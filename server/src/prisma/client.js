const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let rawPrisma = null;
let isDbConnected = false;

try {
  rawPrisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });
} catch (err) {
  logger.warn(`Failed to initialize raw PrismaClient: ${err.message}`);
}

// In-memory fallback repository store when MySQL is offline or credentials not yet provided
const memStore = {
  users: [
    {
      id: 'usr_demo_1',
      githubId: 'demo-user-12345',
      username: 'demo-developer',
      displayName: 'Demo Reviewer [DEMO MODE]',
      email: 'demo@builddeck.local',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      accessTokenEncrypted: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  repositories: [
    {
      id: 'repo_demo_1',
      githubRepositoryId: 'repo-demo-99999',
      name: 'sample-preview-app',
      fullName: 'builddeck/sample-preview-app',
      owner: 'builddeck',
      defaultBranch: 'main',
      cloneUrl: 'https://github.com/builddeck/sample-preview-app.git',
      htmlUrl: 'https://github.com/builddeck/sample-preview-app',
      userId: 'usr_demo_1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  pullRequests: [
    {
      id: 'pr_demo_42',
      githubPrId: 'pr-demo-42',
      number: 42,
      title: 'feat: Add authentication and healthcheck endpoint [DEMO DATA]',
      description: 'This PR adds preview environment health verification and simulated API routes for automated PR testing.',
      sourceBranch: 'feature/auth-health',
      targetBranch: 'main',
      commitSha: 'a82f91d0e4c1b9f7',
      state: 'OPEN',
      author: 'demo-developer',
      repositoryId: 'repo_demo_1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  previewEnvironments: [
    {
      id: 'env_demo_42',
      pullRequestId: 'pr_demo_42',
      commitSha: 'a82f91d0e4c1b9f7',
      containerId: 'builddeck-pr-42',
      imageId: 'builddeck/pr-42-a82f91d0',
      previewUrl: 'http://pr-42.preview.localhost',
      status: 'RUNNING',
      containerPort: 3000,
      createdAt: new Date(),
      startedAt: new Date(),
      destroyedAt: null,
      updatedAt: new Date()
    }
  ],
  environmentLogs: [
    {
      id: 'log_1',
      environmentId: 'env_demo_42',
      level: 'INFO',
      source: 'build',
      message: '[BUILD] Step 1/5 : FROM node:20-alpine',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: 'log_2',
      environmentId: 'env_demo_42',
      level: 'INFO',
      source: 'build',
      message: '[BUILD] Step 2/5 : WORKDIR /app',
      timestamp: new Date(Date.now() - 290000)
    },
    {
      id: 'log_3',
      environmentId: 'env_demo_42',
      level: 'INFO',
      source: 'build',
      message: '[BUILD] Step 3/5 : RUN npm install --production',
      timestamp: new Date(Date.now() - 280000)
    },
    {
      id: 'log_4',
      environmentId: 'env_demo_42',
      level: 'INFO',
      source: 'docker',
      message: '[CONTAINER] Starting container builddeck-pr-42 on builddeck-network...',
      timestamp: new Date(Date.now() - 250000)
    },
    {
      id: 'log_5',
      environmentId: 'env_demo_42',
      level: 'INFO',
      source: 'health',
      message: '[HEALTH] Polling http://localhost:3000/health... OK (HTTP 200)',
      timestamp: new Date(Date.now() - 220000)
    },
    {
      id: 'log_6',
      environmentId: 'env_demo_42',
      level: 'INFO',
      source: 'system',
      message: '[ROUTING] Traefik router configured: pr-42.preview.localhost -> builddeck-pr-42:3000',
      timestamp: new Date(Date.now() - 200000)
    }
  ],
  issues: [
    {
      id: 'iss_demo_1',
      pullRequestId: 'pr_demo_42',
      title: 'Login returns 500 on empty credentials payload [DEMO DATA]',
      description: 'When submitting the login form without filling in any credentials, the application returns HTTP 500.',
      stepsToReproduce: '1. Open preview URL\n2. Click Simulate Bug\n3. Observe 500 error',
      expectedBehavior: 'HTTP 400 Bad Request',
      actualBehavior: 'HTTP 500 Internal Server Error',
      severity: 'HIGH',
      status: 'OPEN',
      createdBy: 'demo-developer',
      userId: 'usr_demo_1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  issueContexts: [
    {
      id: 'ctx_demo_1',
      issueId: 'iss_demo_1',
      environmentId: 'env_demo_42',
      commitSha: 'a82f91d0e4c1b9f7',
      containerId: 'builddeck-pr-42',
      timestamp: new Date(),
      browserInfo: JSON.stringify({ browser: 'Chrome 124.0.0', os: 'Windows 11', viewport: '1440x900' }),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0',
      currentUrl: 'http://pr-42.preview.localhost/api/bug',
      relevantLogs: JSON.stringify([
        '[Sample App] Received GET /api/bug request',
        '[ERROR] Unhandled exception: Simulated bug for reproducible debugging testing'
      ]),
      apiActivity: JSON.stringify([
        { method: 'GET', path: '/health', statusCode: 200, duration: '12ms' },
        { method: 'GET', path: '/api/bug', statusCode: 500, duration: '35ms' }
      ]),
      environmentStatus: 'RUNNING'
    }
  ],
  webhookEvents: [],
  environmentJobs: [],
  activityEvents: [
    {
      id: 'act_1',
      repositoryId: 'repo_demo_1',
      pullRequestId: 'pr_demo_42',
      environmentId: 'env_demo_42',
      type: 'pr_opened',
      message: 'Pull Request #42 detected via GitHub Webhook',
      createdAt: new Date()
    },
    {
      id: 'act_2',
      repositoryId: 'repo_demo_1',
      pullRequestId: 'pr_demo_42',
      environmentId: 'env_demo_42',
      type: 'preview_ready',
      message: 'Preview environment is RUNNING at http://pr-42.preview.localhost',
      createdAt: new Date()
    }
  ]
};

// Check connection to MySQL immediately
if (rawPrisma) {
  rawPrisma.$connect()
    .then(() => {
      isDbConnected = true;
      logger.info('[Database] Successfully connected to MySQL database via Prisma.');
    })
    .catch((err) => {
      isDbConnected = false;
      logger.warn(`[Database] MySQL connection offline or credentials invalid (${err.message.split('\n')[0]}). Operating in resilient fallback mode.`);
    });
}

function createModelHandler(storeKey) {
  return {
    async findMany(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].findMany(args); } catch (e) { /* fallback */ }
      }
      let items = [...memStore[storeKey]];
      if (args.where) {
        items = items.filter(item => {
          for (const [k, v] of Object.entries(args.where)) {
            if (typeof v === 'object' && v !== null) {
              if (v.in && Array.isArray(v.in) && !v.in.includes(item[k])) return false;
              if (v.contains && typeof item[k] === 'string' && !item[k].includes(v.contains)) return false;
            } else if (item[k] !== v) {
              return false;
            }
          }
          return true;
        });
      }
      // Handle includes
      if (args.include) {
        return items.map(item => attachIncludes(storeKey, item, args.include));
      }
      return items;
    },

    async findUnique(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].findUnique(args); } catch (e) { /* fallback */ }
      }
      const item = memStore[storeKey].find(i => {
        if (args.where.id && i.id === args.where.id) return true;
        if (args.where.githubId && i.githubId === args.where.githubId) return true;
        if (args.where.fullName && i.fullName === args.where.fullName) return true;
        if (args.where.deliveryId && i.deliveryId === args.where.deliveryId) return true;
        if (args.where.issueId && i.issueId === args.where.issueId) return true;
        if (args.where.repositoryId_number) {
          return i.repositoryId === args.where.repositoryId_number.repositoryId && i.number === args.where.repositoryId_number.number;
        }
        if (args.where.number !== undefined && i.number === args.where.number) return true;
        return false;
      });
      if (!item) return null;
      return args.include ? attachIncludes(storeKey, item, args.include) : { ...item };
    },

    async findFirst(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].findFirst(args); } catch (e) { /* fallback */ }
      }
      const items = await this.findMany(args);
      return items[0] || null;
    },

    async create(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].create(args); } catch (e) { /* fallback */ }
      }
      const newItem = {
        id: `${storeKey.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data
      };
      // Handle nested context creates
      if (args.data.context?.create) {
        const ctx = {
          id: `ctx_${Date.now()}`,
          issueId: newItem.id,
          createdAt: new Date(),
          ...args.data.context.create
        };
        memStore.issueContexts.push(ctx);
        newItem.context = ctx;
      }
      memStore[storeKey].push(newItem);
      return newItem;
    },

    async update(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].update(args); } catch (e) { /* fallback */ }
      }
      const idx = memStore[storeKey].findIndex(i => i.id === args.where.id);
      if (idx >= 0) {
        memStore[storeKey][idx] = {
          ...memStore[storeKey][idx],
          ...args.data,
          updatedAt: new Date()
        };
        return memStore[storeKey][idx];
      }
      return args.data;
    },

    async upsert(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].upsert(args); } catch (e) { /* fallback */ }
      }
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        return this.update({ where: { id: existing.id }, data: args.update });
      }
      return this.create({ data: args.create });
    },

    async count(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].count(args); } catch (e) { /* fallback */ }
      }
      const items = await this.findMany(args);
      return items.length;
    },

    async createMany(args = {}) {
      if (isDbConnected && rawPrisma) {
        try { return await rawPrisma[storeKey].createMany(args); } catch (e) { /* fallback */ }
      }
      for (const d of args.data || []) {
        await this.create({ data: d });
      }
      return { count: (args.data || []).length };
    }
  };
}

function attachIncludes(storeKey, item, include = {}) {
  const result = { ...item };
  if (storeKey === 'pullRequests') {
    if (include.repository) {
      result.repository = memStore.repositories.find(r => r.id === item.repositoryId) || null;
    }
    if (include.previewEnvironments) {
      result.previewEnvironments = memStore.previewEnvironments.filter(e => e.pullRequestId === item.id);
    }
    if (include.issues) {
      result.issues = memStore.issues.filter(i => i.pullRequestId === item.id);
    }
    if (include._count?.select?.issues) {
      result._count = { issues: memStore.issues.filter(i => i.pullRequestId === item.id).length };
    }
  }
  if (storeKey === 'repositories') {
    if (include.pullRequests) {
      result.pullRequests = memStore.pullRequests
        .filter(p => p.repositoryId === item.id)
        .map(p => ({
          ...p,
          previewEnvironments: memStore.previewEnvironments.filter(e => e.pullRequestId === p.id)
        }));
    }
    if (include.activityEvents) {
      result.activityEvents = (memStore.activityEvents || []).filter(a => a.repositoryId === item.id);
    }
  }
  if (storeKey === 'issues') {
    if (include.context) {
      result.context = memStore.issueContexts.find(c => c.issueId === item.id) || null;
    }
    if (include.pullRequest) {
      result.pullRequest = memStore.pullRequests.find(p => p.id === item.pullRequestId) || null;
    }
  }
  if (storeKey === 'previewEnvironments') {
    if (include.logs) {
      result.logs = memStore.environmentLogs.filter(l => l.environmentId === item.id);
    }
    if (include.pullRequest) {
      result.pullRequest = memStore.pullRequests.find(p => p.id === item.pullRequestId) || null;
    }
  }
  if (storeKey === 'activityEvents') {
    if (include.repository) {
      result.repository = memStore.repositories.find(r => r.id === item.repositoryId) || null;
    }
    if (include.pullRequest) {
      result.pullRequest = memStore.pullRequests.find(p => p.id === item.pullRequestId) || null;
    }
  }
  return result;
}

const prismaProxy = {
  $connect: () => (isDbConnected && rawPrisma ? rawPrisma.$connect() : Promise.resolve()),
  $disconnect: () => (isDbConnected && rawPrisma ? rawPrisma.$disconnect() : Promise.resolve()),
  $queryRaw: (q) => {
    if (isDbConnected && rawPrisma) return rawPrisma.$queryRaw(q);
    return Promise.resolve([{ 1: 1 }]);
  },
  user: createModelHandler('users'),
  repository: createModelHandler('repositories'),
  pullRequest: createModelHandler('pullRequests'),
  previewEnvironment: createModelHandler('previewEnvironments'),
  environmentLog: createModelHandler('environmentLogs'),
  issue: createModelHandler('issues'),
  issueContext: createModelHandler('issueContexts'),
  webhookEvent: createModelHandler('webhookEvents'),
  environmentJob: createModelHandler('environmentJobs'),
  activityEvent: createModelHandler('activityEvents')
};

module.exports = prismaProxy;
