## Why

El módulo de Backend presenta 4 suites de tests que fallan con `SyntaxError: Cannot use import statement outside a module` debido a un conflicto de ESM (ECMAScript Modules) en Jest. Los paquetes `@nodable/entities` (ESM puro) y `@aws-sdk/*` requieren transformación explícita para ser procesados correctamente por Jest con ts-jest.

## What Changes

- **Configuración de Jest**: Actualizar `transformIgnorePatterns` en `Backend/package.json` para permitir la transformación de módulos ESM dentro de `.pnpm/`
- **Patrón de transformación**: Implementar regex que excluya explícitamente `@nodable` y `@aws-sdk` del ignore pattern
- **Cero cambios de código**: Esta es una configuración de infraestructura de testing - no modifica lógica de negocio ni dependencias

## Capabilities

### New Capabilities
<!-- No new capabilities - this is a build/test infrastructure fix -->

### Modified Capabilities
<!-- No requirement changes - this is a test configuration fix -->

## Impact

- **Archivos afectados**: `Backend/package.json` (sección `jest.transformIgnorePatterns`)
- **Tests impactados**: 4 suites del módulo Files (`multer-preservation.spec.ts`, `multer-types-preservation.spec.ts`, `files.service.spec.ts`, `files.controller.spec.ts`)
- **Dependencias**: Sin cambios en dependencias - solo configuración de transformación
- **Sistemas afectados**: Pipeline de tests unitarios del Backend
- **Riesgo**: Mínimo - cambio de configuración aislado, reversible, sin impacto en runtime
