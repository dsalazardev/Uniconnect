# Design: Rediseño Home Screen v2

## Context

El Home Screen actual (`app/(tabs)/index.tsx`) es un placeholder con 40 líneas de código que solo muestra un saludo genérico. El proyecto ya tiene:
- Design system documentado en `DESIGN_TOKENS.md` con 100+ tokens
- `useResponsive` hook funcional en `src/hooks/useResponsive.ts`
- `EventsStore` (MobX) con `loadEvents()` y `events` array
- `AuthStore` (MobX) con `user` object
- Componentes existentes: `EventCard`, `GroupCard` en sus respectivos features
- Expo Router 6.x con file-based routing

**Constraints:**
- Zero-Any policy (tipado estricto)
- StyleSheet nativo (no librerías UI externas)
- No romper interfaces de stores existentes
- Mantener compatibilidad con navegación actual

## Goals / Non-Goals

**Goals:**
- Reemplazar placeholder con home screen funcional y profesional
- Implementar responsividad mobile/desktop usando `useResponsive`
- Integrar datos reales de `EventsStore` y `AuthStore`
- Aplicar 100% de tokens de `DESIGN_TOKENS.md`
- Crear experiencia premium con branding institucional

**Non-Goals:**
- Modificar stores existentes (EventsStore, AuthStore)
- Crear nuevos endpoints de API
- Implementar light mode (solo dark theme)
- Agregar animaciones complejas (fuera de scope)
- Modificar componentes existentes (EventCard, GroupCard)

## Decisions

### Decision 1: Component Architecture - Single File vs Feature-Based
**Choice:** Single file `index.tsx` con subcomponentes inline

**Rationale:**
- Home screen es único (no reutilizable)
- Subcomponentes (Header, EventsSection, GroupsSection) son específicos del home
- Evita over-engineering con carpeta `features/home/`
- Facilita mantenimiento al tener todo el contexto en un archivo
- Total estimado: ~400 líneas (manejable en un archivo)

**Alternatives Considered:**
- Feature-based (`src/features/home/`): Rechazado por complejidad innecesaria
- Múltiples archivos en `app/(tabs)/home/`: Rechazado por no ser patrón de Expo Router

### Decision 2: Data Fetching - useEffect vs Custom Hook
**Choice:** `useEffect` directo en componente principal

**Rationale:**
- `EventsStore.loadEvents()` ya existe y es simple
- No hay lógica compleja de fetching que justifique hook personalizado
- Patrón ya usado en `app/(tabs)/events.tsx` (consistencia)

**Code:**
```typescript
useEffect(() => {
  eventsStore.loadEvents();
}, []);
```

### Decision 3: Responsive Strategy - Conditional Rendering vs Responsive Styles
**Choice:** Conditional rendering de componentes completos

**Rationale:**
- Desktop y mobile tienen layouts fundamentalmente diferentes (3 columnas vs 1 columna)
- Evita estilos complejos con múltiples breakpoints
- Mejor performance (no renderiza componentes innecesarios)
- Código más legible

**Code:**
```typescript
const { isMobile, isDesktop } = useResponsive();

return (
  <View style={styles.container}>
    {isDesktop && <Sidebar />}
    <View style={styles.content}>
      <Header />
      <EventsCarousel />
      <GroupsSection />
    </View>
    {isDesktop && <RightPanel />}
  </View>
);
```

### Decision 4: Styling - StyleSheet.create() Location
**Choice:** Single `StyleSheet.create()` al final del archivo

**Rationale:**
- Patrón estándar de React Native
- Facilita búsqueda de estilos
- Permite reutilización de estilos entre subcomponentes
- Consistente con componentes existentes del proyecto

### Decision 5: Events Filtering - Client-Side vs Server-Side
**Choice:** Client-side filtering con `Array.filter()`

**Rationale:**
- `EventsStore` ya carga todos los eventos
- Filtros son simples (fecha, facultad, semestre)
- Evita múltiples llamadas a API
- Mejor UX (filtrado instantáneo)

**Trade-off:** No escala si hay 1000+ eventos (aceptable para MVP)

### Decision 6: Groups Data Source - New API vs Mock Data
**Choice:** Mock data hardcodeado para "Mis Grupos" y "Grupos Destacados"

**Rationale:**
- No existe `GroupsStore` global (solo en feature)
- Evita crear nueva dependencia en este PR
- Permite completar UI sin bloqueo
- Fácil reemplazar con API real en futuro PR

**Migration Path:** Crear `useMyGroups` hook en `src/features/groups/hooks/` en PR posterior

### Decision 7: Notification Badge - Real Count vs Mock
**Choice:** Mock count (hardcoded 3) con TODO comment

**Rationale:**
- `NotificationStore` existe pero no está integrado en home
- Integración real requiere WebSocket setup (fuera de scope)
- Badge es visual, funcionalidad viene después

**Code:**
```typescript
// TODO: Integrate with NotificationStore.unreadCount
const notificationCount = 3;
```

## Risks / Trade-offs

### Risk 1: Performance con muchos eventos
**Risk:** Carousel con 50+ eventos puede causar lag en scroll
**Mitigation:** 
- Limitar a 10 eventos en carousel
- Usar `React.memo` en EventCard
- Implementar `FlatList` si performance es problema

### Risk 2: Mock data confunde a desarrolladores
**Risk:** Grupos hardcodeados pueden ser olvidados y no reemplazados
**Mitigation:**
- TODO comments explícitos en código
- Documentar en tasks.md que es temporal
- Crear issue de follow-up para integración real

### Risk 3: Responsive breakpoints no cubren todos los casos
**Risk:** Tablets (768-1024px) usan layout mobile, puede no ser óptimo
**Mitigation:**
- Aceptable para MVP (tablets son minoría)
- Agregar `isTablet` layout en futuro si es necesario

### Risk 4: Tokens hardcodeados en vez de importados
**Risk:** Si tokens cambian, hay que actualizar manualmente
**Mitigation:**
- Crear `src/constants/tokens.ts` en PR posterior
- Por ahora, valores hardcodeados con comments que referencian DESIGN_TOKENS.md

## Migration Plan

**Deployment:**
1. PR con cambios en `app/(tabs)/index.tsx` únicamente
2. No requiere cambios en backend o stores
3. No requiere migraciones de BD
4. Deploy directo a producción (sin feature flag)

**Rollback:**
- Revertir commit restaura placeholder anterior
- Sin impacto en otras pantallas
- Sin pérdida de datos

**Testing:**
- Manual testing en Android (mobile)
- Manual testing en Chrome DevTools (desktop 1920x1080)
- Verificar navegación a /events y /groups funciona
- Verificar que EventsStore.loadEvents() se llama

## Open Questions

1. **¿Cuántos eventos mostrar en carousel?** → Decisión: 10 eventos máximo
2. **¿Grupos destacados por qué criterio?** → Decisión: Mock data por ahora, criterio real TBD
3. **¿Sidebar debe ser colapsable?** → Decisión: No, fixed por ahora (v2 feature)
4. **¿Filtros persisten entre sesiones?** → Decisión: No, reset al recargar (v2 feature)
