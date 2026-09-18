# BuildDeck System Architecture

BuildDeck is an automated, GitHub-integrated collaborative Pull Request testing and debugging platform.

## High-Level Architecture Diagram

```text
                               ┌────────────────────────┐
                               │         GitHub         │
                               │  Repository / PR Event │
                               └───────────┬────────────┘
                                           │
                                  OAuth / Webhooks
                              (HMAC SHA-256 Verified)
                                           │
                                           ▼
                            ┌──────────────────────────────┐
                            │    Node.js + Express API     │
                            │ (Auth, Webhooks, PR, Issues) │
                            └──────────────┬───────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────┐
                ▼                          ▼                          ▼
         MySQL 8 Database          Build Queue & Worker       Socket.IO Server
        (Prisma ORM Models)       (Asynchronous Pipeline)     (Real-Time Hub)
                │                          │                          │
                │                          ▼                          │
                │                  Docker Engine API                  │
                │                  (Dockerode Client)                 │
                │                          │                          │
                │                          ▼                          │
                │               Isolated Preview Container            │
                │          (Labels: com.builddeck, Traefik)           │
                │                          │                          │
                │                          ▼                          │
                │                   Traefik Proxy                     │
                │             (pr-X.preview.localhost)                │
                │                          │                          │
                ▼                          ▼                          ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │                     React.js Client Dashboard                    │
      │  - PR Preview Lifecycle (QUEUED -> BUILDING -> RUNNING)          │
      │  - Live Streaming Logs (Terminal/Console)                         │
      │  - Issue Reporter with Auto Technical Context Capture            │
      │  - Reproduce Issue from Exact Commit SHA                         │
      └──────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. GitHub Webhook Layer
- **Ingestion Endpoint**: `POST /api/webhooks/github`
- **Security**: Validates `X-Hub-Signature-256` HMAC SHA-256 signature using `GITHUB_WEBHOOK_SECRET`.
- **Idempotency**: Verifies `X-GitHub-Delivery` ID against database `WebhookEvent` table to prevent duplicate builds.
- **Asynchronous Dispatch**: Responds immediately with HTTP 202 to GitHub and queues background jobs.

### 2. Core Backend Orchestrator (Express.js)
- Manages user authentication, repository connections, pull requests, build states, and debugging sessions.
- Exposes RESTful APIs and WebSocket events for real-time status.
- Liveness check at `GET /health` and dependency readiness at `GET /ready`.

### 3. Asynchronous Build & Deployment Worker
- State Machine: `QUEUED` ➔ `BUILDING` ➔ `BUILT` ➔ `STARTING` ➔ `READY` (or `FAILED`).
- **Source Acquisition**: Checks out or extracts repository at exact commit SHA into an isolated workspace (`./temp/builds/build-<id>`).
- **Dockerfile Contract**: Verifies existence of root `Dockerfile`. If absent, marks status as `FAILED` with clear error message.
- **Stale Build Protection**: Before promoting a build to `READY`, verifies that the commit SHA matches the PR's latest HEAD commit SHA. If a newer commit was pushed while building, the stale container is pruned.

### 4. Containerization & Docker Engine API
- Connected via `dockerode` supporting Windows named pipe (`//./pipe/docker_engine`), Linux Unix socket (`/var/run/docker.sock`), or `DOCKER_HOST`.
- Attaches to dedicated bridge network `builddeck-network`.
- Applies strict resource quotas: Memory limit (512MB), CPU limit (1 core), Process limit (100 PIDs).
- Attaches metadata labels: `com.builddeck=true`, `com.builddeck.managed=true`, `com.builddeck.pr`, `com.builddeck.sha`, `com.builddeck.build`.

### 5. Reverse Proxy (Traefik v2.10)
- Uses Docker provider to inspect container labels dynamically.
- Automatically generates router host: `pr-<number>.preview.localhost`.
- Forwards incoming HTTP port 80 traffic to container internal port 3000.

### 6. Real-Time Hub (Socket.IO)
- Room-based channels (`repository:<id>`, `pr:<id>`, `environment:<id>`).
- Live log streaming directly from Docker stdout/stderr to browser terminal without page refresh.

### 7. Reproducible Debugging Foundation
- Automatically captures exact historic commit SHA, container ID, browser info, tail logs, and sanitized frontend API activities.
- Allows developers to spin up a reproduction preview environment targeting the exact historical commit SHA.
