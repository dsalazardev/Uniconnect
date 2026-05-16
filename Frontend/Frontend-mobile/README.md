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