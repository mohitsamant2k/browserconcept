// ============================================================
// 🌐 PROJECT 7: CORS Playground
// ============================================================
// GOAL: Understand CORS step-by-step by toggling different
// configurations and watching what the browser blocks/allows.
//
// HOW TO RUN:  node server.js
// API Server:  http://localhost:3000
// Frontend:    http://localhost:4000
//
// CORS MODES (toggle from the frontend dashboard):
//   Mode 0: No CORS headers at all (everything blocked)
//   Mode 1: Access-Control-Allow-Origin: * (simple GET works)
//   Mode 2: Specific origin + credentials (credentialed GET works)
//   Mode 3: Full preflight support (POST/DELETE with JSON work)
//   Mode 4: Misconfigured — reflect any origin (DANGEROUS!)
// ============================================================

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// 🔧 API SERVER (port 3000)
// ============================================================
const api = express();
api.use(express.json());
api.use(express.urlencoded({ extended: true }));
api.use(cookieParser());

// ============================================================
// CORS MODE — changed via POST from frontend
// ============================================================
let corsMode = 0; // Start with NO CORS headers

const CORS_MODES = {
  0: 'No CORS headers (all cross-origin blocked)',
  1: 'Allow-Origin: * (simple GET works, credentials fail)',
  2: 'Specific origin + credentials (credentialed requests work)',
  3: 'Full preflight (POST/PUT/DELETE with custom headers work)',
  4: '⚠️ MISCONFIGURED: Reflect any origin (dangerous!)',
};

// In-memory data store
let dataStore = [
  { id: 1, title: 'Secret Report Q1', content: 'Revenue: $5M', owner: 'alice' },
  { id: 2, title: 'Secret Report Q2', content: 'Revenue: $8M', owner: 'alice' },
  { id: 3, title: 'Public Memo', content: 'Office party Friday', owner: 'bob' },
];
let nextId = 4;

// Simple session store
const sessions = {};
const users = {
  alice: { password: 'password123', role: 'admin' },
  bob: { password: 'password456', role: 'user' },
};

// ============================================================
// MIDDLEWARE: Apply CORS headers based on current mode
// ============================================================
function applyCORS(req, res, next) {
  const origin = req.headers.origin;

  // Log every cross-origin request for learning
  if (origin) {
    console.log(`\n📨 ${req.method} ${req.path}`);
    console.log(`   Origin: ${origin}`);
    console.log(`   CORS Mode: ${corsMode} — ${CORS_MODES[corsMode]}`);
  }

  switch (corsMode) {
    case 0:
      // No CORS headers — browser blocks everything cross-origin
      console.log('   → No CORS headers sent (browser will block)');
      break;

    case 1:
      // Wildcard — simple requests work, but NO credentials
      res.setHeader('Access-Control-Allow-Origin', '*');
      console.log('   → Allow-Origin: * (wildcard)');
      break;

    case 2:
      // Specific origin + credentials — credentialed requests work
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        console.log('   → Allow-Origin: http://localhost:4000 + Credentials: true');
      }
      break;

    case 3:
      // Full preflight support — all request types work
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4000');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Custom-Header');
        res.setHeader('Access-Control-Max-Age', '600'); // Cache preflight for 10 min
        console.log('   → Full preflight: Methods, Headers, Credentials all allowed');
      }
      break;

    case 4:
      // DANGEROUS: Reflect any origin — common misconfiguration!
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin); // Reflects attacker's origin!
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Custom-Header');
        console.log(`   → ⚠️ DANGER: Reflecting origin "${origin}" + Credentials!`);
        console.log('   → ANY website can make authenticated requests to this API!');
      }
      break;
  }

  // Handle preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    console.log('   → Preflight (OPTIONS) response sent');
    return res.sendStatus(204);
  }

  next();
}

api.use(applyCORS);

// ============================================================
// AUTH ROUTES (same-origin — no CORS needed)
// ============================================================

// Login page (served directly for same-origin access)
api.get('/login', (req, res) => {
  const msg = req.query.message || '';
  res.send(`
    <!DOCTYPE html>
    <html><head><title>API Server Login</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5; }
      .card { background: white; padding: 30px 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 350px; }
      h2 { text-align: center; margin-bottom: 20px; }
      input { width: 100%; padding: 10px; margin: 6px 0 14px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
      button { width: 100%; padding: 10px; background: #4a90d9; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer; font-weight: 600; }
      button:hover { background: #357abd; }
      .msg { font-size: 13px; color: #e67e22; text-align: center; margin-bottom: 10px; }
      .creds { font-size: 12px; color: #888; text-align: center; margin-top: 14px; }
      code { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; }
    </style></head><body>
    <div class="card">
      <h2>🌐 API Server Login</h2>
      ${msg ? `<p class="msg">${msg}</p>` : ''}
      <form method="POST" action="/login">
        <label>Username</label>
        <input name="username" value="alice" required>
        <label>Password</label>
        <input name="password" type="password" value="password123" required>
        <button type="submit">Log In</button>
      </form>
      <p class="creds">Test: <code>alice/password123</code> or <code>bob/password456</code></p>
    </div></body></html>
  `);
});

api.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.redirect('/login?message=Invalid credentials');
  }

  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions[sessionId] = { username, role: user.role };

  res.cookie('session_id', sessionId, {
    httpOnly: true,
    sameSite: 'none',  // Allow cross-site for CORS testing
    secure: false,     // HTTP localhost
    maxAge: 3600000,
  });

  console.log(`\n✅ ${username} logged in (session: ${sessionId.slice(0, 8)}...)`);
  res.redirect('/login?message=Logged in! Now go to localhost:4000 to test CORS.');
});

api.get('/logout', (req, res) => {
  const sid = req.cookies['session_id'];
  if (sid) delete sessions[sid];
  res.clearCookie('session_id');
  res.redirect('/login?message=Logged out');
});

// Helper: get current user from session
function getUser(req) {
  const sid = req.cookies['session_id'];
  return sid && sessions[sid] ? sessions[sid] : null;
}

// ============================================================
// API ENDPOINTS
// ============================================================

// GET /api/public — no auth needed
api.get('/api/public', (req, res) => {
  console.log('   → Response: public data');
  res.json({
    message: 'This is PUBLIC data — no authentication required',
    data: dataStore.filter(d => d.owner === 'bob'), // Only public items
    corsMode: corsMode,
    corsDescription: CORS_MODES[corsMode],
  });
});

// GET /api/private — requires auth cookie
api.get('/api/private', (req, res) => {
  const user = getUser(req);
  if (!user) {
    console.log('   → Response: 401 (no session cookie received)');
    return res.status(401).json({
      error: 'Not authenticated',
      hint: 'No session cookie was sent. Did the browser block it?',
      cookiesReceived: req.headers.cookie || '(none)',
      corsMode,
    });
  }
  console.log(`   → Response: private data for ${user.username}`);
  res.json({
    message: `Private data for ${user.username} (${user.role})`,
    data: dataStore,
    user: user.username,
    corsMode,
  });
});

// POST /api/data — create new item (requires auth + JSON body)
api.post('/api/data', (req, res) => {
  const user = getUser(req);
  if (!user) {
    console.log('   → Response: 401');
    return res.status(401).json({ error: 'Not authenticated', corsMode });
  }
  const { title, content } = req.body;
  const newItem = { id: nextId++, title: title || 'Untitled', content: content || '', owner: user.username };
  dataStore.push(newItem);
  console.log(`   → Created item #${newItem.id}: "${newItem.title}"`);
  res.status(201).json({ message: 'Created!', item: newItem, corsMode });
});

// DELETE /api/data/:id — delete item (requires auth)
api.delete('/api/data/:id', (req, res) => {
  const user = getUser(req);
  if (!user) {
    console.log('   → Response: 401');
    return res.status(401).json({ error: 'Not authenticated', corsMode });
  }
  const id = parseInt(req.params.id);
  const idx = dataStore.findIndex(d => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  const removed = dataStore.splice(idx, 1)[0];
  console.log(`   → Deleted item #${id}: "${removed.title}"`);
  res.json({ message: `Deleted item #${id}`, item: removed, corsMode });
});

// GET /api/cors-mode — check current CORS mode
api.get('/api/cors-mode', (req, res) => {
  res.json({ mode: corsMode, description: CORS_MODES[corsMode], allModes: CORS_MODES });
});

// POST /api/cors-mode — change CORS mode
api.post('/api/cors-mode', (req, res) => {
  const { mode } = req.body;
  if (mode >= 0 && mode <= 4) {
    corsMode = parseInt(mode);
    console.log(`\n🔄 CORS Mode changed to: ${corsMode} — ${CORS_MODES[corsMode]}`);
    res.json({ mode: corsMode, description: CORS_MODES[corsMode] });
  } else {
    res.status(400).json({ error: 'Invalid mode (0-4)' });
  }
});

// ============================================================
// 🖥️ FRONTEND SERVER (port 4000)
// ============================================================
const frontend = express();
frontend.set('view engine', 'ejs');
frontend.set('views', path.join(__dirname, 'views'));

frontend.get('/', (req, res) => {
  res.render('dashboard');
});

// ============================================================
// START BOTH SERVERS
// ============================================================
api.listen(3000, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🌐  PROJECT 7: CORS Playground');
  console.log('='.repeat(60));
  console.log('');
  console.log('🔧 API Server:   http://localhost:3000');
  console.log('🖥️  Frontend:     http://localhost:4000');
  console.log('');
  console.log('📋 Steps:');
  console.log('   1. Login at http://localhost:3000/login (alice/password123)');
  console.log('   2. Open http://localhost:4000 (CORS dashboard)');
  console.log('   3. Try each request type at each CORS mode');
  console.log('   4. Watch what the browser blocks vs allows');
  console.log('');
  console.log(`🌐 CORS Mode: ${corsMode} — ${CORS_MODES[corsMode]}`);
  console.log('='.repeat(60));
});

frontend.listen(4000, () => {
  console.log('🖥️  Frontend running on http://localhost:4000');
});
