# Uniconnect Frontend

Aplicación móvil desarrollada con React Native y Expo para conectar estudiantes universitarios.

## 👥 Integrantes

- Luis Miguel Henao
- Jaime Andrés Cardona
- Daner Alejandro Salazar
- Mariana López

## 🚀 Tecnologías

- React Native
- Expo
- TypeScript
- React Query
- Zustand

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar el proyecto
npm start
```

## 🏃 Comandos Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Ejecuta en Android
- `npm run ios` - Ejecuta en iOS
- `npm run web` - Ejecuta en navegador web

## Instalación librería notificaciones 
```bash
npx expo install expo-notifications expo-device
npx expo install expo-dev-client
```

## 📲 Distribución Móvil (APK)

La app se distribuye mediante **EAS Build** como APK firmado. Puedes descargar la última versión de prueba directamente e instalarla en cualquier dispositivo Android.

### Descargar APK

```
https://expo.dev/accounts/salazar04/projects/uniconnect_g/builds/4cff4cea-9e09-4d00-8560-10b1e157b5aa
```

> ⚠️ Este APK apunta al backend de producción en Fly.io. Al instalarlo puedes iniciar sesión con tu cuenta institucional (Auth0), ver y gestionar grupos, eventos, conexiones sociales y chatear en tiempo real — todo contra la API en producción, sin necesidad de un servidor local.

### Instalación

1. Abre el enlace desde el navegador de tu dispositivo Android.
2. Toca *Descargar* y espera que finalice.
3. Habilita *Instalar aplicaciones de fuentes desconocidas* si el sistema lo requiere.
4. Ejecuta el archivo APK descargado y presiona *Instalar*.

### Generar un Nuevo Build

```bash
npx eas build --profile preview --platform android --non-interactive
```

Requiere tener `eas-cli` instalado y sesión iniciada en Expo (`eas login`). Las variables de entorno y credenciales se inyectan desde los secrets de EAS.

### Perfiles de Build

| Perfil | Uso | Salida |
|--------|-----|--------|
| `development` | Desarrollo local con dev client | APK |
| `preview` | Distribución a testers | APK firmado |
| `production` | Publicación en tiendas | AAB (App Bundle) |

---

## Pruebas E2E (Maestro)

El proyecto usa **Maestro** para pruebas E2E sobre la app móvil. Los flows están en `maestro/flows/` y se ejecutan contra un emulador Android con la app instalada y el backend corriendo.

### Instalación de Maestro

**macOS (Homebrew):**
```bash
brew install maestro
```

**Linux / WSL (Windows):**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH:$HOME/.maestro/bin"
```

### Precondiciones

Antes de ejecutar cualquier flow, asegurate de tener:

1. **Emulador Android corriendo** — Android Studio → AVD con API 34+
2. **Backend en ejecución** — `npm run dev` en `Backend/` (puerto 8007)
3. **APK debug instalada** en el emulador:
   ```bash
   cd Frontend-mobile
   npx expo run:android
   # o bien
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. **Token JWT válido** — obtenelo iniciando sesión en la app, o generalo con:
   ```bash
   node -e "const {JwtService}=require('@nestjs/jwt');const s=new JwtService({secret:'<your-jwt-secret>'});console.log(s.sign({sub:1,permissions:[],roleName:'student'}))"
   ```

### Ejecución de Flows

```bash
# Flow específico: crear sesión de estudio
maestro test maestro/flows/study-session.yaml

# Todos los flows disponibles
maestro test maestro/flows/

# Con variables de entorno
GROUP_ID=1 AUTH_TOKEN="<jwt>" maestro test maestro/flows/study-session.yaml
```

### Configuración

El archivo `.maestro/config.yaml` define la configuración global:

```yaml
appId: com.damaluja.uniconnect
env:
  MAESTRO_API_URL: http://10.0.2.2:8007/api    # URL del backend (10.0.2.2 = localhost del host)
  MAESTRO_WEBSOCKET_URL: http://10.0.2.2:3000
testFileBasePath: ../maestro
```

> `10.0.2.2` es la IP especial del emulador Android que mapea al `localhost` de la máquina host.
> Si ejecutás scripts Node.js desde Windows, usá `http://localhost:8007/api` en su lugar.

### Verificación de Sincronización (verify-sync.js)

El script `maestro/scripts/verify-sync.js` verifica que una sesión creada desde la app móvil se haya sincronizado correctamente, consultando la API REST y el WebSocket del backend.

**Uso:**
```bash
node maestro/scripts/verify-sync.js <groupId> <authToken> [apiBaseUrl]
```

**Ejemplos:**
```bash
# Desde WSL/Linux (emulador)
node maestro/scripts/verify-sync.js 1 "eyJhbGciOiJ..." http://10.0.2.2:8007/api

# Desde Windows (localhost directo)
node maestro/scripts/verify-sync.js 1 "eyJhbGciOiJ..." http://localhost:8007/api
```

**Qué verifica:**
1. **API Polling** — Hasta 5 intentos (c/2 seg) consultando `GET /groups/:groupId/study-sessions` hasta encontrar la sesión
2. **WebSocket** — Conecta al backend vía WebSocket y escucha el evento `study_session:created` (requiere el módulo `ws`: `npm install ws`)

**Códigos de salida:**
| Código | Significado |
|--------|-------------|
| `0` | Verificación exitosa |
| `1` | API verification falló |
| `2` | WebSocket verification falló |
| `3` | Ambas fallaron |

### Pipeline CI (GitHub Actions)

Los tests E2E se ejecutan automáticamente en CI mediante el job `e2e-android` definido en `.github/workflows/ci.yml`.

**¿Cuándo se ejecuta?**
- Solo en **PRs a `main`** que modifican código de `Frontend-mobile`
- O mediante **`workflow_dispatch`** con `e2e: true`

**Artefactos generados en caso de fallo:**

Cuando un flow E2E falla en CI, Maestro genera capturas y video en `~/.maestro/output/`. Estos se suben como artefacto ZIP (`maestro-artifacts.zip`) al workflow de GitHub Actions.

**Cómo descargarlos:**
1. Ir a la pestaña **Actions** del repositorio en GitHub
2. Seleccionar el workflow run fallido
3. Bajar a la sección **Artifacts**
4. Descargar `maestro-artifacts.zip`

**Contenido del ZIP:**
| Archivo | Descripción |
|---------|-------------|
| `*.png` | Screenshots por cada paso del flow (útiles para ver en qué paso falló) |
| `*.mp4` | Grabación de video completa del flow (desde que inicia hasta que falla) |
| `report.html` | Reporte HTML con detalles del flow y los errores |

**Cómo re-ejecutar un flow fallido localmente:**

1. Descargar `maestro-artifacts.zip` del CI
2. Extraer el contenido
3. Revisar los screenshots para identificar el paso que falló
4. Reproducir localmente:
   ```bash
   # Con el emulador corriendo, el backend andando y la APK instalada
   maestro test --env ARTIFACTS_DIR=./maestro-output maestro/flows/study-session.yaml 2>&1 | tee flow.log
   ```
5. Comparar los screenshots locales con los del CI para ver diferencias
6. Si el error persiste, habilitar debug mode:
   ```bash
   MAESTRO_DRIVER_STARTUP_TIMEOUT=60000 maestro test maestro/flows/study-session.yaml
   ```