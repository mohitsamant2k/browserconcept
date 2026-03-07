// ============================================================
// 🏦 PROJECT 4: CSRF Attack & Defense
// ============================================================
// GOAL: Build a vulnerable banking app, then build an attacker
// site that exploits CSRF, then fix it with 3 different defenses.
//
// HOW TO RUN:  node bank-server.js
// Bank:     http://localhost:3000
// Attacker: http://localhost:4000 (started automatically)
//
// CSRF = Cross-Site Request Forgery
//   Attacker tricks YOUR browser into making requests to a site
//   where YOU'RE already logged in. The browser automatically
//   sends your cookies → the server thinks it's you.
// ============================================================

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');

// ============================================================
// 🏦 BANK APP (port 3000)
// ============================================================
const bank = express();

bank.set('view engine', 'ejs');
bank.set('views', path.join(__dirname, 'views'));

bank.use(express.urlencoded({ extended: true }));
bank.use(express.json());
bank.use(cookieParser());

// Session middleware
bank.use(
  session({
    secret: 'bank-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax', // Default — we'll change this during demos
      // sameSite: 'none', secure: true  ← for cross-site (vulnerable)
      // sameSite: 'strict'               ← defense
    },
  })
);

// ============================================================
// DEFENSE SETTINGS — Toggle these to see each defense
// ============================================================
let defenses = {
  csrfToken: false,       // CSRF token validation
  sameSiteCookie: false,   // SameSite=Strict cookie
  originCheck: false,      // Origin/Referer header check
  doubleSubmit: false,     // Double-submit cookie pattern
};

// ============================================================
// IN-MEMORY "DATABASE"
// ============================================================
const users = {
  alice: { password: 'password123', balance: 10000, transactions: [] },
  bob: { password: 'password456', balance: 5000, transactions: [] },
};

// ============================================================
// MIDDLEWARE: Auth check
// ============================================================
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// ============================================================
// MIDDLEWARE: CSRF Token generation
// ============================================================
function generateCSRFToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function validateCSRFToken(req, res, next) {
  if (!defenses.csrfToken) return next(); // Skip if defense is off

  const tokenFromForm = req.body._csrf || req.headers['x-csrf-token'];
  const tokenFromSession = req.session.csrfToken;

  console.log(`🔑 CSRF Token Check:`);
  console.log(`   From form/header: ${tokenFromForm ? tokenFromForm.substring(0, 16) + '...' : '(missing)'}`);
  console.log(`   From session:     ${tokenFromSession ? tokenFromSession.substring(0, 16) + '...' : '(missing)'}`);

  if (!tokenFromForm || tokenFromForm !== tokenFromSession) {
    console.log('   ❌ CSRF TOKEN MISMATCH — Request BLOCKED!');
    return res.status(403).render('error', {
      message: 'CSRF Token Invalid!',
      detail: 'The request was blocked because the CSRF token is missing or incorrect. This means the request did NOT come from our bank\'s form.',
      user: req.session.user,
      defenses,
    });
  }

  console.log('   ✅ CSRF Token valid — Request allowed');
  next();
}

// ============================================================
// MIDDLEWARE: Origin/Referer check
// ============================================================
function validateOrigin(req, res, next) {
  if (!defenses.originCheck) return next();

  const origin = req.headers.origin || req.headers.referer;
  const allowed = 'http://localhost:3000';

  console.log(`🌐 Origin Check:`);
  console.log(`   Origin/Referer: ${origin || '(missing)'}`);
  console.log(`   Expected:       ${allowed}`);

  if (!origin || !origin.startsWith(allowed)) {
    console.log('   ❌ ORIGIN MISMATCH — Request BLOCKED!');
    return res.status(403).render('error', {
      message: 'Origin Check Failed!',
      detail: `Request came from "${origin || 'unknown'}" but we only accept requests from "${allowed}". This means the request came from a different website (the attacker\'s site).`,
      user: req.session.user,
      defenses,
    });
  }

  console.log('   ✅ Origin matches — Request allowed');
  next();
}

// ============================================================
// MIDDLEWARE: Double-Submit Cookie check
// ============================================================
function validateDoubleSubmit(req, res, next) {
  if (!defenses.doubleSubmit) return next();

  const tokenFromCookie = req.cookies['csrf-double'];
  const tokenFromForm = req.body._csrf_double || req.headers['x-csrf-double'];

  console.log(`🍪 Double-Submit Check:`);
  console.log(`   From cookie: ${tokenFromCookie ? tokenFromCookie.substring(0, 16) + '...' : '(missing)'}`);
  console.log(`   From form:   ${tokenFromForm ? tokenFromForm.substring(0, 16) + '...' : '(missing)'}`);

  if (!tokenFromCookie || !tokenFromForm || tokenFromCookie !== tokenFromForm) {
    console.log('   ❌ DOUBLE-SUBMIT MISMATCH — Request BLOCKED!');
    return res.status(403).render('error', {
      message: 'Double-Submit Cookie Check Failed!',
      detail: 'The CSRF token in the cookie doesn\'t match the token in the form. The attacker\'s page can send cookies (browser does that automatically), but can\'t READ the cookie value to put it in the form (SOP blocks that).',
      user: req.session.user,
      defenses,
    });
  }

  console.log('   ✅ Double-submit matches — Request allowed');
  next();
}

// ============================================================
// ROUTES
// ============================================================

// --- HOME ---
bank.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

// --- LOGIN PAGE ---
bank.get('/login', (req, res) => {
  res.render('login', { error: null, defenses });
});

// --- LOGIN (POST) ---
bank.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user || user.password !== password) {
    return res.render('login', { error: 'Invalid username or password', defenses });
  }

  req.session.user = username;

  // Generate CSRF token for this session
  generateCSRFToken(req);

  // Set double-submit cookie
  const dsToken = crypto.randomBytes(32).toString('hex');
  req.session.doubleSubmitToken = dsToken;
  res.cookie('csrf-double', dsToken, {
    httpOnly: false, // Must be readable by JS for double-submit pattern
    sameSite: 'lax',
  });

  console.log(`✅ ${username} logged in | Balance: $${user.balance}`);
  res.redirect('/dashboard');
});

// --- LOGOUT ---
bank.get('/logout', (req, res) => {
  const user = req.session.user;
  req.session.destroy();
  res.clearCookie('csrf-double');
  console.log(`👋 ${user} logged out`);
  res.redirect('/login');
});

// --- DASHBOARD ---
bank.get('/dashboard', requireLogin, (req, res) => {
  const user = users[req.session.user];
  const csrfToken = generateCSRFToken(req);
  const doubleSubmitToken = req.session.doubleSubmitToken;

  res.render('dashboard', {
    username: req.session.user,
    balance: user.balance,
    transactions: user.transactions,
    csrfToken,
    doubleSubmitToken,
    defenses,
  });
});

// --- TRANSFER MONEY (the vulnerable endpoint) ---
bank.post(
  '/transfer',
  requireLogin,
  validateOrigin,
  validateCSRFToken,
  validateDoubleSubmit,
  (req, res) => {
    const { to, amount } = req.body;
    const sender = req.session.user;
    const senderAccount = users[sender];
    const parsedAmount = parseFloat(amount);

    console.log('');
    console.log('💸 Transfer Request:');
    console.log(`   From: ${sender} (balance: $${senderAccount.balance})`);
    console.log(`   To:   ${to}`);
    console.log(`   Amount: $${parsedAmount}`);
    console.log(`   Origin: ${req.headers.origin || '(none)'}`);
    console.log(`   Referer: ${req.headers.referer || '(none)'}`);

    if (!to || !parsedAmount || parsedAmount <= 0) {
      return res.render('transfer-result', {
        success: false,
        message: 'Invalid transfer details',
        username: sender,
        defenses,
      });
    }

    if (parsedAmount > senderAccount.balance) {
      return res.render('transfer-result', {
        success: false,
        message: 'Insufficient funds',
        username: sender,
        defenses,
      });
    }

    // Process transfer
    senderAccount.balance -= parsedAmount;
    senderAccount.transactions.push({
      type: 'sent',
      to,
      amount: parsedAmount,
      time: new Date().toLocaleTimeString(),
    });

    if (users[to]) {
      users[to].balance += parsedAmount;
      users[to].transactions.push({
        type: 'received',
        from: sender,
        amount: parsedAmount,
        time: new Date().toLocaleTimeString(),
      });
    }

    console.log(`   ✅ Transfer complete! ${sender} → ${to}: $${parsedAmount}`);
    console.log(`   ${sender} new balance: $${senderAccount.balance}`);

    res.render('transfer-result', {
      success: true,
      message: `Successfully transferred $${parsedAmount} to ${to}`,
      username: sender,
      defenses,
    });
  }
);

// --- TOGGLE DEFENSES ---
bank.post('/toggle-defense', requireLogin, (req, res) => {
  const { defense } = req.body;
  if (defenses.hasOwnProperty(defense)) {
    defenses[defense] = !defenses[defense];
    console.log(`🛡️  Defense "${defense}": ${defenses[defense] ? 'ON ✅' : 'OFF ❌'}`);

    // Special handling for SameSite — need to reconfigure session cookie
    if (defense === 'sameSiteCookie') {
      console.log(`   Cookie SameSite is now: ${defenses.sameSiteCookie ? 'Strict' : 'Lax'}`);
      console.log('   ⚠️  Log out and log back in for the cookie change to take effect!');
    }
  }
  res.redirect('/dashboard');
});

// --- RESET BALANCES ---
bank.post('/reset', (req, res) => {
  users.alice.balance = 10000;
  users.alice.transactions = [];
  users.bob.balance = 5000;
  users.bob.transactions = [];
  console.log('🔄 Balances reset');
  res.redirect('/dashboard');
});

// ============================================================
// 😈 ATTACKER SITE (port 4000)
// ============================================================
const attacker = express();
attacker.use(express.static(path.join(__dirname, 'attacker-site')));

// ============================================================
// START BOTH SERVERS
// ============================================================
bank.listen(3000, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🏦 PROJECT 4: CSRF Attack & Defense');
  console.log('='.repeat(60));
  console.log('');
  console.log('🏦 Bank App:      http://localhost:3000');
  console.log('😈 Attacker Site:  http://localhost:4000');
  console.log('');
  console.log('📋 Steps:');
  console.log('   1. Log into the bank as alice/password123');
  console.log('   2. Visit http://localhost:4000 (attacker site)');
  console.log('   3. Watch money get transferred without consent!');
  console.log('   4. Toggle defenses on the dashboard to block it');
  console.log('');
  console.log('👤 Accounts:');
  console.log('   alice / password123  (balance: $10,000)');
  console.log('   bob   / password456  (balance: $5,000)');
  console.log('');
  console.log('🛡️  All defenses: OFF (vulnerable by default)');
  console.log('='.repeat(60));
});

attacker.listen(4000, () => {
  console.log('😈 Attacker site running on http://localhost:4000');
});
