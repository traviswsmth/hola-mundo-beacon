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

Enforcement automático: `package.json:preinstall` ejecuta `npx only-allow pnpm` y `.npmrc:engine-strict=true` bloquea npm.

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

- Node `>=18`, pnpm `>=9` (`package.json:engines` + `packageManager: pnpm@11.23.0`)
- Express `5.2.1`, `@supabase/supabase-js`, `cors`, `dotenv` (condicionado)
- Dev: `node --watch src/index.js` (sin nodemon)
- Deploy: Vercel `@vercel/node` sobre `src/index.js` con `installCommand: pnpm install --frozen-lockfile`
