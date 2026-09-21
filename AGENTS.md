# Instrucciones para agentes IA — hola-mundo-beacon

> **REGLA CRÍTICA — GESTOR DE PAQUETES: Este proyecto usa exclusivamente `pnpm`. Nunca uses `npm`, `npx`, `yarn` ni `bun`.**
> Si ves `package-lock.json`, `yarn.lock` o `bun.lock`, elimínalo. Solo `pnpm-lock.yaml` es válido.

## 1. Comandos obligatorios

```bash
pnpm install --frozen-lockfile   # instalar (CI / local)
pnpm add <pkg>                   # añadir dependencia prod
pnpm add -D <pkg>                # añadir dependencia dev
pnpm up <pkg>@latest             # actualizar
pnpm dev                         # dev con node --watch
pnpm start                       # prod
pnpm test                        # tests (node --test)
pnpm ls --depth=0                # verificar árbol
pnpm outdated                    # verificar desactualizados
pnpm audit                       # auditoría seguridad
```

**Prohibido:**
- `npm install`, `npm ci`, `npm update`, `npx <pkg>` (usa `pnpm dlx <pkg>`)
- Generar o commitear `package-lock.json`

Enforcement automático: `package.json:preinstall` ejecuta `pnpm dlx only-allow pnpm` y `.npmrc:engine-strict=true` bloquea npm.

## 2. Doble check obligatorio para operaciones Git

**Toda modificación Git requiere doble verificación antes de ejecutar.**

### Antes de `git add` / `git commit` / `git push` / `git rm`:
1. **Check 1 — Inspección:** Ejecuta `git status`, `git diff`, `git diff --staged`, `git log --oneline -10`. Verifica que solo estén los archivos intencionados.
2. **Check 2 — Confirmación:** Revisa `git ls-files` y confirma que no incluyes `package-lock.json`, `.env`, `node_modules/` ni locks no deseados. Si dudas, pregunta al usuario.

### Reglas específicas:
- Nunca hagas `git add -A` / `git add .` sin revisar `git status` primero.
- Nunca hagas `commit`, `amend`, `push` o `force-push` sin confirmación explícita del usuario (salvo que el usuario lo pida directamente).
- Nunca commitees secretos (`.env`, `*.pem`, `*.key`).
- Todo `git rm` de lockfiles (`package-lock.json`) debe verificarse con `git status` antes y después.
- Mantén `pnpm-lock.yaml` siempre commiteado y sincronizado.

## 3. Stack y convenciones

- Node `>=20.6`, pnpm `12.3.4` (`package.json:engines` + `packageManager`)
- Express `5.2.1`, `@supabase/supabase-js`, `cors` (abierto en local; allowlist vía
  `CORS_ORIGINS` en prod — ver README), `helmet`,
  `express-rate-limit` (solo `POST /api/log`), `dotenv` (condicionado)
- Seguridad/rendimiento (paridad con las otras variantes): cabeceras helmet, `trust proxy`,
  `express.json({ limit: '100kb' })`, `message` ≤2000, errores genéricos al cliente,
  rate-limit 60/min en escritura, `/health` sin logging, cierre limpio SIGTERM/SIGINT
- Tests: `node --test` (`src/index.test.js`, 7 tests en modo mock, sin dependencias)
- Dev: `node --watch src/index.js` (sin nodemon)
- Deploy: Vercel Functions vía `api/index.js` (re-exporta `src/index.js`) + `rewrites`,
  con `installCommand: pnpm install --frozen-lockfile`. Estáticos de `public/` primero.

## 4. Procesos en segundo plano (regla)

- Toda prueba que levante el servidor en background (`&`, `nohup`, etc.) debe matarse
  al terminar la verificación. No dejes listeners colgados: ocupan puertos (ej. :3000)
  y rompen la siguiente prueba — ya pasó con una instancia olvidada entre sesiones.
- Si el usuario necesita probar a mano, entrégale el comando en PRIMER PLANO
  (`pnpm dev`, Ctrl+C lo mata) siempre que sea posible.
- Solo deja un proceso en background si es imprescindible: anúncialo EXPLÍCITAMENTE
  (puerto, PID, comando exacto para matarlo) y programa auto-kill a los 3 minutos de
  inactividad (ej. `(sleep 180 && kill <PID>) &`).
- Antes de levantar un servidor, verifica el puerto (`lsof -i :<port>`) y mata restos previos.

## 5. Base de datos: solo lectura (regla)

- **PROHIBIDO escribir o borrar datos en bases de datos** (Supabase u otras), aunque sea
  proyecto de prueba o mockup. Solo lectura (`SELECT`, `GET /api/logs`) salvo que sea
  estrictamente necesario: en ese caso, confirmarlo **2 veces** con el usuario antes de
  proceder (dos mensajes de confirmación explícitos, no uno).
