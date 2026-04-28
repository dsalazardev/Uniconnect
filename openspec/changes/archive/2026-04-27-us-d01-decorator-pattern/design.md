# Design: US-D01 - Decorator Pattern para Mensajes del Chat Grupal

## Context

**Estado actual**: El sistema de mensajería implementa el patrón Observer (US-O02) con Clean Architecture en `src/messages/`. El método `MessagesService.applyDecorators()` es un placeholder que solo agrega metadata. Los mensajes se persisten con campos básicos (`text_content`, `attachments` como string genérico).

**Problema**: Necesitamos agregar capacidades modulares (archivos, menciones, reacciones) sin modificar la clase base del mensaje ni romper el flujo Observer existente.

**Arquitectura existente**:
```
src/messages/
├── domain/observer/          # Patrón Observer (US-O02)
├── application/              # MessagesService (coordinador)
├── infrastructure/           # ChatGateway, Observers
└── dto/                      # MessageDto
```

**Stakeholders**: Frontend (React Native) consumirá el `rendered_content` como JSON para renderizar componentes nativos.

## Goals / Non-Goals

**Goals:**
- Implementar patrón Decorator puro en Domain Layer sin dependencias de NestJS
- Soportar composición de decoradores (archivo + menciones + reacciones simultáneos)
- Generar `rendered_content` como JSON estructurado para consumo del frontend
- Mantener compatibilidad con patrón Observer existente
- Tipado estricto TypeScript (Zero-Any)

**Non-Goals:**
- No modificar el flujo Observer (US-O02)
- No implementar renderizado HTML (React Native no lo soporta nativamente)
- No migrar mensajes existentes (campo `rendered_content` será NULL para mensajes legacy)
- No implementar decoradores adicionales más allá de archivo/menciones/reacciones

## Decisions

### Decision 1: Estructura del Domain Layer

**Opción elegida**: Crear `src/messages/domain/decorator/` como hermano de `domain/observer/`

**Alternativas consideradas**:
- Opción A: Colocar decoradores en `application/decorators/` → ❌ Mezcla lógica de dominio con aplicación
- Opción B: Crear módulo separado `src/message-decorators/` → ❌ Rompe cohesión del módulo messages

**Rationale**: El patrón Decorator es lógica de dominio pura. Mantenerlo en `domain/` preserva la separación de capas de Clean Architecture.

### Decision 2: Formato del método `render()`

**Opción elegida**: `render(): string` retorna JSON serializado con estructura enriquecida

**Alternativas consideradas**:
- Opción A: Retornar string Markdown → ❌ Frontend debe parsear manualmente
- Opción B: Retornar HTML → ❌ React Native no soporta HTML nativo, riesgo de XSS
- Opción C: Retornar objeto TypeScript → ❌ No se puede persistir directamente en BD

**Rationale**: JSON es idiomático para APIs REST, fácil de parsear en frontend, y se persiste como TEXT en PostgreSQL.

**Estructura del JSON renderizado**:
```typescript
interface RenderedMessage {
  text: string;
  mentions?: { userId: number; displayName: string; position: number }[];
  files?: { url: string; name: string; mimeType: string; size: number }[];
  reactions?: { emoji: string; count: number; users: number[] }[];
}
```

### Decision 3: Extensión del MessageDto

**Opción elegida**: Agregar campos opcionales al `MessageDto` existente

**Alternativas consideradas**:
- Opción A: Crear `EnrichedMessageDto` separado → ❌ Duplicación, complejidad en mapeo
- Opción B: Usar campo genérico `metadata: Record<string, any>` → ❌ Pierde tipado estricto

**Rationale**: Campos opcionales mantienen retrocompatibilidad y permiten validación con `class-validator`.

**Campos agregados**:
```typescript
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
mentions?: MentionDto[];

@IsOptional()
@IsArray()
@ValidateNested({ each: true })
files?: FileAttachmentDto[];

@IsOptional()
@IsArray()
@ValidateNested({ each: true })
reactions?: ReactionDto[];

@IsOptional()
@IsString()
rendered_content?: string; // JSON serializado
```

### Decision 4: Persistencia del `rendered_content`

**Opción elegida**: Guardar `rendered_content` en BD como columna TEXT

**Alternativas consideradas**:
- Opción A: Regenerar on-the-fly al consultar → ❌ Recomputación costosa, no preserva historial
- Opción B: Guardar en tabla separada `message_metadata` → ❌ Complejidad innecesaria

**Rationale**: Guardar en BD garantiza inmutabilidad del historial y evita recomputación. PostgreSQL maneja TEXT eficientemente.

### Decision 5: Integración con Observer Pattern

**Opción elegida**: Aplicar decoradores ANTES de `chatSubject.notify()`

**Flujo**:
```
sendMessage(dto)
  → applyDecorators(dto)           [instancia Decorator, genera rendered_content]
  → enrichMessageWithRoomInfo(dto) [agrega chat_type, room_id]
  → attachObserverForChatType()    [ata observer]
  → persistMessage(dto)            [guarda dto + rendered_content]
  → chatSubject.notify(dto)        [emite dto enriquecido]
```

**Rationale**: El Observer emite el mensaje ya decorado y persistido, garantizando consistencia entre BD y WebSocket.

### Decision 6: Composición de Decoradores

**Opción elegida**: Aplicar decoradores en orden fijo: Archivo → Menciones → Reacciones

**Implementación en `applyDecorators()`**:
```typescript
let mensaje: IMensaje = new MensajeBase(dto);

if (dto.files?.length) {
  mensaje = new MensajeConArchivo(mensaje, dto.files);
}
if (dto.mentions?.length) {
  mensaje = new MensajeConMencion(mensaje, dto.mentions);
}
if (dto.reactions?.length) {
  mensaje = new MensajeConReaccion(mensaje, dto.reactions);
}

const rendered = mensaje.render();
return { ...dto, rendered_content: rendered };
```

**Rationale**: Orden fijo simplifica testing y debugging. Los decoradores son conmutativos (el orden no afecta el resultado final del JSON).

## Risks / Trade-offs

### Risk 1: Tamaño del campo `rendered_content`
**Riesgo**: Mensajes con muchos archivos/menciones generan JSON grande (>10KB)  
**Mitigación**: PostgreSQL TEXT soporta hasta 1GB. Monitorear tamaño promedio en producción. Considerar compresión si excede 50KB.

### Risk 2: Mensajes legacy sin `rendered_content`
**Riesgo**: Mensajes existentes tendrán `rendered_content = NULL`  
**Mitigación**: Frontend debe manejar NULL renderizando solo `text_content`. No migrar mensajes legacy (costo/beneficio bajo).

### Risk 3: Cambios en estructura del JSON renderizado
**Riesgo**: Si cambiamos la estructura de `RenderedMessage`, mensajes antiguos quedan inconsistentes  
**Mitigación**: Versionar el JSON (`{ version: 1, ...data }`). Frontend maneja múltiples versiones.

### Risk 4: Performance de `render()` en mensajes complejos
**Riesgo**: Decoradores anidados pueden ser lentos con 100+ menciones  
**Mitigación**: Benchmarking en tests. Límite de 50 menciones por mensaje validado en DTO.

### Trade-off 1: Duplicación de datos
**Trade-off**: `files` se duplican en tabla `file` (relación) y en `rendered_content` (JSON)  
**Justificación**: Inmutabilidad del historial. La tabla `file` es fuente de verdad, `rendered_content` es snapshot.

### Trade-off 2: Tipado del JSON renderizado
**Trade-off**: `rendered_content` es string en BD, pierde tipado TypeScript  
**Justificación**: Crear interface `RenderedMessage` en `types/` para parseo en frontend. Backend valida estructura antes de serializar.

## Migration Plan

### Phase 1: Schema Migration
1. Agregar columna `rendered_content TEXT NULL` a tabla `message`
2. Ejecutar `npx prisma migrate dev --name add_rendered_content`
3. Verificar migración en staging

### Phase 2: Backend Implementation
1. Crear `domain/decorator/` con interfaces y clases
2. Extender `MessageDto` con nuevos campos
3. Actualizar `MessagesService.applyDecorators()`
4. Tests unitarios (decoradores + composición)

### Phase 3: Integration Testing
1. Tests de integración con `MessagesService.sendMessage()`
2. Validar que Observer emite DTO con `rendered_content`
3. Verificar persistencia en BD

### Phase 4: Frontend Integration
1. Frontend parsea `rendered_content` JSON
2. Renderiza componentes nativos (menciones, archivos, reacciones)
3. Maneja NULL para mensajes legacy

### Rollback Strategy
- Si falla migración: Revertir con `npx prisma migrate resolve --rolled-back <migration_name>`
- Si falla backend: Feature flag `ENABLE_MESSAGE_DECORATORS=false` desactiva `applyDecorators()`
- Columna `rendered_content` puede quedar NULL sin romper funcionalidad existente

## Open Questions

1. **¿Límite de archivos por mensaje?** → Propuesta: 5 archivos máximo (validar en DTO)
2. **¿Límite de menciones por mensaje?** → Propuesta: 50 menciones máximo (validar en DTO)
3. **¿Formato de `position` en menciones?** → Propuesta: Índice de caracteres en `text_content` (0-based)
4. **¿Cómo manejar menciones a usuarios eliminados?** → Propuesta: Frontend muestra "Usuario desconocido" si userId no existe
