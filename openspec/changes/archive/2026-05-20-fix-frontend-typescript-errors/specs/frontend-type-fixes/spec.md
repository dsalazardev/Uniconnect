## ADDED Requirements

### Requirement: Production build SHALL pass type checking

The TypeScript compiler (`tsc -b`) SHALL compile all source files without errors when run as part of `npm run build`.

#### Scenario: Full build passes
- **WHEN** `npm run build` is executed from `Frontend/Frontend-web/`
- **THEN** the process SHALL exit with code 0
- **AND** `dist/` SHALL contain compiled assets

### Requirement: Component types SHALL match hook return types

Components SHALL destructure hook return values using the correct property names as defined by the hook's return type.

#### Scenario: usePrograms destructuring
- **WHEN** `ProgramList` component calls `usePrograms()`
- **THEN** it SHALL access `data`, `isLoading`, `error` properties
- **AND** it SHALL NOT access non-existent properties like `programs` or `loading`

### Requirement: Mutation functions SHALL accept typed arguments

`useMutation` hooks SHALL have explicitly typed `mutationFn` parameters so that the returned `mutate` function accepts the correct argument type.

#### Scenario: sendConnectionRequest
- **WHEN** `sendConnectionRequest({ addressee_id })` is called
- **THEN** the argument SHALL type-check correctly
- **AND** runtime behavior SHALL be unchanged

### Requirement: API response types SHALL match schema structure

Components SHALL access API response fields using the correct path as defined by the Zod schema.

#### Scenario: Resource decorator fields
- **WHEN** rendering a `Resource` from the API
- **THEN** `url_externa` SHALL be accessed as `r.decoradores.url_externa`
- **AND** `titulo` SHALL be accessed as `r.decoradores.titulo` or `r.titulo` (whichever the schema defines)
