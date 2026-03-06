// ============================================================
// 🛡️ PROJECT 3: XSS Attack & Defense
// ============================================================
// GOAL: Build a vulnerable blog app with ALL 3 types of XSS,
// then fix each one and understand why.
//
// HOW TO RUN:  node server.js
// Open: http://localhost:3000
//
// 3 TYPES OF XSS:
//   1. Reflected XSS  — malicious input reflected in the page
//   2. Stored XSS     — malicious input saved and shown to everyone
//   3. DOM-based XSS  — malicious input used directly by JS in the browser
// ============================================================

const express = require('express');
const path = require('path');

const app = express();

// EJS template engine (auto-escapes with <%= %>, raw with <%- %>)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parse form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// IN-MEMORY "DATABASE" — Stores blog posts and comments
// ============================================================
const posts = [
  {
    id: 1,
    title: 'Welcome to SecureBlog!',
    content: 'This is a demo blog app to learn about XSS attacks. Try posting comments with HTML/script tags!',
    author: 'Admin',
    comments: [
      { author: 'Alice', text: 'Great blog! Looking forward to learning.' },
    ],
  },
];

let nextPostId = 2;

// Track whether "safe mode" is ON (defenses enabled)
// Users toggle this via the UI to see the difference
let safeMode = false;

// ============================================================
// ROUTES
// ============================================================

// --- HOME PAGE: List all posts ---
app.get('/', (req, res) => {
  res.render('index', { posts, safeMode });
});

// --- TOGGLE SAFE MODE ---
app.post('/toggle-safe-mode', (req, res) => {
  safeMode = !safeMode;
  console.log(`🛡️  Safe Mode: ${safeMode ? 'ON ✅' : 'OFF ❌'}`);
  res.redirect('back');
});

// ============================================================
// 🔴 REFLECTED XSS — /search
// ============================================================
// The search query is reflected directly into the HTML page.
// In UNSAFE mode: query is injected raw → XSS!
// In SAFE mode: query is escaped → safe
// ============================================================
app.get('/search', (req, res) => {
  const query = req.query.q || '';
  const results = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.content.toLowerCase().includes(query.toLowerCase())
  );

  console.log(`🔍 Search query: "${query}" | Safe Mode: ${safeMode ? 'ON' : 'OFF'}`);

  res.render('search', { query, results, safeMode });
});

// ============================================================
// 🔴 STORED XSS — /post/:id (comments)
// ============================================================
// Comments are stored in memory and rendered on the page.
// In UNSAFE mode: comments rendered as raw HTML → XSS!
// In SAFE mode: comments are escaped → safe
// ============================================================
app.get('/post/:id', (req, res) => {
  const post = posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).send('Post not found');
  res.render('post', { post, safeMode });
});

// Add a comment to a post
app.post('/post/:id/comment', (req, res) => {
  const post = posts.find((p) => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).send('Post not found');

  const { author, text } = req.body;
  console.log(`💬 New comment by "${author}": "${text}" | Safe Mode: ${safeMode ? 'ON' : 'OFF'}`);

  // In safe mode, we could sanitize here. But we store raw to show the difference
  // The defense happens at RENDER time (output encoding)
  post.comments.push({ author: author || 'Anonymous', text });

  res.redirect(`/post/${post.id}`);
});

// Create a new post
app.post('/post/create', (req, res) => {
  const { title, content, author } = req.body;
  const post = {
    id: nextPostId++,
    title: title || 'Untitled',
    content: content || '',
    author: author || 'Anonymous',
    comments: [],
  };
  posts.push(post);
  console.log(`📝 New post: "${post.title}" by ${post.author}`);
  res.redirect(`/post/${post.id}`);
});

// ============================================================
// 🔴 DOM-BASED XSS — /dom-xss
// ============================================================
// This page reads from location.hash and uses innerHTML.
// The server doesn't see the payload at all — it's all client-side!
// ============================================================
app.get('/dom-xss', (req, res) => {
  res.render('dom-xss', { safeMode });
});

// ============================================================
// 🏠 ATTACK PLAYGROUND — Pre-built attacks to try
// ============================================================
app.get('/playground', (req, res) => {
  res.render('playground', { safeMode });
});

// ============================================================
// API: Clear all comments (for testing)
// ============================================================
app.post('/api/clear-comments', (req, res) => {
  posts.forEach((p) => (p.comments = []));
  console.log('🗑️  All comments cleared');
  res.redirect('/');
});

// ============================================================
// START SERVER
// ============================================================
app.listen(3000, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🛡️  PROJECT 3: XSS Attack & Defense');
  console.log('='.repeat(60));
  console.log('');
  console.log('🌐 Open: http://localhost:3000');
  console.log('');
  console.log('📋 Pages to explore:');
  console.log('   /              — Blog home (see all posts)');
  console.log('   /search?q=...  — Search page (Reflected XSS)');
  console.log('   /post/1        — Blog post with comments (Stored XSS)');
  console.log('   /dom-xss       — DOM-based XSS demo');
  console.log('   /playground    — Pre-built attack payloads to try');
  console.log('');
  console.log('🔴 Safe Mode: OFF (vulnerable by default)');
  console.log('   Toggle it on the page to see defenses in action!');
  console.log('');
  console.log('='.repeat(60));
});
