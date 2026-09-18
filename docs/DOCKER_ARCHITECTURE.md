# BuildDeck Docker & Container Architecture

This document describes how BuildDeck builds, isolates, routes, and destroys Docker preview environments.

---

## 1. Network Topology & Isolation

Preview environments run untrusted code from Pull Requests and are strictly isolated:

```text
Host Network
    │
[Port 80 HTTP / 8080 Admin]
    ▼
┌─────────────────────────────────────────────────────────────┐
│                 builddeck-network (Bridge)                  │
│                                                             │
│   ┌──────────────────┐               ┌──────────────────┐   │
│   │     Traefik      │──────────────>│  Preview Cont.   │   │
│   │  Reverse Proxy   │               │   builddeck-pr-1 │   │
│   │     (:80)        │               │   (Port 3000)    │   │
│   └──────────────────┘               └──────────────────┘   │
│                                              │              │
│                                              ▼              │
│                                      ┌──────────────────┐   │
│                                      │  Preview Cont.   │   │
│                                      │   builddeck-pr-2 │   │
│                                      │   (Port 3000)    │   │
│                                      └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- **Dedicated Network**: `builddeck-network` (bridge network).
- **No Unrestricted Host Access**: Containers do not share the host network stack.
- **No Docker Socket Mounting**: The Docker daemon socket (`docker.sock` / named pipe) is **never** mounted inside preview containers.
- **Unprivileged Execution**: Containers never run with `--privileged`.

---

## 2. Resource Quotas & Limits

BuildDeck enforces configurable container constraints to prevent abusive or runaway PR code:

| Resource | Default Quota | Configuration Variable |
| :--- | :--- | :--- |
| **Memory Limit** | 512MB (536,870,912 bytes) | `PREVIEW_MEMORY_LIMIT=512m` |
| **CPU Quota** | 1.0 Core (1,000,000,000 NanoCPUs) | `PREVIEW_CPU_LIMIT=1` |
| **PID Limit** | 100 max processes | `PREVIEW_PIDS_LIMIT=100` |
| **Build Timeout** | 120 seconds | `PREVIEW_STARTUP_TIMEOUT=120000` |
| **Max Lifetime** | 3600 seconds (1 hour) | `PREVIEW_MAX_LIFETIME=3600` |

---

## 3. Docker Container Metadata & Labels

Every container provisioned by BuildDeck carries standardized labels for dynamic proxy discovery and lifecycle management:

```dockerfile
# BuildDeck Identification & Ownership Labels
com.builddeck=true
com.builddeck.managed=true
com.builddeck.environment=<environmentId>
com.builddeck.pull_request=<prNumber>
com.builddeck.repository=<repositoryId>
com.builddeck.sha=<commitSha>

# Traefik Dynamic Reverse Proxy Labels
traefik.enable=true
traefik.http.routers.pr-<number>.rule=Host(`pr-<number>.preview.localhost`)
traefik.http.routers.pr-<number>.entrypoints=web
traefik.http.services.pr-<number>.loadbalancer.server.port=3000
traefik.docker.network=builddeck-network
```

---

## 4. Safe Automated Cleanup Strategy

BuildDeck safeguards against deleting unrelated containers on the host machine:
- The cleanup worker **only** inspects containers tagged with `com.builddeck=true` or `com.builddeck.managed=true`.
- Unmanaged third-party containers on the machine are strictly ignored.
- BuildDeck never invokes destructive system commands like `docker system prune -a`.

---

## 5. OS Connection Adaptability

BuildDeck automatically detects the host operating system:
- **Windows**: Connects via the Docker Desktop named pipe `//./pipe/docker_engine`.
- **Linux & macOS**: Connects via the standard Unix domain socket `/var/run/docker.sock`.
- **Remote / Custom**: Respects the `DOCKER_HOST` environment variable when specified.
