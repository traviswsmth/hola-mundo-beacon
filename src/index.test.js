// Tests espejo de las otras variantes (Spring/Quarkus/FastAPI/.NET).
// Se fuerza modo mock (sin Supabase) aunque exista .env local.
process.env.SUPABASE_URL = '';
process.env.SUPABASE_ANON_KEY = '';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('./index.js');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('hola-mundo-beacon', () => {
  it('GET /api/hello responde JSON y loguea (mock)', async () => {
    const res = await fetch(`${base}/api/hello`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.message);
    assert.ok(body.timestamp);
    assert.equal(body.log.success, true);
  });

  it('POST /api/log sin message devuelve 400', async () => {
    const res = await fetch(`${base}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  it('POST /api/log válido devuelve 201', async () => {
    const res = await fetch(`${base}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'hola' }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.message, 'Log registrado');
  });

  it('GET /api/logs sin Supabase devuelve 503', async () => {
    const res = await fetch(`${base}/api/logs`);
    assert.equal(res.status, 503);
  });

  it('GET /health responde ok', async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  });

  it('GET / JSON no bloquea el HTML estático', async () => {
    const res = await fetch(`${base}/`, { headers: { Accept: 'application/json' } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.message);
  });

  it('ruta inexistente devuelve 404 JSON', async () => {
    const res = await fetch(`${base}/no-existe`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Ruta no encontrada');
  });
});
