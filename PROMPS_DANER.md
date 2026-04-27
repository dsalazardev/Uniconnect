/opsx-explore.prompt Por favor, explora a profundidad todo el repositorio y analiza la base de código. Tu objetivo principal es aprender y mapear la estructura del proyecto, haciendo especial énfasis en la arquitectura y los patrones de diseño implementados (por ejemplo, identifica si se usa MVC, Arquitectura Hexagonal, patrón Repository, Inyección de Dependencias, etc.). Específicamente, necesito que hagas lo siguiente paso a paso: Lee el archivo /home/salazar/Escritorio/DESAROLLO/AGENTS.md: Úsalo para contextualizarte sobre las reglas generales del proyecto. Sé que puede tener algunas inconsistencias actualmente, no hay problema con eso, úsalo solo como base inicial. Mapea el Flujo de Datos y Patrones: Entiende cómo se comunican las capas actuales de la aplicación leyendo el código real. Actualiza el AGENTS.md: Una vez termines tu análisis, actualiza el archivo AGENTS.md corrigiendo las posibles inconsistencias y añadiendo una sección clara y formal de "Reglas de Arquitectura y Patrones de Diseño". Documenta ahí los patrones exactos que debemos seguir en este proyecto. El objetivo es que este archivo AGENTS.md actualizado se convierta en nuestra regla estricta. De este modo, cuando empecemos la Fase 4 de refactorización, tendrás el contexto perfecto y sabrás exactamente qué patrones de diseño respetar sin que yo tenga que repetírtelo en cada tarea.


/opsx-explore.prompt Quiero que explores la implementación de 5 historias de usuario (US) relacionadas con los patrones Observer y Decorator. Las tareas son: US-T01: Unit tests para el patrón Decorator (3 pts) US-T02: Unit tests para el patrón Observer (3 pts) US-O02: Observer para mensajes del chat en tiempo real (5 pts) US-D01: Decorator de mensajes del chat grupal (5 pts) US-O01: Observer para eventos del grupo de estudio (8 pts) Actúa como un Arquitecto de Software. NO ESCRIBAS CÓDIGO DE IMPLEMENTACIÓN TODAVÍA, estamos en fase de diseño. Explora el proyecto y entrégame un plan estructurado que responda a lo siguiente: Estrategia para el Observer: Analiza dónde encajarían los "Sujetos" y "Observadores" en nuestro código. Valida si ya tenemos instalados @nestjs/event-emitter (para US-O01) y @nestjs/websockets o socket.io (para US-O02). Propón en qué carpetas o servicios irían los Event Emitters y el WebSocket Gateway. Estrategia para el Decorator (US-D01): Propón la creación de un Decorador personalizado (Custom Decorator) en TypeScript que envuelva el método de envío de mensajes grupales. Dame 2 opciones de utilidad de negocio para este decorador (por ejemplo, filtrar groserías o encriptar el texto) para que yo elija una. Estrategia de Testing (US-T01, US-T02): Explica brevemente cómo estructurarás los tests de Jest. Confirma que para el Decorator crearás una clase de prueba (dummy class) interna en el test, y que para el Observer usarás jest.spyOn para rastrear las emisiones de eventos. Revisa la arquitectura actual según nuestro AGENTS.md y muéstrame el plan de ataque.


/opsx-explore.prompt Entendido, hagamos una corrección importante: los patrones Observer y Decorator ya están implementados en la base de código de este backend. Antes de empezar a trabajar en las historias de usuario o en los tests (US-T01, US-T02, US-O02, US-D01, US-O01), necesito que hagamos una fase de EXPLORACIÓN PROFUNDA para que aprendas cómo están construidos actualmente. Por favor, actúa como un Arquitecto de Software y realiza las siguientes tareas de lectura y análisis en el repositorio: Mapeo del Patrón Observer (Eventos del Grupo de Estudio): Busca en el código el uso de @nestjs/event-emitter, inyecciones de la clase EventEmitter2 y métodos que utilicen el decorador @OnEvent(). Identifica exactamente qué servicios actúan como "Sujetos" (los que emiten los eventos) y cuáles actúan como "Observadores" (los que reaccionan a ellos). Mapeo del Patrón Observer (Chat en Tiempo Real): Explora cómo está configurado el chat en tiempo real en la actualidad. Busca clases que usen @WebSocketGateway(), manejo de sockets (@SubscribeMessage()), o flujos con Observable de RxJS. Explícame cómo el servidor notifica los nuevos mensajes a los clientes conectados. Mapeo del Patrón Decorator (Chat Grupal): Busca en el código la declaración de decoradores personalizados (Custom Decorators de TypeScript) que se estén aplicando a la lógica del chat. Analiza qué archivos los definen, cómo envuelven la función original y qué lógica de negocio están ejecutando por debajo. Resumen Arquitectónico: Una vez termines de escanear los archivos, dame un reporte detallado explicándome en qué rutas exactas están implementados estos patrones y cómo funcionan. Tu único objetivo en este momento es analizar, aprender y explicarme el estado actual del código. NO generes código nuevo, no crees planes en OpenSpec ni modifiques ningún archivo. Solo explora y repórtame tus hallazgos.


/opsx-explore.prompt Por favor, toma todo el resumen arquitectónico que acabas de generar sobre el Patrón Observer (EventEmitter2 y WebSockets), el Patrón Decorator (Custom Method Decorators) y las estrategias de Testing (jest.spyOn y dummy classes), y actualiza el archivo AGENTS.md. Agrega una nueva sección llamada ## 🏛️ REGLAS PARA HISTORIAS DE USUARIO (OBSERVER Y DECORATOR) y documenta allí las siguientes directrices estrictas que deberemos seguir para implementar las tareas US-T01, US-T02, US-O02, US-D01 y US-O01: Observer (Eventos de Grupo - US-O01): Es obligatorio usar @nestjs/event-emitter. Se deben extender los MESSAGE_EVENTS existentes y usar @OnEvent(). Observer (Chat en Tiempo Real - US-O02): Es obligatorio usar @nestjs/websockets integrándolo en el MessagesGateway existente, sin inventar nuevas librerías de sockets. Decorator (Chat Grupal - US-D01): Se debe crear un Custom Method Decorator en src/messages/decorators/ para interceptar la lógica de los mensajes (ej. moderación o analítica), manteniendo la lógica de negocio fuera de los controladores. Unit Tests (US-T01 y US-T02): Para probar los EventEmitters, es estrictamente obligatorio usar jest.spyOn(eventEmitter, 'emit'). Para probar el decorador, se debe crear una clase ficticia (DummyClass o TestClass) internamente en el archivo de prueba. Asegúrate de que estas reglas queden guardadas. Una vez que actualices el archivo AGENTS.md y me confirmes, saldremos del modo exploración y empezaremos a crear los specs con /opsx:propose.


/opsx-propose.prompt add-chat-message-decorator Por favor, actúa como un Arquitecto de Software y ayúdame a planificar e implementar estrictamente la primera historia de usuario: US-D01: Decorator de mensajes del chat grupal. Requisitos para el plan y diseño: Diseña un Custom Method Decorator en TypeScript que vivirá en la carpeta src/messages/decorators/ (tal como acordamos en la exploración). El objetivo de negocio de este decorador será la Moderación de Contenido: debe interceptar el mensaje entrante del chat grupal y filtrar palabras prohibidas/groserías antes de que el controlador pase los datos al servicio principal. El diseño y las tareas deben respetar estrictamente las reglas de nuestro AGENTS.md (cero uso de tipos any, tipado estricto y mantener la lógica de negocio fuera del controlador). Por favor, genera los artefactos de esta fase: la propuesta (proposal.md), el diseño técnico (design.md), las especificaciones delta en la carpeta specs/ y la lista de pasos a seguir en tasks.md. No escribas el código fuente todavía, solo genera el plan.


/opsx-apply.prompt Por favor, procede a implementar la US-D01 ejecutando paso a paso las tareas listadas en tasks.md. Asegúrate de escribir el código del Custom Method Decorator para la moderación de contenido y de implementar los tests unitarios en Jest utilizando una clase "dummy" interna, tal como acordamos en el plan. Ejecuta las pruebas para verificar que el decorador funciona correctamente y avísame cuando todas las tareas estén completadas.


/openspec-propose us-o02-realtime-chat-observer Por favor, actúa como un Arquitecto de Software y ayúdame a planificar e implementar la historia de usuario: US-O02: Observer para mensajes del chat en tiempo real. Antes de generar cualquier spec o artefacto, es OBLIGATORIO que leas y analices el archivo AGENTS.md. El diseño debe respetar estrictamente nuestras reglas: debes implementar el patrón Observer usando @nestjs/websockets integrándolo en el MessagesGateway existente, sin inventar nuevas librerías de sockets. Genera los artefactos de esta fase (proposal.md, design.md, las especificaciones delta en specs/ y tasks.md). No escribas el código fuente de implementación todavía, solo genera el plan.


Historia de usuario US-O02: Observer para mensajes del chat en tiempo real. Actúa como un Arquitecto de Software. Antes de generar cualquier spec o artefacto, es OBLIGATORIO que leas y analices el archivo AGENTS.md. El diseño debe respetar estrictamente nuestras reglas: debes implementar el patrón Observer usando @nestjs/websockets integrándolo en el MessagesGateway existente, sin inventar nuevas librerías de sockets. Genera los artefactos de esta fase (proposal.md, design.md, las especificaciones delta en specs/ y tasks.md). No escribas el código fuente de implementación todavía, solo genera el plan.


/opsx-apply.prompt Implementa la historia US-O02 paso a paso siguiendo estrictamente el archivo tasks.md. Asegúrate de modificar el MessagesGateway existente, extender el ChatSessionManager, crear los DTOs y escribir los tests unitarios usando jest.spyOn() como acordamos. Ejecuta los tests para verificar que todo esté en verde y avísame cuando termines.


/opsx-explore.prompt Mapeo del Patrón Observer (Eventos del Grupo de Estudio - US-O01)Por favor, realiza una inspección técnica detallada en el repositorio para identificar cómo se orquestan actualmente los eventos de grupo. Necesito que ejecutes las siguientes tareas de análisis:1. Identificación de Sujetos (Emitters)Busca en src/groups/groups.service.ts y servicios relacionados (como group-invitations.service.ts) inyecciones de la clase EventEmitter2.Identifica los métodos específicos (ej. create(), join(), leave(), update()) donde se estén disparando eventos mediante this.eventEmitter.emit().Documenta qué nombres de eventos se están utilizando actualmente.2. Identificación de Observadores (Listeners)Escanea la carpeta src/notifications/listeners/ y busca el archivo notification-event.listener.ts (o similares).Mapea todos los métodos que utilicen el decorador @OnEvent().Explica qué lógica de "reacción" ejecutan (ej. ¿envían un push, crean un log en la base de datos, o disparan un socket?).3. Análisis de Contratos de EventosBusca el archivo src/messages/events/message.events.ts o uno equivalente para grupos de estudio.Analiza si los eventos están centralizados en un Enum o constantes, para asegurar que cumplimos con la regla de "extender los MESSAGE_EVENTS existentes" definida en el AGENTS.md.4. Resumen de Flujo InternoEntrégame un reporte de rutas y archivos donde se vea el flujo:Acción de Usuario (Sujeto emite) $\rightarrow$ Evento Interno $\rightarrow$ Reacción del Sistema (Observador procesa).


/opsx-propose.prompt us-o01-study-group-events 
Por favor, actúa como un Arquitecto de Software para planificar e implementar la historia de usuario US-O01: Observer para eventos del grupo de estudio (8 pts).
Instrucciones críticas para el agente:
Lectura Obligatoria: Antes de generar nada, lee y analiza AGENTS.md para respetar las reglas de arquitectura (cero any, tipado estricto).
Mecanismo: El diseño debe basarse estrictamente en @nestjs/event-emitter.
Sujeto: Identifica el GroupsService y planea la emisión de los eventos GROUP_CREATED, GROUP_UPDATED, GROUP_DELETED y USER_LEFT_GROUP.
Observador: Planea la extensión del listener en src/notifications/listeners/notification-event.listener.ts para reaccionar a estos eventos.
Contratos: Planea la actualización de src/messages/events/message.events.ts con interfaces de payload tipadas para cada evento nuevo.
Artefactos: Genera la propuesta (proposal.md), el diseño (design.md), las especificaciones delta en specs/ y la lista de pasos en tasks.md.
NO escribas código de implementación todavía, solo genera el plan completo.


/opsx-apply.prompt us-o01-study-group-events
Por favor, procede a implementar la historia de usuario US-O01: Observer para eventos del grupo de estudio ejecutando paso a paso las 95 tareas listadas en el archivo tasks.md.
Instrucciones críticas de ejecución:
Tipado Estricto: Asegúrate de que las nuevas interfaces de payload en message.events.ts no contengan ningún tipo any.
Sujeto (GroupsService): Emite los eventos GROUP_CREATED, GROUP_UPDATED, GROUP_DELETED y USER_LEFT_GROUP solo después de que las operaciones de base de datos sean exitosas.
Observador (GroupActivityListener): Implementa la lógica de notificaciones de forma defensiva con try/catch y el Logger de NestJS, asegurando que un fallo en la notificación no afecte la operación principal.
Testing: Implementa los tests unitarios usando jest.spyOn(eventEmitter, 'emit') para los servicios y valida que las notificaciones se creen correctamente en el listener.
Reglas: Respeta estrictamente el archivo AGENTS.md y actualiza su estado al finalizar.
Ejecuta las pruebas al finalizar para verificar que todo esté en verde y confírmame cuando el sistema esté listo para el archivado.


/opsx-apply.prompt us-o01-study-group-events ACTUAR COMO ARQUITECTO: Se ha detectado una regresión crítica (Error 400) en el endpoint PATCH /api/groups/:id después de tu última implementación. Resuelve esto inmediatamente antes de proceder.
Instrucciones de reparación:
Análisis del Error: El cambio en la firma de GroupsService.update(id, userId, dto) no se reflejó en el controlador, causando un desajuste en los argumentos recibidos por NestJS.
Modificación del Controlador: Abre src/groups/groups.controller.ts y actualiza el método update. Debes extraer el userId del request (usando el decorador @GetUser o similar) y pasarlo como segundo argumento al servicio.
Auditoría de Métodos: Verifica que los métodos create, remove y leaveGroup en el controlador también estén pasando correctamente el userId al servicio, ya que sus firmas también cambiaron.
Validación: Asegúrate de que el DTO sea el tercer parámetro en el método update del controlador para que coincida con el servicio.
Verificación Técnica: Una vez corregido, ejecuta los tests de integración de los controladores de grupos para confirmar que el status code sea 200/201 y no 400.
NO archives el cambio hasta que confirmes que la comunicación entre Controller y Service es íntegra.


/opsx-explore.prompt AUDITORÍA DE PRUEBAS UNITARIAS: Necesito planificar las historias US-T01 (Tests para Decorators) y US-T02 (Tests para Observers). Antes de proponer las specs, realiza un mapeo completo de los componentes que usan estos patrones:
Inventario de Decoradores (US-T01):
Busca todos los archivos en src/ que exporten funciones decoradoras (ej. @ContentModeration, decoradores de permisos, o de extracción de claims).
Identifica cuáles de estos tienen ya un archivo .spec.ts y cuáles no.
Inventario de Observers (US-T02):
Sujetos (Emitters): Identifica todos los servicios que inyectan EventEmitter2 y el MessagesGateway.
Observadores (Listeners): Busca todos los métodos decorados con @OnEvent() y los handlers de @SubscribeMessage().
Lista los archivos que requieren pruebas de "emisión" y los que requieren pruebas de "reacción".
Estado de los Mocks:
Verifica si existen utilidades de testing compartidas para mockear PrismaService o EventEmitter2 para evitar duplicación de código en los nuevos tests.
REPORTE: Entrégame una tabla de "Brecha de Cobertura" que muestre: Componente | Patrón | ¿Tiene Test? (SÍ/NO).


/opsx-propose.prompt unit-testing-patterns Actúa como Arquitecto de Software. Planifica la implementación de US-T01 (Tests de Decoradores) y US-T02 (Tests de Observers) para cubrir las brechas de cobertura detectadas. No escribas código aún, genera el plan completo (proposal, design, specs, tasks).
Requisitos de la Especificación:
US-T01 (Decoradores):
Objetivos: Crear tests unitarios para @RequireAll, @RequireAny, @AdminOnly y @GetClaim.
Estrategia: Seguir la regla de AGENTS.md: usar una DummyClass interna en cada archivo .spec.ts para testear el decorador de forma aislada de los controladores reales.
US-T02 (Observers):
Sujetos (Emitters): Implementar tests de emisión para GroupInvitationsService, ConnectionsService y completar los de MessagesService. Usar obligatoriamente jest.spyOn(eventEmitter, 'emit').
Observadores (Listeners): Implementar los tests de reacción para los 8 handlers de NotificationEventListener. Validar que cada evento dispare correctamente la creación de registros en Prisma.
Infraestructura de Pruebas (Deuda Técnica):
Diseñar una carpeta src/test/mocks/ con fábricas reutilizables (PrismaMock, EventEmitterMock) para eliminar la duplicación de mocks en los archivos .spec.ts.
Calidad: Exigir una cobertura del 100% en la lógica de estos patrones.
Genera los artefactos necesarios en openspec/changes/unit-testing-patterns/ respetando las reglas de tipado estricto.


/opsx-apply.prompt unit-testing-patterns
Por favor, implementa las historias de usuario US-T01 y US-T02 ejecutando sistemáticamente las 46 tareas del archivo tasks.md.
Directrices de implementación (Innegociables):
Infraestructura de Mocks: Comienza creando src/test/mocks/prisma.mock.ts y src/test/mocks/event-emitter.mock.ts. Estas fábricas deben estar estrictamente tipadas para evitar el uso de any en los archivos .spec.ts.
Pruebas de Decoradores (US-T01): Para @RequireAll, @RequireAny, @AdminOnly y @GetClaim, utiliza una DummyClass/DummyController interna en cada test. El objetivo es verificar que la metadata se adjunte correctamente sin necesidad de levantar guards reales.
Pruebas de Observers (US-T02):
Sujetos: En los servicios de invitaciones, conexiones y mensajes, usa jest.spyOn(eventEmitter, 'emit') para validar que los eventos se disparen con el Payload exacto definido en los contratos.
Observadores: Para NotificationEventListener, valida que cada handler reaccione llamando a los métodos correspondientes de PrismaService (create o createMany).
Programación Defensiva: Asegúrate de incluir escenarios de error en los listeners de notificaciones para verificar que un fallo en la BD no propague la excepción (usando resolves.not.toThrow()).
Al finalizar, ejecuta la suite de pruebas completa para garantizar que no hay regresiones y actualiza el AGENTS.md con el estado de cumplimiento.


/opsx-propose.prompt fix-all-test-regressions Actúa como un Ingeniero de QA y Arquitecto. El objetivo es estabilizar el 100% de la suite de pruebas del backend. Los logs muestran fallos masivos en tests antiguos por inyección de dependencias y lógica desactualizada.
Instrucciones de Reparación Crítica:
Migración a Mocks Globales: Actualiza todos los archivos .spec.ts que fallan (Permissions, Files, Users, Roles, etc.) para que utilicen las nuevas fábricas createPrismaMock() y createEventEmitterMock() de src/test/mocks/. Esto resolverá los errores de "Nest can't resolve dependencies".
Reparación de EventsService:
Corrige el test de findAll: ajusta la expectativa de toBeNull() a toEqual([]) si el servicio ahora retorna un array vacío por defecto.
Ajusta los tests de permisos para que coincidan con los códigos de error actuales (FORBIDDEN vs INVALID_ID).
Fix de FilesController/Service: Inyecta el S3Client mockeado en los tests de archivos y asegura que MessagesGateway y MessageRepository estén presentes en el TestingModule.
Fix de AppController: Corrige el error getHello is not a function. Verifica si el método fue renombrado o si el mock del controlador está mal instanciado.
Ajuste de Property-Based Testing: En multer-preservation.spec.ts, ajusta las expectativas de los strings (URL encoding) para que el test sea flexible con caracteres especiales como.
Verificación Total: Al terminar, el agente DEBE ejecutar npm test y no detenerse hasta que el reporte muestre "Tests: 0 failed, 228 total" (o el número total que corresponda).
Genera los artefactos de planificación antes de tocar el código para asegurar que no rompamos la lógica de negocio.


/opsx-apply.prompt fix-all-test-regressions
Por favor, procede con la estabilización de la suite de pruebas ejecutando las 57 tareas del archivo tasks.md. Tu objetivo es alcanzar 0 fallos en los 228 tests.
Protocolo de Reparación Crítica:
Migración de Mocks: En los archivos con errores de dependencias (Permissions, Files, Users, Roles), sustituye los mocks manuales por las fábricas createPrismaMock() y createEventEmitterMock() creadas en el paso anterior.
Sincronización de Contratos (EventsService): Si la lógica de negocio ahora devuelve [] en lugar de null, actualiza las expectativas del test. No cambies el código de producción, solo ajusta el test a la realidad actual del sistema.
Corrección de AppController: Verifica si getHello cambió de nombre en el controlador real y sincroniza el test.
Flexibilidad en PBT: En los tests de fast-check (Multer/Files), ajusta las validaciones para que acepten el encoding de URLs (ej. que %7B sea válido para {).
Validación Incremental: Después de cada grupo de tareas (especialmente el Grupo 1 y 2), ejecuta los tests específicos de esos archivos para asegurar que pasaron a verde antes de seguir.
Al finalizar, ejecuta npm test en todo el proyecto. No consideres la tarea completa hasta que el reporte muestre "0 failed". Actualiza el AGENTS.md con el éxito de la estabilización.