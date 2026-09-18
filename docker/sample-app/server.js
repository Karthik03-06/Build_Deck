const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint (for BuildDeck health checker)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'preview'
  });
});

// Root preview page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BuildDeck Preview Application</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0d1117;
          color: #c9d1d9;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        .card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 32px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          background: #238636;
          color: #ffffff;
          margin-bottom: 16px;
        }
        h1 { margin-top: 0; color: #58a6ff; }
        .meta-box {
          background: #0d1117;
          border: 1px solid #21262d;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          font-family: monospace;
          font-size: 14px;
        }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .meta-row:last-child { margin-bottom: 0; }
        .btn {
          background: #238636;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        .btn:hover { background: #2ea043; }
        .btn-danger { background: #da3633; margin-left: 10px; }
        .btn-danger:hover { background: #f85149; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">RUNNING IN PREVIEW</span>
        <h1>BuildDeck Isolated Preview</h1>
        <p>This application was automatically built and deployed by <strong>BuildDeck</strong> from a GitHub Pull Request!</p>
        
        <div class="meta-box">
          <div class="meta-row"><span>PR Number:</span> <span>#${process.env.PR_NUMBER || '42'}</span></div>
          <div class="meta-row"><span>Commit SHA:</span> <span>${process.env.COMMIT_SHA || 'a82f91d0e4'}</span></div>
          <div class="meta-row"><span>Internal Port:</span> <span>${PORT}</span></div>
          <div class="meta-row"><span>Health Status:</span> <span style="color: #3fb950;">✓ Pass (/health)</span></div>
        </div>

        <div>
          <button class="btn" onclick="testApi()">Trigger Test API</button>
          <button class="btn btn-danger" onclick="triggerError()">Simulate Bug (500)</button>
        </div>
        <p id="output" style="margin-top: 15px; font-family: monospace; color: #8b949e;"></p>
      </div>

      <script>
        async function testApi() {
          const res = await fetch('/api/test');
          const data = await res.json();
          document.getElementById('output').innerText = 'API Response: ' + JSON.stringify(data);
        }
        async function triggerError() {
          const res = await fetch('/api/bug');
          const data = await res.json();
          document.getElementById('output').innerText = 'Error Captured: ' + JSON.stringify(data);
        }
      </script>
    </body>
    </html>
  `);
});

// Sample API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'BuildDeck preview API is functional!', timestamp: Date.now() });
});

app.get('/api/bug', (req, res) => {
  res.status(500).json({ error: 'Internal Server Error', message: 'Simulated bug for reproducible debugging testing' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Sample App] Preview server listening on port ${PORT}`);
});
