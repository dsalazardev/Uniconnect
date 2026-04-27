# Bugfix Requirements Document

## Introduction

Este documento especifica los requisitos para corregir el bug crítico de infraestructura FIX-04: Error `NoSuchKey` en AWS S3 al intentar descargar archivos cuyos nombres contienen espacios o caracteres especiales (tildes). La causa raíz es un mismatch de URL encoding donde los espacios se guardan como `%20` en la base de datos, pero S3 espera la llave exacta (decodificada) o falla con NoSuchKey.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN un archivo con espacios en el nombre es subido al sistema THEN el sistema guarda la llave S3 con codificación URL (`%20`) en la base de datos

1.2 WHEN se solicita una URL prefirmada para descargar un archivo con espacios THEN S3 retorna error `NoSuchKey` porque busca la llave codificada en lugar de la decodificada

1.3 WHEN un archivo contiene caracteres especiales como tildes (á, é, í, ó, ú, ñ) THEN el sistema permite nombres que causan problemas de codificación en S3

1.4 WHEN se intenta descargar archivos antiguos con nombres que contienen `%20` en la base de datos THEN el sistema falla al generar URLs prefirmadas válidas

### Expected Behavior (Correct)

2.1 WHEN un archivo con espacios en el nombre es subido al sistema THEN el sistema SHALL sanitizar el nombre reemplazando espacios por guiones antes de guardarlo en S3

2.2 WHEN se solicita una URL prefirmada para descargar cualquier archivo THEN el sistema SHALL decodificar explícitamente la llave extraída de la base de datos usando `decodeURIComponent`

2.3 WHEN un archivo contiene caracteres especiales como tildes THEN el sistema SHALL normalizar el nombre eliminando tildes y caracteres no alfanuméricos

2.4 WHEN se procesa cualquier nombre de archivo para subida THEN el sistema SHALL aplicar sanitización obligatoria usando normalización NFD y regex para limpieza

### Unchanged Behavior (Regression Prevention)

3.1 WHEN se suben archivos con nombres ya válidos (solo caracteres alfanuméricos y guiones) THEN el sistema SHALL CONTINUE TO procesarlos correctamente sin modificaciones

3.2 WHEN se generan URLs prefirmadas para archivos con nombres ya sanitizados THEN el sistema SHALL CONTINUE TO funcionar correctamente

3.3 WHEN se accede a archivos existentes con nombres válidos THEN el sistema SHALL CONTINUE TO mantener la funcionalidad de descarga sin interrupciones

3.4 WHEN se utilizan todas las demás funcionalidades del servicio de archivos THEN el sistema SHALL CONTINUE TO operar normalmente sin afectar otros flujos