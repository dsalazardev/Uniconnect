# Progress: Amplify Frontend Deploy

## 2026-05-20 — Task Group 1 Complete

- [x] 1.1 Created `amplify.yml` at repo root
- [x] 1.2 Verified structure matches design spec

The `amplify.yml` was created with:
- `version: 1` and `applications` array
- `appRoot: Frontend/Frontend-web` — shifts working directory to web app
- preBuild: `npm ci --legacy-peer-deps` + `cd ../shared && npm run build`
- build: `npm run build` (tsc -b && vite build)
- artifacts: `dist/` directory
- cache: `node_modules/**/*`

Created helper script: `scripts/setup-amplify-env.sh` with env var reference.

## ⚠️ Advertencia: TS errors pre-existentes

La validación local reveló errores de TypeScript en ProgramList, StudentProfile, BibliotecaPage y EventsPage que bloquean `tsc -b`. El `amplify.yml` es correcto, pero el build del web fallará hasta que estos errores se corrijan. Ver `findings.md` para detalles.

## Pending (requiere acción manual)

- [ ] 2.1 Configure Amplify Console — connect repo, verify amplify.yml auto-detection
- [ ] 2.2 Set env vars (VITE_API_URL, VITE_WEBSOCKET_URL, Auth0) in Amplify Console
- [ ] 3.1 Fix pre-existing TS errors, then push commit to GitHub
- [ ] 3.2 Verify Amplify build log
- [ ] 3.3 Verify deployed site
