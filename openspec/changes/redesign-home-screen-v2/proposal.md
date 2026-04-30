# Proposal: Rediseño Home Screen v2

## Why

El Home Screen actual (`app/(tabs)/index.tsx`) presenta una experiencia genérica con saludos informales y emojis que no reflejan la identidad profesional de Uniconnect. Carece de funcionalidad útil, mostrando solo un mensaje de bienvenida sin acceso rápido a eventos, grupos o notificaciones. Además, no implementa responsividad para escritorio, desperdiciando espacio en pantallas grandes. Este rediseño es necesario para establecer una experiencia premium alineada con el design system documentado en `DESIGN_TOKENS.md` y proporcionar valor inmediato al usuario.

## What Changes

- **BREAKING**: Eliminar saludos informales ("¡Hola, {nombre}! 👋") y reemplazar con Header de Marca profesional
- Implementar Header con branding "Uniconnect" (Roboto Bold 24px, color Gold #D9B97E)
- Agregar Logo de la Universidad de Caldas y Badge de notificaciones en el Header
- Crear layout responsivo con `useResponsive` hook:
  - **Mobile**: Columna única con scroll vertical, enfoque en "Próximos Eventos"
  - **Desktop**: Layout de 3 columnas (Sidebar izquierdo + Contenido central max-width 1200px + Panel derecho)
- Implementar Carrusel de Eventos con colores semánticos por tipo (CONFERENCIA: #0056b3, TALLER: #28a745, etc.)
- Agregar sección "Mis Grupos" con cards premium (`rgba(26, 26, 26, 0.9)` + borde gold en hover)
- Implementar Filtros con chips dorados para facultad/semestre
- Integrar datos reales de `EventsStore` (MobX) y `AuthStore` sin romper interfaces existentes
- Aplicar tokens de `DESIGN_TOKENS.md` al 100%: colores, tipografía, espaciado, border radius

## Capabilities

### New Capabilities

- `home-header-branding`: Header profesional con logo institucional, título "Uniconnect" y badge de notificaciones
- `responsive-layout`: Sistema de layout adaptativo mobile/desktop usando `useResponsive` hook
- `events-carousel`: Carrusel horizontal de próximos eventos con colores semánticos por tipo
- `groups-quick-access`: Sección de acceso rápido a grupos del usuario con cards premium
- `faculty-filters`: Sistema de filtros con chips para facultad y semestre
- `desktop-sidebar`: Sidebar de navegación rápida para pantallas desktop (≥1024px)
- `desktop-groups-panel`: Panel lateral derecho con "Grupos Destacados" para desktop

### Modified Capabilities

<!-- No hay capabilities existentes que se modifiquen a nivel de requirements -->

## Impact

### Código Afectado
- **Archivo principal**: `Frontend/app/(tabs)/index.tsx` (reescritura completa)
- **Dependencias existentes**: 
  - `src/features/auth/store/AuthStore` (lectura de usuario actual)
  - `src/features/events/store/events.store` (lectura de eventos)
  - `src/hooks/useResponsive` (detección de tamaño de pantalla)
  - `@expo/vector-icons` (iconografía Ionicons)

### Stores y Servicios
- **Lectura**: `EventsStore.events`, `EventsStore.loadEvents()`
- **Lectura**: `AuthStore.user`, `AuthStore.isAuthenticated`
- **Sin modificaciones**: No se alteran interfaces de stores existentes

### Assets
- **Requerido**: Logo de la Universidad de Caldas (`assets/Logo_de_la_Universidad_de_Caldas.svg.png`)
- **Iconos**: Ionicons de `@expo/vector-icons` (calendar, people, notifications, filter)

### Design System
- **100% alineado** con `DESIGN_TOKENS.md`:
  - Colores: Gold #D9B97E, backgrounds oscuros (#000000, #1a1a1a), colores semánticos
  - Tipografía: Roboto con escalas definidas (10px-24px)
  - Espaciado: Sistema de 4px (2, 4, 6, 8, 12, 16, 24, 48)
  - Border radius: 4-22px según componente
  - Sin sombras (jerarquía por borders y transparencias)

### Navegación
- **Sin cambios**: Mantiene integración con Expo Router y Tab Navigation
- **Mejora**: Sidebar desktop con links a otras tabs (eventos, grupos, comunidad)

### Performance
- **Optimización**: Uso de `React.memo` para componentes de cards
- **Lazy loading**: Carrusel de eventos con scroll horizontal optimizado
- **Responsividad**: Renderizado condicional según `isMobile`/`isDesktop`
