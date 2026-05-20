## 1. ADR-1 — Add `build:prod` script

- [x] 1.1 Add `"build:prod": "vite build"` to `Frontend/Frontend-web/package.json` scripts section
- [x] 1.2 Verify `"build"` script is unchanged (`"tsc -b && vite build"`)
- [x] 2.1 Add `"exclude": ["src/contract-check.ts"]` to `Frontend/Frontend-web/tsconfig.app.json`
- [x] 3.1 Change build command from `npm run build` to `npm run build:prod`
- [x] 3.2 Remove `cd ../shared && npm run build` from preBuild phase
- [x] 3.3 Verify final `amplify.yml` structure matches design spec
- [x] 4.1 Run `npm run build:prod` — exit code 0, `dist/` produced (848KB JS, 1.57s)
- [x] 4.2 Run `npm run build` — still fails on `tsc -b` (type-checking preserved)
