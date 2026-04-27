## ADDED Requirements

### Requirement: RequireAll decorator sets permissions metadata
El decorador `RequireAll` SHALL establecer metadata con clave `PERMISSIONS_KEY` y valor `{ type: 'all', permissions: string[] }` en el método decorado.

#### Scenario: Sets correct metadata key
- **WHEN** `RequireAll('read:groups', 'write:groups')` se aplica a un método de DummyController
- **THEN** `Reflector.get(PERMISSIONS_KEY, method)` retorna `{ type: 'all', permissions: ['read:groups', 'write:groups'] }`

#### Scenario: Works with single permission
- **WHEN** `RequireAll('admin:only')` se aplica a un método
- **THEN** la metadata contiene exactamente `['admin:only']` en el array de permissions

#### Scenario: Works with empty permissions array
- **WHEN** `RequireAll()` se aplica sin argumentos
- **THEN** la metadata contiene un array vacío `[]`

### Requirement: RequireAny decorator sets permissions metadata
El decorador `RequireAny` SHALL establecer metadata con clave `PERMISSIONS_KEY` y valor `{ type: 'any', permissions: string[] }`.

#### Scenario: Sets type 'any' in metadata
- **WHEN** `RequireAny('read:groups', 'write:groups')` se aplica a un método
- **THEN** la metadata retorna `{ type: 'any', permissions: ['read:groups', 'write:groups'] }`

#### Scenario: Type 'any' differs from RequireAll type 'all'
- **WHEN** se compara metadata de `RequireAny` vs `RequireAll` con los mismos permisos
- **THEN** el campo `type` es `'any'` para RequireAny y `'all'` para RequireAll

### Requirement: AdminOnly decorator sets adminOnly metadata
El decorador `AdminOnly` SHALL establecer metadata con clave `ADMIN_ONLY_KEY` y valor `true`.

#### Scenario: Sets adminOnly flag to true
- **WHEN** `@AdminOnly()` se aplica a un método de DummyController
- **THEN** `Reflector.get(ADMIN_ONLY_KEY, method)` retorna `true`

#### Scenario: Does not affect other methods
- **WHEN** `@AdminOnly()` se aplica solo a un método de una clase con múltiples métodos
- **THEN** los otros métodos sin el decorador retornan `undefined` para `ADMIN_ONLY_KEY`

### Requirement: GetClaim decorator extracts JWT claim from request
El decorador `GetClaim` SHALL extraer el valor del claim especificado del objeto `user` en el request de Express.

#### Scenario: Extracts 'sub' claim
- **WHEN** el request tiene `user: { sub: 42, roleName: 'student' }` y se usa `@GetClaim('sub')`
- **THEN** el valor extraído es `42`

#### Scenario: Extracts 'roleName' claim
- **WHEN** el request tiene `user: { sub: 1, roleName: 'admin' }` y se usa `@GetClaim('roleName')`
- **THEN** el valor extraído es `'admin'`

#### Scenario: Returns undefined for missing claim
- **WHEN** el request tiene `user: { sub: 1 }` y se usa `@GetClaim('nonExistentClaim')`
- **THEN** el valor extraído es `undefined`

#### Scenario: Returns undefined when user is not set
- **WHEN** el request no tiene propiedad `user` y se usa `@GetClaim('sub')`
- **THEN** el valor extraído es `undefined` sin lanzar excepción
