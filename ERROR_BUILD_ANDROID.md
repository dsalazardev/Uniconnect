ERROR_BUILD_ANDROID.md
======================

Resumen ejecutivo
------------------
Problema: al ejecutar la app Android con Expo/Hermes la aplicación falla en tiempo de ejecución con:

([runtime not ready]: ReferenceError: Property 'SharedArrayBuffer' doesn't exist, stack: ... metroRequire ... global ...)

Hipótesis principal: una dependencia (frecuentemente pretty-format@30.x u otra librería que use SharedArrayBuffer / workers / WASM) está siendo incluida en el bundle final que Hermes ejecuta. Hermes no soporta SharedArrayBuffer → crash.

Este documento describe cómo diagnosticar el problema sin tocar código, opciones de remediación ordenadas por impacto, verificación y medidas preventivas (CI + documentación).

Síntomas
--------
- Crash inmediato en Android con Hermes: ReferenceError: Property 'SharedArrayBuffer' doesn't exist.
- Stacktrace con referencias a metroRequire / loadModuleImplementation (indica código bundlado por Metro).
- Suele aparecer en monorepos con hoisting o mezcla de gestores de paquetes y/o uso de `resolutions`/`overrides` mal aplicados.

Causa típica
------------
- Algunas librerías (ej. pretty-format v30+) usan SharedArrayBuffer.
- Hermes (JS engine en Android) no implementa SharedArrayBuffer.
- Si Metro incluye código que lo referencia en el bundle, Hermes lanza ReferenceError al evaluar ese código.
- En monorepos, dev-dependencies (jest/@types/jest) o una resolución incorrecta pueden hacer que versiones no deseadas queden accesibles a Metro y terminen en el bundle.

Evidencia del repositorio
--------------------------
- El archivo AGENTS.md del repo documenta este fallo y prescribe forzar pretty-format@29.7.0 via `overrides` en package.json raíz y limpiar caches/lockfiles.
- Riesgo adicional: lockfiles múltiples (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) y `resolutions` en subpaquetes pueden producir resoluciones inconsistentes en npm workspaces.

Objetivos
---------
1. Diagnosticar con certeza qué módulo/version introduce SharedArrayBuffer en el bundle.
2. Aplicar una solución segura (no invasiva la 1ª vez), verificar en dispositivo físico o emulador.
3. Añadir controles en CI para evitar regresiones.

Diagnóstico (no destructivo)
----------------------------
Ejecuta las comprobaciones siguientes y pega salidas aquí para interpretación (no se cambian archivos):

1) Detectar lockfiles y decidir el package manager:

```bash
ls -1 | rg -n 'package-lock.json|pnpm-lock.yaml|yarn.lock' || true
```

2) Comprobar versiones y origen de `pretty-format` (si usas npm):

```bash
npm ls pretty-format --all
npm why pretty-format
```

3) Buscar `resolutions` / `overrides` en subpackages:

```bash
rg '"resolutions"|"overrides"' -n Frontend || true
```

4) Confirmar si el bundle contiene `SharedArrayBuffer` (evidencia fuerte):

```bash
# en una terminal, arrancar el packager (mobile)
cd Frontend/Frontend-mobile
npx expo start

# en otra terminal, descargar bundle y buscar la cadena
curl -s "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false" -o /tmp/index.android.bundle
rg -n -C 6 "SharedArrayBuffer" /tmp/index.android.bundle || true
```

- Si aparece, copia ~10 líneas de contexto y se podrá mapear el módulo responsable.

Cómo interpretar resultados
---------------------------
- `npm ls pretty-format` mostrando 30.x en la cadena → conflicto de versiones.
- `npm why pretty-format` mostrará cuál paquete lo exige (ej. @types/jest → jest → pretty-format).
- Si `SharedArrayBuffer` aparece en el bundle y hay referencias a `node_modules/<paquete>` → Metro está incluyendo ese código.

Remediación recomendada (de menor a mayor impacto)
--------------------------------------------------

Opción 1 — No invasiva (diagnóstico/aseguramiento)
- Asegúrate de que no está importándose accidentalmente código de test/dev en runtime.
- Revisa `package.json` raíz para `overrides` o políticas existentes (AGENTS.md sugiere override de pretty-format).

Opción 2 — Forzar versión compatible + reinstalación limpia (recomendada si el diagnóstico confirma conflicto)
1. Añadir/confirmar overrides en package.json raíz (ejemplo):

```json
"overrides": {
  "pretty-format": "29.7.0",
  "jest-matcher-utils": "29.7.0",
  "jest-diff": "29.7.0",
  "@expo/metro-runtime": {
    "pretty-format": "29.7.0"
  }
}
```

2. Limpieza e instalación (ADVERTENCIA: destructivo en entorno local):

```bash
# desde la raíz (borra node_modules y lockfiles locales)
rm -rf node_modules Frontend/Frontend-mobile/node_modules Frontend/Frontend-web/node_modules Frontend/shared/node_modules
rm -rf node_modules/.cache Frontend/Frontend-mobile/.expo
rm -f package-lock.json pnpm-lock.yaml yarn.lock
npm install --legacy-peer-deps
```

3. Verificar:

```bash
npm ls pretty-format --all
rg -n "SharedArrayBuffer" node_modules || true
```

4. Limpiar caches Metro / Gradle y reconstruir mobile:

```bash
cd Frontend/Frontend-mobile
npx expo start -c   # limpia Metro cache
cd android && ./gradlew clean
cd ..
npx expo run:android
```

Opción 3 — Temporal / diagnóstico: cambiar a JSC
- Cambiar el engine JS a `jsc` para confirmar que Hermes es la causa. No usar JSC en producción; solo diagnóstico.

Opción 4 — Patch (último recurso)
- Usar `patch-package` para parchear la dependencia problemática localmente. Mantener ticket para revertir cuando upstream corrija.

Verificación post-fix
---------------------
1. `npm ls pretty-format --all` → confirmar 29.7.0 única.
2. Repetir descarga de bundle y buscar `SharedArrayBuffer` → no debe aparecer.
3. `npx expo run:android` → la app arranca correctamente con Hermes.

Automatización / prevención (CI)
--------------------------------
1. Job de CI que falla si `pretty-format >= 30` (script simple que falla la build si se detecta la versión no segura).
2. Job de CI que genera el bundle (o el artefacto JS) y grep por `SharedArrayBuffer` antes de publicar.
3. Policy: documentar en CONTRIBUTING/AGENTS.md: "No usar `resolutions` en subpackages; usar `overrides` en raíz; estandarizar package manager en el monorepo."

Plan de trabajo (tareas concretas)
---------------------------------
1. Diagnóstico no destructivo: ejecutar `npm ls` y buscar en bundle. (30–60 min)
2. Si conflicto confirmado: aplicar overrides + reinstalación limpia. (1–2 hrs)
3. Verificación en dispositivo físico y build de release. (30–60 min)
4. Añadir CI checks y documentación. (1–2 hrs)
5. Abrir ticket para remover parches cuando upstream actualice. (15 min)

Estimación
----------
- Diagnóstico: 30–60 min.
- Fix + reinstall + rebuild: 1–3 horas (depende de red y tamaño del monorepo).
- CI + doc: 1–2 horas.

Riesgos y mitigación
--------------------
- Borrar node_modules y lockfiles locales puede afectar a desarrolladores que usan otro package manager. Mitigar: acordar y documentar el manager estándar (recomiendo npm).
- Overrides pueden ocultar dependencias rotas. Mitigar: CI para detección y plan de subida a upstream.
- Parches locales añaden deuda. Mitigar: registrar y planear removión cuando upstream lo arregle.

Checklist rápido
----------------
1. ¿package.json raíz tiene `overrides` para pretty-format?  
2. ¿Hay más de un lockfile en repo?  
3. ¿bundle contiene `SharedArrayBuffer` antes del fix?  
4. ¿bundle contiene `SharedArrayBuffer` después del fix?  
5. ¿CI falla si se introduce pretty-format@30.x?  

Diagrama (visión rápida)
------------------------
```
┌────────────┐
│ package.json│
│ (overrides) │
└────┬────────┘
     │
     ▼
┌────────────┐   Metro resolves  ┌────────────┐   Hermes executes
│ node_modules│ ───────────────▶ │ JS bundle   │ ───────────────▶ Runtime
└────┬───────┘                   └────┬────────┘
     │ contains problematic code         │
     ▼                                    ▼
 pretty-format@30 (uses SharedArrayBuffer)  ReferenceError on Hermes
```

Comandos útiles (resumen)
-------------------------
- Diagnóstico:
```bash
npm ls pretty-format --all
npm why pretty-format
rg -n -C 6 "SharedArrayBuffer" /tmp/index.android.bundle
```
- Limpieza e instalación:
```bash
rm -rf node_modules Frontend/Frontend-mobile/node_modules Frontend/shared/node_modules
rm -f package-lock.json pnpm-lock.yaml yarn.lock
npm install --legacy-peer-deps
```
- Limpiar Metro y Gradle:
```bash
cd Frontend/Frontend-mobile
npx expo start -c
cd android && ./gradlew clean
npx expo run:android
```

Preguntas abiertas
------------------
1. ¿Quieres que te ayude a ejecutar los comandos de diagnóstico ahora y analice las salidas? (Pega las salidas aquí.)
2. ¿Confirmamos estandarizar en `npm` y proceder con la limpieza si el diagnóstico confirma el conflicto?
3. ¿Quieres que redacte la propuesta/ticket para CI + docs (OpenSpec) que puedas revisar antes de aplicar?

Referencias
-----------
- AGENTS.md (repositorio) — contiene una sección con el fix forzado (pretty-format@29.7.0) y recomendaciones sobre `overrides` vs `resolutions`.

---
Archivo creado automáticamente por la asistencia; revisa los comandos y ejecútalos con cuidado (algunas operaciones son destructivas en entorno local).
