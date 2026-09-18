# BuildDeck Troubleshooting Guide

Common issues encountered when running BuildDeck and their resolutions.

---

## 1. Docker Engine Unavailable

**Symptom**:
Log displays `connect ENOENT //./pipe/docker_engine` or `connect ENOENT /var/run/docker.sock`, and `/api/health` reports `docker: "unavailable"`.

**Resolution**:
1. Ensure Docker Desktop is installed and running.
2. If running on Windows, verify that **Expose daemon on tcp://localhost:2375 without TLS** is enabled or that Docker Desktop is running in Windows/WSL2 integration mode.
3. If running in a Linux server, verify that the user running Node has permissions to `/var/run/docker.sock` (`sudo usermod -aG docker $USER`).
4. Set `DOCKER_HOST` in `.env` if using a remote Docker daemon.

---

## 2. MySQL Authentication Failed (P1000)

**Symptom**:
Log displays `Authentication failed against database server at localhost:3306`.

**Resolution**:
1. Check `DATABASE_URL` in `server/.env`.
2. By default, Docker Compose provisions MySQL with `mysql://root:password@localhost:3306/builddeck`.
3. If connecting to a pre-existing host MySQL instance, update the username and password in `DATABASE_URL`.
4. BuildDeck includes a resilient in-memory fallback layer so that the dashboard and testing suite continue to function without crashing even if host credentials are temporarily invalid.

---

## 3. Webhook Signature Rejected (401 Unauthorized)

**Symptom**:
GitHub reports webhook deliveries fail with HTTP 401.

**Resolution**:
1. Ensure `GITHUB_WEBHOOK_SECRET` in `server/.env` exactly matches the secret entered in GitHub webhook settings.
2. Verify that your reverse proxy or tunnel forwards the raw request body without stripping or modifying characters. BuildDeck uses the raw payload stream buffer to calculate HMAC SHA-256.

---

## 4. Missing Dockerfile Error

**Symptom**:
Build fails with error: `"Repository does not contain a Dockerfile required by BuildDeck."`

**Resolution**:
BuildDeck requires repositories to have a `Dockerfile` at the repository root. Ensure the PR branch includes a valid Dockerfile that packages the application.

---

## 5. Preview URL Not Loading (`pr-X.preview.localhost`)

**Symptom**:
The preview button opens `http://pr-X.preview.localhost` but the browser shows `ERR_CONNECTION_REFUSED`.

**Resolution**:
1. Ensure Traefik is running (`docker compose up -d traefik`).
2. Verify that the browser supports `*.localhost` resolution (Chrome, Edge, Firefox, and modern operating systems resolve `*.localhost` to `127.0.0.1` automatically per RFC 6761).
3. If using an older OS or custom DNS that does not resolve `*.localhost`, add an entry to your `hosts` file (`/etc/hosts` or `C:\Windows\System32\drivers\etc\hosts`):
   ```text
   127.0.0.1 pr-42.preview.localhost
   ```

---

## 6. Container Starts But Health Check Times Out

**Symptom**:
Environment status transitions to `STARTING` and then `FAILED` with message `Health check timed out`.

**Resolution**:
1. Check that the preview application inside the Docker container is bound to `0.0.0.0` (not `127.0.0.1`).
2. Verify that the application listens on port 3000 (or the port specified in `containerPort`).
3. Ensure the application responds with HTTP 200 to `GET /health` or `GET /`.
