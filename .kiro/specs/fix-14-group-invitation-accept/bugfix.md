# Bugfix Requirements Document

## Introduction

Este documento describe el bug en el proceso de aceptación de invitaciones de grupo desde el frontend React Native. Cuando un usuario intenta aceptar una invitación de grupo, la petición HTTP falla con un error 400 (Bad Request), impidiendo que el usuario se una al grupo a pesar de que el backend está funcionando correctamente según las pruebas realizadas.

El error se manifiesta como un AxiosError con código de estado 400, lo que indica que el servidor está rechazando la petición debido a datos inválidos o mal formateados en el payload. Este bug afecta la experiencia del usuario al impedir la funcionalidad básica de unirse a grupos mediante invitaciones.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN un usuario autenticado intenta aceptar una invitación de grupo desde el frontend React Native THEN la petición HTTP PATCH falla con error 400 (Bad Request)

1.2 WHEN el error 400 ocurre THEN el mensaje de error mostrado es "Error al responder invitación: [AxiosError: Request failed with status code 400]" sin detalles adicionales sobre la causa

1.3 WHEN la petición falla con error 400 THEN el usuario no puede unirse al grupo y la invitación permanece en estado "pending"

1.4 WHEN el frontend envía la petición PATCH a `/group-invitations/:id/respond` THEN el backend rechaza la petición debido a validación fallida del DTO

### Expected Behavior (Correct)

2.1 WHEN un usuario autenticado intenta aceptar una invitación de grupo desde el frontend React Native THEN la petición HTTP PATCH SHALL completarse exitosamente con código 200

2.2 WHEN la petición es exitosa THEN el sistema SHALL actualizar el estado de la invitación de "pending" a "accepted" en la base de datos

2.3 WHEN la invitación es aceptada THEN el sistema SHALL crear automáticamente una membresía (membership) para el usuario en el grupo con `is_admin: false`

2.4 WHEN la membresía es creada THEN el sistema SHALL emitir eventos de notificación apropiados (GROUP_INVITATION_ACCEPTED, USER_JOINED_GROUP)

2.5 WHEN la operación completa exitosamente THEN el frontend SHALL mostrar un mensaje de confirmación y actualizar la lista de grupos del usuario

2.6 WHEN ocurre un error de validación THEN el sistema SHALL retornar un mensaje de error descriptivo que indique exactamente qué campo o validación falló

### Unchanged Behavior (Regression Prevention)

3.1 WHEN un usuario rechaza una invitación de grupo THEN el sistema SHALL CONTINUE TO procesar la respuesta correctamente actualizando el estado a "rejected"

3.2 WHEN un usuario intenta responder a una invitación que no le pertenece THEN el sistema SHALL CONTINUE TO retornar error 403 (Forbidden)

3.3 WHEN un usuario intenta responder a una invitación ya respondida THEN el sistema SHALL CONTINUE TO retornar error 400 con mensaje "Esta invitación ya fue respondida anteriormente"

3.4 WHEN un usuario intenta responder a una invitación inexistente THEN el sistema SHALL CONTINUE TO retornar error 404 (Not Found)

3.5 WHEN el backend recibe una petición con estructura de DTO correcta THEN el sistema SHALL CONTINUE TO validar y procesar la petición sin errores

3.6 WHEN se crea una membresía exitosamente THEN el sistema SHALL CONTINUE TO emitir eventos de WebSocket para notificar a otros miembros del grupo

3.7 WHEN el frontend envía otras peticiones a endpoints de invitaciones (GET pending, POST send, DELETE cancel) THEN el sistema SHALL CONTINUE TO funcionar correctamente sin regresiones
