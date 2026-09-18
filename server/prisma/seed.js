require('dotenv').config();
const prisma = require('../src/prisma/client');

async function main() {
  console.log('[SEED] Starting database seed with explicit DEMO DATA...');

  // Upsert Demo User
  const demoUser = await prisma.user.upsert({
    where: { githubId: 'demo-user-12345' },
    update: {},
    create: {
      githubId: 'demo-user-12345',
      username: 'demo-developer',
      displayName: 'Demo Reviewer [DEMO DATA]',
      email: 'demo@builddeck.local',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4'
    }
  });

  // Upsert Demo Repository
  const demoRepo = await prisma.repository.upsert({
    where: { fullName: 'builddeck/sample-preview-app' },
    update: {},
    create: {
      githubRepositoryId: 'repo-demo-99999',
      name: 'sample-preview-app',
      fullName: 'builddeck/sample-preview-app',
      owner: 'builddeck',
      defaultBranch: 'main',
      cloneUrl: 'https://github.com/builddeck/sample-preview-app.git',
      htmlUrl: 'https://github.com/builddeck/sample-preview-app',
      userId: demoUser.id
    }
  });

  // Upsert Demo Pull Request
  const demoPr = await prisma.pullRequest.upsert({
    where: {
      repositoryId_number: {
        repositoryId: demoRepo.id,
        number: 42
      }
    },
    update: {},
    create: {
      githubPrId: 'pr-demo-42',
      number: 42,
      title: 'feat: Add authentication and health check endpoint [DEMO DATA]',
      description: 'This PR adds preview environment health verification and simulated API routes for automated PR testing.',
      sourceBranch: 'feature/auth-health',
      targetBranch: 'main',
      commitSha: 'a82f91d0e4c1b9f7',
      state: 'OPEN',
      author: 'demo-developer',
      repositoryId: demoRepo.id
    }
  });

  // Create or retrieve Demo Preview Environment
  let demoEnv = await prisma.previewEnvironment.findFirst({
    where: { pullRequestId: demoPr.id }
  });

  if (!demoEnv) {
    demoEnv = await prisma.previewEnvironment.create({
      data: {
        pullRequestId: demoPr.id,
        commitSha: 'a82f91d0e4c1b9f7',
        containerId: 'builddeck-pr-42',
        imageId: 'builddeck/pr-42-a82f91d0',
        previewUrl: 'http://pr-42.preview.localhost',
        status: 'RUNNING',
        containerPort: 3000,
        startedAt: new Date()
      }
    });

    // Create Initial Environment Logs
    await prisma.environmentLog.createMany({
      data: [
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'build',
          message: '[BUILD] Checking out PR #42 commit a82f91d0e4c1b9f7...',
          timestamp: new Date(Date.now() - 300000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'build',
          message: '[BUILD] Step 1/5 : FROM node:20-alpine',
          timestamp: new Date(Date.now() - 290000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'build',
          message: '[BUILD] Step 2/5 : WORKDIR /app',
          timestamp: new Date(Date.now() - 280000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'build',
          message: '[BUILD] Step 3/5 : RUN npm install --production',
          timestamp: new Date(Date.now() - 260000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'build',
          message: '[BUILD] Successfully built image builddeck/pr-42-a82f91d0',
          timestamp: new Date(Date.now() - 250000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'docker',
          message: '[CONTAINER] Creating container builddeck-pr-42 on builddeck-network...',
          timestamp: new Date(Date.now() - 240000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'docker',
          message: '[CONTAINER] Starting container builddeck-pr-42...',
          timestamp: new Date(Date.now() - 230000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'health',
          message: '[HEALTH] Polling http://localhost:3000/health (attempt 1/10)... OK (HTTP 200)',
          timestamp: new Date(Date.now() - 220000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'system',
          message: '[ROUTING] Traefik router configured for host: pr-42.preview.localhost -> container: builddeck-pr-42:3000',
          timestamp: new Date(Date.now() - 210000)
        },
        {
          environmentId: demoEnv.id,
          level: 'INFO',
          source: 'system',
          message: '[PREVIEW] Environment status updated to RUNNING. Accessible at http://pr-42.preview.localhost',
          timestamp: new Date(Date.now() - 200000)
        }
      ]
    });
  }

  // Create Demo Issue with rich Reproducible Debugging Context
  const demoIssue = await prisma.issue.create({
    data: {
      pullRequestId: demoPr.id,
      title: 'Login returns 500 on empty credentials payload [DEMO DATA]',
      description: 'When submitting the login form without filling in any credentials, the application server returns an unexpected 500 error instead of a 400 Bad Request.',
      stepsToReproduce: '1. Open preview URL http://pr-42.preview.localhost\n2. Click "Simulate Bug (500)" button\n3. Observe unhandled exception in developer console',
      expectedBehavior: 'Application should return HTTP 400 with message "Missing required credentials"',
      actualBehavior: 'Application throws HTTP 500 Internal Server Error',
      severity: 'HIGH',
      status: 'OPEN',
      createdBy: 'demo-developer',
      userId: demoUser.id,
      context: {
        create: {
          environmentId: demoEnv.id,
          commitSha: 'a82f91d0e4c1b9f7',
          containerId: 'builddeck-pr-42',
          browserInfo: JSON.stringify({
            browser: 'Chrome 124.0.0',
            os: 'Windows 11',
            screenResolution: '1920x1080',
            viewport: '1440x900'
          }),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          currentUrl: 'http://pr-42.preview.localhost/api/bug',
          relevantLogs: JSON.stringify([
            '[Sample App] Preview server listening on port 3000',
            '[Sample App] Received GET /api/bug request',
            '[ERROR] Unhandled exception: Simulated bug for reproducible debugging testing'
          ]),
          apiActivity: JSON.stringify([
            {
              method: 'GET',
              path: '/health',
              statusCode: 200,
              duration: '12ms',
              timestamp: new Date(Date.now() - 150000).toISOString()
            },
            {
              method: 'GET',
              path: '/api/test',
              statusCode: 200,
              duration: '24ms',
              timestamp: new Date(Date.now() - 120000).toISOString()
            },
            {
              method: 'GET',
              path: '/api/bug',
              statusCode: 500,
              duration: '45ms',
              timestamp: new Date(Date.now() - 60000).toISOString()
            }
          ]),
          environmentStatus: 'RUNNING'
        }
      }
    }
  });

  // Create Activity Events
  await prisma.activityEvent.createMany({
    data: [
      {
        repositoryId: demoRepo.id,
        pullRequestId: demoPr.id,
        environmentId: demoEnv.id,
        type: 'pr_opened',
        message: 'Pull Request #42 opened by demo-developer'
      },
      {
        repositoryId: demoRepo.id,
        pullRequestId: demoPr.id,
        environmentId: demoEnv.id,
        type: 'preview_queued',
        message: 'Preview environment queued for commit a82f91d0'
      },
      {
        repositoryId: demoRepo.id,
        pullRequestId: demoPr.id,
        environmentId: demoEnv.id,
        type: 'build_completed',
        message: 'Docker image builddeck/pr-42-a82f91d0 built successfully'
      },
      {
        repositoryId: demoRepo.id,
        pullRequestId: demoPr.id,
        environmentId: demoEnv.id,
        type: 'preview_ready',
        message: 'Preview environment is RUNNING at http://pr-42.preview.localhost'
      },
      {
        repositoryId: demoRepo.id,
        pullRequestId: demoPr.id,
        environmentId: demoEnv.id,
        type: 'issue_reported',
        message: 'Issue #1 reported: Login returns 500 on empty credentials payload'
      }
    ]
  });

  console.log('[SEED] Demo data seeded successfully.');
  console.log(`[SEED] Demo User: ${demoUser.username} (${demoUser.id})`);
  console.log(`[SEED] Demo Repo: ${demoRepo.fullName} (${demoRepo.id})`);
  console.log(`[SEED] Demo PR: #${demoPr.number} (${demoPr.id})`);
  console.log(`[SEED] Demo Preview: ${demoEnv.previewUrl} (${demoEnv.status})`);
  console.log(`[SEED] Demo Issue: ${demoIssue.title} (${demoIssue.id})`);
}

main()
  .catch((e) => {
    console.error('[SEED] Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
