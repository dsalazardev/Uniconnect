# Bugfix Requirements Document

## Introduction

Este documento define los requisitos para corregir el error "Usuario no encontrado" que ocurre al intentar crear eventos mediante `POST /events`. El problema surge por un desajuste de tipos: el ID del usuario extraído del token JWT llega como `string`, pero Prisma espera un `Int` para la clave primaria `id_user` en las consultas de base de datos.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN se realiza una petición `POST /events` con un token JWT válido THEN el sistema responde con error 404 "Usuario no encontrado"

1.2 WHEN el controlador extrae el ID del usuario del token JWT THEN el valor se mantiene como `string` sin conversión a número

1.3 WHEN el servicio ejecuta `prisma.user.findUnique` con el ID como `string` THEN la consulta falla porque Prisma espera un `Int`

### Expected Behavior (Correct)

2.1 WHEN se realiza una petición `POST /events` con un token JWT válido THEN el sistema SHALL crear el evento exitosamente y retornar código 201

2.2 WHEN el controlador extrae el ID del usuario del token JWT THEN el sistema SHALL convertir el valor a número entero antes de pasarlo al servicio

2.3 WHEN el servicio ejecuta `prisma.user.findUnique` con el ID convertido THEN la consulta SHALL encontrar al usuario correctamente

### Unchanged Behavior (Regression Prevention)

3.1 WHEN se realizan otras operaciones que no involucran creación de eventos THEN el sistema SHALL CONTINUE TO funcionar normalmente

3.2 WHEN se utilizan tokens JWT en otros endpoints THEN el sistema SHALL CONTINUE TO procesar la autenticación correctamente

3.3 WHEN se crean eventos con usuarios válidos después de la corrección THEN el sistema SHALL CONTINUE TO mantener la integridad referencial en la base de datos