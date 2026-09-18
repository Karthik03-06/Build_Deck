const path = require('path');
const fs = require('fs');
const prisma = require('../../prisma/client');
const dockerService = require('../docker/dockerService');
const githubApiService = require('../github/githubApiService');
const config = require('../../utils/env');
const logger = require('../../utils/logger');
const {
  emitEnvironmentStatus,
  emitEnvironmentLog,
  emitActivity
} = require('../../sockets/socketServer');

class PreviewService {
  /**
   * Appends an environment log entry and broadcasts to Socket.IO
   */
  async log(environmentId, message, level = 'INFO', source = 'system') {
    try {
      const entry = await prisma.environmentLog.create({
        data: {
          environmentId,
          message,
          level,
          source
        }
      });
      emitEnvironmentLog(environmentId, entry);
      logger.info(`[EnvLog ${environmentId.substring(0, 8)}] [${source}] ${message}`);
    } catch (err) {
      logger.error(`Failed to record environment log: ${err.message}`);
    }
  }

  /**
   * Creates or returns a PreviewEnvironment record for a given PR and commit SHA
   */
  async getOrCreateEnvironment(pullRequestId, commitSha) {
    const pr = await prisma.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: { repository: true }
    });

    if (!pr) {
      throw new Error(`PullRequest not found: ${pullRequestId}`);
    }

    // Check if an environment already exists for this exact commit
    let env = await prisma.previewEnvironment.findFirst({
      where: {
        pullRequestId,
        commitSha
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!env || env.status === 'DESTROYED') {
      const previewHost = `pr-${pr.number}.${config.preview.domain}`;
      const previewUrl = `http://${previewHost}`;

      env = await prisma.previewEnvironment.create({
        data: {
          pullRequestId,
          commitSha,
          status: 'QUEUED',
          previewUrl,
          containerPort: 3000
        }
      });

      emitEnvironmentStatus(env);
      await this.log(env.id, `Environment created and marked QUEUED for PR #${pr.number} (commit: ${commitSha})`, 'INFO', 'system');

      // Create background job
      await prisma.environmentJob.create({
        data: {
          environmentId: env.id,
          type: 'BUILD_AND_START',
          status: 'PENDING'
        }
      });

      // Record Activity
      await prisma.activityEvent.create({
        data: {
          repositoryId: pr.repositoryId,
          pullRequestId: pr.id,
          environmentId: env.id,
          type: 'preview_queued',
          message: `Preview environment queued for PR #${pr.number} (${commitSha.substring(0, 8)})`
        }
      });
    }

    return env;
  }

  /**
   * Executes the full container build & deploy pipeline
   */
  async deployEnvironment(environmentId) {
    const env = await prisma.previewEnvironment.findUnique({
      where: { id: environmentId },
      include: {
        pullRequest: {
          include: { repository: { include: { user: true } } }
        }
      }
    });

    if (!env) throw new Error(`Environment ${environmentId} not found`);

    const pr = env.pullRequest;
    const repo = pr.repository;
    const prNumber = pr.number;
    const commitSha = env.commitSha;
    const shortSha = commitSha.substring(0, 8);
    const imageName = `builddeck/pr-${prNumber}-${shortSha}`;
    const containerName = `builddeck-pr-${prNumber}`;

    try {
      // 1. Transition to BUILDING
      const buildingEnv = await prisma.previewEnvironment.update({
        where: { id: environmentId },
        data: { status: 'BUILDING' }
      });
      emitEnvironmentStatus(buildingEnv);
      await this.log(environmentId, `Starting Docker build pipeline for commit ${shortSha}...`, 'INFO', 'build');

      // Check Docker daemon connectivity
      const dockerStatus = await dockerService.checkConnection();
      if (!dockerStatus.connected) {
        throw new Error(`Docker Engine is not accessible: ${dockerStatus.error}. Please ensure Docker Desktop/daemon is running.`);
      }

      // 2. Obtain build context (PR source code) into unique isolated workspace
      const workspaceDir = path.resolve(__dirname, '../../../temp/builds', `build-${environmentId}-${Date.now()}`);
      fs.mkdirSync(workspaceDir, { recursive: true });

      let buildContextPath = null;
      let tarStream = null;

      // Check if local sample-app exists in examples/sample-app or docker/sample-app
      const samplePathExamples = path.resolve(__dirname, '../../../examples/sample-app');
      const samplePathDocker = path.resolve(__dirname, '../../../docker/sample-app');
      const sampleSource = fs.existsSync(samplePathExamples) ? samplePathExamples : (fs.existsSync(samplePathDocker) ? samplePathDocker : null);

      if (sampleSource) {
        // Copy sample into unique build workspace
        fs.cpSync(sampleSource, workspaceDir, { recursive: true });
        buildContextPath = workspaceDir;
      } else {
        // Attempt GitHub tarball download
        const token = repo.user?.accessTokenEncrypted;
        tarStream = await githubApiService.downloadCommitArchive(
          repo.owner,
          repo.name,
          commitSha,
          token
        );
      }

      // Check Dockerfile contract (Section 15)
      if (buildContextPath && !fs.existsSync(path.join(buildContextPath, 'Dockerfile'))) {
        throw new Error('Repository does not contain a Dockerfile required by BuildDeck.');
      }

      await this.log(environmentId, `Building Docker image ${imageName} in workspace ${path.basename(workspaceDir)}...`, 'INFO', 'build');

      // 3. Build Docker image
      const buildResult = await dockerService.buildImage({
        contextPath: buildContextPath,
        tarStream,
        commitSha,
        imageName,
        onLog: (line) => this.log(environmentId, line, 'INFO', 'build')
      });

      // 4. Transition to STARTING
      const startingEnv = await prisma.previewEnvironment.update({
        where: { id: environmentId },
        data: {
          status: 'STARTING',
          imageId: buildResult.imageId || imageName
        }
      });
      emitEnvironmentStatus(startingEnv);
      await this.log(environmentId, `Image built successfully. Creating container ${containerName}...`, 'INFO', 'docker');

      // 5. Create container with Traefik routing labels
      const container = await dockerService.createContainer({
        imageName,
        containerName,
        environmentId,
        prNumber,
        repositoryId: repo.id,
        port: env.containerPort || 3000
      });

      // 6. Start container
      await dockerService.startContainer(container.id);
      await this.log(environmentId, `Container ${container.id.substring(0, 12)} started. Awaiting health check...`, 'INFO', 'docker');

      // Attach real-time container log streamer
      dockerService.getLogsStream(container.id, (line) => {
        this.log(environmentId, line, 'INFO', 'docker');
      });

      // 7. Health check
      const inspectData = await dockerService.inspectContainer(container.id);
      const ip = inspectData?.NetworkSettings?.Networks?.['builddeck-network']?.IPAddress || '127.0.0.1';
      
      const isHealthy = await dockerService.healthCheck({
        host: ip,
        port: env.containerPort || 3000,
        path: config.preview.healthPath || '/health',
        timeout: 45000,
        interval: 2000
      });

      if (!isHealthy) {
        throw new Error(`Container started but failed health check at path ${config.preview.healthPath || '/health'}.`);
      }

      // STALE BUILD PROTECTION (Section 27):
      // Verify that this build's commit is still the PR's latest HEAD commit SHA
      const latestPr = await prisma.pullRequest.findUnique({ where: { id: pr.id } });
      if (latestPr && latestPr.commitSha !== commitSha) {
        await this.log(environmentId, `Stale build detected (PR has updated to ${latestPr.commitSha.substring(0, 8)}). Pruning container...`, 'WARN', 'system');
        await dockerService.stopContainer(container.id);
        await dockerService.removeContainer(container.id, true);
        const staleEnv = await prisma.previewEnvironment.update({
          where: { id: environmentId },
          data: { status: 'DESTROYED', destroyedAt: new Date() }
        });
        emitEnvironmentStatus(staleEnv);
        return staleEnv;
      }

      // BLUE/GREEN SWAP: Cleanup older active containers for this PR
      const oldEnvs = await prisma.previewEnvironment.findMany({
        where: {
          pullRequestId: pr.id,
          id: { not: environmentId },
          status: 'RUNNING'
        }
      });
      for (const oldEnv of oldEnvs) {
        try {
          await this.teardownEnvironment(oldEnv.id);
        } catch (e) {
          logger.warn(`Could not teardown previous preview ${oldEnv.id}: ${e.message}`);
        }
      }

      // 8. Mark RUNNING
      const runningEnv = await prisma.previewEnvironment.update({
        where: { id: environmentId },
        data: {
          status: 'RUNNING',
          containerId: container.id,
          startedAt: new Date()
        }
      });
      emitEnvironmentStatus(runningEnv);
      await this.log(environmentId, `Preview environment is now RUNNING! Available at: ${runningEnv.previewUrl}`, 'INFO', 'system');

      await prisma.activityEvent.create({
        data: {
          repositoryId: repo.id,
          pullRequestId: pr.id,
          environmentId: env.id,
          type: 'preview_ready',
          message: `Preview environment is RUNNING for PR #${prNumber} at ${runningEnv.previewUrl}`
        }
      });

      // Cleanup workspace files
      try {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
      } catch (e) {
        // non-blocking
      }

      return runningEnv;
    } catch (err) {
      logger.error(`[Preview Deploy Error] ${err.message}`);
      await this.log(environmentId, `Deployment failed: ${err.message}`, 'ERROR', 'system');

      const failedEnv = await prisma.previewEnvironment.update({
        where: { id: environmentId },
        data: { status: 'FAILED' }
      });
      emitEnvironmentStatus(failedEnv);

      await prisma.activityEvent.create({
        data: {
          repositoryId: repo.id,
          pullRequestId: pr.id,
          environmentId: env.id,
          type: 'preview_failed',
          message: `Preview build failed for PR #${prNumber}: ${err.message}`
        }
      });

      throw err;
    }
  }

  /**
   * Gracefully tears down and destroys a preview environment
   */
  async teardownEnvironment(environmentId) {
    const env = await prisma.previewEnvironment.findUnique({
      where: { id: environmentId },
      include: { pullRequest: true }
    });

    if (!env || env.status === 'DESTROYED') {
      return env;
    }

    try {
      // 1. Transition to STOPPING
      const stoppingEnv = await prisma.previewEnvironment.update({
        where: { id: environmentId },
        data: { status: 'STOPPING' }
      });
      emitEnvironmentStatus(stoppingEnv);
      await this.log(environmentId, 'Tearing down preview environment...', 'INFO', 'system');

      // 2. Stop and remove container
      if (env.containerId) {
        await dockerService.stopContainer(env.containerId);
        await dockerService.removeContainer(env.containerId, true);
        await this.log(environmentId, `Container ${env.containerId.substring(0, 12)} removed.`, 'INFO', 'docker');
      } else {
        const containerName = `builddeck-pr-${env.pullRequest.number}`;
        await dockerService.removeContainer(containerName, true);
      }

      // 3. Mark DESTROYED
      const destroyedEnv = await prisma.previewEnvironment.update({
        where: { id: environmentId },
        data: {
          status: 'DESTROYED',
          destroyedAt: new Date()
        }
      });
      emitEnvironmentStatus(destroyedEnv);
      await this.log(environmentId, 'Environment marked DESTROYED and Traefik routing cleared.', 'INFO', 'system');

      await prisma.activityEvent.create({
        data: {
          repositoryId: env.pullRequest.repositoryId,
          pullRequestId: env.pullRequestId,
          environmentId: env.id,
          type: 'environment_destroyed',
          message: `Preview environment destroyed for PR #${env.pullRequest.number}`
        }
      });

      return destroyedEnv;
    } catch (err) {
      logger.error(`[Teardown Error] ${err.message}`);
      await this.log(environmentId, `Teardown error: ${err.message}`, 'WARN', 'system');
      throw err;
    }
  }

  /**
   * Reproduces an issue using the exact historical commit SHA
   */
  async reproduceIssue(issueId) {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        context: true,
        pullRequest: {
          include: { repository: true }
        }
      }
    });

    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    if (!issue.context || !issue.context.commitSha) {
      throw new Error('Issue does not have captured commit SHA context for reproduction');
    }

    const exactCommitSha = issue.context.commitSha;
    logger.info(`[Reproduce] Reproducing issue #${issue.id} with exact commit SHA: ${exactCommitSha}`);

    // Create or get environment with the EXACT commit SHA
    const env = await this.getOrCreateEnvironment(issue.pullRequestId, exactCommitSha);
    return env;
  }
}

module.exports = new PreviewService();
