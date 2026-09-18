# GitHub Integration & Webhook Setup Guide

BuildDeck integrates with GitHub via OAuth (for reviewer authentication and repository listing) and GitHub Webhooks (for Pull Request event detection and automated container builds).

---

## 1. GitHub OAuth App Setup

To allow developers and reviewers to authenticate with GitHub:

1. Navigate to **GitHub Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in the application registration details:
   - **Application name**: `BuildDeck Preview Platform`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
3. Click **Register application**.
4. Generate a new **Client secret**.
5. Copy your **Client ID** and **Client Secret** into your `.env`:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

---

## 2. GitHub Webhook Configuration

GitHub webhooks inform BuildDeck when Pull Requests are opened, updated with new commits, or closed/merged.

### Local Development Webhook Tunnel
Because GitHub cannot directly reach `localhost`, use a secure tunnel such as **ngrok** or **Cloudflare Tunnel**:

```bash
ngrok http 5000
# Example forwarding URL: https://abc123xyz.ngrok-free.app
```

### Adding the Webhook in GitHub
1. In your GitHub repository, go to **Settings → Webhooks → Add webhook**.
2. Configure the following fields:
   - **Payload URL**: `https://<your-tunnel-domain>/api/webhooks/github` (or `http://localhost:5000/api/webhooks/github` in production)
   - **Content type**: `application/json`
   - **Secret**: Value of `GITHUB_WEBHOOK_SECRET` from your `.env` (default: `builddeck_webhook_secret_key_12345`)
   - **SSL verification**: Enable SSL verification
   - **Which events would you like to trigger this webhook?**:
     - Choose **Let me select individual events**.
     - Check:
       - [x] **Pull requests**
       - [x] **Pushes**
3. Click **Add webhook**.

---

## 3. Webhook Security & Idempotency

BuildDeck implements two mandatory security and reliability checks for every webhook:

1. **HMAC SHA-256 Verification**:
   The header `X-Hub-Signature-256` is verified using constant-time equality check (`crypto.timingSafeEqual`) against the raw incoming request payload. Any payload with an invalid or missing signature is rejected with HTTP 401 Unauthorized.

2. **Delivery ID Idempotency**:
   GitHub may deliver duplicate webhook events. BuildDeck checks `X-GitHub-Delivery` against the `WebhookEvent` table. If the delivery ID has already been recorded, BuildDeck returns HTTP 200 with `{ status: "ignored" }` to prevent spinning up duplicate preview environments.
