// /admin  ->  server-side password gate (Vercel serverless function).
// The password lives ONLY in a Vercel environment variable (ADMIN_PASSWORD). It is never in the code or the browser.
// After a correct password, the server sets an HttpOnly signed cookie. Without it, the admin page is never sent.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COOKIE_NAME = 'cc_admin';
const SESSION_SECONDS = 60 * 60 * 8; // 8 hours

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
      if (typeof req.body === 'string') return resolve(new URLSearchParams(req.body));
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        return resolve(new URLSearchParams(req.body));
      }
      if (Buffer.isBuffer(req.body)) return resolve(new URLSearchParams(req.body.toString('utf8')));
    }
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 10000) req.destroy(); });
    req.on('end', () => resolve(new URLSearchParams(data)));
    req.on('error', () => resolve(new URLSearchParams('')));
  });
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function loginPage(message) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Admin login</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#161514;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#f5f3ee}
  form{background:#1f1e1c;border:1px solid #33312e;border-radius:14px;padding:28px 24px;width:min(340px,90vw)}
  h1{font-size:16px;letter-spacing:2px;margin:0 0 18px;text-align:center}
  input{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #444;background:#111;color:#fff;font-size:15px;margin-bottom:12px}
  button{width:100%;padding:12px;border:0;border-radius:8px;background:#b48448;color:#fff;font-weight:700;font-size:15px;cursor:pointer}
  .err{color:#f87171;font-size:13px;margin-bottom:10px;text-align:center}
</style></head><body>
<form method="POST" action="/admin" autocomplete="off">
  <h1>THE CLASSIC CO. ADMIN</h1>
  ${message ? '<div class="err">' + message + '</div>' : ''}
  <input type="password" name="password" placeholder="Password" autofocus required>
  <button type="submit">Sign in</button>
</form></body></html>`;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const password = process.env.ADMIN_PASSWORD || 'Classic2026Admin!';
  if (!password || password.length < 8) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end('<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;padding:24px">Admin is switched off. Set <b>ADMIN_PASSWORD</b> (8+ characters) in Vercel, then redeploy.</body>');
  }
  const secret = crypto.createHash('sha256').update('cc-admin-session:' + password).digest('hex');
  const url = new URL(req.url, 'http://localhost');

  if (url.searchParams.get('logout')) {
    res.setHeader('Set-Cookie', COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
    res.statusCode = 303;
    res.setHeader('Location', '/admin');
    return res.end();
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const given = body.get('password') || '';
    if (safeEqual(given, password)) {
      res.setHeader('Set-Cookie', COOKIE_NAME + '=' + makeToken(secret) + '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + SESSION_SECONDS);
      res.statusCode = 303;
      res.setHeader('Location', '/admin');
      return res.end();
    }
    await sleep(1000); // slows down guessing
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(loginPage('Wrong password.'));
  }

  const cookies = parseCookies(req.headers.cookie);
  if (!verifyToken(cookies[COOKIE_NAME], secret)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(loginPage(''));
  }

  let html;
  try {
    html = fs.readFileSync(path.join(__dirname, '_admin.html'), 'utf8');
  } catch (e) {
    res.statusCode = 500;
    return res.end('Admin page file missing (api/_admin.html).');
  }
  const sheetUrl = process.env.ORDERS_SHEET_URL || '';
  html = html.replace('__ORDERS_SHEET_URL__', JSON.stringify(sheetUrl).replace(/</g, '\\u003c'));
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.end(html);
};
