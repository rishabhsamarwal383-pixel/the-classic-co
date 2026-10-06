const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ogg': 'audio/ogg',
  '.ico': 'image/x-icon'
};

const adminHandler = require('./api/admin.js');

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsed.pathname);

  // 1. Handle /admin route via api/admin.js
  if (pathname === '/admin' || pathname === '/admin/' || pathname === '/api/admin') {
    return adminHandler(req, res);
  }

  // Handle local orders API
  if (pathname === '/api/order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const order = JSON.parse(body);
        const ordersFile = path.join(BASE_DIR, 'orders.json');
        let list = [];
        try { list = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch (e) { list = []; }
        const idx = list.findIndex(o => o.orderId === order.orderId);
        if (idx >= 0) list[idx] = order; else list.unshift(order);
        fs.writeFileSync(ordersFile, JSON.stringify(list, null, 2), 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, orderId: order.orderId }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/orders' && req.method === 'GET') {
    const ordersFile = path.join(BASE_DIR, 'orders.json');
    let list = [];
    try { list = JSON.parse(fs.readFileSync(ordersFile, 'utf8')); } catch (e) { list = []; }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(JSON.stringify(list));
    return;
  }

  // 2. Default to index.html for root
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const filePath = path.join(BASE_DIR, pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(BASE_DIR)) {
    res.statusCode = 403;
    return res.end('Access denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing
      const indexHtml = path.join(BASE_DIR, 'index.html');
      fs.readFile(indexHtml, (e, data) => {
        if (e) {
          res.statusCode = 404;
          return res.end('Not found');
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(data);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🚀 THE CLASSIC CO. - LOCAL OPERATIONS SERVER LIVE!`);
  console.log(`==================================================`);
  console.log(`🖥️  PC Admin:   http://localhost:${PORT}/admin`);
  console.log(`📱 Phone Admin: http://192.168.1.7:${PORT}/admin`);
  console.log(`🛍️  Storefront:  http://localhost:${PORT}/`);
  console.log(`🔑 Password:    Classic2026Admin!`);
  console.log(`==================================================\n`);
});
