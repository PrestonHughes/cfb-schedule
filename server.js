const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard';
// Public endpoint behind the SEC's availability report widget (secsports.com/fbreports).
const AVAILABILITY_URL = 'https://app.hdintelligence.com/api/get-publish-public';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/scoreboard') {
    const group = url.searchParams.get('group') || '80';
    const dates = url.searchParams.get('dates') || '';
    const espnUrl = `${ESPN_SCOREBOARD_URL}?dates=${encodeURIComponent(dates)}&groups=${encodeURIComponent(group)}&limit=400`;

    try {
      const upstream = await fetch(espnUrl);
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(body);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to reach ESPN', detail: String(err) }));
    }
    return;
  }

  if (url.pathname === '/api/team-schedule') {
    const team = url.searchParams.get('team') || '333';
    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${encodeURIComponent(team)}/schedule`;

    try {
      const upstream = await fetch(espnUrl);
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(body);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to reach ESPN', detail: String(err) }));
    }
    return;
  }

  if (url.pathname === '/api/availability') {
    try {
      const upstream = await fetch(AVAILABILITY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ sport: 'Football', organization: 'SEC', conference: 'SEC' })
      });
      const body = await upstream.text();
      // The upstream payload embeds every logo/venue image as base64 (~7 MB); drop them.
      const slim = upstream.ok
        ? JSON.stringify(JSON.parse(body, (k, v) => (typeof v === 'string' && v.startsWith('data:')) ? null : v))
        : body;
      res.writeHead(upstream.status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(slim);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Failed to reach SEC availability report', detail: String(err) }));
    }
    return;
  }

  // Static file serving (index.html, etc.) with basic path-traversal protection.
  let filePath = path.normalize(path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CFB Weekend Watch running:`);
  console.log(`  On this PC:      http://localhost:${PORT}`);
  console.log(`  On your network: http://<this-PC's-LAN-IP>:${PORT}  (find it with "ipconfig")`);
});
