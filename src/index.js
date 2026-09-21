try { process.loadEnvFile(); } catch {}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { logEvent } = require('./logger');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Detrás de proxies (Render/Vercel) para que req.ip use X-Forwarded-For
app.set('trust proxy', 1);

// Middlewares
app.use(helmet({
  // Sin CSP: el frontend vanilla usa onclick="" y <script> inline; activarlo los bloquea
  // (script-src-attr 'none'). Paridad con las otras variantes (solo nosniff/DENY/no-referrer).
  // En prod con frontend compilado (sin inline JS), quitar esta línea para endurecer.
  contentSecurityPolicy: false,
})); // Seguridad: resto de cabeceras que Express no enviaba
// CORS abierto por defecto para no romper pruebas locales (cualquier origen/puerto).
// Prod: define CORS_ORIGINS="https://tu-dominio.com" para restringir (ver README).
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(allowedOrigins.length
  ? cors({ origin: allowedOrigins, methods: ['GET', 'POST'] })
  : cors());
app.use(express.json({ limit: '100kb' }));
// Nota: static va DESPUÉS de las rutas para que GET / negocie por Accept
// (navegador → index.html, API client → JSON), igual que las otras variantes

// Log de cada request (debug, sin ensuciar /health)
app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
  }
  next();
});

// Anti-abuso en el endpoint de escritura (paridad: los otros validan y acotan)
const logLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-8' });

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
app.post('/api/log', logLimiter, async (req, res) => {
  const { message } = req.body ?? {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Se requiere campo "message" (string) en el body' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'message supera 2000 caracteres' });
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
    // Seguridad: no filtrar el mensaje crudo de Supabase al cliente
    return res.status(500).json({ error: 'No se pudieron obtener los logs' });
  }

  res.json({ count: data.length, logs: data });
});

// GET /health - Healthcheck sin log para no ensuciar
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Estáticos (favicon, etc.) + fallback de public/index.html para GET / navegador
app.use(express.static(path.join(__dirname, '..', 'public')));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`✅ hola-mundo-beacon escuchando en http://localhost:${PORT}`);
    console.log(`   Endpoints: GET / | GET /api/hello | POST /api/log | GET /api/logs | GET /health`);
    if (!process.env.SUPABASE_URL) {
      console.log('   ⚠️  Configura SUPABASE_URL y SUPABASE_ANON_KEY en .env para activar logging remoto');
    }
  });
  // Estabilidad: cierre limpio ante SIGTERM/SIGINT (Render/Vercel/Ctrl+C)
  const shutdown = (signal) => {
    console.log(`\n[${signal}] cerrando servidor...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
