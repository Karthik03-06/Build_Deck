# BuildDeck

> **Build. Preview. Test. Debug. Merge.**

BuildDeck is a production-grade, GitHub-integrated collaborative Pull Request testing and debugging platform.

The platform automatically provisions an isolated Docker preview environment for every Pull Request, equips reviewers with a browser-accessible URL to test actual PR code, delivers real-time build/container/log streaming via Socket.IO, and allows reviewers to report bugs while automatically capturing the exact technical context (commit SHA, environment ID, container ID, browser info, redacted API activity, and relevant logs) required to reproduce the issue.

---

## 1. System Architecture

```mermaid
graph TD
    A[GitHub PR Opened/Updated] -->|OAuth & Webhooks| B[Express.js API Backend]
    B -->|HMAC Verification & Idempotency| C[MySQL Database via Prisma]
    B -->|Enqueue Job| D[Asynchronous Background Worker]
    D -->|Dockerode / Docker Engine API| E[Build PR Image & Start Container]
    E -->|Traefik Routing Labels| F[Traefik Reverse Proxy]
    F -->|pr-X.preview.localhost| G[Live Browser Preview URL]
    B -->|Real-Time Status & Logs| H[Socket.IO Hub]
    H -->|Instant UI Updates| I[React Dashboard]
    G -->|Reviewer Reports Bug| J[Issue Reporter]
    J -->|Auto Context: Commit SHA, Logs, Redacted APIs| C
    I -->|Reproduce Issue| D
    D -->|Rebuild from Exact Historical Commit| E
    A -->|PR Closed/Merged| B
    B -->|Automated Teardown| D
    D -->|Stop & Remove Container| E
```

---

## 2. Technology Stack

### Frontend
- **React.js 18** (JavaScript, no TypeScript, no Next.js)
- **Vite** (Next-generation lightning fast build tool)
- **React Router v6** (Declarative routing)
- **Tailwind CSS** (Dark-first developer UI palette)
- **Socket.IO Client** (Real-time live status and log streaming)
- **Axios** (Centralized API client with automatic activity tracking)
- **Lucide React** (Modern developer tool iconography)

### Backend
- **Node.js** & **Express.js** (JavaScript)
- **Prisma ORM** (MySQL 8.0 schema, models, relations, seed)
- **Socket.IO** (WebSockets real-time hub with rooms)
- **Dockerode** (Docker Engine API client with Windows named pipe & Linux socket support)
- **Octokit / GitHub REST API** (Repository, PR, commit, and archive fetching)
- **Helmet**, **CORS**, and **Cookie-Session** (HTTP-only secure session cookies)

### Infrastructure & Reverse Proxy
- **Docker & Docker Compose** (Container lifecycle orchestration)
- **Traefik v2.10** (Dynamic reverse proxy using Docker provider and container labels)
- **MySQL 8.0** (Persistent relational storage)

---

## 3. Core Workflow & Acceptance Scenarios

1. **GitHub PR Created**: GitHub delivers webhook to `/api/webhooks/github`.
2. **HMAC & Idempotency**: Backend verifies `X-Hub-Signature-256` and checks `X-GitHub-Delivery` against the `WebhookEvent` table to prevent duplicate environments.
3. **Database Persistence**: Pull Request and `PreviewEnvironment` records are saved with the **exact commit SHA**.
4. **Background Worker Execution**: The background worker picks up the `EnvironmentJob` (`BUILD_AND_START`).
5. **Docker Build Pipeline**:
   - `QUEUED` ➔ `BUILDING`: PR source code is packaged and built with the repository `Dockerfile`.
   - `BUILDING` ➔ `STARTING`: Container is created with resource limits (512MB RAM, 1 CPU, 100 PIDs), labeled with `com.builddeck=true`, and attached to `builddeck-network`.
   - Traefik dynamic routing labels are applied (`traefik.http.routers.pr-X.rule=Host(\`pr-X.preview.localhost\`)`).
6. **Health Check Verification**: BuildDeck polls `http://<container-ip>:3000/health` until 200 OK or timeout.
7. **RUNNING & Real-Time Sync**: Status transitions to `RUNNING`. Socket.IO broadcasts `environment:running` to React client.
8. **Browser Testing & Bug Reporting**: Reviewer clicks **Open Preview**, tests the live app, and clicks **Report Bug**.
9. **Automated Context Capture**:
   - Exact commit SHA
   - Container ID & Environment ID
   - User-Agent, screen resolution, and viewport
   - Recent container tail logs
   - Redacted frontend API activity (passwords, tokens, auth headers removed)
10. **Reproducible Debugging**: Developer inspects the issue and clicks **Reproduce Issue**. BuildDeck recreates the environment using that **exact historical commit SHA** (never current branch HEAD).
11. **Automated Cleanup**: When the PR is closed or merged, container is gracefully stopped, removed, and routing cleared (`DESTROYED`).

---

## 4. Project Structure

```text
BuildDeck/
│
├── client/
│   ├── src/
│   │   ├── components/       # StatusBadge, LogViewer, Timeline, PreviewButton, etc.
│   │   ├── pages/            # LandingPage, Dashboard, PR Detail, Issue Detail, Settings
│   │   ├── layouts/          # AppLayout with Navbar and Sidebar
│   │   ├── context/          # AuthContext and SocketContext
│   │   ├── socket/           # socketClient.js singleton
│   │   ├── services/         # api.js centralized axios client
│   │   └── index.css         # Tailwind dark theme
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/      # auth, repo, pr, environment, issue, webhook, system
│   │   ├── routes/           # Express API endpoints
│   │   ├── middleware/       # auth, errorHandler, activityTracker, rateLimiter
│   │   ├── services/
│   │   │   ├── auth/         # GitHub OAuth service
│   │   │   ├── github/       # GitHub REST API client
│   │   │   ├── docker/       # Dockerode container service & health checker
│   │   │   ├── preview/      # Preview environment orchestration
│   │   │   └── issues/       # Issue context capture & reproduction
│   │   ├── workers/          # environmentWorker.js & cleanupWorker.js
│   │   ├── sockets/          # Socket.IO event broadcaster
│   │   └── utils/            # logger, cryptoUtils, env, errors
│   ├── prisma/
│   │   ├── schema.prisma     # MySQL schema models
│   │   └── seed.js           # Explicit DEMO DATA seed script
│   ├── tests/                # Jest test suite & E2E verification
│   └── package.json
│
├── docker/
│   ├── sample-app/           # Real target application with Dockerfile for testing
│   └── traefik/              # Traefik configuration
│
├── docker-compose.yml        # MySQL, Traefik, Backend, Frontend
├── .env.example              # Documented environment template
├── .gitignore
└── README.md
```

---

## 5. Prerequisites

- **Node.js**: v18+ (tested on Node v20 & v22)
- **MySQL Server**: 8.0+ (or run via Docker Compose)
- **Docker Desktop** / Docker Engine (for preview container builds)

---

## 6. Environment Configuration

Copy `.env.example` to `.env` in the root and in `server/.env`:

```bash
cp .env.example server/.env
```

### Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Backend API port |
| `DATABASE_URL` | `mysql://root:password@localhost:3306/builddeck` | MySQL Prisma connection string |
| `GITHUB_CLIENT_ID` | *(Optional for demo)* | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET`| *(Optional for demo)* | GitHub OAuth App Client Secret |
| `GITHUB_WEBHOOK_SECRET` | `builddeck_webhook_secret_key_12345` | Secret key for GitHub HMAC SHA-256 validation |
| `SESSION_SECRET` | `super_secret_builddeck_session_key_987654321`| Encryption key for HTTP-only session cookies |
| `FRONTEND_URL` | `http://localhost:5173` | React frontend URL for CORS and OAuth redirects |
| `PREVIEW_DOMAIN` | `preview.localhost` | Domain suffix for Traefik preview routing |
| `PREVIEW_HEALTH_PATH` | `/health` | Health endpoint polled after container launch |
| `PREVIEW_STARTUP_TIMEOUT` | `120000` | Health check timeout in milliseconds (2 mins) |
| `PREVIEW_MEMORY_LIMIT` | `512m` | Preview container RAM limit |
| `PREVIEW_CPU_LIMIT` | `1` | Preview container CPU limit (NanoCPUs) |
| `PREVIEW_PIDS_LIMIT` | `100` | Max processes allowed inside preview container |
| `PREVIEW_MAX_LIFETIME` | `3600` | Max seconds before automated cleanup worker destroys container |

---

## 7. Step-by-Step Installation & Running

### Option A: Local Development Setup

#### 1. Install Backend Dependencies & Run Database Migrations
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed
```

#### 2. Install Frontend Dependencies
```bash
cd ../client
npm install
```

#### 3. Run Backend & Worker
```bash
cd ../server
npm run dev
```
*(The backend server will automatically initialize Socket.IO, the Background Job Worker, and the Automated Cleanup Worker.)*

#### 4. Run Frontend
```bash
cd ../client
npm run dev
```
Open **http://localhost:5173** in your browser.

---

### Option B: Docker Compose Setup

To launch all infrastructure services (MySQL 8.0, Traefik Reverse Proxy, Backend, and Frontend) together:

```bash
docker compose up --build -d
```

- **React Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Traefik Dashboard**: http://localhost:8080
- **Preview Environments**: `http://pr-<number>.preview.localhost`

---

## 8. GitHub Integration Setup

### GitHub OAuth App Setup
1. Go to **GitHub Settings → Developer Settings → OAuth Apps → New OAuth App**.
2. Set:
   - **Application name**: `BuildDeck Preview Platform`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
3. Copy **Client ID** and **Client Secret** into your `.env`.

### GitHub Webhook Setup
1. In your GitHub repository, navigate to **Settings → Webhooks → Add webhook**.
2. Configure:
   - **Payload URL**: `http://<your-public-url>/api/webhooks/github` (use `ngrok http 5000` for local development)
   - **Content type**: `application/json`
   - **Secret**: Set to value of `GITHUB_WEBHOOK_SECRET`
   - **Events**: Select **Let me select individual events** → Check **Pull requests** and **Pushes**.
3. Click **Add webhook**.

---

## 9. Automated Testing & Verification

### Run Unit and Integration Tests
```bash
cd server
npm test
```
Tests cover:
- **Authentication**: Session cookies, OAuth redirect generation, demo login, unauthorized protection.
- **Webhooks**: HMAC SHA-256 validation, invalid signature rejection, delivery ID idempotency.
- **Docker Service**: Container creation, Traefik labeling, resource quota enforcement, health check polling.
- **Issues & Debugging**: Auto-context extraction, credential redaction, exact commit reproduction.
- **Cleanup**: Expired environment sweeps and orphaned container detection.

### Run 18-Step End-to-End Test
```bash
cd server
npm run test:e2e
```
The automated E2E script validates the complete 18-step pipeline:
1. Simulates GitHub PR opened webhook with HMAC signature.
2. Verifies webhook idempotency and database persistence in MySQL.
3. Provisions preview environment record with exact commit SHA.
4. Simulates reviewer testing and submitting an issue.
5. Verifies captured `IssueContext` (commit SHA, logs, redacted APIs).
6. Tests `reproduceIssue` ensuring the historical commit SHA is retrieved.
7. Simulates PR merged webhook and verifies container destruction.

---

## 10. Security Notes

- **Preview Code is Untrusted**: Preview containers run with restricted memory (512MB), limited CPU (1 core), process caps (100 PIDs), unprivileged mode, and no host filesystem mounts.
- **Docker Socket Isolation**: The Docker socket (`docker.sock` / named pipe) is **never** mounted into preview containers.
- **Credential Redaction**: The frontend API activity tracker automatically sanitizes all request/response objects, redacting passwords, bearer tokens, cookies, and secret keys before storing debugging contexts.
- **Session Protection**: All sessions use HTTP-only, SameSite cookies with signed secrets. Access tokens are encrypted at rest using AES-256 and never sent to the client browser.

---

## 11. License

MIT License. Designed and built with production engineering rigor for **BuildDeck**.
