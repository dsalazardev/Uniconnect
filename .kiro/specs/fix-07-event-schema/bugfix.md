# Bugfix Requirements Document

## Introduction

El sistema actualmente presenta una inconsistencia arquitectónica en el esquema de base de datos donde la tabla `event` utiliza UUID como clave primaria (`id String @default(uuid())`), mientras que todas las demás tablas del sistema utilizan enteros auto-incrementables (como `id_user`, `id_group`, etc.). Esta inconsistencia causa problemas de estandarización en el esquema y dificulta el mantenimiento y la coherencia del sistema.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN se define la tabla `event` THEN el sistema utiliza `id String @default(uuid())` como clave primaria
1.2 WHEN se relaciona la tabla `event` con otras tablas THEN el sistema mantiene inconsistencia de tipos entre claves primarias (String vs Int)
1.3 WHEN se desarrollan controladores y servicios para eventos THEN el sistema espera y retorna `id` como `string` en lugar de seguir el patrón estándar
1.4 WHEN se desarrollan interfaces frontend para eventos THEN el sistema consume `id` como `string` rompiendo la consistencia con otras entidades

### Expected Behavior (Correct)

2.1 WHEN se define la tabla `event` THEN el sistema SHALL utilizar `id_event Int @id @default(autoincrement())` como clave primaria
2.2 WHEN se relaciona la tabla `event` con otras tablas THEN el sistema SHALL mantener consistencia de tipos usando enteros auto-incrementables
2.3 WHEN se desarrollan controladores y servicios para eventos THEN el sistema SHALL esperar y retornar `id_event` como `number` siguiendo el patrón estándar
2.4 WHEN se desarrollan interfaces frontend para eventos THEN el sistema SHALL consumir `id_event` como `number` manteniendo consistencia con otras entidades

### Unchanged Behavior (Regression Prevention)

3.1 WHEN se accede a otras tablas del sistema (user, group, program, etc.) THEN el sistema SHALL CONTINUE TO utilizar sus claves primarias enteras existentes
3.2 WHEN se ejecutan operaciones CRUD en entidades no relacionadas con eventos THEN el sistema SHALL CONTINUE TO funcionar sin cambios
3.3 WHEN se utilizan relaciones existentes entre tablas no afectadas THEN el sistema SHALL CONTINUE TO mantener la integridad referencial
3.4 WHEN se ejecutan migraciones de base de datos THEN el sistema SHALL CONTINUE TO preservar los datos de todas las tablas excepto `event` (pérdida autorizada)