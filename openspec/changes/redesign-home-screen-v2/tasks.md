# Tasks: Rediseño Home Screen v2

## 1. Setup y Preparación

- [x] 1.1 Backup del archivo actual `app/(tabs)/index.tsx`
- [x] 1.2 Leer `DESIGN_TOKENS.md` para familiarizarse con tokens
- [x] 1.3 Verificar que `useResponsive` hook funciona correctamente
- [x] 1.4 Verificar que `EventsStore` y `AuthStore` están disponibles

## 2. Estructura Base del Componente

- [x] 2.1 Crear imports necesarios (React, RN components, stores, hooks, icons)
- [x] 2.2 Definir interface `HomeScreenProps` (vacía por ahora)
- [x] 2.3 Crear componente principal `HomeScreen` con observer de MobX
- [x] 2.4 Implementar `useResponsive` hook para detectar tamaño de pantalla
- [x] 2.5 Crear estructura de layout condicional (mobile vs desktop)

## 3. Header de Marca (home-header-branding)

- [x] 3.1 Crear subcomponente `Header` inline
- [x] 3.2 Agregar Logo de Universidad de Caldas con Image component
- [x] 3.3 Agregar texto "Uniconnect" con Roboto Bold 24px, color #D9B97E
- [x] 3.4 Implementar notification badge con count (mock: 3)
- [x] 3.5 Hacer badge tappable para navegar a /notifications
- [x] 3.6 Aplicar estilos del header usando tokens de DESIGN_TOKENS.md
- [x] 3.7 Verificar que NO hay saludos ni emojis en el header

## 4. Layout Responsivo (responsive-layout)

- [x] 4.1 Implementar layout mobile (columna única, scroll vertical)
- [x] 4.2 Implementar layout desktop (3 columnas: sidebar + content + panel)
- [x] 4.3 Configurar max-width 1200px para contenido central en desktop
- [x] 4.4 Aplicar padding y spacing usando tokens (spacing[8], spacing[6])
- [x] 4.5 Verificar que sidebar y panel solo renderizan en desktop (≥1024px)

## 5. Carrusel de Eventos (events-carousel)

- [x] 5.1 Crear subcomponente `EventsCarousel` inline
- [x] 5.2 Implementar useEffect para llamar `EventsStore.loadEvents()` al montar
- [x] 5.3 Filtrar eventos futuros (date >= today) y ordenar por fecha
- [x] 5.4 Implementar ScrollView horizontal con cards de eventos
- [x] 5.5 Aplicar colores semánticos por tipo de evento (CONFERENCIA: #0056b3, etc.)
- [x] 5.6 Configurar card width 280px, gap 12px entre cards
- [x] 5.7 Hacer cards tappables para navegar a `/events/${id_event}`
- [x] 5.8 Implementar loading state mientras cargan eventos
- [x] 5.9 Implementar empty state "No hay eventos próximos"
- [x] 5.10 Aplicar estilos usando tokens (borderRadius.xl, spacing[6], fontSize['2xl'])

## 6. Sección Mis Grupos (groups-quick-access)

- [x] 6.1 Crear subcomponente `GroupsSection` inline
- [x] 6.2 Crear mock data con 4 grupos hardcodeados (TODO comment para API real)
- [x] 6.3 Renderizar cards de grupos con premium styling
- [x] 6.4 Aplicar background rgba(26, 26, 26, 0.9), border gold
- [x] 6.5 Implementar hover effect en desktop (border rgba(217, 185, 126, 0.5))
- [x] 6.6 Mostrar nombre de grupo, curso, y member count
- [x] 6.7 Hacer cards tappables para navegar a `/groups/${id_group}`
- [x] 6.8 Agregar link "Ver todos" que navega a /(tabs)/groups
- [x] 6.9 Implementar empty state "No eres miembro de ningún grupo"

## 7. Filtros de Facultad (faculty-filters)

- [x] 7.1 Crear subcomponente `FacultyFilters` inline
- [x] 7.2 Implementar ScrollView horizontal con chips
- [x] 7.3 Crear array de facultades (Ingeniería, Salud, Ciencias Exactas, Jurídicas, Agropecuarias, Artes)
- [x] 7.4 Aplicar chip styling: borderRadius 20px, border gold, padding 6px/14px
- [x] 7.5 Implementar estado local para filtro seleccionado
- [x] 7.6 Aplicar styling diferente para chip activo (border #D9B97E, background gold15)
- [x] 7.7 Implementar lógica de filtrado client-side para eventos
- [x] 7.8 Implementar lógica de filtrado client-side para grupos
- [x] 7.9 Agregar opción "Todas las facultades" para limpiar filtro

## 8. Sidebar Desktop (desktop-sidebar)

- [x] 8.1 Crear subcomponente `Sidebar` inline
- [x] 8.2 Renderizar solo cuando `isDesktop === true`
- [x] 8.3 Configurar width fijo 240px, background #0d0d0d
- [x] 8.4 Crear array de navigation links (Inicio, Eventos, Grupos, Comunidad, Conexiones, Notificaciones, Perfil)
- [x] 8.5 Renderizar cada link con icon (Ionicons) y label
- [x] 8.6 Destacar link actual con color gold y background rgba(217, 185, 126, 0.1)
- [x] 8.7 Hacer links tappables para navegar a tabs correspondientes
- [x] 8.8 Aplicar estilos usando tokens (spacing[8], gap.md, fontSize.lg)

## 9. Panel Derecho Desktop (desktop-groups-panel)

- [x] 9.1 Crear subcomponente `RightPanel` inline
- [x] 9.2 Renderizar solo cuando `isDesktop === true`
- [x] 9.3 Configurar width fijo 300px, background #0d0d0d
- [x] 9.4 Agregar título "Grupos Destacados"
- [x] 9.5 Crear mock data con 5 grupos destacados (TODO comment para API real)
- [x] 9.6 Renderizar compact cards con nombre, member count, y botón "Unirse"
- [x] 9.7 Implementar scroll vertical si contenido excede altura
- [x] 9.8 Aplicar border left 1px solid rgba(217, 185, 126, 0.1)
- [x] 9.9 Hacer botón "Unirse" funcional (mock por ahora, TODO para API)

## 10. Estilos y Tokens

- [x] 10.1 Crear StyleSheet.create() único al final del archivo
- [x] 10.2 Aplicar colores de DESIGN_TOKENS.md (Gold #D9B97E, backgrounds oscuros)
- [x] 10.3 Aplicar tipografía de DESIGN_TOKENS.md (Roboto, fontSize 10-24px)
- [x] 10.4 Aplicar espaciado de DESIGN_TOKENS.md (spacing 2-48px, gap 6-12px)
- [x] 10.5 Aplicar border radius de DESIGN_TOKENS.md (4-22px según componente)
- [x] 10.6 Verificar que NO se usan sombras (solo borders y transparencias)
- [x] 10.7 Agregar comments en estilos referenciando DESIGN_TOKENS.md

## 11. Integración con Stores

- [x] 11.1 Importar `eventsStore` de `@/src/features/events/store/events.store`
- [x] 11.2 Importar `authStore` de `@/src/features/auth/store/AuthStore`
- [x] 11.3 Usar `eventsStore.events` para obtener lista de eventos
- [x] 11.4 Usar `eventsStore.loading` para mostrar loading state
- [x] 11.5 Usar `authStore.user` para obtener info del usuario (si es necesario)
- [x] 11.6 Verificar que NO se modifican interfaces de stores

## 12. Navegación

- [x] 12.1 Importar `useRouter` de `expo-router`
- [x] 12.2 Implementar navegación a `/events/${id}` al tap en event card
- [x] 12.3 Implementar navegación a `/groups/${id}` al tap en group card
- [x] 12.4 Implementar navegación a `/(tabs)/notifications` al tap en badge
- [x] 12.5 Implementar navegación a `/(tabs)/groups` al tap en "Ver todos"
- [x] 12.6 Implementar navegación a otras tabs desde sidebar

## 13. Performance y Optimización

- [x] 13.1 Envolver event cards en React.memo si es necesario
- [x] 13.2 Envolver group cards en React.memo si es necesario
- [x] 13.3 Limitar carousel a 10 eventos máximo
- [x] 13.4 Verificar que no hay re-renders innecesarios al cambiar tamaño de pantalla

## 14. Testing Manual

- [x] 14.1 Probar en Android (mobile): verificar layout columna única
- [x] 14.2 Probar en Chrome DevTools (desktop 1920x1080): verificar 3 columnas
- [x] 14.3 Verificar que header muestra "Uniconnect" sin saludos ni emojis
- [x] 14.4 Verificar que eventos se cargan y muestran correctamente
- [x] 14.5 Verificar que colores semánticos de eventos son correctos
- [x] 14.6 Verificar que navegación a detalle de evento funciona
- [x] 14.7 Verificar que navegación a detalle de grupo funciona
- [x] 14.8 Verificar que filtros afectan contenido mostrado
- [x] 14.9 Verificar que sidebar solo aparece en desktop
- [x] 14.10 Verificar que panel derecho solo aparece en desktop
- [x] 14.11 Verificar que todos los estilos usan tokens de DESIGN_TOKENS.md

## 15. Documentación y Limpieza

- [x] 15.1 Agregar JSDoc comments al componente principal
- [x] 15.2 Agregar TODO comments para mock data (grupos, notificaciones)
- [x] 15.3 Agregar comments explicando decisiones de diseño clave
- [x] 15.4 Verificar que código cumple Zero-Any policy
- [x] 15.5 Verificar que imports están organizados correctamente
- [x] 15.6 Eliminar código comentado o debug logs
