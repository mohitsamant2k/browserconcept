# 🛡️ Browser Security — Learn by Building

> Every concept is learned by building a real project. No theory-only sections.
> Estimated total time: 8–10 weeks (1–2 hours/day)
> Stack: HTML, CSS, JavaScript, Node.js + Express

---

## Phase 1: Setup & Foundations (Week 1)

### Project 1: Build a Simple HTTP Server
**Concepts:** HTTP protocol, request/response, headers, status codes

**What you build:**
- [ ] A Node.js + Express server that serves HTML pages
- [ ] Add routes: `/`, `/login`, `/dashboard`, `/api/data`
- [ ] Log every request's method, URL, and headers to the console
- [ ] Inspect requests in browser DevTools → Network tab
- [ ] Add a `/headers` route that echoes back all request headers as JSON

**You'll learn:** How HTTP works, what headers are, how browsers talk to servers.

---

### Project 2: Demonstrate Same-Origin Policy
**Concepts:** SOP, origins, cross-origin restrictions

**What you build:**
- [ ] Run TWO servers: `localhost:3000` and `localhost:4000`
- [ ] Server A (`3000`) serves a page with JavaScript that tries to:
  - Fetch data from Server B (`4000`) → see it fail (SOP blocks it)
  - Access an iframe loaded from Server B → see it fail
  - Read a cookie set by Server B → see it fail
- [ ] Log all errors in the console and document WHY each one fails
- [ ] Add `postMessage` communication between the two origins (the allowed way)

**You'll learn:** Why SOP exists, what it blocks, how origins work.

---

## Phase 2: Cross-Site Attacks — Attack & Defend (Week 2–3)

### Project 3: Build a Vulnerable App → Then Fix XSS
**Concepts:** Reflected XSS, Stored XSS, DOM-based XSS, sanitization

**What you build:**

**Part A — Build the vulnerable version:**
- [ ] A blog app with: post creation form, comments, search page
- [ ] Search page reflects query param in HTML → **Reflected XSS**
  - `/search?q=<script>alert('hacked')</script>` should execute
- [ ] Comments stored in DB/memory and rendered raw → **Stored XSS**
  - Submit `<img src=x onerror=alert('hacked')>` as a comment
- [ ] A page that reads `location.hash` and puts it in `innerHTML` → **DOM XSS**

**Part B — Fix every vulnerability:**
- [ ] Escape/encode all output using a template engine (EJS/Handlebars auto-escaping)
- [ ] Install and use **DOMPurify** for any user HTML
- [ ] Replace `innerHTML` with `textContent`
- [ ] Add input validation on the server side
- [ ] Test that all previous attack payloads are now blocked

**You'll learn:** How XSS works, why it's dangerous, how to prevent it.

---

### Project 4: Build a CSRF Attack → Then Defend Against It
**Concepts:** CSRF tokens, SameSite cookies, double-submit pattern

**What you build:**

**Part A — Build the vulnerable app:**
- [ ] A banking app with login (`POST /login`) and transfer money (`POST /transfer`)
- [ ] Use cookie-based sessions (express-session)
- [ ] Create an **attacker page** (separate server) with a hidden form that auto-submits a transfer request to the banking app
- [ ] Demo: user logged into bank → visits attacker page → money transferred without consent

**Part B — Add CSRF defenses (implement ALL three):**
- [ ] **CSRF Token:** Generate a random token per session, embed in forms, validate on server
- [ ] **SameSite Cookie:** Set `SameSite=Strict` on session cookie → show attack now fails
- [ ] **Double-Submit Cookie:** Send CSRF token in both cookie AND form field, compare on server
- [ ] **Origin/Referer check:** Validate the `Origin` header on state-changing requests

**You'll learn:** How CSRF exploits trust, and multiple defense strategies.

---

### Project 5: Build a Clickjacking Demo
**Concepts:** iframes, X-Frame-Options, frame-ancestors

**What you build:**
- [ ] A "Delete Account" page on your app
- [ ] An attacker page that loads your app in a transparent iframe, overlaid with a "Win a Prize!" button positioned exactly over "Delete Account"
- [ ] Click "Win a Prize!" → actually clicks "Delete Account"
- [ ] **Fix it:** Add `X-Frame-Options: DENY` header → iframe stops loading
- [ ] **Fix it (modern):** Add `Content-Security-Policy: frame-ancestors 'none'`
- [ ] Test that the clickjacking page is now blocked

**You'll learn:** Visual deception attacks and iframe security.

---

## Phase 3: Cookie Security (Week 4)

### Project 6: Cookie Security Lab
**Concepts:** HttpOnly, Secure, SameSite, cookie prefixes

**What you build:**
- [ ] A login system that sets a session cookie
- [ ] **Experiment 1:** Set cookie WITHOUT `HttpOnly` → steal it with `document.cookie` via XSS
- [ ] **Experiment 2:** Add `HttpOnly` → show `document.cookie` can no longer read it
- [ ] **Experiment 3:** Remove `Secure` flag → use HTTP (not HTTPS) → cookie sent in plaintext
- [ ] **Experiment 4:** Set `SameSite=Strict` → show cookie NOT sent on cross-site requests
- [ ] **Experiment 5:** Set `SameSite=Lax` → show cookie sent on top-level navigations but NOT on sub-requests
- [ ] **Experiment 6:** Use `__Host-` prefix → cookie must be Secure + no Domain + Path=/
- [ ] Build a dashboard that shows all cookies and their attributes visually

**You'll learn:** Every cookie attribute and its security impact.

---

## Phase 4: CORS & Security Headers (Week 5)

### Project 7: Build a CORS Playground
**Concepts:** CORS, preflight, credentialed requests, misconfigurations

**What you build:**
- [ ] An API server (`localhost:3000`) with endpoints:
  - `GET /api/public` — open data
  - `GET /api/private` — requires auth cookie
  - `POST /api/data` — accepts JSON
  - `DELETE /api/data/:id` — destructive action
- [ ] A frontend on `localhost:4000` that calls all these endpoints
- [ ] **Step 1:** No CORS headers → all cross-origin requests fail
- [ ] **Step 2:** Add `Access-Control-Allow-Origin: *` → GET works, credentialed requests fail
- [ ] **Step 3:** Add specific origin + `Allow-Credentials: true` → credentialed GET works
- [ ] **Step 4:** POST with JSON triggers preflight → add preflight handling
- [ ] **Step 5:** Intentionally misconfigure CORS (reflect any origin) → demonstrate the exploit
- [ ] Build a visual dashboard showing request → preflight → response flow

**You'll learn:** How CORS works, why preflight exists, common misconfigurations.

---

### Project 8: Implement All Security Headers
**Concepts:** CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

**What you build:**
- [ ] Start with a server that has ZERO security headers
- [ ] Scan it with https://securityheaders.com → see the F grade
- [ ] Add headers one by one and observe the effect:

| Header | What to implement | Test |
|--------|------------------|------|
| `Content-Security-Policy` | `script-src 'self'; style-src 'self'` | Inline script should be blocked |
| CSP with nonce | `script-src 'nonce-abc123'` | Only nonced scripts run |
| `X-Content-Type-Options` | `nosniff` | Serve .txt as script → blocked |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Check referer on cross-origin links |
| `Permissions-Policy` | `camera=(), microphone=()` | `navigator.mediaDevices` denied |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | (needs HTTPS to test) |

- [ ] Re-scan with securityheaders.com → aim for A+ grade
- [ ] Build a middleware that auto-applies all secure headers

**You'll learn:** What each header does and how to configure them.

---

## Phase 5: Authentication & OAuth (Week 6–7)

### Project 9: Build Session Auth from Scratch
**Concepts:** Sessions, session hijacking, session fixation

**What you build:**
- [ ] User registration + login (hash passwords with bcrypt)
- [ ] Generate a random session ID, store in a server-side Map
- [ ] Set session ID in a cookie (`HttpOnly`, `Secure`, `SameSite=Strict`)
- [ ] Protected `/dashboard` route — redirect to login if no valid session
- [ ] **Attack 1:** Steal session cookie (disable HttpOnly, inject XSS) → hijack session
- [ ] **Attack 2:** Session fixation — set a known session ID before login
- [ ] **Fix:** Regenerate session ID after successful login
- [ ] Add session expiry and logout (destroy session on server)
- [ ] Add a "view active sessions" page showing all logged-in devices

**You'll learn:** How sessions work, how they're attacked, how to secure them.

---

### Project 10: Implement OAuth 2.0 with GitHub Login
**Concepts:** OAuth 2.0 Authorization Code Flow, PKCE, tokens, scopes

**What you build:**
- [ ] Register an OAuth App on GitHub (Settings → Developer Settings)
- [ ] **Step 1:** Redirect user to GitHub's `/authorize` endpoint with `client_id`, `redirect_uri`, `scope`, `state`
- [ ] **Step 2:** Handle callback — receive `code`, exchange it for `access_token` via server-to-server request
- [ ] **Step 3:** Use `access_token` to fetch user profile from GitHub API
- [ ] **Step 4:** Create a session for the user, display their GitHub profile
- [ ] **Security:** Validate the `state` parameter to prevent CSRF
- [ ] **Security:** Store tokens server-side only, never expose to client
- [ ] **Bonus:** Implement PKCE flow (code_verifier + code_challenge)
- [ ] **Bonus:** Add Google as a second OAuth provider

**You'll learn:** The full OAuth flow, why each step exists, and security pitfalls.

---

### Project 11: Build and Break JWTs
**Concepts:** JWT structure, signing, verification, common vulnerabilities

**What you build:**
- [ ] Build a login API that returns a JWT (use `jsonwebtoken` library)
- [ ] JWT contains: `sub`, `name`, `role`, `iat`, `exp`
- [ ] Protected API routes that verify the JWT
- [ ] Build a JWT debugger page (decode header, payload, verify signature — like jwt.io)
- [ ] **Attack 1:** Change `role: "admin"` in payload without re-signing → should fail verification
- [ ] **Attack 2:** Set algorithm to `none` → understand why servers must reject this
- [ ] **Attack 3:** Confuse HS256/RS256 algorithm → understand algorithm confusion attacks
- [ ] **Fix:** Explicitly specify allowed algorithms in verification
- [ ] Implement refresh tokens with rotation (invalidate old refresh token on use)

**You'll learn:** JWT internals, why they're easy to misuse, and secure implementation.

---

## Phase 6: Transport Security (Week 7–8)

### Project 12: Set Up HTTPS & HSTS Locally
**Concepts:** TLS, certificates, HSTS, mixed content, SRI

**What you build:**
- [ ] Generate a self-signed SSL certificate using OpenSSL
- [ ] Configure your Express server to serve over HTTPS
- [ ] **Mixed Content Test:** Load an HTTP image on an HTTPS page → see browser warning/block
- [ ] Add HSTS header → browser remembers to use HTTPS
- [ ] **SRI:** Load jQuery from CDN with `integrity` attribute
  - Tamper with the hash → page refuses to load the script
- [ ] **Redirect:** HTTP → HTTPS automatic redirect middleware

**You'll learn:** How HTTPS works locally, mixed content dangers, SRI verification.

---

## Phase 7: Advanced Security (Week 9–10)

### Project 13: Build and Prevent Injection Attacks
**Concepts:** SQL Injection, SSRF, Open Redirects

**What you build:**
- [ ] A user search feature with raw SQL query → **SQL Injection**
  - Input: `' OR 1=1 --` → dumps all users
  - **Fix:** Switch to parameterized queries / ORM
- [ ] A URL preview feature that fetches any URL on the server → **SSRF**
  - Input: `http://localhost:6379` → access internal Redis
  - **Fix:** Whitelist allowed domains, block private IPs
- [ ] A redirect endpoint: `/redirect?url=` → **Open Redirect**
  - Input: `https://evil.com` → user redirected to attacker's site
  - **Fix:** Whitelist allowed redirect destinations

**You'll learn:** Server-side injection attacks and how to prevent them.

---

### Project 14: Secure Storage & Modern APIs
**Concepts:** localStorage security, Trusted Types, Fetch Metadata

**What you build:**
- [ ] **Storage Comparison App:**
  - Store a token in `localStorage` → steal it via XSS (inject `<script>alert(localStorage.token)</script>`)
  - Store a token in `sessionStorage` → show it survives page refresh but not new tabs
  - Store a token in `HttpOnly` cookie → show XSS CANNOT steal it
  - Build a visual comparison table of security properties
- [ ] **Trusted Types:**
  - Enable Trusted Types via CSP: `require-trusted-types-for 'script'`
  - Try `innerHTML = userInput` → see it blocked
  - Create a Trusted Types policy that sanitizes input
- [ ] **Fetch Metadata:**
  - Read `Sec-Fetch-Site`, `Sec-Fetch-Mode`, `Sec-Fetch-Dest` headers on server
  - Build middleware that blocks requests where `Sec-Fetch-Site: cross-site` on sensitive endpoints
  - Log all fetch metadata headers in a dashboard

**You'll learn:** Client-side storage risks, modern browser security APIs.

---

## 🏆 Capstone Project (Week 10+)

### Project 15: Build a Fully Secured Web App
**Concepts:** Everything combined

**Build a complete app (e.g., a simple social media or notes app) with ALL security measures:**

- [ ] **Auth:** OAuth login (GitHub) + session management + CSRF tokens
- [ ] **Headers:** Full CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- [ ] **Cookies:** HttpOnly, Secure, SameSite=Strict, `__Host-` prefix
- [ ] **CORS:** Properly configured for API routes
- [ ] **Input:** All user input sanitized, parameterized queries
- [ ] **Transport:** HTTPS, SRI on CDN resources
- [ ] **XSS:** Output encoding, DOMPurify, Trusted Types
- [ ] **CSRF:** Token-based protection on all state-changing routes
- [ ] **Rate Limiting:** Prevent brute force on login
- [ ] **Security Audit:** Run OWASP ZAP or similar scanner → fix all findings
- [ ] **Score:** Get A+ on securityheaders.com

**This is your portfolio piece that proves you understand browser security.**

---

## 🧰 Tools You'll Use

| Tool | Purpose |
|------|---------|
| Node.js + Express | Backend server |
| EJS or Handlebars | Templating with auto-escaping |
| DOMPurify | HTML sanitization |
| bcrypt | Password hashing |
| jsonwebtoken | JWT creation/verification |
| express-session | Session management |
| helmet | Security headers middleware (study, then build your own) |
| OpenSSL | Generate SSL certificates |
| Browser DevTools | Inspect headers, cookies, network, console |
| securityheaders.com | Scan your headers |
| OWASP ZAP | Automated security scanner |

---

## 📋 Progress Tracker

| # | Project | Status |
|---|---------|--------|
| 1 | HTTP Server | ⬜ Not Started |
| 2 | Same-Origin Policy Demo | ⬜ Not Started |
| 3 | XSS Attack & Defense | ⬜ Not Started |
| 4 | CSRF Attack & Defense | ⬜ Not Started |
| 5 | Clickjacking Demo | ⬜ Not Started |
| 6 | Cookie Security Lab | ⬜ Not Started |
| 7 | CORS Playground | ⬜ Not Started |
| 8 | Security Headers | ⬜ Not Started |
| 9 | Session Auth from Scratch | ⬜ Not Started |
| 10 | OAuth 2.0 GitHub Login | ⬜ Not Started |
| 11 | JWT Build & Break | ⬜ Not Started |
| 12 | HTTPS & HSTS Setup | ⬜ Not Started |
| 13 | Injection Attacks | ⬜ Not Started |
| 14 | Storage & Modern APIs | ⬜ Not Started |
| 15 | 🏆 Capstone: Secured App | ⬜ Not Started |

---

*Every project follows: Build vulnerable version → Attack it → Fix it → Verify fix. Start with Project 1!*
