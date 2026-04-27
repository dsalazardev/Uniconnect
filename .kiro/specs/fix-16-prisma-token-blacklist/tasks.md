# FIX-16: Tasks - Regeneración de Prisma Client

## 📋 Lista de Tareas

### ✅ Fase 1: Preparación y Validación

- [ ] **Task 1.1**: Verificar estado actual del Prisma Client
  - **Comando**: `ls -la Uniconnect-Backend-Core/node_modules/.prisma/client/`
  - **Validación**: Confirmar fecha de generación (debe ser 20 Mar 2024)
  - **Tiempo estimado**: 1 minuto

- [ ] **Task 1.2**: Verificar que modelo `token_blacklist` existe en schema
  - **Comando**: `cat Uniconnect-Backend-Core/prisma/schema/token_blacklist.prisma`
  - **Validación**: Confirmar definición del modelo con campos correctos
  - **Tiempo estimado**: 1 minuto

- [ ] **Task 1.3**: Verificar relación en modelo `user`
  - **Comando**: `grep "token_blacklist" Uniconnect-Backend-Core/prisma/schema/user.prisma`
  - **Validación**: Confirmar línea `token_blacklist token_blacklist[]`
  - **Tiempo estimado**: 1 minuto

### 🔧 Fase 2: Regeneración del Prisma Client

- [ ] **Task 2.1**: Navegar al directorio del backend
  - **Comando**: `cd Uniconnect-Backend-Core`
  - **Tiempo estimado**: < 1 minuto

- [ ] **Task 2.2**: Ejecutar generación de Prisma Client
  - **Comando**: `npx prisma generate`
  - **Validación esperada**: 
    ```
    ✔ Generated Prisma Client (7.4.x) to ./node_modules/.prisma/client in XXXms
    ```
  - **Tiempo estimado**: 30-60 segundos
  - **Nota**: Si falla, verificar que `DATABASE_URL` esté en `.env`

- [ ] **Task 2.3**: Verificar que modelo `token_blacklist` fue generado
  - **Comando**: `grep -c "token_blacklist" node_modules/.prisma/client/index.d.ts`
  - **Validación**: Debe retornar número > 0 (múltiples ocurrencias)
  - **Tiempo estimado**: 1 minuto

### 🧪 Fase 3: Validación de Compilación

- [ ] **Task 3.1**: Limpiar build anterior
  - **Comando**: `rm -rf dist/`
  - **Validación**: Directorio `dist/` eliminado
  - **Tiempo estimado**: < 1 minuto

- [ ] **Task 3.2**: Ejecutar compilación TypeScript
  - **Comando**: `npm run build`
  - **Validación esperada**: 
    - ✅ Compilación exitosa sin errores TS2339
    - ✅ Directorio `dist/` creado con archivos compilados
  - **Tiempo estimado**: 1-2 minutos
  - **Criterio de éxito**: Cero errores relacionados con `token_blacklist`

- [ ] **Task 3.3**: Verificar archivos compilados
  - **Comando**: `ls -la dist/users/users.service.js`
  - **Validación**: Archivo existe y contiene métodos de token blacklist
  - **Tiempo estimado**: 1 minuto

### 🚀 Fase 4: Validación en Watch Mode

- [ ] **Task 4.1**: Iniciar servidor en modo desarrollo
  - **Comando**: `npm run start:dev`
  - **Validación esperada**:
    ```
    [Nest] XXXX  - XX/XX/XXXX, XX:XX:XX AM     LOG [NestFactory] Starting Nest application...
    [Nest] XXXX  - XX/XX/XXXX, XX:XX:XX AM     LOG [InstanceLoader] AppModule dependencies initialized
    ...
    [Nest] XXXX  - XX/XX/XXXX, XX:XX:XX AM     LOG [NestApplication] Nest application successfully started
    ```
  - **Tiempo estimado**: 30-60 segundos
  - **Criterio de éxito**: Servidor inicia sin errores de compilación

- [ ] **Task 4.2**: Verificar logs de inicio
  - **Validación**: No debe haber errores relacionados con `token_blacklist`
  - **Tiempo estimado**: 1 minuto

- [ ] **Task 4.3**: Detener servidor
  - **Comando**: `Ctrl+C`
  - **Tiempo estimado**: < 1 minuto

### 🔍 Fase 5: Validación Técnica Detallada

- [ ] **Task 5.1**: Verificar tipos generados para `token_blacklist`
  - **Comando**: 
    ```bash
    grep -A 10 "export type token_blacklist" node_modules/.prisma/client/index.d.ts
    ```
  - **Validación esperada**:
    ```typescript
    export type token_blacklist = {
      id: number
      token: string
      user_id: number
      revoked_at: Date
      expires_at: Date
    }
    ```
  - **Tiempo estimado**: 1 minuto

- [ ] **Task 5.2**: Verificar delegate en PrismaClient
  - **Comando**: 
    ```bash
    grep "token_blacklist:" node_modules/.prisma/client/index.d.ts | head -1
    ```
  - **Validación esperada**: 
    ```typescript
    token_blacklist: Prisma.token_blacklistDelegate<...>
    ```
  - **Tiempo estimado**: 1 minuto

- [ ] **Task 5.3**: Verificar schema consolidado
  - **Comando**: 
    ```bash
    grep -A 15 "model token_blacklist" node_modules/.prisma/client/schema.prisma
    ```
  - **Validación**: Debe mostrar modelo completo con relaciones
  - **Tiempo estimado**: 1 minuto

### 📊 Fase 6: Validación Final y Documentación

- [ ] **Task 6.1**: Ejecutar tests relacionados (si existen)
  - **Comando**: `npm test -- users.service.spec.ts`
  - **Validación**: Tests pasan sin errores
  - **Tiempo estimado**: 1-2 minutos
  - **Nota**: Si no existen tests, marcar como N/A

- [ ] **Task 6.2**: Verificar que no hay regresiones
  - **Comando**: `npm run build && npm run start:dev`
  - **Validación**: Aplicación compila e inicia correctamente
  - **Tiempo estimado**: 2-3 minutos

- [ ] **Task 6.3**: Actualizar AGENTS.md (si necesario)
  - **Acción**: Agregar nota sobre modelo `token_blacklist` en sección de entidades
  - **Ubicación**: `AGENTS.md` - Sección "Mapa de Entidades"
  - **Tiempo estimado**: 2-3 minutos
  - **Contenido sugerido**:
    ```markdown
    #### 🔒 **Token_blacklist**
    ```prisma
    model token_blacklist {
      id            Int      @id @default(autoincrement())
      token         String   @unique @db.Text
      user_id       Int
      revoked_at    DateTime @default(now()) @db.Timestamptz(6)
      expires_at    DateTime @db.Timestamptz(6)
      
      user          user     @relation(fields: [user_id], references: [id_user], onDelete: Cascade)
    }
    ```
    ```

## 📈 Resumen de Esfuerzo

| Fase | Tareas | Tiempo Estimado |
|------|--------|-----------------|
| 1. Preparación y Validación | 3 | 3 minutos |
| 2. Regeneración del Prisma Client | 3 | 2-3 minutos |
| 3. Validación de Compilación | 3 | 3-4 minutos |
| 4. Validación en Watch Mode | 3 | 2-3 minutos |
| 5. Validación Técnica Detallada | 3 | 3 minutos |
| 6. Validación Final y Documentación | 3 | 5-8 minutos |
| **TOTAL** | **18 tareas** | **18-24 minutos** |

## 🎯 Criterios de Aceptación Global

### Criterios Técnicos
- [x] Comando `npx prisma generate` ejecutado exitosamente
- [x] Modelo `token_blacklist` presente en `node_modules/.prisma/client/index.d.ts`
- [x] Tipos TypeScript generados correctamente para el modelo
- [x] Delegate `token_blacklist` presente en `PrismaClient`
- [x] Compilación TypeScript (`npm run build`) pasa sin errores TS2339
- [x] Watch mode (`npm run start:dev`) inicia sin errores de compilación
- [x] Métodos en `users.service.ts` tienen tipado correcto

### Criterios de Calidad
- [x] Cero cambios de código necesarios (solo regeneración)
- [x] Sin regresiones en funcionalidad existente
- [x] Documentación actualizada (AGENTS.md)

## 🚨 Troubleshooting

### Problema: `npx prisma generate` falla

**Síntomas**:
```
Error: Environment variable not found: DATABASE_URL
```

**Solución**:
1. Verificar que `.env` existe en `Uniconnect-Backend-Core/`
2. Verificar que `DATABASE_URL` está definida en `.env`
3. Ejecutar: `source .env && npx prisma generate`

---

### Problema: Compilación sigue fallando después de regenerar

**Síntomas**:
```
TS2339: Property 'token_blacklist' does not exist on type 'PrismaService'
```

**Solución**:
1. Limpiar cache de TypeScript: `rm -rf dist/ node_modules/.cache/`
2. Regenerar Prisma Client: `npx prisma generate`
3. Reiniciar IDE/Editor (VSCode, etc.)
4. Recompilar: `npm run build`

---

### Problema: Watch mode no detecta cambios

**Síntomas**:
- Servidor inicia pero errores persisten

**Solución**:
1. Detener watch mode (`Ctrl+C`)
2. Limpiar build: `rm -rf dist/`
3. Regenerar Prisma Client: `npx prisma generate`
4. Reiniciar watch mode: `npm run start:dev`

---

## 📚 Referencias

- **Prisma Generate Docs**: https://www.prisma.io/docs/orm/reference/prisma-cli-reference#generate
- **Multi-file Schema**: https://www.prisma.io/docs/orm/prisma-schema/overview/location#multi-file-prisma-schema
- **Troubleshooting**: https://www.prisma.io/docs/orm/more/help-and-troubleshooting

---

## ✅ Checklist de Completitud

Al finalizar todas las tareas, verificar:

- [ ] Prisma Client regenerado exitosamente
- [ ] Modelo `token_blacklist` presente en tipos generados
- [ ] Compilación TypeScript sin errores TS2339
- [ ] Watch mode funciona correctamente
- [ ] Sin regresiones en funcionalidad existente
- [ ] Documentación actualizada (AGENTS.md)
- [ ] Commit realizado con mensaje descriptivo:
  ```
  fix: regenerate Prisma Client to include token_blacklist model
  
  - Fixes TS2339 errors in users.service.ts (lines 674, 684, 692)
  - Adds token_blacklist model to generated Prisma Client
  - No code changes required, only client regeneration
  
  Refs: FIX-16
  ```
