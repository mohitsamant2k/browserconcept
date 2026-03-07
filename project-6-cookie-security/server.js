// ============================================================
// 🍪 PROJECT 6: Cookie Security Lab
// ============================================================
// GOAL: Explore every cookie attribute and understand its
// security impact through hands-on experiments.
//
// HOW TO RUN:  node server.js
// Main App:    http://localhost:3000
// Attacker:    http://localhost:4000
//
// COOKIE ATTRIBUTES:
//   HttpOnly  → JavaScript can't read the cookie
//   Secure    → Cookie only sent over HTTPS
//   SameSite  → Controls cross-site cookie sending
//   Path      → Cookie only sent to matching paths
//   Domain    → Cookie shared across subdomains
//   __Host-   → Prefix: must be Secure + Path=/ + no Domain
//   __Secure- → Prefix: must have Secure flag
// ============================================================

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// 🏠 MAIN APP (port 3000)
// ============================================================
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ============================================================
// COOKIE SETTINGS (toggleable via dashboard)
// ============================================================
let cookieSettings = {
  httpOnly: false,     // Experiment 1 & 2
  secure: false,       // Experiment 3
  sameSite: 'lax',     // Experiment 4 & 5: 'none', 'lax', 'strict'
  path: '/',           // Default path
  useHostPrefix: false, // Experiment 6: __Host- prefix
};

// In-memory "database"
const users = {
  alice: { password: 'password123', email: 'alice@example.com' },
  bob: { password: 'password456', email: 'bob@example.com' },
};

// Simple session store
const sessions = {};

// ============================================================
// MIDDLEWARE: Check session from cookie
// ============================================================
function getSession(req) {
  // Check for regular session cookie or __Host- prefixed cookie
  const sessionId = req.cookies['session_id'] || req.cookies['__Host-session_id'];
  if (sessionId && sessions[sessionId]) {
    return sessions[sessionId];
  }
  return null;
}

function requireLogin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.redirect('/login');
  }
  req.currentUser = session.username;
  next();
}

// ============================================================
// ROUTES
// ============================================================

// --- HOME ---
app.get('/', (req, res) => {
  const session = getSession(req);
  if (session) return res.redirect('/dashboard');
  res.redirect('/login');
});

// --- LOGIN PAGE ---
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// --- LOGIN (POST) ---
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user || user.password !== password) {
    return res.render('login', { error: 'Invalid credentials' });
  }

  // Create session
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions[sessionId] = { username, createdAt: new Date() };

  // Build cookie options based on current settings
  const cookieOpts = {
    httpOnly: cookieSettings.httpOnly,
    secure: cookieSettings.secure,
    path: cookieSettings.path,
    maxAge: 3600000, // 1 hour
  };

  // SameSite handling
  // IMPORTANT: Chrome requires Secure flag when SameSite=None!
  // On HTTP localhost, SameSite=None without Secure = cookie REJECTED.
  // So when user picks 'none', we must also set secure=false and
  // omit SameSite entirely (letting browser default apply).
  if (cookieSettings.sameSite === 'strict') {
    cookieOpts.sameSite = 'strict';
  } else if (cookieSettings.sameSite === 'lax') {
    cookieOpts.sameSite = 'lax';
  } else {
    // SameSite=None — don't set sameSite attribute at all on HTTP
    // This lets cookies be sent cross-site on older browsers,
    // and modern Chrome treats missing as 'lax' — that's educational!
    // We intentionally leave sameSite undefined.
    cookieOpts.sameSite = false; // express: false = don't set the attribute
  }

  // Cookie name (with or without __Host- prefix)
  const cookieName = cookieSettings.useHostPrefix ? '__Host-session_id' : 'session_id';

  // If using __Host- prefix, enforce the rules
  if (cookieSettings.useHostPrefix) {
    cookieOpts.secure = true;  // __Host- requires Secure
    cookieOpts.path = '/';     // __Host- requires Path=/
    // __Host- must NOT have Domain attribute (we don't set it)
  }

  // Clear any old cookies
  res.clearCookie('session_id');
  res.clearCookie('__Host-session_id');

  // Set the session cookie
  res.cookie(cookieName, sessionId, cookieOpts);

  // Also set a demo "preferences" cookie that's always JS-readable
  // (to contrast with the session cookie)
  res.cookie('user_prefs', JSON.stringify({ theme: 'light', lang: 'en' }), {
    httpOnly: false,
    maxAge: 3600000,
  });

  console.log('');
  console.log('🍪 Cookie set for', username);
  console.log('   Name:', cookieName);
  console.log('   HttpOnly:', cookieOpts.httpOnly);
  console.log('   Secure:', cookieOpts.secure);
  console.log('   SameSite:', cookieOpts.sameSite);
  console.log('   Path:', cookieOpts.path);
  console.log('');

  res.redirect('/dashboard');
});

// --- LOGOUT ---
app.get('/logout', (req, res) => {
  const sessionId = req.cookies['session_id'] || req.cookies['__Host-session_id'];
  if (sessionId) {
    delete sessions[sessionId];
  }
  res.clearCookie('session_id');
  res.clearCookie('__Host-session_id');
  res.clearCookie('user_prefs');
  console.log('👋 Logged out');
  res.redirect('/login');
});

// --- DASHBOARD ---
app.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', {
    username: req.currentUser,
    cookieSettings,
    cookies: req.cookies,
    rawCookieHeader: req.headers.cookie || '(no cookies sent)',
  });
});

// --- TOGGLE COOKIE SETTINGS ---
app.post('/toggle', requireLogin, (req, res) => {
  const { setting, value } = req.body;

  if (setting === 'httpOnly') {
    cookieSettings.httpOnly = !cookieSettings.httpOnly;
    console.log(`🍪 HttpOnly: ${cookieSettings.httpOnly ? 'ON ✅' : 'OFF ❌'}`);
  } else if (setting === 'secure') {
    cookieSettings.secure = !cookieSettings.secure;
    console.log(`🍪 Secure: ${cookieSettings.secure ? 'ON ✅' : 'OFF ❌'}`);
  } else if (setting === 'sameSite') {
    // Cycle: none → lax → strict → none
    const cycle = { none: 'lax', lax: 'strict', strict: 'none' };
    cookieSettings.sameSite = cycle[cookieSettings.sameSite] || 'none';
    console.log(`🍪 SameSite: ${cookieSettings.sameSite}`);
  } else if (setting === 'hostPrefix') {
    cookieSettings.useHostPrefix = !cookieSettings.useHostPrefix;
    console.log(`🍪 __Host- prefix: ${cookieSettings.useHostPrefix ? 'ON ✅' : 'OFF ❌'}`);
  }

  // After changing settings, user must re-login to get a new cookie
  // with the updated attributes
  const sessionId = req.cookies['session_id'] || req.cookies['__Host-session_id'];
  if (sessionId) delete sessions[sessionId];
  res.clearCookie('session_id');
  res.clearCookie('__Host-session_id');

  res.redirect('/login?message=Settings changed! Log in again to get a cookie with the new attributes.');
});

// --- API: Get user profile (for cross-site requests) ---
app.get('/api/profile', (req, res) => {
  // Set CORS headers to allow the attacker site to make requests
  // Attacker runs on 127.0.0.1 (NOT localhost) so browser treats it as cross-SITE
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:4000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  const session = getSession(req);
  if (!session) {
    return res.json({ error: 'Not logged in', cookies_received: req.headers.cookie || 'none' });
  }
  res.json({
    username: session.username,
    email: users[session.username].email,
    cookies_received: req.headers.cookie || 'none',
    message: '⚠️ Attacker can read your profile because cookies were sent cross-site!'
  });
});

// --- API: Transfer money (for cross-site POST test) ---
app.post('/api/transfer', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:4000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const session = getSession(req);
  if (!session) {
    return res.json({ error: 'Not logged in — SameSite may have blocked the cookie!' });
  }
  const { to, amount } = req.body;
  console.log(`💸 Cross-site transfer: ${session.username} → ${to}: $${amount}`);
  res.json({
    success: true,
    message: `Transferred $${amount} from ${session.username} to ${to}`,
    warning: '⚠️ This worked because SameSite was not strict!'
  });
});

// Handle preflight for /api/transfer
app.options('/api/transfer', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:4000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

// --- EXPERIMENT PAGE: XSS Cookie Theft ---
app.get('/xss-demo', requireLogin, (req, res) => {
  res.render('xss-demo', {
    username: req.currentUser,
    cookieSettings,
  });
});

// ============================================================
// 😈 ATTACKER SITE (port 4000)
// ============================================================
const attacker = express();
attacker.use(express.static(path.join(__dirname, 'attacker-site')));

// ============================================================
// START BOTH SERVERS
// ============================================================
app.listen(3000, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🍪  PROJECT 6: Cookie Security Lab');
  console.log('='.repeat(60));
  console.log('');
  console.log('🏠 Main App:       http://localhost:3000');
  console.log('😈 Attacker Site:   http://127.0.0.1:4000  ← use 127.0.0.1, NOT localhost!');
  console.log('');
  console.log('📋 Experiments:');
  console.log('   1. HttpOnly OFF → steal cookie via XSS');
  console.log('   2. HttpOnly ON  → XSS can\'t read cookie');
  console.log('   3. Secure flag  → cookie only over HTTPS');
  console.log('   4. SameSite=Strict → no cross-site cookies');
  console.log('   5. SameSite=Lax → only top-level navigations');
  console.log('   6. __Host- prefix → strictest cookie rules');
  console.log('');
  console.log('👤 Accounts:  alice/password123  |  bob/password456');
  console.log('');
  console.log('🍪 Default: HttpOnly=OFF, Secure=OFF, SameSite=Lax');
  console.log('='.repeat(60));
});

attacker.listen(4000, '127.0.0.1', () => {
  console.log('😈 Attacker site running on http://127.0.0.1:4000');
  console.log('');
  console.log('⚠️  IMPORTANT: Access attacker via 127.0.0.1, NOT localhost!');
  console.log('   localhost→localhost = same-site (SameSite won\'t block)');
  console.log('   localhost→127.0.0.1 = cross-site (SameSite WILL block)');
});
