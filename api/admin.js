// /admin -> Server-side password gate & operations API (Vercel serverless function).
// Protected behind HttpOnly signed session cookie and timing-safe authentication.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

const COOKIE_NAME = 'cc_admin';
const SESSION_SECONDS = 60 * 60 * 12; // 12 hours session

const GITHUB_OWNER = 'rishabhsamarwal383-pixel';
const GITHUB_REPO = 'the-classic-co';
const GITHUB_BRANCH = 'main';

function hmac(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function makeToken(secret) {
  const exp = String(Date.now() + SESSION_SECONDS * 1000);
  return exp + '.' + hmac(exp, secret);
}

function verifyToken(token, secret) {
  if (!token) return false;
  const parts = String(token).split('.');
  if (parts.length !== 2) return false;
  const exp = Number(parts[0]);
  if (!exp || exp < Date.now()) return false;
  return safeEqual(parts[1], hmac(parts[0], secret));
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string') return resolve(req.body);
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        return resolve(JSON.stringify(req.body));
      }
      if (Buffer.isBuffer(req.body)) return resolve(req.body.toString('utf8'));
    }
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 5000000) req.destroy(); });
    req.on('end', () => resolve(data));
    req.on('error', () => resolve(''));
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function githubApi(token, method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`,
      method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'the-classic-co-admin-bot',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(bodyStr);
    req.end();
  });
}

function loginPage(message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#161514">
<title>Admin Login | The Classic Co.</title>
<link rel="manifest" href="/admin-manifest.json">
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#161514;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#f5f3ee;padding:16px;box-sizing:border-box;}
  form{background:#1f1e1c;border:1px solid #33312e;border-radius:16px;padding:32px 26px;width:min(360px,100%);box-shadow:0 20px 40px rgba(0,0,0,0.5);}
  .brand{font-size:12px;letter-spacing:3px;color:#b48448;font-weight:700;text-align:center;margin-bottom:6px;text-transform:uppercase;}
  h1{font-size:18px;letter-spacing:1px;margin:0 0 20px;text-align:center;font-weight:600;}
  input{width:100%;box-sizing:border-box;padding:13px 14px;border-radius:9px;border:1px solid #444;background:#111;color:#fff;font-size:15px;margin-bottom:14px;outline:none;}
  input:focus{border-color:#b48448;}
  button{width:100%;padding:13px;border:0;border-radius:9px;background:#b48448;color:#fff;font-weight:700;font-size:15px;cursor:pointer;transition:background 0.2s;}
  button:hover{background:#9a6f3b;}
  .err{background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;padding:10px;border-radius:8px;font-size:13px;margin-bottom:14px;text-align:center;}
  .tip{font-size:11px;color:#78736b;text-align:center;margin-top:16px;line-height:1.5;}
</style></head><body>
<form method="POST" action="/admin" autocomplete="off">
  <div class="brand">THE CLASSIC CO.</div>
  <h1>OPERATIONS STUDIO</h1>
  ${message ? '<div class="err">' + message + '</div>' : ''}
  <input type="password" name="password" placeholder="Enter Admin Password" autofocus required>
  <button type="submit">Unlock Dashboard</button>
  <div class="tip">Protected operations portal · Standalone PWA enabled</div>
</form></body></html>`;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const password = process.env.ADMIN_PASSWORD || 'Classic2026Admin!';
  const secret = crypto.createHash('sha256').update('cc-admin-session:' + password).digest('hex');
  const url = new URL(req.url, 'http://localhost');

  // Logout handler
  if (url.searchParams.get('logout')) {
    res.setHeader('Set-Cookie', COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
    res.statusCode = 303;
    res.setHeader('Location', '/admin');
    return res.end();
  }

  const cookies = parseCookies(req.headers.cookie);
  const isAuthenticated = verifyToken(cookies[COOKIE_NAME], secret);

  // Authenticated API Publish Route (POST /admin?action=publish)
  if (url.searchParams.get('action') === 'publish') {
    if (!isAuthenticated) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: 'Unauthorized. Please login again.' }));
    }

    try {
      const raw = await readBody(req);
      let payload = {};
      try { payload = JSON.parse(raw); } catch (e) { payload = Object.fromEntries(new URLSearchParams(raw)); }

      const githubToken = payload.token || process.env.GITHUB_TOKEN;
      if (!githubToken) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: false,
          error: 'No GitHub Token provided. Set GITHUB_TOKEN in Vercel or enter it in the Admin Settings.'
        }));
      }

      const filePath = payload.filePath || 'js/products-data.js';
      const fileContent = payload.content;
      const commitMessage = payload.message || `🚀 Admin Live Update: Updated ${filePath}`;

      if (!fileContent) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: false, error: 'File content is empty.' }));
      }

      // 1. Get existing SHA from GitHub
      let sha = undefined;
      const getRes = await githubApi(githubToken, 'GET', `/contents/${filePath}?ref=${GITHUB_BRANCH}`);
      if (getRes.status === 200 && getRes.data && getRes.data.sha) {
        sha = getRes.data.sha;
      }

      // 2. Put updated content to GitHub
      const base64Content = Buffer.from(fileContent).toString('base64');
      const putBody = {
        message: commitMessage,
        content: base64Content,
        branch: GITHUB_BRANCH
      };
      if (sha) putBody.sha = sha;

      const putRes = await githubApi(githubToken, 'PUT', `/contents/${filePath}`, putBody);

      if (putRes.status === 200 || putRes.status === 201) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          message: `Successfully deployed to GitHub! Vercel is now building and deploying to your live site (takes ~20s).`,
          commitSha: putRes.data.commit ? putRes.data.commit.sha : undefined
        }));
      } else {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: false,
          error: `GitHub rejected update (${putRes.status}): ${JSON.stringify(putRes.data)}`
        }));
      }

    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // Handle Password Login Form Submission
  if (req.method === 'POST') {
    const raw = await readBody(req);
    const params = new URLSearchParams(raw);
    const given = params.get('password') || '';

    if (safeEqual(given, password)) {
      res.setHeader('Set-Cookie', COOKIE_NAME + '=' + makeToken(secret) + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + SESSION_SECONDS);
      res.statusCode = 303;
      res.setHeader('Location', '/admin');
      return res.end();
    }
    await sleep(1000); // Brute force throttle
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(loginPage('Incorrect password. Please try again.'));
  }

  // Check Session Cookie Authentication
  if (!isAuthenticated) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(loginPage(''));
  }

  // Authenticated: Serve Full Operations Dashboard PWA
  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, '_admin.html'), 'utf8');
  } catch (e) {
    res.statusCode = 500;
    return res.end('Admin dashboard template missing (api/_admin.html).');
  }

  const sheetUrl = process.env.ORDERS_SHEET_URL || '';
  const hasEnvToken = Boolean(process.env.GITHUB_TOKEN);
  
  html = html.replace('__ORDERS_SHEET_URL__', JSON.stringify(sheetUrl).replace(/</g, '\\u003c'));
  html = html.replace('__GITHUB_TOKEN_AVAILABLE__', JSON.stringify(hasEnvToken));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(html);
};
