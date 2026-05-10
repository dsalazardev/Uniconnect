## Context

El chat de Frontend-web renderiza mensajes inline en `MessageList.tsx` sin separación de componentes. El texto se muestra plano (sin resaltar `@menciones`) y los archivos adjuntos usan un icono `FileText` genérico. Mobile ya tiene una implementación completa del patrón Decorator con `BaseMessage`, `WithMentions`, `WithFileAttachment` y `MessageBubble` que los orquesta.

La capa WebSocket ya existe en web (mismos eventos que mobile), pero el evento `message:mention` que emite el backend solo tiene un handler vacío en `useChat.ts:168` — no genera notificación ni navegación.

## Goals / Non-Goals

**Goals:**
- Portar `BaseMessage.tsx` (parseo y resaltado de `@menciones`) a web
- Portar `WithMentions.tsx` (borde de acento + icono `@` en burbuja) a web
- Portar `WithFileAttachment.tsx` (iconos por tipo MIME, vista previa de imágenes) a web
- Crear `MessageBubble.tsx` en web que orqueste los 3 decoradores (mismo patrón que mobile)
- Refactorizar `MessageList.tsx` para usar `MessageBubble`
- Implementar notificación navegable cuando el usuario es mencionado con `@`
- Agregar emoji picker al chat web (similar al de mobile)
- Mejorar `FilePickerModal` web con previsualización de imágenes

**Non-Goals:**
- NO portar eventos `user:presence`, `group:activity`, `message:read` (baja prioridad)
- NO procesar `rendered_content` del backend (ningún frontend lo usa)
- NO modificar shared package types
- NO modificar backend
- NO modificar Frontend-mobile

## Decisions

### D1: Portar código literal vs reescribir
**Decisión**: Portar adaptando a React DOM + CSS Modules
**Rationale**: La lógica de negocio (parseMentions, containsMention) es puro TypeScript sin dependencias RN. Se porta igual. La UI cambia de React Native (View/Text/StyleSheet) a HTML semántico (<div>/<span>/CSS Modules). El archivo mobile tiene ~80-150 líneas cada uno — portar es más rápido que diseñar desde cero.
**Alternativa**: Reescribir completamente — descartado porque la lógica ya está probada y testeada en mobile.

### D2: Notificación de mención: Toast vs notificación persistente
**Decisión**: Usar el sistema de notificaciones existente (`notificationObserver` + `notificationsStore`) + toast informativo
**Rationale**: 
- El backend ya emite `message:mention` con `id_group` y `sender_name` (ver `useChat.ts:161-173`)
- Debemos crear una notificación en `notificationsStore` (persistente, visible en NotificationCenter)
- Y un toast temporal con `showToast.info()` que tenga un botón "Ir al chat"
- La navegación se hace con `useNavigate()` de React Router hacia `/messages/groups/{id_group}`
**Alternativa**: Solo toast — descartado porque el usuario perdería la notificación si no la ve en ese momento.

### D3: Emoji picker: librería externa vs implementación inline
**Decisión**: Portar la lista inline de emojis populares de mobile (POPULAR_EMOJIS), renderizada como grid en un Modal
**Rationale**: Mobile usa una lista hardcodeada de 56 emojis populares. Portar esto a web es trivial (~30 líneas de JSX + CSS Grid). Una librería externa (como `emoji-picker-react`) sería overkill para 56 emojis y agregaría peso al bundle.
**Alternativa**: `emoji-picker-react` — descartado por peso extra innecesario.

### D4: Mejora de FilePickerModal — previsualización de imágenes
**Decisión**: Usar `URL.createObjectURL()` para previsualizar imágenes seleccionadas antes de subir
**Rationale**: Mobile usa `Image.source={{ uri: file.uri }}` para previsualizar. En web, `URL.createObjectURL()` genera URLs blob que `<img src={blobUrl} />` puede renderizar. No requiere librerías externas.
**Alternativa**: FileReader API — más verboso, misma funcionalidad.

### D5: Arquitectura de componentes decorators
**Decisión**: Misma estructura que mobile — componentes anidados en lugar de HOCs
**Rationale**: Mobile usa composición directa: `WithMentions(WithFileAttachment(BaseMessage))`. Esto es más legible y testeable que HOCs. En web se replica el mismo patrón con JSX anidado.
**Alternativa**: HOCs (higher-order components) — innecesario, la composición directa es suficiente.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| CSS Modules nuevos duplican estilos de MessageList.module.css | MessageBubble.module.css solo contiene estilos de la burbuja individual. Los estilos de layout (contenedor, alineación) se quedan en MessageList.module.css |
| Notificación de mención sin conexión WebSocket | En `useChat.ts` ya existe el handler para `message:mention`. Solo estamos agregando lógica dentro de ese handler. Si no hay WS, simplemente no llega el evento — degradación graceful |
| Regresión en MessageList al refactorizar | Los tests de mobile para MessageBubble son buena referencia. Se crearán tests básicos para web. La extracción es mecánica: mover JSX de burbuja a MessageBubble.tsx, pasar las mismas props |
| Emoji picker sin búsqueda | La lista hardcodeada de 56 emojis cubre los más usados. Si se necesita búsqueda en el futuro, se puede migrar a una librería |
