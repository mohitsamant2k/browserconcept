// ============================================================
// 🖱️ PROJECT 5: Clickjacking Attack & Defense
// ============================================================
// GOAL: Build an app with a dangerous action (delete account),
// then build an attacker page that tricks users into clicking
// that button via a transparent iframe overlay.
//
// HOW TO RUN:  node server.js
// Legit App:   http://localhost:3000
// Attacker:    http://localhost:4000
//
// CLICKJACKING = Visual deception attack
//   Attacker loads YOUR site in an invisible iframe.
//   A fake "Win a Prize!" button is positioned exactly
//   over YOUR "Delete Account" button.
//   User clicks what they THINK is a prize → actually
//   clicks Delete Account on YOUR site.
// ============================================================

const express = require('express');
const session = require('express-session');
const path = require('path');

// ============================================================
// 🏠 LEGITIMATE APP (port 3000)
// ============================================================
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
// NOTE: sameSite is set to 'none' so the cookie is sent inside
// cross-origin iframes (localhost:4000 → localhost:3000).
// Chrome treats missing SameSite as 'lax', which BLOCKS iframe cookies.
// 'none' explicitly allows cross-site cookie sending.
// This is intentionally VULNERABLE for the clickjacking demo.
// In production, you'd use sameSite: 'strict' or 'lax'.
app.use(
  session({
    secret: 'clickjacking-demo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'none', secure: false },
  })
);

// ============================================================
// DEFENSE SETTINGS
// ============================================================
let defenses = {
  xFrameOptions: false,     // X-Frame-Options: DENY
  cspFrameAncestors: false, // CSP: frame-ancestors 'none'
  frameBreaker: false,      // JavaScript frame-buster (legacy)
};

// ============================================================
// MIDDLEWARE: Apply security headers based on defense toggles
// ============================================================
app.use((req, res, next) => {
  if (defenses.xFrameOptions) {
    res.setHeader('X-Frame-Options', 'DENY');
    console.log('🛡️  X-Frame-Options: DENY header added');
  }

  if (defenses.cspFrameAncestors) {
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    console.log('🛡️  CSP: frame-ancestors \'none\' header added');
  }

  next();
});

// ============================================================
// IN-MEMORY "DATABASE"
// ============================================================
const users = {
  alice: {
    password: 'password123',
    email: 'alice@example.com',
    settings: { theme: 'light', notifications: true },
    deleted: false,
  },
  bob: {
    password: 'password456',
    email: 'bob@example.com',
    settings: { theme: 'dark', notifications: false },
    deleted: false,
  },
};

// ============================================================
// MIDDLEWARE: Auth check
// ============================================================
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  if (users[req.session.user].deleted) {
    req.session.destroy();
    return res.redirect('/login');
  }
  next();
}

// ============================================================
// ROUTES
// ============================================================

// --- HOME ---
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

// --- LOGIN PAGE ---
app.get('/login', (req, res) => {
  res.render('login', { error: null, message: null, defenses });
});

// --- LOGIN (POST) ---
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user || user.password !== password) {
    return res.render('login', { error: 'Invalid credentials', message: null, defenses });
  }

  if (user.deleted) {
    return res.render('login', { error: 'This account has been deleted', message: null, defenses });
  }

  req.session.user = username;
  console.log(`✅ ${username} logged in`);
  res.redirect('/dashboard');
});

// --- LOGOUT ---
app.get('/logout', (req, res) => {
  const user = req.session.user;
  req.session.destroy();
  console.log(`👋 ${user} logged out`);
  res.redirect('/login');
});

// --- DASHBOARD ---
app.get('/dashboard', requireLogin, (req, res) => {
  const user = users[req.session.user];
  res.render('dashboard', {
    username: req.session.user,
    email: user.email,
    settings: user.settings,
    defenses,
  });
});

// --- SETTINGS PAGE (contains the dangerous "Delete Account" button) ---
app.get('/settings', requireLogin, (req, res) => {
  const user = users[req.session.user];
  res.render('settings', {
    username: req.session.user,
    email: user.email,
    settings: user.settings,
    defenses,
  });
});

// --- UPDATE SETTINGS ---
app.post('/settings', requireLogin, (req, res) => {
  const user = users[req.session.user];
  user.settings.theme = req.body.theme || user.settings.theme;
  user.settings.notifications = req.body.notifications === 'on';
  console.log(`⚙️  ${req.session.user} updated settings`);
  res.redirect('/settings');
});

// --- DELETE ACCOUNT (the target for clickjacking) ---
app.post('/delete-account', requireLogin, (req, res) => {
  const username = req.session.user;
  users[username].deleted = true;

  console.log('');
  console.log('💀'.repeat(30));
  console.log(`💀 ACCOUNT DELETED: ${username}`);
  console.log(`💀 Origin: ${req.headers.origin || '(none)'}`);
  console.log(`💀 Referer: ${req.headers.referer || '(none)'}`);
  console.log('💀'.repeat(30));
  console.log('');

  req.session.destroy();
  res.render('login', {
    error: null,
    message: `Account "${username}" has been permanently deleted!`,
    defenses,
  });
});

// --- TRANSFER MONEY (another clickjacking target) ---
app.post('/transfer', requireLogin, (req, res) => {
  const { to, amount } = req.body;
  console.log(`💸 Transfer: ${req.session.user} → ${to}: $${amount}`);
  console.log(`   Origin: ${req.headers.origin || '(none)'}`);
  console.log(`   Referer: ${req.headers.referer || '(none)'}`);
  res.redirect('/dashboard');
});

// --- TOGGLE DEFENSES ---
app.post('/toggle-defense', requireLogin, (req, res) => {
  const { defense } = req.body;
  if (defenses.hasOwnProperty(defense)) {
    defenses[defense] = !defenses[defense];
    console.log(`🛡️  Defense "${defense}": ${defenses[defense] ? 'ON ✅' : 'OFF ❌'}`);
  }
  res.redirect('/dashboard');
});

// --- RESET ACCOUNTS ---
app.post('/reset', (req, res) => {
  users.alice.deleted = false;
  users.bob.deleted = false;
  console.log('🔄 Accounts reset');
  res.redirect('/login');
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
  console.log('🖱️  PROJECT 5: Clickjacking Attack & Defense');
  console.log('='.repeat(60));
  console.log('');
  console.log('🏠 Legit App:      http://localhost:3000');
  console.log('😈 Attacker Site:   http://localhost:4000');
  console.log('');
  console.log('📋 Steps:');
  console.log('   1. Log in as alice/password123');
  console.log('   2. Visit http://localhost:4000 (attacker site)');
  console.log('   3. Click "Claim Your Prize!" → actually deletes your account!');
  console.log('   4. Go back to dashboard → toggle defenses ON');
  console.log('   5. Visit attacker site again → iframe is now blocked!');
  console.log('');
  console.log('👤 Accounts:');
  console.log('   alice / password123');
  console.log('   bob   / password456');
  console.log('');
  console.log('🛡️  All defenses: OFF (vulnerable by default)');
  console.log('='.repeat(60));
});

attacker.listen(4000, () => {
  console.log('😈 Attacker site running on http://localhost:4000');
});
