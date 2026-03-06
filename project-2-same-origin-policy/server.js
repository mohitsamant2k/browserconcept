// ============================================================
// 🛡️ PROJECT 2: Same-Origin Policy Demo
// ============================================================
// GOAL: See the Same-Origin Policy (SOP) in action by running
// TWO servers on different ports and watching the browser
// block cross-origin requests.
//
// HOW TO RUN:  node server.js
// This starts BOTH servers:
//   Server A → http://localhost:3000  (your app)
//   Server B → http://localhost:4000  (different origin)
// ============================================================

const express = require('express');
const path = require('path');

// ============================================================
// SERVER A — Your App (port 3000)
// ============================================================
// This is "your" website. It will try to access Server B.
// The browser will BLOCK most of these attempts because
// localhost:3000 and localhost:4000 are DIFFERENT ORIGINS.
//
// 🧠 KEY CONCEPT: An "origin" = scheme + host + port
//   http://localhost:3000  ← Origin A
//   http://localhost:4000  ← Origin B  (different port = different origin!)
// ============================================================

const serverA = express();
serverA.use(express.json());

// Serve static HTML pages
serverA.use(express.static(path.join(__dirname, 'views', 'server-a')));

// Server A's own API (same-origin requests will work fine)
serverA.get('/api/same-origin-data', (req, res) => {
  console.log('✅ [Server A] Same-origin request received — this always works!');
  res.json({
    message: '✅ This works! Same-origin request (localhost:3000 → localhost:3000)',
    origin: 'http://localhost:3000',
    tip: 'Same-origin requests are never blocked by the browser.',
  });
});

// Server A sets a cookie
serverA.get('/set-cookie', (req, res) => {
  res.cookie('serverA_session', 'secret_token_abc123', {
    httpOnly: false, // So we can read it with document.cookie for demo
  });
  console.log('🍪 [Server A] Cookie set: serverA_session=secret_token_abc123');
  res.json({ message: 'Cookie set! Check Application tab in DevTools.' });
});

serverA.listen(3000, () => {
  console.log('🟢 Server A running at: http://localhost:3000');
});

// ============================================================
// SERVER B — The "Other" Origin (port 4000)
// ============================================================
// This is a DIFFERENT origin. Server A's pages will try to
// access Server B's resources, and the browser will BLOCK them.
//
// 🧠 KEY CONCEPT: The browser enforces SOP, NOT the server.
// Server B happily responds to any request — it's the BROWSER
// that refuses to give the response to JavaScript on Server A.
// ============================================================

const serverB = express();
serverB.use(express.json());

// Serve Server B's pages
serverB.use(express.static(path.join(__dirname, 'views', 'server-b')));

// Server B's API — no CORS headers (blocked by default)
serverB.get('/api/secret-data', (req, res) => {
  console.log('📨 [Server B] Request received for /api/secret-data');
  console.log('   ⚠️  The server DID respond, but the browser will BLOCK');
  console.log('   the response from being read by JavaScript on Server A!');
  res.json({
    message: '🔒 Secret data from Server B!',
    secret: 'This is sensitive data that SOP protects.',
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ],
  });
});

// Server B sets its own cookie
serverB.get('/set-cookie', (req, res) => {
  res.cookie('serverB_session', 'secret_token_xyz789', {
    httpOnly: false,
  });
  console.log('🍪 [Server B] Cookie set: serverB_session=secret_token_xyz789');
  res.json({ message: 'Server B cookie set!' });
});

// Server B page that shows document.cookie (to prove cookie sharing)
serverB.get('/check-cookies', (req, res) => {
  res.send(`
    <html>
    <head><style>
      body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #e2e8f0; padding: 30px; }
      h2 { color: #e94560; margin-bottom: 16px; }
      .cookie-display { background: #0f172a; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 16px 0; font-family: monospace; font-size: 15px; color: #fbbf24; min-height: 50px; }
      .info { background: #1e293b; border-left: 3px solid #38bdf8; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 20px; }
      .info p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 4px 0; }
      code { background: #334155; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
      strong { color: #f87171; }
    </style></head>
    <body>
      <h2>🔴 Server B (port 4000) — Cookie Check</h2>
      <p>This page is on <code>http://localhost:4000</code>. Let's see what <code>document.cookie</code> returns:</p>
      <div class="cookie-display" id="cookie-output">Loading...</div>
      <div class="info">
        <p>🔥 <strong>Notice:</strong> You can see Server A's cookie (<code>serverA_session</code>) here too!</p>
        <p>🧠 Cookies are scoped by <strong>domain</strong> (localhost), NOT by <strong>origin</strong> (localhost:port).</p>
        <p>📋 SOP says <code>:3000 ≠ :4000</code> → different origins → fetch blocked</p>
        <p>🍪 Cookies say <code>:3000 = :4000</code> → same domain → cookies shared!</p>
      </div>
      <script>
        document.getElementById('cookie-output').textContent = document.cookie || '(no cookies set yet — go set cookies on Server A first!)';
      </script>
    </body>
    </html>
  `);
});

// Server B page served in iframe
serverB.get('/iframe-page', (req, res) => {
  res.send(`
    <html>
    <head><style>
      body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #e2e8f0; padding: 20px; }
      h2 { color: #e94560; }
      p { color: #94a3b8; }
      code { background: #334155; padding: 2px 6px; border-radius: 4px; color: #fbbf24; }
    </style></head>
    <body>
      <h2>🔴 This is Server B (port 4000)</h2>
      <p>This page is loaded inside an iframe on Server A.</p>
      <p>Server A's JavaScript <strong>cannot</strong> access this page's DOM because it's a different origin!</p>
      <p>Server B secret: <code>super_secret_password_123</code></p>
      <p id="serverB-data">Server B DOM content here</p>
    </body>
    </html>
  `);
});

// ---- postMessage listener (the ALLOWED way to communicate) ----
// This endpoint serves a page that listens for postMessage
serverB.get('/postmessage-page', (req, res) => {
  res.send(`
    <html>
    <head><style>
      body { font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #e2e8f0; padding: 20px; }
      h2 { color: #e94560; }
      .message { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-top: 12px; }
    </style></head>
    <body>
      <h2>🔴 Server B — postMessage Listener</h2>
      <p>Waiting for messages from Server A...</p>
      <div id="messages"></div>

      <script>
        // Listen for messages from other origins
        window.addEventListener('message', (event) => {
          // 🧠 SECURITY: Always check the origin!
          // Without this check, ANY website could send messages.
          if (event.origin !== 'http://localhost:3000') {
            return; // Silently ignore (browser extensions send postMessages too)
          }

          console.log('✅ Received message from Server A:', event.data);
          
          const div = document.getElementById('messages');
          div.innerHTML += '<div class="message">📩 From Server A: <strong>' + event.data + '</strong></div>';

          // Send a response back to Server A
          try {
            event.source.postMessage('Hello from Server B! I received: ' + event.data, event.origin);
            console.log('📤 Sent response back to Server A');
          } catch(e) {
            console.log('❌ Failed to send response:', e.message);
            // Fallback: use parent.postMessage
            window.parent.postMessage('Hello from Server B! I received: ' + event.data, 'http://localhost:3000');
            console.log('📤 Sent response via window.parent instead');
          }
        });
      </script>
    </body>
    </html>
  `);
});

serverB.listen(4000, () => {
  console.log('🔴 Server B running at: http://localhost:4000');
  console.log('');
  console.log('='.repeat(60));
  console.log('🛡️  PROJECT 2: Same-Origin Policy Demo');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 Open http://localhost:3000 in your browser');
  console.log('   Then run each experiment and watch:');
  console.log('   1. Browser Console (F12 → Console) for errors');
  console.log('   2. Network tab for blocked requests');
  console.log('   3. This terminal for server-side logs');
  console.log('');
  console.log('='.repeat(60));
});
