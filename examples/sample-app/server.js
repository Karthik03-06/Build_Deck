const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint required by BuildDeck health verification
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

// Root preview page
app.get('/', (req, res) => {
  const prNumber = process.env.PR_NUMBER || '42';
  const commitSha = process.env.COMMIT_SHA || 'latest';
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>BuildDeck Live Preview — PR #${prNumber}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0b0f17;
          color: #f0f4fc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 24px;
        }
        .container {
          background: #121826;
          border: 1px solid #223049;
          border-radius: 16px;
          padding: 36px;
          max-width: 580px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.4);
          margin-bottom: 20px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; }
        h1 { margin-top: 0; font-size: 24px; color: #38bdf8; }
        p { color: #8e9eb5; font-size: 14px; line-height: 1.6; }
        .meta-table {
          background: #0b0f17;
          border: 1px solid #182234;
          border-radius: 10px;
          padding: 16px;
          margin: 20px 0;
          font-family: "JetBrains Mono", monospace;
          font-size: 13px;
        }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #182234; }
        .row:last-child { border-bottom: none; }
        .label { color: #8e9eb5; }
        .val { color: #f0f4fc; font-weight: 600; }
        .btn {
          background: #0284c7;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: background 0.2s;
        }
        .btn:hover { background: #0369a1; }
        .btn-danger { background: #be123c; margin-left: 8px; }
        .btn-danger:hover { background: #9f1239; }
        #response-output {
          margin-top: 16px;
          font-family: monospace;
          font-size: 12px;
          color: #38bdf8;
          min-height: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge"><span class="dot"></span> Preview Environment Live</div>
        <h1>BuildDeck Isolated Preview</h1>
        <p>This application was automatically built and routed by <strong>BuildDeck</strong> from a GitHub Pull Request!</p>

        <div class="meta-table">
          <div class="row"><span class="label">Pull Request:</span> <span class="val">#${prNumber}</span></div>
          <div class="row"><span class="label">Commit SHA:</span> <span class="val">${commitSha}</span></div>
          <div class="row"><span class="label">Internal Port:</span> <span class="val">${PORT} (Bound to 0.0.0.0)</span></div>
          <div class="row"><span class="label">Health Check:</span> <span class="val" style="color: #34d399;">200 OK (/health)</span></div>
        </div>

        <div>
          <button class="btn" onclick="testHealth()">Check Health API</button>
          <button class="btn btn-danger" onclick="simulateBug()">Simulate Bug</button>
        </div>
        <div id="response-output"></div>
      </div>

      <script>
        async function testHealth() {
          const res = await fetch('/health');
          const data = await res.json();
          document.getElementById('response-output').innerText = 'Health Check Response: ' + JSON.stringify(data);
        }
        async function simulateBug() {
          document.getElementById('response-output').innerText = 'Simulated client-side exception: Unhandled rejection at line 42';
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Sample App] Listening on 0.0.0.0:${PORT}`);
});
