## Context

Frontend-web fue scaffoldeado con Vite 8.x + React 19.x y React Router 7.x. El router (`src/router.tsx`) renderiza componentes presentacionales directamente (e.g. `<EventList />` sin props) en lugar de usar page wrappers que conecten hooks/store, causando pantallas vacías. El `index.css` retiene el tema purple del template Vite, el Layout navbar es azul (`#0056b3`), y el botón de login es blanco — todo incompatible con la identidad Gold/Dark de Uniconnect. Faltan loaders en el Suspense del lazy-load de LoginScreen y en el loading state de EventsPage.

El backend y el paquete `@uniconnect/shared` son correctos. El API Client inyecta el Bearer token vía interceptor Axios. El problema es puramente deFrontend-web.

## Goals / Non-Goals

**Goals:**
- Que las rutas `/events`, `/groups` y `/messages` muestren datos reales del backend
- Que el tema visual de web (colores, navbar, botones) sea idéntico al de mobile: Gold `#D9B97E` sobre Dark `#1a1a1a`
- Que haya spinners/loaders en todas las transiciones donde mobile los tiene
- Crear un sistema de design tokens centralizado (colores, tipografía) para mantener la consistencia a futuro
- Migrar CSS modules a usar CSS custom properties desde los tokens

**Non-Goals:**
- NO cambiar el backend
- NO modificar el paquete `@uniconnect/shared`
- NO implementar nuevas features (solo corregir las existentes)
- NO tocar Frontend-mobile
- NO cambios de arquitectura profunda (ej. migrar de MobX a otra cosa)

## Decisions

### D1: Page Wrappers en lugar de High-Order Components
- **Decisión**: Crear `pages/GroupsPage.tsx` y `pages/MessagesPage.tsx` (sigue el patrón ya existente de `pages/EventsPage.tsx`)
- **Alternativa considerada**: HOCs que inyecten props — se descarta porque añade complejidad innecesaria y rompe el patrón MVC local (Components ← Hooks ← Stores) ya establecido
- **Razonamiento**: Consistencia con EventsPage existente, claridad, testabilidad

### D2: CSS Custom Properties para design tokens
- **Decisión**: Definir `:root` variables en `index.css` (ya existe el mecanismo) y referenciarlas desde los CSS modules como `var(--color-gold)` en lugar de valores hardcodeados
- **Alternativa considerada**: Archivo `tokens.module.css` separado — se descarta porque las custom properties en `:root` son el estándar CSS nativo sin build step extra
- **Razonamiento**: Cero dependencias externas, funciona con Vite out-of-the-box, facilita futuros themes

### D3: CSS nativo, no Tailwind
- **Decisión**: Mantener CSS Modules + CSS custom properties. No migrar a Tailwind.
- **Alternativa considerada**: Tailwind — se descarta porque el proyecto ya tiene una inversión significativa en CSS Modules y no hay problema de escala que justifique la migración
- **Razonamiento**: Consistencia con el codebase existente, cero fricción de tooling

### D4: LoadingSpinner como componente compartido
- **Decisión**: Crear `components/elements/LoadingSpinner.tsx` con variante `size` (sm/md/lg) y `label` opcional
- **Alternativa considerada**: Spinner inline en cada página — se descarta porque duplica código y dificulta cambios globales de diseño
- **Razonamiento**: Reutilizable, mantenible, sigue el patrón de `components/elements/` existente

### D5: Suspense fallback con spinner en lugar de null
- **Decisión**: Cambiar `Suspense fallback={null}` por `<LoadingSpinner size="lg" label="Cargando..." />`
- **Alternativa considerada**: Skeleton screens — se descarta por simplicidad; el lazy load es solo de LoginScreen (un botón), no justifica skeletons
- **Razonamiento**: Feedback visual inmediato durante la carga del módulo auth0-spa-js

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| Al cambiar CSS custom properties, algún componente use valor viejo | Busqueda grep de todos los valores hardcodeados antes del cambio; testing visual post-cambio |
| GroupsPage y MessagesPage tengan bugs si los stores no están completos | Ya existen hooks (`useGroups`, `useMyGroups`, etc.) y store (`GroupAdminStore`); solo falta el wrapper |
| El cambio de navbar azul a dark confunda a usuarios acostumbrados | El login screen ya es dark/gold, y mobile es dark; es consistencia, no cambio |
| Regresión en eventos si EventsPage existe pero router usa EventList | El cambio es 1 línea en router.tsx; fácil de revertir |
