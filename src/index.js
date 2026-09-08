try { process.loadEnvFile(); } catch {}
const express = require('express');
const cors = require('cors');
const path = require('path');
const { logEvent } = require('./logger');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Log de cada request (opcional, no bloqueante)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// GET / - Hola Mundo principal + log con timestamp
app.get('/', async (req, res) => {
  const timestamp = new Date().toISOString();
  // Log asíncrono sin bloquear respuesta (fire and forget con await no bloqueante)
  logEvent('Visita a / - Hola Mundo', req);

  // Si es request de navegador y existe public/index.html, Express static ya lo sirve
  // Pero para API clients, responder JSON
  if (req.headers.accept && req.headers.accept.includes('text/html') && req.path === '/') {
    // Dejar que static sirva index.html, pero si no existe, responder JSON
    return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (err) => {
      if (err) {
        res.json({ message: '¡Hola Mundo! 🌎', timestamp, status: 'ok' });
      }
    });
  }

  res.json({
    message: '¡Hola Mundo! 🌎',
    timestamp,
    info: 'Backend funcionando. Log con timestamp enviado a Supabase.',
  });
});

// GET /api/hello - Endpoint API explícito
app.get('/api/hello', async (req, res) => {
  const timestamp = new Date().toISOString();
  const result = await logEvent('GET /api/hello', req);

  res.json({
    message: '¡Hola Mundo desde la API! 🚀',
    timestamp,
    log: result,
  });
});

// POST /api/log - Permite loguear mensajes custom
app.post('/api/log', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Se requiere campo "message" (string) en el body' });
  }

  const timestamp = new Date().toISOString();
  const result = await logEvent(message, req);

  res.status(201).json({
    message: 'Log registrado',
    timestamp,
    log: result,
  });
});

// GET /api/logs - Últimos 20 logs (para verificar)
app.get('/api/logs', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase no configurado. Revisa .env' });
  }

  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[GET /api/logs] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ count: data.length, logs: data });
});

// GET /health - Healthcheck sin log para no ensuciar
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ hola-mundo-beacon escuchando en http://localhost:${PORT}`);
    console.log(`   Endpoints: GET / | GET /api/hello | POST /api/log | GET /api/logs | GET /health`);
    if (!process.env.SUPABASE_URL) {
      console.log('   ⚠️  Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env para activar logging remoto');
    }
  });
}

module.exports = app;
