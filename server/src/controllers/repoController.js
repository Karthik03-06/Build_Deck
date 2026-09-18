const prisma = require('../prisma/client');
const githubApiService = require('../services/github/githubApiService');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

async function listRepositories(req, res, next) {
  try {
    const repos = await prisma.repository.findMany({
      include: {
        pullRequests: {
          select: {
            id: true,
            number: true,
            state: true,
            previewEnvironments: {
              where: { status: 'RUNNING' },
              select: { id: true }
            }
          }
        },
        _count: {
          select: { pullRequests: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formatted = repos.map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.fullName,
      owner: r.owner,
      defaultBranch: r.defaultBranch,
      cloneUrl: r.cloneUrl,
      htmlUrl: r.htmlUrl,
      createdAt: r.createdAt,
      openPrCount: (r.pullRequests || []).filter(p => p.state === 'OPEN').length,
      activePreviewCount: (r.pullRequests || []).reduce((acc, p) => acc + (p.previewEnvironments?.length || 0), 0)
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
}

async function getRepositoryById(req, res, next) {
  try {
    const { id } = req.params;
    const repo = await prisma.repository.findUnique({
      where: { id },
      include: {
        pullRequests: {
          orderBy: { number: 'desc' },
          include: {
            previewEnvironments: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            _count: {
              select: { issues: true }
            }
          }
        },
        activityEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!repo) {
      throw new NotFoundError(`Repository ${id} not found`);
    }

    res.json(repo);
  } catch (err) {
    next(err);
  }
}

async function connectRepository(req, res, next) {
  try {
    const { fullName, name, owner, defaultBranch, cloneUrl, htmlUrl, githubRepositoryId } = req.body;
    const userId = req.user?.id || (await prisma.user.findFirst())?.id;

    if (!fullName) {
      return res.status(400).json({ error: 'Repository fullName is required (e.g. owner/repo)' });
    }

    const repo = await prisma.repository.upsert({
      where: { fullName },
      update: {
        defaultBranch: defaultBranch || 'main',
        cloneUrl: cloneUrl || `https://github.com/${fullName}.git`,
        htmlUrl: htmlUrl || `https://github.com/${fullName}`
      },
      create: {
        githubRepositoryId: String(githubRepositoryId || Date.now()),
        name: name || fullName.split('/')[1] || fullName,
        fullName,
        owner: owner || fullName.split('/')[0] || 'owner',
        defaultBranch: defaultBranch || 'main',
        cloneUrl: cloneUrl || `https://github.com/${fullName}.git`,
        htmlUrl: htmlUrl || `https://github.com/${fullName}`,
        userId
      }
    });

    res.status(201).json(repo);
  } catch (err) {
    next(err);
  }
}

async function listAvailableGithubRepos(req, res, next) {
  try {
    if (!req.user) {
      return res.json([]);
    }
    const repos = await githubApiService.getUserRepositories(req.user);
    res.json(repos);
  } catch (err) {
    logger.warn(`Could not list GitHub repos: ${err.message}`);
    res.json([]);
  }
}

module.exports = {
  listRepositories,
  getRepositoryById,
  connectRepository,
  listAvailableGithubRepos
};
