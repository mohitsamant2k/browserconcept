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

### Project 10: Implement All OAuth 2.0 Flows
**Concepts:** OAuth 2.0 grant types, public vs confidential clients, PKCE, tokens, scopes, OpenID Connect

#### Part A — Understand Public vs Confidential Clients
- [ ] Build a comparison dashboard that explains:

| | **Confidential Client** | **Public Client** |
|---|---|---|
| **What** | Server-side app (Node.js, Python) | SPA, mobile app, CLI |
| **Has a secret?** | ✅ Yes — `client_secret` stored on server | ❌ No — can't hide secrets in browser/app |
| **Example** | Express backend | React SPA, Android app |
| **Secure?** | More secure — secret never exposed | Less secure — needs PKCE to compensate |

#### Part B — Authorization Code Flow (Confidential Client)
- [ ] Register an OAuth App on GitHub (Settings → Developer Settings)
- [ ] **Step 1:** Redirect user to GitHub's `/authorize` endpoint with `client_id`, `redirect_uri`, `scope`, `state`
- [ ] **Step 2:** Handle callback — receive `code`, exchange it for `access_token` using `client_secret` (server-to-server)
- [ ] **Step 3:** Use `access_token` to fetch user profile from GitHub API
- [ ] **Step 4:** Create a session for the user, display their GitHub profile
- [ ] **Security:** Validate the `state` parameter to prevent CSRF
- [ ] **Security:** Store `client_secret` and tokens server-side only, never expose to client

#### Part C — Authorization Code Flow + PKCE (Public Client)
- [ ] Build a frontend-only SPA that does OAuth WITHOUT a `client_secret`
- [ ] **Step 1:** Generate `code_verifier` (random string) and `code_challenge` (SHA256 hash of verifier)
- [ ] **Step 2:** Redirect to `/authorize` with `code_challenge` and `code_challenge_method=S256`
- [ ] **Step 3:** On callback, exchange `code` + `code_verifier` for `access_token` (no secret needed!)
- [ ] **Why PKCE?** Without it, an attacker who intercepts the `code` can steal the token. With PKCE, they also need the `code_verifier` which never left the browser
- [ ] **Visual:** Build a diagram showing the PKCE flow step by step

#### Part D — Client Credentials Flow (Machine-to-Machine)
- [ ] Build a backend service that talks to another API with no user involved
- [ ] **Step 1:** Send `client_id` + `client_secret` directly to the token endpoint
- [ ] **Step 2:** Receive `access_token` — no user login, no redirect
- [ ] **Use case:** Cron job fetching data, microservice-to-microservice auth
- [ ] **Security:** This flow should NEVER be used in a browser (secret would be exposed)

#### Part E — Implicit Flow (Deprecated — Build to Understand Why)
- [ ] Build the implicit flow: redirect directly returns `access_token` in URL fragment
- [ ] **Step 1:** Redirect to `/authorize` with `response_type=token`
- [ ] **Step 2:** Token comes back in URL: `#access_token=xyz`
- [ ] **Demonstrate the problem:** Token is in browser history, URL bar, referer headers
- [ ] **Show why it's deprecated:** No `code_verifier`, no server-side exchange, token exposed everywhere
- [ ] **Conclusion:** Always use Authorization Code + PKCE instead

#### Part F — Refresh Tokens
- [ ] Implement token refresh: short-lived `access_token` (15 min) + long-lived `refresh_token` (7 days)
- [ ] Build a `/refresh` endpoint that accepts a refresh token and returns a new access token
- [ ] Implement **refresh token rotation** — issue a new refresh token on each use, invalidate the old one
- [ ] **Attack:** Replay an old refresh token → server detects reuse → revokes all tokens for that user

#### Part G — Add Multiple Providers
- [ ] Add **Google** as a second OAuth provider (Authorization Code + PKCE)
- [ ] Add **GitHub** as the first provider (Authorization Code)
- [ ] Build a login page with "Login with GitHub" and "Login with Google" buttons
- [ ] Handle account linking — same email from different providers = same user account
- [ ] **OpenID Connect:** Use Google's OIDC to get an `id_token` (JWT) with user info

#### Part H — OAuth Security Dashboard
- [ ] Build a visual page comparing all flows side by side:

| Flow | Client Type | Has Secret? | Has PKCE? | User Involved? | Secure? |
|------|------------|-------------|-----------|----------------|---------|
| Authorization Code | Confidential | ✅ | Optional | ✅ | ✅✅✅ |
| Auth Code + PKCE | Public | ❌ | ✅ | ✅ | ✅✅ |
| Client Credentials | Confidential | ✅ | ❌ | ❌ | ✅✅ |
| Implicit (deprecated) | Public | ❌ | ❌ | ✅ | ❌ |

- [ ] Log every OAuth step with timestamps — show the full journey from login click to API access

#### Part I — Scopes & Consent
- [ ] Implement scopes to limit what an app can access:

| Scope | What it allows |
|-------|---------------|
| `read:profile` | Read user's name, email, avatar |
| `read:repos` | List user's repositories |
| `write:repos` | Create/edit repositories |
| `admin` | Full access (dangerous!) |

- [ ] Build a consent screen: "App X wants to access your profile and repos. Allow?"
- [ ] Store granted scopes per user per app
- [ ] Enforce scopes on API routes — if token has `read:profile` but hits `/api/repos`, return `403 Forbidden`
- [ ] **Principle of Least Privilege:** Apps should request minimum scopes needed
- [ ] Build a "Manage Connected Apps" page where users can view and revoke app access

#### Part J — Token Introspection & Revocation
- [ ] Build a `/oauth/introspect` endpoint (RFC 7662):
  - Input: `access_token`
  - Output: `{ active: true/false, scope, client_id, exp, sub }`
- [ ] Build a `/oauth/revoke` endpoint (RFC 7009):
  - Immediately invalidate a token before it expires
- [ ] **Opaque tokens vs JWTs:**
  - Opaque: random string, must call introspect endpoint to validate → server round-trip
  - JWT: self-contained, validated locally by checking signature → no server call needed
  - Build both and compare performance
- [ ] Implement a token blacklist for revoked JWTs (since JWTs can't be "deleted")

#### Part K — OAuth Security Attacks & Defenses
- [ ] **Attack 1: Redirect URI manipulation** — register `redirect_uri=https://evil.com` → steal auth code
  - **Fix:** Exact match redirect URI validation (no wildcards)
- [ ] **Attack 2: Missing `state` parameter** — CSRF attack on OAuth login
  - **Fix:** Generate random `state`, validate on callback
- [ ] **Attack 3: Authorization code interception** — steal code from URL
  - **Fix:** PKCE (code_verifier proves you started the flow)
- [ ] **Attack 4: Token leakage via referer** — access_token in URL fragment leaks to other sites
  - **Fix:** Use Authorization Code flow, never put tokens in URLs
- [ ] **Attack 5: Insufficient scope validation** — app asks for `admin` when it only needs `read:profile`
  - **Fix:** Server enforces scope restrictions

**You'll learn:** Every OAuth flow, scopes, consent, token lifecycle, public vs confidential clients, PKCE, security attacks, and why implicit flow is dead.

---

### Project 11: Build and Break JWTs
**Concepts:** JWT structure, header, claims, signing, verification, common vulnerabilities

#### Part A — JWT Structure Deep Dive
- [ ] Build a JWT from scratch (without libraries first!) to understand the 3 parts:

```
Header.Payload.Signature
```

- [ ] **Header** — algorithm and token type:
```json
{ "alg": "HS256", "typ": "JWT" }
```

- [ ] **Payload (Claims)** — the actual data. Build all three types:

| Claim Type | Claims | Purpose |
|-----------|--------|----------|
| **Registered** (standard) | `iss` (issuer), `sub` (subject), `aud` (audience), `exp` (expiration), `nbf` (not before), `iat` (issued at), `jti` (JWT ID) | Standard fields defined by RFC 7519 |
| **Public** | `name`, `email`, `picture`, `email_verified` | Common fields (registered at IANA) |
| **Private** | `role`, `permissions`, `tenant_id`, `plan` | Custom fields for your app |

- [ ] **Signature** — `HMAC-SHA256(base64(header) + "." + base64(payload), secret)`

#### Part B — All Registered Claims in Action
- [ ] Build a JWT generator that lets you set each claim and see the effect:

| Claim | What it does | Example | What happens if wrong |
|-------|-------------|---------|----------------------|
| `iss` | Who created the token | `"auth.myapp.com"` | Server rejects token from unknown issuer |
| `sub` | Who the token is about | `"user_123"` | Identifies the user |
| `aud` | Who the token is for | `"api.myapp.com"` | API rejects token meant for a different service |
| `exp` | When the token expires | `1709856000` (Unix timestamp) | Server rejects expired tokens |
| `nbf` | Don't use before this time | `1709855000` | Server rejects token used too early |
| `iat` | When the token was created | `1709855000` | Helps calculate age |
| `jti` | Unique token ID | `"abc-123-def"` | Prevents token replay attacks |

- [ ] **Experiment:** Set `exp` to 10 seconds from now → use the token → wait 11 seconds → use it again → see it rejected
- [ ] **Experiment:** Set `aud` to `"api-1.com"` → send it to `"api-2.com"` → see it rejected
- [ ] **Experiment:** Use `jti` to prevent the same token from being used twice (replay protection)

#### Part C — Signing Algorithms
- [ ] Implement **HS256** (symmetric) — same secret to sign and verify
- [ ] Implement **RS256** (asymmetric) — private key signs, public key verifies
- [ ] Build a comparison:

| | HS256 | RS256 |
|---|---|---|
| Key type | Shared secret | Public + Private key pair |
| Who can sign? | Anyone with the secret | Only the private key holder |
| Who can verify? | Anyone with the secret | Anyone with the public key |
| Use case | Single server | Microservices (auth server signs, API servers verify with public key) |
| Risk | Secret must be shared with every service | Private key stays on auth server only |

- [ ] **Experiment:** Sign with RS256, distribute only the public key to API servers → they can verify but never create fake tokens

#### Part D — JWT Attacks & Defenses
- [ ] **Attack 1: Payload tampering** — Change `role: "user"` to `role: "admin"` without re-signing → should fail verification
- [ ] **Attack 2: `none` algorithm** — Set `alg: "none"`, remove signature → see if server accepts it
  - **Fix:** Always specify `algorithms: ['HS256']` in verification, never allow `none`
- [ ] **Attack 3: Algorithm confusion** — Server uses RS256, but attacker sends HS256 using the public key as the HMAC secret
  - **Fix:** Explicitly set allowed algorithm, never trust the header's `alg`
- [ ] **Attack 4: Missing `exp` claim** — Token never expires → stolen token works forever
  - **Fix:** Always require `exp`, set short expiry (15 min)
- [ ] **Attack 5: Token in localStorage** — Steal via XSS: `localStorage.getItem('token')`
  - **Fix:** Store in HttpOnly cookie or in-memory only
- [ ] **Attack 6: `jku`/`x5u` injection** — Attacker points to their own key server
  - **Fix:** Whitelist trusted key URLs

#### Part E — JWT vs Session Comparison
- [ ] Build both auth systems side by side and compare:

| | JWT (Stateless) | Session (Stateful) |
|---|---|---|
| Stored where? | Client (cookie/header) | Server (memory/DB) |
| Scalable? | ✅ No server storage | ❌ Need shared session store |
| Revocable? | ❌ Hard (needs blacklist) | ✅ Just delete from store |
| Size | Large (contains all claims) | Small (just session ID) |
| Best for | APIs, microservices | Traditional web apps |

#### Part F — Real-World JWT Implementation
- [ ] Build a complete auth API:
  - `POST /auth/login` → returns `access_token` (JWT, 15 min) + `refresh_token` (opaque, 7 days)
  - `GET /api/profile` → requires valid JWT in `Authorization: Bearer <token>` header
  - `POST /auth/refresh` → exchange refresh token for new access token + new refresh token
  - `POST /auth/logout` → add JWT `jti` to blacklist, delete refresh token
- [ ] Build a JWT debugger page (like jwt.io) — paste a token, see decoded header, payload, and signature verification result
- [ ] Add role-based access control: `role: "admin"` can access `/api/admin`, `role: "user"` cannot

**You'll learn:** JWT structure, all claim types, signing algorithms, every major attack, and when to use JWTs vs sessions.

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
