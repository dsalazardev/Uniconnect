# Reglas del Sistema de Contexto Autónomo para Agentes IA

## 🎯 DIRECTIVA DE ACTUALIZACIÓN CONTINUA

> **OBLIGATORIO PARA TODOS LOS AGENTES**: Al finalizar cualquier Historia de Usuario (HU), refactorización o cambio en el esquema de base de datos, el Agente TIENE LA OBLIGACIÓN de abrir `AGENTS.md` y actualizar el mapa de entidades, la estructura de carpetas o las reglas de negocio si sufrieron modificaciones, antes de dar por terminada la tarea.

## 📋 PROTOCOLO DE TRABAJO OBLIGATORIO

### 1. ANTES DE INICIAR CUALQUIER TAREA
- [ ] Leer completamente `AGENTS.md`
- [ ] Identificar las entidades y módulos involucrados
- [ ] Verificar las reglas de ingeniería estrictas aplicables
- [ ] Confirmar el tech stack y patrones arquitectónicos

### 2. DURANTE EL DESARROLLO
- [ ] Seguir estrictamente las reglas de tipado (CERO `any`)
- [ ] Implementar programación defensiva (try/catch + excepciones NestJS)
- [ ] Usar UniconnectLogger Singleton para logging
- [ ] Validar con class-validator en DTOs (Backend)
- [ ] Seguir arquitectura MVC Local (Frontend)

### 3. AL FINALIZAR LA TAREA
- [ ] Verificar si se modificaron entidades Prisma
- [ ] Verificar si se crearon nuevos módulos o features
- [ ] Verificar si cambiaron reglas de negocio
- [ ] **ACTUALIZAR `AGENTS.md`** si es necesario
- [ ] Confirmar que el código sigue los patrones establecidos

## 🚨 TRIGGERS DE ACTUALIZACIÓN OBLIGATORIA

### Cambios que REQUIEREN actualización del contexto:

#### 🗄️ **Base de Datos (Prisma)**
- Nuevos modelos en `prisma/schema/`
- Modificación de relaciones entre entidades
- Cambios en campos o tipos de datos
- Nuevas migraciones

#### 🏗️ **Backend (NestJS)**
- Nuevos módulos en `src/`
- Nuevos controllers, services o guards
- Cambios en sistema de autenticación
- Nuevos decoradores o middlewares
- Modificación de DTOs importantes

#### 🎨 **Frontend (React Native)**
- Nuevas features en `src/features/`
- Nuevos stores (MobX/Zustand)
- Cambios en navegación o routing
- Nuevos hooks personalizados
- Modificación de servicios HTTP

#### 🔐 **Seguridad y Permisos**
- Nuevos roles o permisos
- Cambios en guards o decoradores
- Modificación de claims JWT
- Nuevas validaciones de acceso

#### 📱 **Funcionalidades de Negocio**
- Nuevos flujos de trabajo
- Cambios en reglas de negocio
- Nuevas integraciones (Auth0, AWS S3, etc.)
- Modificación de eventos WebSocket

## 📝 FORMATO DE ACTUALIZACIÓN

### Estructura del Commit de Actualización:
```
feat/fix: [Descripción del cambio]

- Implementado: [Lista de cambios]
- Actualizado AGENTS.md:
  - Sección: [Nombre de la sección]
  - Cambios: [Descripción específica]
```

### Secciones del AGENTS.md a Actualizar:

1. **🏗️ Tech Stack** - Nuevas dependencias o versiones
2. **📊 Mapa de Entidades** - Cambios en Prisma Schema
3. **🏛️ Arquitectura de Módulos Backend** - Nuevos módulos NestJS
4. **🔐 Sistema de Autenticación** - Cambios en auth/permisos
5. **🔄 Flujos Principales** - Nuevos workflows o endpoints
6. **🎨 Arquitectura Frontend** - Nuevas features o stores
7. **🛠️ Reglas de Negocio** - Nuevas validaciones o restricciones
8. **📝 Patrones Arquitectónicos** - Nuevos patrones implementados
9. **🚀 Configuración y Deployment** - Nuevas variables de entorno

## ⚡ AUTOMATIZACIÓN CON SCRIPT

El script `scripts/generate-context.js` puede ayudar a automatizar la actualización del mapa de entidades:

```bash
# Ejecutar después de cambios en Prisma
cd Uniconnect-Backend-Core
node scripts/generate-context.js
```

## 🎯 RESPONSABILIDADES DEL AGENTE

### ✅ DEBE HACER:
- Leer `AGENTS.md` antes de cada tarea
- Seguir las reglas de ingeniería estrictas
- Actualizar el contexto cuando sea necesario
- Mantener la consistencia arquitectónica
- Documentar cambios significativos

### ❌ NO DEBE HACER:
- Ignorar las reglas de tipado estricto
- Crear código sin validación defensiva
- Modificar arquitectura sin actualizar contexto
- Usar patrones inconsistentes con el proyecto
- Dejar el contexto desactualizado

## 🔍 VERIFICACIÓN DE CUMPLIMIENTO

### Checklist Final:
- [ ] ¿Se siguieron las reglas de ingeniería estrictas?
- [ ] ¿Se actualizó `AGENTS.md` si fue necesario?
- [ ] ¿El código es consistente con la arquitectura existente?
- [ ] ¿Se documentaron los cambios apropiadamente?
- [ ] ¿Se mantuvieron los patrones establecidos?

---

**Nota**: Este sistema garantiza que cualquier agente IA que trabaje en el proyecto tenga acceso inmediato a la información arquitectónica actualizada, manteniendo la coherencia y calidad del código a lo largo del tiempo.