## Context

Uniconnect es una plataforma educativa con chat grupal en tiempo real implementado con NestJS + Socket.IO. El sistema actual procesa mensajes directamente sin filtrado de contenido, usando:

- `MessagesGateway` con WebSocket handlers (`@SubscribeMessage`)
- `MessagesService` con lógica de negocio y EventEmitter2
- Arquitectura estricta: Controllers → Services → Repositories
- Tipado estricto TypeScript (cero `any`)

**Restricciones arquitectónicas (AGENTS.md):**
- Mantener lógica de negocio fuera de controladores
- Usar Custom Method Decorators para interceptación
- Preservar funcionalidad existente sin regresiones
- Seguir patrones de logging con UniconnectLogger

## Goals / Non-Goals

**Goals:**
- Implementar moderación automática transparente usando Decorator Pattern
- Filtrar palabras prohibidas antes del procesamiento del mensaje
- Registrar actividad de moderación para auditoría
- Mantener performance sin impacto significativo en latencia
- Integración sin cambios en APIs existentes

**Non-Goals:**
- Moderación manual o dashboard de administración
- Análisis de sentimientos o IA avanzada
- Moderación de archivos/imágenes (solo texto)
- Cambios en base de datos o esquemas existentes
- Configuración dinámica en runtime (será estática)

## Decisions

### 1. Custom Method Decorator vs Interceptor vs Middleware

**Decisión:** Custom Method Decorator
**Rationale:** 
- Cumple requisitos de AGENTS.md para US-D01
- Aplicación granular a métodos específicos
- Reutilizable entre Gateway y Service
- No interfiere con arquitectura NestJS existente

**Alternativas consideradas:**
- NestJS Interceptor: Más complejo, requiere cambios en módulos
- Middleware: Solo funciona en HTTP, no WebSocket
- Guard: Para autorización, no procesamiento de datos

### 2. Ubicación del Filtrado: Pre vs Post Validación

**Decisión:** Pre-validación (antes de DTO processing)
**Rationale:**
- Bloquea contenido inapropiado lo antes posible
- Evita procesamiento innecesario de mensajes rechazados
- Logs más precisos de intentos de envío

### 3. Estrategia de Filtrado de Palabras

**Decisión:** Lista estática de palabras prohibidas con matching exacto
**Rationale:**
- Implementación simple y predecible
- Performance óptima (O(1) lookup con Set)
- Fácil testing y debugging
- Suficiente para MVP educativo

**Alternativas consideradas:**
- Regex patterns: Más complejo, potencial DoS
- API externa: Latencia y dependencia externa
- Machine Learning: Overkill para el scope

### 4. Manejo de Mensajes Rechazados

**Decisión:** Lanzar excepción con mensaje descriptivo
**Rationale:**
- Consistente con patrones NestJS existentes
- Frontend puede mostrar error específico al usuario
- Evita confusión sobre mensajes "perdidos"

### 5. Configuración del Decorator

**Decisión:** Opciones configurables via parámetros del decorator
```typescript
@ContentModeration({
  filterProfanity: true,
  maxLength: 500,
  logActivity: true
})
```
**Rationale:**
- Flexibilidad por método
- Fácil testing con diferentes configuraciones
- Autodocumentado en el código

## Risks / Trade-offs

### Performance Impact
**Risk:** Filtrado añade latencia a cada mensaje
**Mitigation:** 
- Usar Set para O(1) lookup de palabras prohibidas
- Lista pequeña de palabras (< 100 términos)
- Benchmark para validar impacto < 5ms

### False Positives
**Risk:** Palabras legítimas bloqueadas por contexto educativo
**Mitigation:**
- Lista curada específica para entorno educativo
- Logs detallados para identificar falsos positivos
- Configuración por método permite ajustes granulares

### Bypass de Moderación
**Risk:** Usuarios evaden filtros con caracteres especiales
**Mitigation:**
- Normalización básica de texto (espacios, mayúsculas)
- Scope limitado a palabras exactas (no patrones complejos)
- Monitoreo via logs para detectar patrones de evasión

### Maintenance Overhead
**Risk:** Lista de palabras prohibidas requiere mantenimiento
**Mitigation:**
- Lista inicial conservadora y bien documentada
- Logs facilitan identificación de términos faltantes
- Implementación permite fácil extensión futura

## Migration Plan

### Deployment Strategy
1. **Fase 1:** Implementar decorator sin aplicar (testing)
2. **Fase 2:** Aplicar a `MessagesService.create()` (REST API)
3. **Fase 3:** Aplicar a `MessagesGateway.handleMessage()` (WebSocket)
4. **Fase 4:** Monitorear logs y ajustar lista de palabras

### Rollback Strategy
- Remover decorators de métodos (cambio de 1 línea por método)
- Sin cambios en base de datos o APIs
- Rollback inmediato sin downtime

### Monitoring
- Logs de moderación con UniconnectLogger
- Métricas: mensajes filtrados vs total
- Alertas si tasa de filtrado > 5% (posible falso positivo)

## Open Questions

1. **Lista inicial de palabras prohibidas:** ¿Usar lista pública o crear específica para educación?
2. **Normalización de texto:** ¿Incluir caracteres especiales (l33t speak) o solo básica?
3. **Configuración por grupo:** ¿Diferentes niveles de moderación por tipo de grupo?
4. **Logs de auditoría:** ¿Almacenar en base de datos o solo archivos de log?

**Decisiones pendientes para implementación:**
- Definir lista exacta de palabras prohibidas
- Confirmar nivel de normalización de texto requerido