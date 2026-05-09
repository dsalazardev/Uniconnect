## Why

Frontend-web muestra pantallas vacías ("No hay eventos disponibles", "No hay grupos disponibles") a pesar de que el backend responde correctamente y el token JWT se inyecta vía interceptor Axios. El tema visual (CSS purple de Vite scaffold, navbar azul, botón login blanco) es incompatible con la identidad Gold/Dark de Uniconnect. Faltan loaders en transiciones clave. Esto hace que la web se perciba como un cascarón vacío e inconexo.

## What Changes

- **Router fix**: Reemplazar render directo de componentes presentacionales por wrappers con hooks/store en rutas `/events`, `/groups`, `/messages`
- **UI Theme unificación**: Limpiar `index.css` de scaffold Vite, reemplazar tema purple por gold/dark, cambiar navbar azul a dark, botón login de blanco a gold
- **Visual feedback**: Agregar spinner en Suspense fallback (login lazy load), reemplazar `<p>Cargando...</p>` por componente spinner en EventsPage
- **Design tokens**: Crear `constants/colors.ts` y `constants/typography.ts` en web con valores centralizados
- **Mantenibilidad**: Migrar valores hardcodeados de CSS modules a CSS custom properties

## Capabilities

### New Capabilities
- `router-fix`: Corregir las 3 rutas que renderizan componentes presentacionales sin datos (events, groups, messages)
- `ui-theme-parity`: Unificar el tema visual de web con mobile (Gold/Dark)
- `visual-feedback`: Agregar loaders/spinners en los puntos del ciclo de vida donde faltan
- `design-tokens-web`: Crear sistema centralizado de colores y tipografía para web

### Modified Capabilities
<!-- No existing spec capabilities are changing at the spec level -->

## Impact

- **Frontend-web/src/router.tsx**: 3 rutas cambiadas a page wrappers, 1 nuevo `Suspense` fallback
- **Frontend-web/src/index.css**: Reemplazo completo del tema
- **Frontend-web/src/components/Layout.tsx + .module.css**: Navbar recolorizado
- **Frontend-web/src/features/auth/components/LoginScreen.module.css**: Botón login recolorizado
- **Frontend-web/src/constants/**: 2 nuevos archivos (colors.ts, typography.ts)
- **Frontend-web/src/pages/**: 2 nuevos archivos (GroupsPage.tsx, MessagesPage.tsx)
- **Frontend-web/src/components/elements/**: 1 nuevo componente (LoadingSpinner.tsx)
- **Frontend-web/src/features/events/components/EventsPage.tsx**: Spinner en loading state
- **Múltiples *.module.css**: Migración a CSS custom properties
- **Sin cambios en shared/ o backend**
