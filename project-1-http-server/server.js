// ============================================================
// 🛡️ PROJECT 1: HTTP Server
// ============================================================
// GOAL: Understand HTTP request/response, headers, and status codes
// by building and inspecting a real server.
//
// HOW TO RUN:  node server.js
// THEN VISIT:  http://localhost:3000
// ============================================================

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// ------------------------------------------------------------
// MIDDLEWARE: Parse form data (for the login POST)
// ------------------------------------------------------------
// This lets Express understand data sent from HTML forms.
// Without this, req.body would be undefined on POST requests.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ------------------------------------------------------------
// MIDDLEWARE: Request Logger
// ------------------------------------------------------------
// This runs on EVERY request before the route handler.
// It logs the method, URL, status code, and all headers.
//
// 🧠 KEY CONCEPT: Middleware is a function that sits between
// the request and the response. It can read/modify both.
// ------------------------------------------------------------
app.use((req, res, next) => {
  const startTime = Date.now();

  // Log when the response finishes (so we can capture the status code)
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📨 ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
    console.log('='.repeat(60));
    
    console.log('\n📥 REQUEST HEADERS (sent by your browser):');
    console.log('-'.repeat(40));
    Object.entries(req.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Log request body/payload (for POST, PUT, PATCH requests)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      console.log('\n📦 REQUEST PAYLOAD (data sent by the client):');
      console.log('-'.repeat(40));
      const contentType = req.headers['content-type'] || 'unknown';
      console.log(`  Content-Type: ${contentType}`);
      Object.entries(req.body).forEach(([key, value]) => {
        // Mask password fields for safety
        const displayValue = key.toLowerCase().includes('password') 
          ? '*'.repeat(String(value).length) 
          : value;
        console.log(`  ${key}: ${displayValue}`);
      });
      console.log(`  ⚠️  This payload was sent in CLEARTEXT over HTTP!`);
    }

    // Log query parameters (for GET requests with ?key=value)
    if (Object.keys(req.query).length > 0) {
      console.log('\n🔍 QUERY PARAMETERS (from the URL):');
      console.log('-'.repeat(40));
      Object.entries(req.query).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }

    console.log('\n📤 RESPONSE HEADERS (sent by this server):');
    console.log('-'.repeat(40));
    const responseHeaders = res.getHeaders();
    Object.entries(responseHeaders).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('\n');
  });

  next(); // Pass control to the next middleware/route
});

// ============================================================
// ROUTES
// ============================================================

// ---- HOME PAGE ----
// Serves the main HTML page explaining the project.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// ---- LOGIN PAGE (GET) ----
// Serves the login form. The form will POST to /login.
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// ---- LOGIN HANDLER (POST) ----
// Handles the login form submission.
// 🧠 KEY CONCEPT: POST requests carry data in the request BODY,
// not in the URL. Check DevTools → Network → Payload to see it.
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 LOGIN ATTEMPT:');
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${'*'.repeat(password?.length || 0)} (hidden)`);
  console.log('   ⚠️  On plain HTTP, this data travels in CLEARTEXT!');
  console.log('   🔒 HTTPS (Project 12) encrypts this data in transit.');

  // For now, accept any login. Real auth comes in Project 9.
  res.send(`
    <html>
    <head><style>
      body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
      .box { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 500px; text-align: center; }
      h1 { color: #22c55e; margin-bottom: 12px; }
      p { color: #94a3b8; line-height: 1.6; }
      code { background: #334155; padding: 2px 6px; border-radius: 4px; color: #fbbf24; font-size: 13px; }
      a { color: #38bdf8; }
    </style></head>
    <body>
      <div class="box">
        <h1>✅ Login Received!</h1>
        <p>Welcome, <strong>${username}</strong>!</p>
        <p style="margin-top: 16px;">
          Check your <strong>terminal</strong> — the server logged your credentials.<br>
          Check <strong>DevTools → Network</strong> — click the POST request and look at the <strong>Payload</strong> tab.<br><br>
          ⚠️ Notice: your password was sent in <code>cleartext</code> over HTTP.<br>
          In Project 12, we'll add HTTPS to encrypt this data.
        </p>
        <p style="margin-top: 20px;"><a href="/">← Back to Home</a></p>
      </div>
    </body>
    </html>
  `);
});

// ---- DASHBOARD ----
// A page that would normally be protected by authentication.
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// ---- API ENDPOINT ----
// Returns JSON data. Notice the Content-Type header changes!
// 🧠 KEY CONCEPT: APIs return JSON, not HTML. The Content-Type
// header tells the browser what kind of data it received.
app.get('/api/data', (req, res) => {
  res.json({
    message: '🛡️ This is JSON data from the API',
    timestamp: new Date().toISOString(),
    server: 'Project 1 — HTTP Server',
    security_note: 'No authentication, no CORS headers, no security headers. We will fix all of this!',
    headers_you_sent: {
      user_agent: req.headers['user-agent'],
      accept: req.headers['accept'],
      host: req.headers['host'],
    },
  });
});

// ---- HEADERS ECHO ----
// Returns ALL request headers as JSON.
// 🧠 KEY CONCEPT: Your browser sends many headers automatically
// that you never see — User-Agent, Accept, Cookie, etc.
// This route makes them visible.
app.get('/headers', (req, res) => {
  res.json({
    title: '📥 Your Request Headers',
    description: 'These are all the headers your browser sent automatically with this request.',
    total_headers: Object.keys(req.headers).length,
    headers: req.headers,
    learn: {
      'host': 'Which server you are talking to',
      'user-agent': 'Your browser name and version',
      'accept': 'What content types your browser can handle',
      'accept-language': 'Your preferred language',
      'accept-encoding': 'Compression formats your browser supports',
      'connection': 'Whether to keep the TCP connection open',
      'cookie': 'Any cookies stored for this domain (none yet!)',
    }
  });
});

// ---- STATUS CODE TESTER ----
// Returns any HTTP status code you specify.
// 🧠 KEY CONCEPT: Status codes tell the browser what happened.
// 2xx = success, 3xx = redirect, 4xx = client error, 5xx = server error
app.get('/status/:code', (req, res) => {
  const code = parseInt(req.params.code);
  
  const statusMessages = {
    200: '✅ OK — Everything worked!',
    201: '✅ Created — New resource was created.',
    301: '🔀 Moved Permanently — Resource has a new URL.',
    302: '🔀 Found — Temporary redirect.',
    304: '📋 Not Modified — Use your cached version.',
    400: '❌ Bad Request — The server didn\'t understand your request.',
    401: '🔒 Unauthorized — You need to log in.',
    403: '🚫 Forbidden — You don\'t have permission.',
    404: '🔍 Not Found — This resource doesn\'t exist.',
    405: '⛔ Method Not Allowed — Wrong HTTP method.',
    429: '⏱️ Too Many Requests — Slow down! (rate limiting)',
    500: '💥 Internal Server Error — Something broke on the server.',
    502: '🌐 Bad Gateway — The upstream server failed.',
    503: '🔧 Service Unavailable — Server is down for maintenance.',
  };

  const message = statusMessages[code] || `Status code: ${code}`;

  if (code >= 100 && code < 600) {
    res.status(code).json({
      status_code: code,
      message: message,
      learn: 'Check the Network tab in DevTools — look at the Status column!',
      categories: {
        '1xx': 'Informational',
        '2xx': 'Success',
        '3xx': 'Redirection',
        '4xx': 'Client Error',
        '5xx': 'Server Error',
      }
    });
  } else {
    res.status(400).json({ error: 'Invalid status code. Use 100-599.' });
  }
});

// ---- 404 HANDLER ----
// Catches any route that doesn't match the ones above.
app.use((req, res) => {
  res.status(404).json({
    error: '404 — Not Found',
    message: `The route ${req.method} ${req.url} does not exist.`,
    available_routes: ['GET /', 'GET /login', 'POST /login', 'GET /dashboard', 'GET /api/data', 'GET /headers', 'GET /status/:code'],
    tip: 'Check DevTools → Network tab to see this 404 response!',
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🛡️  PROJECT 1: HTTP Server');
  console.log('='.repeat(60));
  console.log(`\n🚀 Server running at: http://localhost:${PORT}`);
  console.log('\n📋 Available routes:');
  console.log('   GET  /            → Homepage');
  console.log('   GET  /login       → Login page');
  console.log('   POST /login       → Handle login');
  console.log('   GET  /dashboard   → Dashboard page');
  console.log('   GET  /api/data    → JSON API response');
  console.log('   GET  /headers     → See your request headers');
  console.log('   GET  /status/:code → Test any HTTP status code');
  console.log('\n👀 Watch this terminal — every request will be logged here!');
  console.log('🔍 Open DevTools (F12) → Network tab in your browser.');
  console.log('='.repeat(60) + '\n');
});
