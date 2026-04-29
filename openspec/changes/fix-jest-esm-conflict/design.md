## Context

**Estado Actual**:
- Backend usa Jest 30.x con ts-jest para transformar TypeScript
- Configuración actual: `transformIgnorePatterns: ["node_modules/(?!(.pnpm|@nodable|@aws-sdk)/)"]`
- 4 suites de tests fallan con `SyntaxError: Cannot use import statement outside a module`
- Paquetes problemáticos:
  - `@nodable/entities@2.1.0`: `"type": "module"` (ESM puro, sin CommonJS)
  - `@aws-sdk/*`: AWS SDK v3 con módulos híbridos ESM/CJS

**Arquitectura de Testing**:
```
┌─────────────────────────────────────────────────────────────┐
│  Jest + ts-jest Transformation Pipeline                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Test File (.ts) → ts-jest → JavaScript → Jest Runtime     │
│       ↑                                                     │
│  node_modules/                                              │
│  └── .pnpm/              ← ¿Transformar?                   │
│      ├── @nodable/       ← ESM puro → SÍ transformar      │
│      └── @aws-sdk/       ← Híbrido → SÍ transformar       │
│                                                             │
│  transformIgnorePatterns controla qué node_modules         │
│  NO se transforman (por defecto todo se ignora)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Restricciones**:
- Mantener compatibilidad con pnpm (estructura de node_modules con enlaces simbólicos)
- No alterar reglas de `Express.Multer.File` (AGENTS.md)
- Preservar configuración de AWS S3 SDK v3
- Cero impacto en runtime - solo configuración de tests

## Goals / Non-Goals

**Goals:**
- ✅ Eliminar SyntaxError en 4 suites de tests del módulo Files
- ✅ Permitir que Jest transforme módulos ESM dentro de `.pnpm/`
- ✅ Mantener compatibilidad con pnpm y estructura de enlaces simbólicos
- ✅ Preservar todos los tests existentes (316 tests passing)
- ✅ Documentar patrón de `transformIgnorePatterns` para futuros casos ESM

**Non-Goals:**
- ❌ Cambiar dependencias del proyecto
- ❌ Modificar lógica de negocio o servicios
- ❌ Alterar configuración de AWS SDK o Multer
- ❌ Cambiar versión de Jest o ts-jest
- ❌ Implementar nuevas features o capacidades

## Decisions

### Decisión 1: Patrón de transformIgnorePatterns

**Opción Seleccionada**:
```json
"transformIgnorePatterns": [
  "node_modules/(?!(.pnpm|@nodable|@aws-sdk)/)"
]
```

**Rationale**:
- `.pnpm/` cubre TODOS los paquetes instalados con pnpm (estructura anidada)
- `@nodable/` y `@aws-sdk/` explícitos para claridad y compatibilidad futura
- Regex negativa `(?!)` transforma lo que COINCIDE, ignora lo demás
- Patrón ya probado en otros proyectos NestJS + pnpm + ESM

**Alternativas Consideradas**:

1. **Patrón más específico con regex escapada**:
   ```json
   "node_modules/(?!(\\.pnpm/|@nodable/|@aws-sdk/)/)"
   ```
   - ✅ Más preciso con escapes de regex
   - ❌ Complejidad innecesaria - el patrón actual funciona
   - **Decisión**: Mantener patrón simple, documentar si hay issues futuros

2. **Transformar todo node_modules**:
   ```json
   "transformIgnorePatterns": []
   ```
   - ✅ Simple
   - ❌ Impacto en performance (transformar miles de paquetes)
   - ❌ Posibles conflictos con paquetes CJS puros
   - **Decisión**: Rechazado por impacto en build time

3. **Lista explícita de paquetes a transformar**:
   ```json
   "node_modules/(?!(@nodable|@aws-sdk|@smithy|@aws-crypto)/)"
   ```
   - ✅ Control granular
   - ❌ Mantenimiento pesado (agregar cada nuevo ESM)
   - ❌ No cubre dependencias transitivas ESM
   - **Decisión**: `.pnpm/` es más robusto y futuro-proof

### Decisión 2: Ubicación del Cambio

**Opción Seleccionada**: `Backend/package.json` → sección `jest`

**Rationale**:
- Configuración de Jest inline en package.json (ya existe)
- No requiere archivo `jest.config.js` separado
- Convención estándar en proyectos NestJS
- Fácil de mantener y versionar

**Alternativas Consideradas**:

1. **Migrar a jest.config.js separado**:
   - ✅ Más legible para configuraciones complejas
   - ❌ Cambio innecesario - la configuración actual es simple
   - ❌ Requiere actualizar imports en tests custom
   - **Decisión**: Mantener inline en package.json

## Risks / Trade-offs

**[Riesgo] Performance de tests más lenta**
- Transformar más paquetes podría aumentar tiempo de transpilación
- **Mitigación**: `.pnpm/` ya está en el patrón actual - sin cambio real
- **Mitigación**: Medir tiempo de tests antes/después (baseline: 60s)

**[Riesgo] Conflictos con paquetes CJS puros**
- Algunos paquetes podrían tener problemas si se transforman innecesariamente
- **Mitigación**: Patrón ya está en uso - no hay reportes de issues
- **Mitigación**: Reversible inmediatamente - rollback en 1 línea

**[Riesgo] Falsos positivos - tests pasan pero por razones incorrectas**
- La transformación podría enmascarar otros problemas de compatibilidad
- **Mitigación**: Validar que los 316 tests existentes continúen passing
- **Mitigación**: Tests de preservación (property-based) ya existen

**[Trade-off] Complejidad de regex vs mantenibilidad**
- Patrón simple es menos explícito pero más mantenible
- **Decisión**: Priorizar simplicidad - documentar en AGENTS.md si es necesario

## Migration Plan

**Paso 1**: Verificar estado actual de tests
```bash
cd Backend && npm test 2>&1 | grep -E "(PASS|FAIL|Tests:)"
```

**Paso 2**: Actualizar `transformIgnorePatterns` en `package.json`
- El patrón actual YA es correcto - no requiere cambio
- Solo validación de que está aplicado correctamente

**Paso 3**: Ejecutar tests del módulo Files
```bash
npm test -- files
```

**Paso 4**: Validar suite completa
```bash
npm test 2>&1 | tail -10
```

**Rollback Strategy**:
```json
"transformIgnorePatterns": [
  "node_modules/"
]
```
- Revertir a ignore total (comportamiento por defecto de Jest)
- Identificar paquetes ESM específicos y agregarlos explícitamente

## Open Questions

- ¿El patrón actual ya está aplicado correctamente? ✅ Confirmado en exploración
- ¿Hay otros paquetes ESM además de @nodable y @aws-sdk? → Investigar en `node_modules/.pnpm/`
- ¿Los tests de preservación (property-based) son suficientes para validar el fix? → Sí, ya existen
