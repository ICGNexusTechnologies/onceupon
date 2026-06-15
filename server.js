// server.js — local test server for Once Upon
// Lets the downloaded HTML generate books on your machine WITHOUT exposing your API key.
//
// SETUP (one time):
//   1. Put this file (server.js), your HTML, and a .env file in the SAME folder.
//   2. In .env put one line:   ANTHROPIC_API_KEY=sk-ant-your-new-key
//   3. Make sure you have Node 18 or newer:  node -v
//
// RUN:
//   node server.js
//   then open  http://localhost:3000  in your browser.
//
// The key stays on your machine. The browser only talks to localhost.

const http = require('http');
const fs = require('fs');
const path = require('path');

// ---- load .env (simple parser, no dependencies) ----
function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    txt.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch (_) { /* no .env file — rely on real env vars */ }
}
loadEnv();

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || 'claude-sonnet-4-6';  // current Sonnet
const PORT = process.env.PORT || 3000;

if (!API_KEY) {
  console.error('\n❌ No ANTHROPIC_API_KEY found. Create a .env file next to server.js with:\n   ANTHROPIC_API_KEY=sk-ant-your-key\n');
  process.exit(1);
}

// find the HTML file to serve (handles once-upon-app.html, once-upon-app_2.html, etc.)
function findHtml() {
  const preferred = ['once-upon-app.html'];
  for (const f of preferred) if (fs.existsSync(path.join(__dirname, f))) return f;
  const any = fs.readdirSync(__dirname).find(f => f.endsWith('.html'));
  return any || null;
}

const server = http.createServer(async (req, res) => {
  // ---- serve the app at / ----
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const file = findHtml();
    if (!file) { res.writeHead(500); return res.end('No .html file found in this folder.'); }
    let html = fs.readFileSync(path.join(__dirname, file), 'utf8');
    // Rewrite the direct Anthropic call to go through this local proxy instead.
    html = html.replace(/https:\/\/api\.anthropic\.com\/v1\/messages/g, '/api/generate');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
  }

  // ---- proxy story generation to Anthropic ----
  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        payload.model = MODEL;                       // force a valid current model
        if (!payload.max_tokens || payload.max_tokens < 2000) payload.max_tokens = 2000; // room for the book
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload)
        });
        const text = await upstream.text();
        if (!upstream.ok) console.error('Anthropic error', upstream.status, text.slice(0, 300));
        res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
        res.end(text);
      } catch (err) {
        console.error('Proxy error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('\n✦ Once Upon running at  http://localhost:' + PORT);
  console.log('   Serving: ' + (findHtml() || '(no .html found!)'));
  console.log('   Model:   ' + MODEL);
  console.log('   Press Ctrl+C to stop.\n');
});
