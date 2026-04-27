# Plan de Implementación

- [x] 1. Escribir test de exploración de condición de bug
  - **Property 1: Fault Condition** - Archivos con Espacios y Caracteres Especiales
  - **CRÍTICO**: Este test DEBE FALLAR en código no corregido - la falla confirma que el bug existe
  - **NO intentar arreglar el test o el código cuando falle**
  - **NOTA**: Este test codifica el comportamiento esperado - validará la corrección cuando pase después de la implementación
  - **OBJETIVO**: Generar contraejemplos que demuestren que el bug existe
  - **Enfoque PBT Acotado**: Para bugs determinísticos, acotar la propiedad a los casos concretos que fallan para asegurar reproducibilidad
  - Test de implementación de detalles de Fault Condition en diseño: archivos con espacios (`"mi archivo.pdf"`) y caracteres especiales (`"currículum.docx"`) causan errores NoSuchKey
  - Las aserciones del test deben coincidir con las Expected Behavior Properties del diseño: sanitización automática y descarga exitosa
  - Ejecutar test en código NO CORREGIDO
  - **RESULTADO ESPERADO**: Test FALLA (esto es correcto - prueba que el bug existe)
  - Documentar contraejemplos encontrados para entender la causa raíz
  - Marcar tarea completa cuando el test esté escrito, ejecutado, y la falla documentada
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Escribir tests de propiedades de preservación (ANTES de implementar la corrección)
  - **Property 2: Preservation** - Procesamiento de Nombres de Archivo Válidos
  - **IMPORTANTE**: Seguir metodología de observación primero
  - Observar comportamiento en código NO CORREGIDO para inputs no problemáticos
  - Escribir property-based tests capturando patrones de comportamiento observados de Preservation Requirements
  - Property-based testing genera muchos casos de test para garantías más fuertes
  - Ejecutar tests en código NO CORREGIDO
  - **RESULTADO ESPERADO**: Tests PASAN (esto confirma el comportamiento base a preservar)
  - Marcar tarea completa cuando los tests estén escritos, ejecutados, y pasando en código no corregido
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Corrección para bug de encoding de URLs S3

  - [x] 3.1 Implementar función de sanitización de nombres de archivo
    - Crear función privada `sanitizeFilename(filename: string): string` en FilesService
    - Implementar normalización NFD usando `filename.normalize('NFD')`
    - Aplicar regex `/[^a-zA-Z0-9.-]/g` para eliminar caracteres no alfanuméricos excepto puntos y guiones
    - Reemplazar espacios con guiones antes de aplicar regex
    - Preservar extensiones de archivo correctamente
    - Mantener tipado estricto sin usar `any` types
    - _Bug_Condition: isBugCondition(input) donde input.filename contiene espacios o caracteres especiales_
    - _Expected_Behavior: sanitización automática y descarga exitosa del diseño_
    - _Preservation: Preservation Requirements del diseño_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Modificar lógica de subida para usar sanitización
    - Actualizar método de subida (probablemente `uploadFile`) en FilesService
    - Aplicar `sanitizeFilename()` al nombre antes de crear S3 key
    - Usar nombre sanitizado como S3 Key para almacenamiento
    - Mantener nombre original para metadatos si es necesario
    - Asegurar tipado estricto sin `any` types
    - _Bug_Condition: isBugCondition(input) donde input.operation == 'upload'_
    - _Expected_Behavior: sanitización automática del diseño_
    - _Preservation: Preservation Requirements del diseño_
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Implementar decodificación en lógica de descarga
    - Actualizar método de descarga (probablemente `getPresignedUrl`) en FilesService
    - Envolver extracción de key con `decodeURIComponent(storedKey)`
    - Aplicar decodificación antes de generar URL prefirmada
    - Mantener compatibilidad con keys ya sanitizadas y archivos antiguos con `%20` en DB
    - Asegurar tipado estricto sin `any` types
    - _Bug_Condition: isBugCondition(input) donde input.operation == 'download' y stored_key contiene '%20'_
    - _Expected_Behavior: descarga exitosa del diseño_
    - _Preservation: Preservation Requirements del diseño_
    - _Requirements: 2.3, 2.4_

  - [x] 3.4 Verificar que el test de exploración de condición de bug ahora pasa
    - **Property 1: Expected Behavior** - Archivos con Espacios y Caracteres Especiales
    - **IMPORTANTE**: Re-ejecutar el MISMO test de la tarea 1 - NO escribir un test nuevo
    - El test de la tarea 1 codifica el comportamiento esperado
    - Cuando este test pase, confirma que el comportamiento esperado se satisface
    - Ejecutar test de exploración de condición de bug del paso 1
    - **RESULTADO ESPERADO**: Test PASA (confirma que el bug está corregido)
    - _Requirements: Expected Behavior Properties del diseño_

  - [x] 3.5 Verificar que los tests de preservación aún pasan
    - **Property 2: Preservation** - Procesamiento de Nombres de Archivo Válidos
    - **IMPORTANTE**: Re-ejecutar los MISMOS tests de la tarea 2 - NO escribir tests nuevos
    - Ejecutar property-based tests de preservación del paso 2
    - **RESULTADO ESPERADO**: Tests PASAN (confirma que no hay regresiones)
    - Confirmar que todos los tests aún pasan después de la corrección (sin regresiones)

- [x] 4. Checkpoint - Asegurar que todos los tests pasen
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.