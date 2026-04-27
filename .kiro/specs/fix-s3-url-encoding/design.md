# Fix S3 URL Encoding Bugfix Design

## Overview

Este diseño aborda el bug crítico FIX-04 donde archivos con espacios o caracteres especiales en sus nombres causan errores `NoSuchKey` en AWS S3. La estrategia de corrección implementa sanitización preventiva de nombres de archivo en el backend y decodificación explícita en el flujo de descarga para garantizar compatibilidad con archivos existentes.

## Glossary

- **Bug_Condition (C)**: La condición que desencadena el bug - cuando nombres de archivo contienen espacios o caracteres especiales que causan mismatch de URL encoding en S3
- **Property (P)**: El comportamiento deseado cuando se procesan archivos con nombres problemáticos - sanitización automática y descarga exitosa
- **Preservation**: Funcionalidad existente de subida/descarga para archivos con nombres válidos que debe mantenerse inalterada
- **FilesService**: El servicio en `src/files/files.service.ts` que maneja operaciones de archivos con S3
- **S3 Key**: El identificador único usado por AWS S3 para almacenar y recuperar objetos
- **URL Encoding**: Proceso de codificación de caracteres especiales en URLs (ej: espacio → `%20`)
- **NFD Normalization**: Normalización Unicode que separa caracteres con tildes en caracteres base + diacríticos

## Bug Details

### Fault Condition

El bug se manifiesta cuando un archivo con espacios o caracteres especiales es procesado por el sistema. El `FilesService` no sanitiza nombres de archivo durante la subida, causando que S3 keys contengan caracteres problemáticos, y no decodifica explícitamente las keys durante la descarga.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { filename: string, operation: 'upload' | 'download' }
  OUTPUT: boolean
  
  RETURN (input.filename CONTAINS ' ') OR 
         (input.filename CONTAINS_SPECIAL_CHARS ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ']) OR
         (input.operation == 'download' AND stored_key CONTAINS '%20')
END FUNCTION
```

### Examples

- **Upload con espacios**: `"mi archivo.pdf"` → se guarda como `"mi%20archivo.pdf"` en S3 → descarga falla con NoSuchKey
- **Upload con tildes**: `"currículum.docx"` → caracteres especiales causan problemas de encoding → descarga inconsistente
- **Descarga de archivo antiguo**: Key en DB contiene `"documento%20final.txt"` → S3 busca key literal con `%20` → NoSuchKey
- **Archivo válido**: `"documento-final.txt"` → funciona correctamente (debe preservarse)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Subida y descarga de archivos con nombres ya válidos (solo alfanuméricos y guiones) debe continuar funcionando exactamente igual
- Generación de URLs prefirmadas para archivos con nombres sanitizados debe mantener la funcionalidad actual
- Todas las demás operaciones del FilesService (listado, eliminación, metadatos) deben permanecer inalteradas

**Scope:**
Todos los inputs que NO involucran nombres de archivo con espacios o caracteres especiales deben ser completamente no afectados por esta corrección. Esto incluye:
- Archivos con nombres que solo contienen caracteres alfanuméricos y guiones
- Operaciones que no involucran nombres de archivo (configuración, autenticación)
- Funcionalidades de otros servicios que interactúan con FilesService

## Hypothesized Root Cause

Basado en la descripción del bug, los problemas más probables son:

1. **Falta de Sanitización en Upload**: El método de subida no procesa nombres de archivo antes de crear S3 keys
   - Los espacios se codifican automáticamente como `%20` por el navegador/cliente
   - Los caracteres especiales no se normalizan antes del almacenamiento

2. **Falta de Decodificación en Download**: El método de descarga no decodifica keys extraídas de la base de datos
   - `decodeURIComponent()` no se aplica a keys antes de generar URLs prefirmadas
   - S3 busca la key literal con `%20` en lugar de la key decodificada

3. **Inconsistencia de Encoding**: Mismatch entre cómo se almacenan las keys y cómo se buscan
   - Upload: key se almacena con encoding (`%20`)
   - Download: S3 espera key sin encoding (espacio literal)

4. **Ausencia de Normalización Unicode**: Caracteres con tildes no se procesan consistentemente
   - Diferentes navegadores pueden enviar diferentes representaciones Unicode
   - Falta normalización NFD para separar caracteres base de diacríticos

## Correctness Properties

Property 1: Fault Condition - File Upload and Download with Special Characters

_For any_ file upload where the filename contains spaces or special characters (isBugCondition returns true), the fixed FilesService SHALL sanitize the filename by replacing spaces with hyphens, normalizing Unicode characters, and removing non-alphanumeric characters before storing in S3, and SHALL successfully generate presigned URLs for download.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Valid Filename Processing

_For any_ file operation where the filename does NOT contain spaces or special characters (isBugCondition returns false), the fixed FilesService SHALL produce exactly the same behavior as the original service, preserving all existing functionality for files with valid names.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Asumiendo que nuestro análisis de causa raíz es correcto:

**File**: `src/files/files.service.ts`

**Function**: `FilesService` class methods

**Specific Changes**:
1. **Add Private Sanitization Method**: Crear función `sanitizeFilename(filename: string): string`
   - Implementar normalización NFD usando `filename.normalize('NFD')`
   - Aplicar regex `/[^a-zA-Z0-9.-]/g` para eliminar caracteres no alfanuméricos excepto puntos y guiones
   - Reemplazar espacios con guiones antes de la regex
   - Preservar extensiones de archivo correctamente

2. **Modify Upload Logic**: Actualizar método de subida (probablemente `uploadFile`)
   - Aplicar `sanitizeFilename()` al nombre antes de crear S3 key
   - Mantener el nombre original para metadatos si es necesario
   - Asegurar que el Key de S3 use el nombre sanitizado

3. **Modify Download Logic**: Actualizar método de descarga (probablemente `getPresignedUrl`)
   - Envolver extracción de key con `decodeURIComponent(storedKey)`
   - Aplicar decodificación antes de generar URL prefirmada
   - Mantener compatibilidad con keys ya sanitizadas

4. **Type Safety**: Mantener tipado estricto sin usar `any`
   - Definir interfaces para parámetros de archivo si no existen
   - Usar tipos específicos para S3 operations
   - Asegurar que todas las funciones tengan tipos de retorno explícitos

5. **Error Handling**: Agregar manejo robusto de errores
   - Validar que la sanitización no resulte en nombres vacíos
   - Manejar casos edge como archivos sin extensión
   - Preservar información de error original para debugging

## Testing Strategy

### Validation Approach

La estrategia de testing sigue un enfoque de dos fases: primero, generar contraejemplos que demuestren el bug en código no corregido, luego verificar que la corrección funciona correctamente y preserva el comportamiento existente.

### Exploratory Fault Condition Checking

**Goal**: Generar contraejemplos que demuestren el bug ANTES de implementar la corrección. Confirmar o refutar el análisis de causa raíz. Si refutamos, necesitaremos re-hipotetizar.

**Test Plan**: Escribir tests que simulen subida de archivos con nombres problemáticos y intenten generar URLs prefirmadas. Ejecutar estos tests en código NO CORREGIDO para observar fallas y entender la causa raíz.

**Test Cases**:
1. **Upload with Spaces Test**: Subir archivo `"mi documento.pdf"` (fallará en código no corregido)
2. **Upload with Accents Test**: Subir archivo `"currículum.docx"` (fallará en código no corregido)
3. **Download Legacy File Test**: Intentar descargar archivo con key `"archivo%20viejo.txt"` en DB (fallará en código no corregido)
4. **Mixed Characters Test**: Subir archivo `"reporte 2024 - versión final.xlsx"` (fallará en código no corregido)

**Expected Counterexamples**:
- URLs prefirmadas generan NoSuchKey errors en S3
- Posibles causas: falta de sanitización en upload, falta de decodificación en download, inconsistencia de encoding

### Fix Checking

**Goal**: Verificar que para todos los inputs donde la condición de bug se cumple, la función corregida produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := FilesService_fixed.processFile(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos los inputs donde la condición de bug NO se cumple, la función corregida produce el mismo resultado que la función original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT FilesService_original.processFile(input) = FilesService_fixed.processFile(input)
END FOR
```

**Testing Approach**: Property-based testing es recomendado para preservation checking porque:
- Genera muchos casos de test automáticamente a través del dominio de input
- Detecta casos edge que tests unitarios manuales podrían perder
- Proporciona garantías fuertes de que el comportamiento no cambia para todos los inputs no problemáticos

**Test Plan**: Observar comportamiento en código NO CORREGIDO primero para archivos con nombres válidos, luego escribir property-based tests capturando ese comportamiento.

**Test Cases**:
1. **Valid Filename Preservation**: Verificar que archivos como `"documento-final.pdf"` continúan funcionando igual
2. **Alphanumeric Only Preservation**: Verificar que archivos como `"report123.xlsx"` mantienen comportamiento exacto
3. **Extension Preservation**: Verificar que diferentes extensiones (`.pdf`, `.docx`, `.jpg`) se manejan igual
4. **Metadata Preservation**: Verificar que metadatos de archivo se preservan correctamente después de la corrección

### Unit Tests

- Test sanitización de nombres con espacios, tildes, y caracteres especiales
- Test preservación de extensiones durante sanitización
- Test decodificación de keys con `%20` y otros caracteres codificados
- Test casos edge (nombres vacíos, solo extensión, caracteres Unicode complejos)

### Property-Based Tests

- Generar nombres de archivo aleatorios y verificar que la sanitización produce nombres válidos
- Generar combinaciones de caracteres especiales y verificar comportamiento consistente
- Test que archivos con nombres ya válidos mantienen comportamiento idéntico a través de muchos escenarios

### Integration Tests

- Test flujo completo de subida y descarga con nombres problemáticos
- Test compatibilidad con archivos existentes en S3 con keys codificadas
- Test que URLs prefirmadas generadas funcionan correctamente con S3