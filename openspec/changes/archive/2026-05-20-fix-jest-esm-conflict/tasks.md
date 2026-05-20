## 1. Verificación del Estado Actual

- [ ] 1.1 Leer configuración actual de Jest en `Backend/package.json`
- [ ] 1.2 Identificar el valor actual de `transformIgnorePatterns`
- [ ] 1.3 Verificar que 4 suites de tests del módulo Files están fallando (si aplica)

## 2. Implementación del Fix

- [ ] 2.1 Actualizar `transformIgnorePatterns` con el patrón `node_modules/(?!(.pnpm|@nodable|@aws-sdk)/)`
- [ ] 2.2 Validar sintaxis JSON del package.json después del cambio
- [ ] 2.3 Preservar resto de configuración de Jest sin modificaciones

## 3. Validación de Tests

- [ ] 3.1 Ejecutar tests del módulo Files: `npm test -- files`
- [ ] 3.2 Verificar que `multer-preservation.spec.ts` pasa (PASS)
- [ ] 3.3 Verificar que `multer-types-preservation.spec.ts` pasa (PASS)
- [ ] 3.4 Verificar que `files.service.spec.ts` pasa (PASS)
- [ ] 3.5 Verificar que `files.controller.spec.ts` pasa (PASS)

## 4. Validación de Suite Completa

- [ ] 4.1 Ejecutar suite completa: `npm test`
- [ ] 4.2 Verificar que los 316 tests continúan pasando
- [ ] 4.3 Verificar que no hay regresiones en otros módulos
- [ ] 4.4 Documentar tiempo de ejecución (baseline: ~60 segundos)

## 5. Documentación y Cierre

- [ ] 5.1 Actualizar AGENTS.md si el patrón difiere de lo documentado
- [ ] 5.2 Marcar change como completado en OpenSpec
- [ ] 5.3 Crear commit con mensaje descriptivo del fix
