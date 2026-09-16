import http from 'node:http';
import { URL } from 'node:url';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCEO } from './src/ceo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const port = Number(process.env.PORT || 3000);

const send = (res, status, data, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(data) : data);
};

const readBody = async (req) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  if (!body) return {};
  return JSON.parse(body);
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/agents') {
      const { agents } = await import('./src/registry.js');
      return send(res, 200, { agents });
    }

    if (req.method === 'POST' && url.pathname === '/api/ceo/run') {
      const body = await readBody(req);
      if (!body.goal || typeof body.goal !== 'string') {
        return send(res, 400, { error: 'goal is required' });
      }
      const result = await runCEO({ goal: body.goal, data: body.data ?? null });
      return send(res, 200, result);
    }

    if (req.method === 'GET') {
      const requested = url.pathname === '/' ? '/index.html' : url.pathname;
      const file = path.normalize(path.join(publicDir, requested));
      if (!file.startsWith(publicDir)) return send(res, 403, { error: 'Forbidden' });
      try {
        const content = await readFile(file);
        const ext = path.extname(file);
        const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
        return send(res, 200, content, types[ext] || 'application/octet-stream');
      } catch {
        return send(res, 404, { error: 'Not found' });
      }
    }

    return send(res, 404, { error: 'Not found' });
  } catch (error) {
    console.error(error);
    return send(res, 500, { error: error.message || 'Internal server error' });
  }
});

server.listen(port, () => console.log(`CEO Agent server running at http://localhost:${port}`));
