# BuildDeck Development Plan & Roadmap

## Phase 0: Repository & Environment Inspection

### Findings
- **OS**: Windows 11
- **Node.js**: v22.15.1
- **npm**: v11.4.0
- **Git**: v2.48.1
- **MySQL**: MySQL80 service active on port 3306.
- **Docker**: Docker client is not in system PATH directly. Dockerode client in backend supports Windows named pipe (`//./pipe/docker_engine`), Unix socket (`/var/run/docker.sock`), and `DOCKER_HOST`.
- **Existing Codebase**:
  - Full Express.js backend with routes, controllers, middleware, workers, and Prisma ORM.
  - Complete React 18 frontend with Vite, Tailwind CSS, Lucide icons, and Socket.IO client.
  - Initial tests pass (17/17 Jest tests).
  - Production build in `client/` compiles cleanly (`vite build` succeeds).

---

## Phase 1: Infrastructure Scaffolding & Verification
- [x] Docker Compose configuration (`mysql`, `traefik`, `backend`, `frontend`)
- [x] Network definition: `builddeck-network`
- [x] Environment configuration template: `.env.example`
- [x] Sample test application with Dockerfile contract in `examples/sample-app/`
- [x] Liveness (`GET /health`) and Readiness (`GET /ready`) endpoints

---

## Phase 2: Database Layer & Relational Models
- [x] MySQL schema models: `User`, `Repository`, `PullRequest`, `PreviewEnvironment`, `EnvironmentLog`, `Issue`, `IssueContext`, `WebhookEvent`, `EnvironmentJob`, `ActivityEvent`
- [x] Explicit build and environment models with foreign key cascades
- [x] Initial MySQL migrations in `server/prisma/migrations/`
- [x] Database client wrapper with connection resilience and offline fallback mode
- [x] Seed script for development and testing

---

## Phase 3: Backend Foundation & REST APIs
- [x] Centralized Express app with Helmet, CORS, and Cookie-Session
- [x] Centralized error handling and structured error responses
- [x] REST endpoints:
  - `GET /health` & `GET /ready`
  - `GET /api/repositories` & `GET /api/repositories/:id`
  - `GET /api/pull-requests` & `GET /api/pull-requests/:id`
  - `GET /api/environments` & `GET /api/environments/:id`
  - `POST /api/environments/:id/destroy`
  - `GET /api/issues` & `GET /api/issues/:id`
  - `POST /api/issues/:id/reproduce`
  - `POST /api/webhooks/github`

---

## Phase 4: GitHub Integration & Webhook Security
- [x] Constant-time HMAC SHA-256 verification (`X-Hub-Signature-256`)
- [x] Delivery ID deduplication (`X-GitHub-Delivery`) for idempotency
- [x] Event dispatch for `pull_request.opened`, `pull_request.synchronize`, `pull_request.closed`
- [x] Fast HTTP 202 Accepted response to avoid GitHub timeouts

---

## Phase 5: Source Acquisition & Isolated Build Workspaces
- [x] Pull Request exact commit SHA retrieval
- [x] Unique build workspace directory allocation (`./temp/builds/build-<id>`)
- [x] Source archive retrieval and extraction
- [x] Dockerfile contract validation (fail build immediately if missing)

---

## Phase 6: Docker Container Orchestration & Lifecycle
- [x] Dockerode integration with named pipe and Unix socket fallback
- [x] Predictable unique naming: `builddeck-pr-<number>` and image `builddeck/pr-<number>-<sha>`
- [x] Traefik routing labels attached dynamically
- [x] Resource constraints: 512MB RAM, 1 CPU, 100 PIDs limit
- [x] Traceability labels: `com.builddeck=true`, `com.builddeck.managed=true`, `com.builddeck.pr`, `com.builddeck.sha`
- [x] Health check polling (`/health`) before promoting environment to `READY`/`RUNNING`

---

## Phase 7: Traefik Reverse Proxy Routing
- [x] Dynamic Traefik Docker provider
- [x] Route: `pr-<number>.preview.localhost` ➔ container port 3000
- [x] Route teardown on environment destruction

---

## Phase 8: Real-Time WebSockets Engine
- [x] Socket.IO hub with room management (`pr:<id>`, `environment:<id>`)
- [x] Live log streaming from Docker stdout/stderr directly to frontend console
- [x] Real-time state transitions without page refresh

---

## Phase 9: React Dashboard & User Interface
- [x] Dark-first developer UI with Tailwind CSS
- [x] Dynamic `EnvironmentTimeline` showing step-by-step progress
- [x] Terminal `LogViewer` with search, level filters, and auto-scroll
- [x] `PreviewButton` with dynamic state-driven behavior
- [x] Bug reporter modal capturing client browser context and redacted API activity

---

## Phase 10: Reproducible Debugging Workflow
- [x] Capture exact historic commit SHA on issue creation
- [x] Capture container ID, tail logs, and redacted network activity
- [x] "Reproduce Issue" action recreates preview container strictly pinned to historical commit SHA

---

## Phase 11: Cleanup & Stale Build Protection
- [x] Blue/Green replacement on PR synchronize
- [x] Stale build check: prune build if a newer commit arrived during build
- [x] Cleanup worker for expired environments (`PREVIEW_MAX_LIFETIME`)
- [x] Closed/merged PR container and route destruction
- [x] Safe orphan container cleanup filtering by `com.builddeck.managed=true`

---

## Phase 12: Testing & Verification
- [x] Unit & integration tests for Auth, Webhooks, Docker, Issues, Cleanup
- [x] 18-step automated end-to-end test script
- [x] Frontend production bundle build verification
