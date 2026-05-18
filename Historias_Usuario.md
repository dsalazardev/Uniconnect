# 📋 Backlog de Historias de Usuario - Sprint 4

Este documento contiene la estructura limpia de las historias de usuario del proyecto, divididas por roles.

---

## 🛠️ Mis Historias (QA / Infraestructura)

### US-INF07: Build y distribución de la app móvil con EAS Build
[cite_start]**Como** equipo, necesitamos generar builds firmados de la app móvil mediante EAS Build para poder distribuirla al docente y a los pares evaluadores sin depender de Expo Go. [cite: 1]
* **Criterio 1:** Dado que el proyecto móvil tiene un archivo eas.json configurado con perfiles development, preview y production | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condición descrita. [cite: 2, 3, 4]
* **Criterio 2:** Dado que se ejecuta eas build --profile preview --platform android | Cuando termina el build | [cite_start]Entonces se genera un APK firmado descargable desde la URL pública del build. [cite: 5]
* **Criterio 3:** Dado que el APK preview se instala en un dispositivo Android real | Cuando el usuario abre la app | [cite_start]Entonces puede autenticarse, ver sus grupos y enviar mensajes contra el backend de producción en Fly.io. [cite: 6]
* **Criterio 4:** Dado que las variables sensibles (clientId de OAuth, URL del backend) se inyectan en build | Cuando se inspecciona el bundle | [cite_start]Entonces no aparecen credenciales hardcodeadas en código fuente del repositorio. [cite: 7]
* **Criterio 5:** Dado que el README del proyecto móvil | Cuando se documenta la distribución | [cite_start]Entonces incluye el enlace al último APK preview y las instrucciones para instalarlo. [cite: 8]

### US-T05: Unit tests para el patrón State
[cite_start]**Como** equipo, necesitamos pruebas unitarias que cubran la matriz de transiciones del ciclo de vida del grupo de estudio y de las tareas, garantizando que las transiciones inválidas se rechazan con la excepción esperada. [cite: 79]
* **Criterio 1:** Dado que la matriz de transiciones del grupo declara qué acciones son válidas en cada estado | Cuando se ejecutan las pruebas | [cite_start]Entonces existe al menos un test por celda válida y otro por celda inválida. [cite: 80]
* **Criterio 2:** Dado que un grupo está en estado Activo | Cuando se ejecuta solicitarSalidaAdmin() | [cite_start]Entonces el grupo transita a TransferenciaAdminPendiente. [cite: 81]
* **Criterio 3:** Dado que un grupo está en estado TransferenciaAdminPendiente | Cuando se intenta agregar un miembro | [cite_start]Entonces se lanza TransicionInvalidaError con código específico. [cite: 82]
* **Criterio 4:** Dado que un grupo está en estado SinAdmin | Cuando un miembro acepta ser admin | [cite_start]Entonces el grupo vuelve a Activo. [cite: 83]
* **Criterio 5:** Dado que las tareas implementan State (US-V01) | Cuando se ejecutan las pruebas de transiciones de tarea | [cite_start]Entonces se cubren los caminos Pendiente a EnProgreso, EnProgreso a EnRevision, EnRevision a Completada y cualquier estado a Vencida. [cite: 84, 85]
* **Criterio 6:** Dado que el flujo completo de transferencia de administración del Sprint 3 fue refactorizado | Cuando los tests del Sprint 3 se ejecutan contra el nuevo modelo de estados | [cite_start]Entonces todos pasan sin modificarlos. [cite: 86, 87]

### US-T04: Unit tests para el patrón Strategy
[cite_start]**Como** equipo, necesitamos pruebas unitarias que verifiquen el comportamiento del patrón Strategy en las notificaciones multicanal de forma aislada del transporte real (WebSocket, SMTP, Expo Push). [cite: 121]
* **Criterio 1:** Dado que cada estrategia concreta tiene al menos dos casos de prueba (envío exitoso y manejo de error) | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condición descrita. [cite: 122, 123]
* **Criterio 2:** Dado que las estrategias se prueban con dobles de prueba (mocks o stubs) sobre los clientes externos | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces ninguna prueba unitaria depende de un servidor SMTP, WebSocket ni Expo Push reales. [cite: 124, 125]
* **Criterio 3:** Dado que el NotificacionService recibe una lista de estrategias inyectadas | Cuando se prueba con tres estrategias y una de ellas falla | [cite_start]Entonces las otras dos se ejecutan correctamente y el fallo queda aislado. [cite: 126, 127]
* **Criterio 4:** Dado que las preferencias del usuario filtran las estrategias activas | Cuando un usuario tiene push desactivado | [cite_start]Entonces la PushMovilStrategy no se ejecuta para ese usuario. [cite: 128]
* **Criterio 5:** Dado que se aplica el principio Open/Closed | Cuando se agrega una estrategia ficticia en pruebas | [cite_start]Entonces el NotificacionService la consume sin modificación de código existente. [cite: 129]

### US-INF06: Pipeline CI/CD con GitHub Actions
[cite_start]**Como** equipo, necesitamos que cada merge a la rama main ejecute automaticamente las pruebas y, si pasan, despliegue la version actualizada en Fly.io. [cite: 112]
* **Criterio 1:** Dado que Existe workflow .github/workflows/deploy.yml que se activa en push a main | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 113, 114]
* **Criterio 2:** Dado que El workflow ejecuta en orden: instalar dependencias -> correr tests -> build Docker -> deploy a Fly.io | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 115, 116]
* **Criterio 3:** Dado que Si alguno de los tests falla, el deploy no se ejecuta y el workflow reporta error | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 117, 118]
* **Criterio 4:** Dado que El token de Fly.io (FLY_API_TOKEN) esta almacenado como GitHub Secret, no en el repositorio | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 119, 120]

### US-INF09: Pipeline de CI/CD unificado para web, movil y backend
[cite_start]**Como** equipo de DevOps, queremos un pipeline de integracion y entrega continua que automatice las pruebas, el build y el despliegue de los tres proyectos (dashboard web, app movil y backend) para reducir el tiempo de release y eliminar despliegues manuales propensos a error. [cite: 199]
* **Criterio 1:** Dado que se hace push a una rama de feature en cualquiera de los tres repositorios | Cuando el pipeline arranca | [cite_start]Entonces se ejecutan linter, type-check y la suite de pruebas unitarias, y el merge a main queda bloqueado si alguno falla. [cite: 200]
* **Criterio 2:** Dado que se hace merge a main en el repositorio del backend | Cuando el pipeline finaliza con exito | [cite_start]Entonces la nueva imagen se despliega automaticamente en Fly.io y el endpoint /health refleja el commit recien publicado. [cite: 201]
* **Criterio 3:** Dado que se hace merge a main en el repositorio web | Cuando el pipeline finaliza con exito | [cite_start]Entonces el build estatico generado con Vite se sirve detras de Nginx y queda accesible en la URL publica del entorno de produccion. [cite: 202]
* **Criterio 4:** Dado que se hace merge a main en el repositorio movil | Cuando el pipeline finaliza con exito | [cite_start]Entonces se dispara un EAS Build de perfil preview y el enlace de descarga del artefacto queda registrado en el historial de releases. [cite: 203]
* **Criterio 5:** Dado que un despliegue automatico falla en cualquiera de los tres proyectos | Cuando el pipeline detecta el error | [cite_start]Entonces se ejecuta rollback a la ultima version estable y se publica una alerta en el canal del equipo. [cite: 204]
* **Criterio 6:** Dado que un PR esta abierto | Cuando el pipeline ejecuta la suite de pruebas | [cite_start]Entonces el reporte de cobertura se publica como comentario en el PR y el merge se bloquea si la cobertura cae por debajo del umbral minimo acordado. [cite: 205]
* **Criterio 7:** Dado que cada repositorio tiene su README | Cuando se documenta el pipeline | [cite_start]Entonces incluye el diagrama del flujo, los entornos disponibles y la lista de secretos requeridos por GitHub Actions. [cite: 206]

### US-T07: Pruebas de integracion movil-backend
[cite_start]**Como** equipo, queremos pruebas de integracion y E2E que cubran los endpoints nuevos del Sprint 4, usando Detox o Maestro y contratos Zod compartidos entre web y movil. [cite: 186]
* **Criterio 1:** Dado que el backend expone los endpoints nuevos del Sprint 4 (foro, biblioteca, sesiones, encuestas) | Cuando se ejecuta la suite de pruebas de integracion | [cite_start]Entonces cada endpoint tiene al menos una prueba que valida el contrato de respuesta esperado. [cite: 187, 188]
* **Criterio 2:** Dado que la suite E2E corre con Detox o Maestro | Cuando se ejecuta el flujo de creacion de sesion de estudio desde la app movil | [cite_start]Entonces la prueba valida que la sesion aparece en el calendario web sin recargar manualmente. [cite: 189, 190]
* **Criterio 3:** Dado que Los contratos Zod de los DTOs del backend estan publicados en el paquete compartido packages/api-types y los proyectos web y movil los consumen sin duplicar validaciones | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 191, 192]
* **Criterio 4:** Dado que un contrato Zod de un endpoint cambia sin actualizar los clientes | Cuando se ejecuta la compilacion de TypeScript en web o movil | [cite_start]Entonces la compilacion falla con error explicito indicando el campo incompatible. [cite: 193, 194]
* **Criterio 5:** Dado que se ejecuta la suite completa de pruebas de integracion en CI | Cuando todos los tests pasan | [cite_start]Entonces el reporte de cobertura de los endpoints del Sprint 4 es igual o superior al 70%. [cite: 195]
* **Criterio 6:** Dado que una prueba E2E falla en el pipeline | Cuando el CI reporta el error | [cite_start]Entonces el log incluye la captura de pantalla o el video del flujo fallido generado por Detox o Maestro. [cite: 196]
* **Criterio 7:** Dado que El README del proyecto movil documenta como ejecutar las pruebas E2E localmente y como interpretar los artefactos generados por el pipeline de CI | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 197, 198]

---

## 💻 Historias de Desarrolladores (Devs)

### US-M01: Autenticación institucional en la app móvil
[cite_start]**Como** estudiante, quiero iniciar sesión en la app móvil con mi correo @ucaldas.edu.co para acceder a UniConnect desde mi celular usando el mismo backend que el dashboard web. [cite: 9]
* **Criterio 1:** Dado que abro la app móvil sin sesión activa | Cuando aparece la pantalla de inicio | [cite_start]Entonces se muestra el botón Iniciar sesión con Google. [cite: 10]
* **Criterio 2:** Dado que pulso Iniciar sesión con Google | Cuando se ejecuta el flujo OAuth con expo-auth-session | [cite_start]Entonces se aplica la restricción de dominio @ucaldas.edu.co contra el mismo endpoint del backend que usa el dashboard web. [cite: 11]
* **Criterio 3:** Dado que un correo no institucional intenta autenticarse | Cuando completa el login | [cite_start]Entonces la app muestra un mensaje de error claro y deniega el acceso. [cite: 12]
* **Criterio 4:** Dado que el login fue exitoso | Cuando la app recibe el JWT | [cite_start]Entonces lo almacena en SecureStore (no en AsyncStorage plano) y lo adjunta a las peticiones siguientes. [cite: 13]
* **Criterio 5:** Dado que cierro y vuelvo a abrir la app | Cuando aún hay JWT válido en SecureStore | [cite_start]Entonces la sesión se restaura sin pedir login nuevamente. [cite: 14]
* **Criterio 6:** Dado que pulso Cerrar sesión | Cuando confirmo | [cite_start]Entonces el JWT se elimina del SecureStore y la app vuelve a la pantalla de login. [cite: 15]

### US-CH01: Chain of Responsibility para validación de mensajes
[cite_start]**Como** equipo de desarrollo, queremos aplicar el patrón Chain of Responsibility sobre la publicación de mensajes en el chat para que cada validación (tamaño, contenido, menciones, permisos, adjunto) sea un handler independiente y la cadena pueda extenderse sin modificar los handlers existentes. [cite: 16]
* **Criterio 1:** Dado que existe la interfaz IValidadorMensajeHandler con los métodos setSiguiente(handler) y manejar(mensaje): ResultadoValidacion | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condición descrita. [cite: 17, 18]
* **Criterio 2:** Dado que existen al menos cuatro handlers concretos: ValidarTamanoHandler, ValidarContenidoHandler, ValidarMencionesHandler y ValidarPermisosHandler | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condición descrita. [cite: 19, 20]
* **Criterio 3:** Dado que la cadena se construye en un único punto del módulo de chat (factory o composition root) | Cuando se inicializa el módulo | [cite_start]Entonces el orden de los handlers queda explícito y configurable. [cite: 21]
* **Criterio 4:** Dado que un mensaje viola una regla | Cuando el handler responsable lo detecta | [cite_start]Entonces la cadena se corta y devuelve un ResultadoValidacion fallido con el código de error específico del handler que rechazó el mensaje. [cite: 22]
* **Criterio 5:** Dado que un mensaje pasa todas las validaciones | Cuando el último handler termina | [cite_start]Entonces el mensaje se entrega al ChatSubject del Sprint 3 con los decoradores ya aplicados. [cite: 23]
* **Criterio 6:** Dado que se requiere agregar una validación nueva (por ejemplo ValidarAdjuntoHandler) | Cuando se implementa la nueva clase | [cite_start]Entonces solo se modifica la composición de la cadena, no los handlers existentes. [cite: 24]
* **Criterio 7:** Dado que el README del módulo de chat | Cuando se documenta el patrón | [cite_start]Entonces incluye el diagrama UML y un diagrama de secuencia mostrando un caso exitoso y uno con cortocircuito. [cite: 25]

### US-S01: Strategy para notificaciones multicanal
[cite_start]**Como** equipo de desarrollo, queremos implementar el patrón Strategy sobre el envío de notificaciones para que cada canal (in-app, email, push) sea intercambiable y configurable por usuario sin modificar el código del NotificacionService. [cite: 26]
* **Criterio 1:** Dado que existe la interfaz INotificacionStrategy con el método enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condición descrita. [cite: 27, 28]
* **Criterio 2:** Dado que existen al menos tres estrategias concretas: InAppWebSocketStrategy, EmailInstitucionalStrategy y PushMovilStrategy | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condición descrita. [cite: 29, 30]
* **Criterio 3:** Dado que el NotificacionService recibe la lista de estrategias por inyección de dependencias y no las instancia internamente | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condición descrita. [cite: 31, 32]
* **Criterio 4:** Dado que un usuario configura sus preferencias de canal por tipo de evento | Cuando llega un evento desde el Observer del Sprint 3 | [cite_start]Entonces solo se ejecutan las estrategias activas para ese usuario y ese tipo de evento. [cite: 33, 34]
* **Criterio 5:** Dado que una estrategia falla durante el envío | Cuando el NotificacionService notifica | [cite_start]Entonces las demás estrategias siguen ejecutándose y el error queda aislado. [cite: 35]
* **Criterio 6:** Dado que se requiere agregar un canal nuevo (por ejemplo, ResumenDiarioStrategy) | Cuando se implementa la nueva clase | [cite_start]Entonces no es necesario modificar el NotificacionService ni las estrategias existentes (principio Open/Closed). [cite: 36]
* **Criterio 7:** Dado que el módulo de notificaciones tiene su README | Cuando se documenta el patrón | [cite_start]Entonces incluye el diagrama UML con la interfaz, las estrategias concretas y el contexto cliente. [cite: 37]

### US-ST01: State para el ciclo de vida del grupo
[cite_start]**Como** equipo, necesitamos refactorizar el flujo de transferencia de admin del Sprint 3 usando el patron State con cinco estados como clases independientes y emision de eventos. [cite: 38]
* **Criterio 1:** Dado que Existe una interfaz IEstadoGrupo con metodos solicitar(), aceptar(), rechazar() y transferir(); los cinco estados concretos (Activo, PendienteTransferencia, TransferenciaAceptada, Disuelto, Bloqueado) son clases independientes | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 39, 40, 41]
* **Criterio 2:** Dado que un administrador inicia la transferencia de rol | Cuando ejecuta la accion | [cite_start]Entonces el grupo pasa del estado Activo al estado PendienteTransferencia y se emite el evento correspondiente a los observers. [cite: 42]
* **Criterio 3:** Dado que el candidato acepta la transferencia | Cuando confirma | [cite_start]Entonces el grupo pasa al estado TransferenciaAceptada y el sistema actualiza el campo admin_id en base de datos atomicamente. [cite: 43]
* **Criterio 4:** Dado que el candidato rechaza la transferencia | Cuando confirma el rechazo | [cite_start]Entonces el grupo vuelve al estado Activo y el administrador original mantiene el rol. [cite: 44]
* **Criterio 5:** Dado que El refactor del flujo de transferencia del Sprint 3 usa los cinco estados como clases independientes; ningun estado concreto referencia directamente a otro estado sin pasar por la interfaz | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 45, 46, 47]
* **Criterio 6:** Dado que ocurre un evento de ciclo de vida del grupo | Cuando el Subject lo emite | [cite_start]Entonces todos los observers suscritos (WebSocket, Persistencia) reciben el evento con el nuevo estado como payload. [cite: 48]
* **Criterio 7:** Dado que El diagrama UML del patron State (contexto, interfaz, cinco estados y transiciones) esta documentado en el README del modulo de grupos | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 49, 50]

### US-M02: Listado y detalle de grupos de estudio en móvil
[cite_start]**Como** estudiante, quiero ver desde la app móvil mis grupos de estudio actuales y entrar al detalle de cualquiera para revisar miembros y acceder al chat. [cite: 51]
* **Criterio 1:** Dado que estoy autenticado en la app | Cuando entro a la pestaña Mis grupos | [cite_start]Entonces se carga el listado consultando el backend desplegado en Fly.io. [cite: 52]
* **Criterio 2:** Dado que pulso un grupo del listado | Cuando se abre la vista de detalle | [cite_start]Entonces veo la lista de miembros, el administrador actual, la asignatura y el estado del grupo (Activo, TransferenciaAdminPendiente, etc.). [cite: 53]
* **Criterio 3:** Dado que el grupo está en estado TransferenciaAdminPendiente y soy el admin saliente | Cuando entro al detalle | [cite_start]Entonces la app muestra una banda informativa indicando que mi salida está bloqueada hasta que el candidato acepte. [cite: 54]
* **Criterio 4:** Dado que ya pertenezco a tres grupos para una misma asignatura | Cuando intento crear un cuarto desde la app | [cite_start]Entonces se rechaza con el mismo mensaje de error que el dashboard web. [cite: 55]
* **Criterio 5:** Dado que el listado está cargado | Cuando hago pull-to-refresh | [cite_start]Entonces se vuelve a consultar el backend y la lista se actualiza. [cite: 56]

### US-M03: Chat grupal en tiempo real en la app móvil
[cite_start]**Como** estudiante, quiero participar en el chat de mis grupos desde la app móvil enviando y recibiendo mensajes en tiempo real, con soporte para adjuntos y menciones. [cite: 57]
* **Criterio 1:** Dado que entro al chat de un grupo desde el móvil | Cuando carga la vista | [cite_start]Entonces se muestra el historial paginado de mensajes en orden cronológico. [cite: 58]
* **Criterio 2:** Dado que envío un mensaje desde el móvil | Cuando lo publico | [cite_start]Entonces aparece en tiempo real en el dashboard web y en otros móviles conectados al mismo grupo, sin recargar (Observer del Sprint 3). [cite: 59]
* **Criterio 3:** Dado que adjunto un archivo desde la galería o cámara | Cuando se envía | [cite_start]Entonces el mensaje se renderiza con el icono y metadatos correctos (Decorator del Sprint 3) tanto en web como en móvil. [cite: 60]
* **Criterio 4:** Dado que escribo @nombre en un mensaje | Cuando el backend pasa la cadena de validación de US-CH01 | [cite_start]Entonces la mención se persiste decorada y el mencionado recibe la notificación diferenciada (Strategy + Observer). [cite: 61, 62]
* **Criterio 5:** Dado que el mensaje viola una regla de la cadena de validación de US-CH01 | Cuando el backend lo rechaza | [cite_start]Entonces la app muestra el código de error específico devuelto por el handler que cortó la cadena. [cite: 63]
* **Criterio 6:** Dado que pierdo conectividad y la recupero | Cuando vuelvo al chat | [cite_start]Entonces el cliente reconecta el WebSocket y descarga los mensajes que se enviaron durante la desconexión. [cite: 64]

### US-W06: Mensajería privada uno a uno desde el dashboard
[cite_start]**Como** estudiante, quiero abrir conversaciones privadas con compañeros de mis grupos desde el dashboard web para coordinar tareas sin saturar el chat grupal. [cite: 65]
* **Criterio 1:** Dado que estoy en el chat grupal | Cuando hago clic sobre un compañero y selecciono Mensaje privado | [cite_start]Entonces se abre una conversación uno a uno separada del chat grupal. [cite: 66, 67]
* **Criterio 2:** Dado que envío un mensaje privado | Cuando lo publico | [cite_start]Entonces solo el destinatario lo recibe en tiempo real, nunca otros miembros del grupo (canal WebSocket independiente). [cite: 68]
* **Criterio 3:** Dado que adjunto un archivo o uso una mención en mensaje privado | Cuando el mensaje se envía | [cite_start]Entonces los mismos decoradores del Sprint 3 aplican y la cadena de validación de US-CH01 se ejecuta antes de la entrega. [cite: 69]
* **Criterio 4:** Dado que abro una conversación privada existente | Cuando carga la vista | [cite_start]Entonces se muestra el historial paginado en orden cronológico con scroll infinito hacia atrás. [cite: 70]
* **Criterio 5:** Dado que una conversación privada está abierta | Cuando el destinatario está conectado | [cite_start]Entonces se muestra un indicador de presencia en línea. [cite: 71]

### US-W05: Centro de notificaciones en el dashboard
[cite_start]**Como** estudiante, quiero ver desde el dashboard web todas mis notificaciones (solicitudes de ingreso, transferencias de admin, menciones en chat) en un panel centralizado para no perder información relevante de mis grupos. [cite: 72]
* **Criterio 1:** Dado que abro el dashboard web | Cuando hago clic en el icono de notificaciones de la barra superior | [cite_start]Entonces se despliega el panel con la lista de notificaciones ordenadas por fecha descendente. [cite: 73]
* **Criterio 2:** Dado que hay notificaciones nuevas | Cuando se reciben en tiempo real vía WebSocket | [cite_start]Entonces el contador del icono se actualiza sin recargar la página (Observer del Sprint 3 + Strategy in-app de US-S01). [cite: 74]
* **Criterio 3:** Dado que estoy en el panel | Cuando aplico filtros por tipo de evento o por estado leída/no leída | [cite_start]Entonces la lista se filtra en cliente sin nuevas peticiones al backend. [cite: 75, 76]
* **Criterio 4:** Dado que hago clic en una notificación de solicitud de ingreso pendiente | Cuando la selecciono | [cite_start]Entonces el dashboard navega al panel de admin del grupo correspondiente con la solicitud preseleccionada. [cite: 77]
* **Criterio 5:** Dado que abro el panel | Cuando las notificaciones se renderizan | [cite_start]Entonces todas las que estaban no leídas pasan a estado leídas tras un retraso de dos segundos. [cite: 78]

### US-D03: Decorator de notificaciones con prioridad y tipo de accion
[cite_start]**Como** equipo, necesitamos decorar las notificaciones del sistema para anadirles metadatos de prioridad y acciones embebidas sin modificar la notificacion base. [cite: 88]
* **Criterio 1:** Dado que Existe NotificacionBase con mensaje, destinatario y timestamp | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 89, 90]
* **Criterio 2:** Dado que Existe NotificacionConPrioridad que anade nivel: normal | urgente | critica | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 91, 92]
* **Criterio 3:** Dado que Existe NotificacionConAccion que anade un objeto accion con label y endpoint para call-to-action inline | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 93, 94]

### US-O03: Observer para nuevos eventos universitarios
[cite_start]**Como** estudiante, quiero suscribirme a categorias de eventos universitarios para recibir notificacion automatica cuando se publique un nuevo evento de esa categoria. [cite: 95]
* **Criterio 1:** Dado que Existe EventoUniversidadSubject que implementa ISubject y emite el evento NUEVO_EVENTO con la categoria como campo del payload | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 96, 97]
* **Criterio 2:** Dado que Los estudiantes pueden suscribirse/desuscribirse a categorias via POST /eventos/suscribir y DELETE /eventos/suscribir | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 98, 99]
* **Criterio 3:** Dado que se crea un nuevo evento en categoria "Academico" | Cuando el subject notifica | [cite_start]Entonces solo los estudiantes suscritos a "Academico" reciben la notificacion. [cite: 100]
* **Criterio 4:** Dado que El observer filtra por categoria antes de emitir el mensaje WebSocket al usuario | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 101, 102]

### US-INF05: Deploy del dashboard web en Fly.io
[cite_start]**Como** equipo, necesitamos que el dashboard web este desplegado en Fly.io y accesible con una URL publica estable. [cite: 103]
* **Criterio 1:** Dado que Existe fly.toml configurado en la raiz del frontend | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 104, 105]
* **Criterio 2:** Dado que La variable VITE_API_URL (o equivalente) apunta a la URL del backend desplegado en Fly.io, no a localhost | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 106, 107]
* **Criterio 3:** Dado que El dashboard carga correctamente en el navegador desde la URL publica de Fly.io | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 108, 109]
* **Criterio 4:** Dado que El flujo completo login -> grupos -> chat funciona correctamente en produccion (no solo en local) | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 110, 111]

### US-W04: Migración del dashboard web a React + Vite (corrección de stack)
[cite_start]**Como** equipo, necesitamos migrar el dashboard web desde Expo Web hacia un proyecto independiente con React + Vite + TypeScript para cumplir con la arquitectura del producto y permitir un build estático servido por Nginx en producción. [cite: 130]
* **Criterio 1:** Dado que existe un repositorio o carpeta /web independiente del proyecto móvil | Cuando se inspecciona el package.json | [cite_start]Entonces no contiene dependencias de expo, react-native ni react-native-web. [cite: 131]
* **Criterio 2:** Dado que el proyecto fue creado con Vite | Cuando se ejecuta npm run dev | [cite_start]Entonces el dashboard arranca en modo desarrollo con HMR funcional. [cite: 132]
* **Criterio 3:** Dado que el proyecto fue creado con Vite | Cuando se ejecuta npm run build | [cite_start]Entonces se genera la carpeta dist/ con los artefactos estáticos optimizados. [cite: 133]
* **Criterio 4:** Dado que las funcionalidades del Sprint 3 (autenticación, panel de admin, chat grupal) fueron migradas | Cuando un evaluador ejecuta el flujo completo | [cite_start]Entonces todas las HU del Sprint 3 marcadas para web siguen pasando. [cite: 134]
* **Criterio 5:** Dado que el Dockerfile del Sprint 3 (US-INF02) está vigente | Cuando se construye la imagen del frontend | [cite_start]Entonces sigue usando el build multi-stage con Nginx sirviendo la carpeta dist/. [cite: 135]
* **Criterio 6:** Dado que el README del frontend | Cuando se documenta el stack | [cite_start]Entonces especifica versiones exactas de React, Vite y TypeScript, además del comando de arranque. [cite: 136]

### US-D02: Decorator de perfil de estudiante con estadisticas
[cite_start]**Como** equipo de desarrollo, necesitamos aplicar el patron Decorator al perfil del estudiante para que el sistema pueda mostrar versiones enriquecidas del perfil sin acoplar las estadisticas al modelo base. [cite: 137]
* **Criterio 1:** Dado que Existe PerfilBase con nombre, carrera, semestre y asignaturas activas | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 138, 139]
* **Criterio 2:** Dado que Existe PerfilConEstadisticas que anade: numero de grupos creados, grupos en los que participa, y mensajes enviados | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 140, 141]
* **Criterio 3:** Dado que Existe PerfilConInsignias que anade un array de insignias desbloqueadas basadas en hitos del sistema | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 142, 143]
* **Criterio 4:** Dado que El endpoint GET /perfil/:id?vista=completa retorna el perfil con todos los decoradores aplicados | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 144, 145]
* **Criterio 5:** Dado que El endpoint GET /perfil/:id retorna unicamente el perfil base (sin costo computacional extra) | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 146, 147]

### US-V05: Foro de preguntas y respuestas por asignatura
[cite_start]**Como** estudiante, quiero un foro de preguntas y respuestas por asignatura con una cadena CoR independiente, sistema de votos con reordenamiento dinamico y validacion de matricula, accesible desde web y movil. [cite: 148]
* **Criterio 1:** Dado que un estudiante matriculado accede al foro | Cuando publica una pregunta | [cite_start]Entonces la pregunta pasa por la cadena de responsabilidad (CoR) de validacion y queda visible para el grupo. [cite: 149]
* **Criterio 2:** Dado que un estudiante lee una respuesta | Cuando hace clic en votar a favor | [cite_start]Entonces el sistema actualiza el conteo en tiempo real y reordena las respuestas por votos descendentes. [cite: 150]
* **Criterio 3:** Dado que un usuario no matriculado intenta publicar en el foro | Cuando envia la solicitud | [cite_start]Entonces el sistema rechaza la operacion con mensaje que indica que se requiere matricula en la asignatura. [cite: 151]
* **Criterio 4:** Dado que Existe IManejadorPregunta con metodos manejar(pregunta) y setSiguiente(manejador); el CoR del foro es independiente del CoR de mensajes del Sprint 3 | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 152, 153, 154]
* **Criterio 5:** Dado que el docente marca una respuesta como aceptada | Cuando se actualiza el estado | [cite_start]Entonces esa respuesta queda fijada al tope de la lista independientemente del conteo de votos. [cite: 155]
* **Criterio 6:** Dado que se abre el foro en el dashboard web | Cuando la vista carga | [cite_start]Entonces muestra las preguntas con su conteo de votos y su estado (abierta o resuelta). [cite: 156]
* **Criterio 7:** Dado que se abre el foro en la app movil | Cuando la vista carga | [cite_start]Entonces muestra el mismo contenido que la vista web usando los mismos endpoints del backend. [cite: 157]

### US-V03: Biblioteca colaborativa de recursos
[cite_start]**Como** estudiante, quiero una biblioteca colaborativa de recursos con un nuevo caso de Decorator con tres variantes, extraccion Open Graph, permisos diferenciados y acceso desde web y movil. [cite: 158]
* **Criterio 1:** Dado que un estudiante sube un recurso con URL externa | Cuando el sistema procesa la solicitud | [cite_start]Entonces extrae titulo, descripcion e imagen de previsualizacion via Open Graph y los almacena junto al recurso. [cite: 159]
* **Criterio 2:** Dado que Existe RecursoBase con metodos getContenido() y getMetadata(); RecursoConEtiquetas, RecursoConValoracion y RecursoConComentarios son los tres decoradores implementados | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 160, 161]
* **Criterio 3:** Dado que un integrante del grupo agrega un recurso | Cuando otro integrante intenta editarlo | [cite_start]Entonces el sistema verifica los permisos diferenciados y solo permite la edicion al propietario o al administrador del grupo. [cite: 162]
* **Criterio 4:** Dado que un estudiante busca recursos en la biblioteca | Cuando aplica un filtro por tipo de contenido | [cite_start]Entonces la lista muestra solo los recursos que coinciden con el filtro. [cite: 163]
* **Criterio 5:** Dado que la biblioteca carga en el dashboard web | Cuando hay recursos disponibles | [cite_start]Entonces cada tarjeta muestra la imagen Open Graph, el titulo extraido y los decoradores activos del recurso. [cite: 164]
* **Criterio 6:** Dado que la biblioteca carga en la app movil | Cuando el usuario accede a la seccion | [cite_start]Entonces puede subir, ver y filtrar recursos usando los mismos endpoints del backend que la version web. [cite: 165]
* **Criterio 7:** Dado que Los decoradores de recursos son componibles entre si y compatibles con los decoradores de mensajes definidos en el Sprint 3 | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 166, 167]

### US-V02: Sesiones de estudio programadas
[cite_start]**Como** estudiante, quiero programar sesiones de estudio con generacion de series recurrentes, recordatorios temporizados via NotificacionService y acceso dual desde web y movil. [cite: 168]
* **Criterio 1:** Dado que un estudiante crea una sesion de estudio con recurrencia semanal | Cuando confirma la creacion | [cite_start]Entonces el sistema genera la serie completa de sesiones hasta la fecha de fin indicada. [cite: 169]
* **Criterio 2:** Dado que una sesion de estudio esta proxima a ocurrir | Cuando el temporizador de recordatorio se activa segun la configuracion del usuario | [cite_start]Entonces el NotificacionService emite la notificacion a todos los participantes del grupo. [cite: 170, 171]
* **Criterio 3:** Dado que un organizador cancela una sesion individual de una serie recurrente | Cuando confirma la cancelacion | [cite_start]Entonces solo esa sesion desaparece del calendario sin afectar las demas de la serie. [cite: 172]
* **Criterio 4:** Dado que el estudiante accede al calendario de sesiones en el dashboard web | Cuando la vista carga | [cite_start]Entonces ve todas las sesiones del grupo ordenadas cronologicamente con indicacion de recurrencia. [cite: 173]
* **Criterio 5:** Dado que el estudiante accede al calendario en la app movil | Cuando selecciona una sesion | [cite_start]Entonces puede ver los detalles y confirmar o declinar su asistencia. [cite: 174]
* **Criterio 6:** Dado que La logica de recordatorios reutiliza el NotificacionService implementado en el Sprint 3 sin duplicar codigo de envio de notificaciones | Cuando se valida el requerimiento en el flujo correspondiente | [cite_start]Entonces el sistema cumple la condicion descrita. [cite: 175, 176]
* **Criterio 7:** Dado que un participante actualiza su disponibilidad | Cuando guarda el cambio | [cite_start]Entonces el organizador recibe una notificacion automatica via Observer. [cite: 177]

### US-V04: Encuestas rapidas en el chat
[cite_start]**Como** estudiante, quiero crear encuestas rapidas en el chat del grupo con un Decorator componible con los del Sprint 3, votacion en tiempo real y auto-cierre programado. [cite: 178]
* **Criterio 1:** Dado que un estudiante envia una encuesta en el chat del grupo | Cuando el mensaje se publica | [cite_start]Entonces el Decorator de encuesta se compone con los decoradores de mensaje existentes del Sprint 3 sin modificar la clase base. [cite: 179]
* **Criterio 2:** Dado que un participante vota en una encuesta activa | Cuando registra su voto | [cite_start]Entonces el sistema actualiza los resultados en tiempo real para todos los participantes conectados via WebSocket. [cite: 180]
* **Criterio 3:** Dado que se alcanza el tiempo limite configurado en la encuesta | Cuando el temporizador expira | [cite_start]Entonces el sistema cierra automaticamente la votacion y muestra el resultado final definitivo. [cite: 181]
* **Criterio 4:** Dado que el creador de la encuesta quiere ver los resultados antes del cierre | Cuando accede al detalle del mensaje | [cite_start]Entonces ve el porcentaje de votos por opcion en tiempo real. [cite: 182]
* **Criterio 5:** Dado que un participante intenta votar dos veces en la misma encuesta | Cuando envia el segundo voto | [cite_start]Entonces el sistema rechaza la operacion con mensaje indicando que ya registro su voto. [cite: 183]
* **Criterio 6:** Dado que la encuesta se muestra en el dashboard web | Cuando la vista renderiza el mensaje | [cite_start]Entonces se distingue visualmente del texto plano y muestra botones de votacion activos. [cite: 184]
* **Criterio 7:** Dado que la encuesta se muestra en la app movil | Cuando el participante la ve en el chat | [cite_start]Entonces puede votar usando el mismo endpoint del backend que la version web. [cite: 185]

### US-DEV01: Documentacion OpenAPI y tipos TypeScript compartidos entre web y movil
[cite_start]**Como** desarrollador, quiero una documentacion viva del API del backend en formato OpenAPI 3 y tipos TypeScript autogenerados consumibles desde web y movil para evitar inconsistencias entre cliente y servidor. [cite: 218]
* **Criterio 1:** Dado que el backend expone una especificacion OpenAPI 3 | Cuando un desarrollador accede a la ruta /docs | [cite_start]Entonces se renderiza la interfaz Swagger UI con todos los endpoints, DTOs, parametros y codigos de respuesta documentados. [cite: 219]
* **Criterio 2:** Dado que se agrega un endpoint nuevo en el backend | Cuando se ejecuta el build | [cite_start]Entonces el archivo openapi.json se regenera automaticamente a partir del codigo fuente o de los decoradores, sin pasos manuales. [cite: 220]
* **Criterio 3:** Dado que existe un paquete compartido packages/api-types | Cuando el pipeline de CI ejecuta la generacion | [cite_start]Entonces openapi-typescript produce los tipos a partir de openapi.json y publica el paquete en el monorepo. [cite: 221]
* **Criterio 4:** Dado que los proyectos web y movil importan el paquete api-types | Cuando un endpoint cambia su contrato y los clientes no actualizan su codigo | [cite_start]Entonces la compilacion TypeScript falla, impidiendo que un contrato roto llegue a runtime. [cite: 222, 223]
* **Criterio 5:** Dado que el paquete api-types incluye esquemas Zod equivalentes a los DTOs | Cuando un cliente recibe una respuesta del backend | [cite_start]Entonces los datos se validan contra el esquema antes de propagarse a la UI y los datos malformados se rechazan con un error explicito. [cite: 224]
* **Criterio 6:** Dado que el backend publica una nueva version SemVer | Cuando el archivo openapi.json se versiona junto con el release | [cite_start]Entonces es posible recuperar el contrato exacto de cualquier version historica desde el repositorio. [cite: 225, 226]
* **Criterio 7:** Dado que un desarrollador nuevo se incorpora al equipo | Cuando consulta el README del backend | [cite_start]Entonces encuentra un ejemplo paso a paso de como agregar un endpoint, regenerar los tipos y consumirlo desde web y movil. [cite: 227]

---

## 📋 Historias de Gestión (Scrum Master)

### US-SM01: Tablero de metricas Scrum y trazabilidad del proyecto
[cite_start]**Como** Scrum Master, quiero un tablero centralizado con las metricas del equipo (velocidad, cumplimiento, burn-down) y la trazabilidad entre Historias de Usuario, commits y despliegues para tomar decisiones informadas en cada ceremonia. [cite: 207]
* **Criterio 1:** Dado que existe un modulo de metricas accesible desde el dashboard web | Cuando el Scrum Master entra al tablero | [cite_start]Entonces ve la velocidad historica del equipo en story points por sprint y el promedio movil de los ultimos tres sprints. [cite: 208]
* **Criterio 2:** Dado que un sprint esta activo | Cuando el Scrum Master abre el tablero | [cite_start]Entonces se muestra el burn-down chart con el avance diario de las HU completadas frente a la linea ideal. [cite: 209]
* **Criterio 3:** Dado que cada HU tiene criterios de aceptacion numerados | Cuando se registra el resultado de la evaluacion | [cite_start]Entonces el porcentaje de cumplimiento por HU y por sprint queda visible en el tablero y exportable a CSV. [cite: 210]
* **Criterio 4:** Dado que cada commit incluye el ID de HU en su mensaje siguiendo la convencion del equipo | Cuando se hace clic sobre una HU del tablero | [cite_start]Entonces se listan los commits, PRs y despliegues asociados con enlace directo al repositorio. [cite: 211, 212]
* **Criterio 5:** Dado que el equipo realiza una retrospectiva al cierre de cada sprint | Cuando el Scrum Master registra los acuerdos, impedimentos y acciones de mejora | [cite_start]Entonces quedan persistidos y vinculados al sprint correspondiente. [cite: 213, 214]
* **Criterio 6:** Dado que un impedimento permanece abierto mas de tres dias habiles | Cuando se renderiza el tablero | [cite_start]Entonces el impedimento se resalta visualmente y se incluye en el reporte semanal del Scrum Master. [cite: 215]
* **Criterio 7:** Dado que el sprint termina | Cuando el Scrum Master solicita el reporte de cierre | [cite_start]Entonces se genera un PDF con metricas, HU completadas, impedimentos resueltos y acciones acordadas para el siguiente sprint. [cite: 216, 217]