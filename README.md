# 🌎 hola-mundo-beacon

Backend **Hola Mundo** minimalista con **Express + Supabase** que registra cada visita con `timestamp` en un BaaS gratuito.

> **Nombre recomendado:** `hola-mundo-beacon` — *beacon* = baliza que emite un log con timestamp en cada request. Alternativas: `logstamp-hola-mundo`, `hola-supabase-logger`.

## ✨ Stack

- **Backend:** Node.js 20.6+ (probado en 24.x) + Express 5.2 + CORS + helmet + express-rate-limit
- **BaaS:** Supabase (Postgres, plan gratuito 500MB, sin tarjeta)
- **Frontend demo:** `public/index.html` vanilla JS
- **Deploy listo:** Vercel Functions (`api/index.js` + `rewrites`), también Render / Railway / Fly
- **Gestor:** pnpm 12 exclusivamente (`pnpm-lock.yaml`, `packageManager: pnpm@12.3.4`)
- **Tests:** `node --test` (7 tests en modo mock, sin dependencias)

> ⚠️ Este proyecto usa **pnpm exclusivamente**. No uses `npm`/`yarn`/`bun`. Ver `AGENTS.md`.

## 📁 Estructura

```
hola-mundo-beacon/
├── src/
│   ├── index.js      # App Express + endpoints
│   ├── supabase.js   # Cliente Supabase
│   └── logger.js     # logEvent() con timestamp
├── public/index.html # Frontend demo
├── supabase.sql      # SQL para crear tabla logs
├── .env.example
└── vercel.json
```

## 🚀 Quick Start (3 minutos)

### 1. Clonar e instalar
```bash
cd hola-mundo-beacon
pnpm install --frozen-lockfile
```

### 2. Configurar Supabase

Ya tienes el proyecto creado. Ahora:

1. Ve a **Supabase Dashboard > SQL Editor > New Query**
2. Pega el contenido de `supabase.sql` y ejecuta (crea tabla `logs` + RLS policies)
3. Ve a **Project Settings > API** y copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`

4. Crea tu `.env`:
```bash
copy .env.example .env
# Edita .env y pega tus valores
```

`.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=3000
```

### 3. Correr local

```bash
pnpm dev   # con node --watch (auto-reload nativo)
# o
pnpm start
```

Abre http://localhost:3000

- Verás el frontend demo
- Cada `GET /` y `GET /api/hello` inserta un log con `timestamp` ISO en Supabase

### 4. Verificar logs

**Opción A - API:**
```bash
curl http://localhost:3000/api/hello
curl http://localhost:3000/api/logs | jq
```

**Opción B - Supabase Dashboard:**
`Table Editor > logs` → verás `message`, `endpoint`, `ip`, `timestamp`

**Opción C - Frontend:**
Click en `GET /api/logs` en http://localhost:3000

Sin `.env`, el backend corre en **modo mock** (log en consola, no falla).

## 🔌 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/` | Hola Mundo + log timestamp |
| `GET` | `/api/hello` | API JSON + log |
| `POST` | `/api/log` | Log custom `{ "message": "texto" }` |
| `GET` | `/api/logs` | Últimos 20 logs de Supabase |
| `GET` | `/health` | Healthcheck sin log |

Ejemplo POST:
```bash
curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola desde curl"}'
```

## ☁️ Deploy a Vercel (gratuito)

```bash
pnpm dlx vercel
vercel
# Configura env vars en Vercel Dashboard > Settings > Environment Variables:
# SUPABASE_URL, SUPABASE_ANON_KEY
vercel --prod
```

O conecta tu repo GitHub a Vercel (import project) y añade las env vars. Vercel detecta `pnpm-lock.yaml` y usa `pnpm install --frozen-lockfile` (ver `vercel.json:installCommand`).

**Otros deploys gratuitos:** Render (Web Service), Railway, Fly.io — mismo código, solo `pnpm start`.

## 🗄️ Tabla Supabase

```sql
logs (
  id bigint PK,
  message text,
  endpoint text,
  ip text,
  user_agent text,
  timestamp timestamptz default now()
)
```

Timestamp se genera en **dos capas**: `new Date().toISOString()` en Node + `default now()` en Postgres por si no se envía.

## 🔒 Notas de seguridad

- Para demo se usan policies `allow insert/select = true` con `anon key` (ver `supabase.sql`).
- En producción, usa `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor (nunca expongas en frontend).

### Buena práctica al pasar a prod: restringir CORS
En local el servidor acepta cualquier origen (`cors()` abierto) para no romper pruebas
desde otros puertos, `file://` o previews. Al desplegar, fija los orígenes permitidos:
```bash
# .env en producción (solo tus dominios, separados por coma)
CORS_ORIGINS=https://tu-app.vercel.app,https://tudominio.com
```
Con `CORS_ORIGINS` definido, el servidor solo acepta `GET`/`POST` desde esa allowlist;
sin la variable, queda abierto (modo dev). Nunca pongas `*` en producción.

## 🧪 Test local sin Supabase

El proyecto funciona sin `.env` en modo mock. Los tests del `src/index.js:55` verifican eso.

## 📝 Siguiente paso

1. Configura tu `.env` con los datos de tu proyecto Supabase ya creado
2. `pnpm dev` y haz `curl http://localhost:3000/api/hello`
3. Verifica en Supabase que aparece el log

¡Listo! Ya tienes Hola Mundo con logging persistente gratuito.
