## ADDED Requirements

### Requirement: Jest debe transformar módulos ESM de dependencias

El sistema de testing SHALL transformar correctamente módulos ECMAScript (ESM) dentro de `node_modules/.pnpm/` para permitir la ejecución de tests con Jest y ts-jest.

#### Scenario: Transformación de @nodable/entities (ESM puro)
- **WHEN** Jest ejecuta tests que importan `@nodable/entities`
- **THEN** ts-jest transforma el módulo ESM a CommonJS sin errores de sintaxis

#### Scenario: Transformación de @aws-sdk/* (módulos híbridos)
- **WHEN** Jest ejecuta tests que importan paquetes `@aws-sdk/*`
- **THEN** ts-jest transforma los módulos correctamente sin errores de import/export

#### Scenario: Tests del módulo Files ejecutan sin SyntaxError
- **WHEN** se ejecuta `npm test` en el Backend
- **THEN** las 4 suites (`multer-preservation`, `multer-types-preservation`, `files.service`, `files.controller`) pasan de FAIL a PASS

### Requirement: Configuración de transformIgnorePatterns en package.json

El sistema SHALL configurar `transformIgnorePatterns` en `Backend/package.json` para excluir explícitamente `.pnpm/`, `@nodable/`, y `@aws-sdk/` del patrón de ignore de Jest.

#### Scenario: Patrón permite transformación de .pnpm
- **WHEN** Jest encuentra un módulo dentro de `node_modules/.pnpm/`
- **THEN** el módulo es transformado por ts-jest en lugar de ser ignorado

#### Scenario: Patrón es específico para scopes problemáticos
- **WHEN** el patrón de regex es evaluado
- **THEN** coincide con `.pnpm/`, `@nodable/`, y `@aws-sdk/` explícitamente

#### Scenario: Tests existentes preservan comportamiento
- **WHEN** se ejecuta la suite completa de 316 tests
- **THEN** todos los tests continúan pasando sin regresiones

### Requirement: Compatibilidad con pnpm y estructura de enlaces simbólicos

El sistema SHALL mantener compatibilidad con la estructura de `node_modules` de pnpm, incluyendo enlaces simbólicos y carpetas anidadas dentro de `.pnpm/`.

#### Scenario: Estructura pnpm es respetada
- **WHEN** Jest resuelve imports de paquetes en `.pnpm/@scope+package@version/`
- **THEN** los paths se resuelven correctamente a través de enlaces simbólicos

#### Scenario: No hay impacto en runtime
- **WHEN** la aplicación se ejecuta en producción
- **THEN** la configuración de `transformIgnorePatterns` no afecta el comportamiento (solo aplica a Jest)
