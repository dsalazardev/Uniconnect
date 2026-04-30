# 🎨 AUDITORÍA VISUAL Y ESTRUCTURAL - FRONTEND UNICONNECT

> **Fecha**: 30 de Abril, 2026  
> **Objetivo**: Mapear el sistema de diseño actual del frontend React Native/Expo para alimentar el MCP de Stitch  
> **Estado**: ✅ COMPLETADO - Solo diagnóstico, sin modificaciones al código

---

## 📋 RESUMEN EJECUTIVO

El frontend de Uniconnect utiliza **React Native 0.81.x con Expo 54.x** y **NO implementa una librería UI externa** (no hay NativeBase, Paper, Gluestack, Tamagui, etc.). Todo el sistema de diseño está construido con **StyleSheet nativo de React Native** y componentes personalizados.

### Stack Tecnológico UI
- **Framework**: React Native 0.81.x + Expo 54.x
- **Navegación**: Expo Router 6.x (file-based routing)
- **Iconografía**: `@expo/vector-icons` (Ionicons)
- **Gradientes**: `expo-linear-gradient`
- **Blur Effects**: `expo-blur`
- **Toasts**: `react-native-toast-message`
- **Estado**: MobX 6.x + Zustand 5.x (híbrido)
- **Tipografía**: `@expo-google-fonts/roboto`

---

## 🎨 TOKENS DE DISEÑO IDENTIFICADOS

### 1. PALETA DE COLORES

#### Colores Primarios
```typescript
// Gold/Dorado - Color principal de la marca
#D9B97E  // Gold principal (botones, badges, acentos)
rgba(217, 185, 126, 0.25)  // Gold 25% (backgrounds)
rgba(217, 185, 126, 0.2)   // Gold 20% (borders)
rgba(217, 185, 126, 0.15)  // Gold 15% (active states)
rgba(217, 185, 126, 0.1)   // Gold 10% (hover)
rgba(217, 185, 126, 0.08)  // Gold 8% (subtle backgrounds)
rgba(217, 185, 126, 0.05)  // Gold 5% (very subtle)
```

#### Colores de Fondo
```typescript
// Backgrounds oscuros
#0d0d0d  // Header background (muy oscuro)
#1a1a1a  // Card background (oscuro)
rgba(26, 26, 26, 0.9)  // Card background con transparencia
#000000  // Background principal (negro puro)
```

#### Colores de Texto
```typescript
#ffffff  // Texto principal (blanco)
#D9B97E  // Texto destacado (gold)
#888888  // Texto secundario (gris medio)
#666666  // Texto terciario (gris oscuro)
#999999  // Texto de metadatos (gris claro)
```

#### Colores Semánticos
```typescript
// Success (Verde)
#22C55E  // Success principal
#28a745  // Success alternativo
rgba(34, 197, 94, 0.08)  // Success background

// Error (Rojo)
#EF4444  // Error principal
#ff4d4d  // Error alternativo
#FCA5A5  // Error text
rgba(239, 68, 68, 0.15)  // Error background
rgba(239, 68, 68, 0.3)   // Error border

// Warning (Naranja)
#F97316  // Warning principal
#fd7e14  // Warning alternativo
rgba(249, 115, 22, 0.25)  // Warning background
rgba(249, 115, 22, 0.2)   // Warning border

// Info (Azul)
#38BDF8  // Info principal
#0056b3  // Info alternativo
rgba(56, 189, 248, 0.08)  // Info background
#64c8ff  // Info text (admin badge)
rgba(100, 200, 255, 0.2)  // Info badge background

// Purple (Transferencia)
#A78BFA  // Purple principal
#6f42c1  // Purple alternativo
rgba(167, 139, 250, 0.08)  // Purple background
rgba(167, 139, 250, 0.4)   // Purple border

// Teal (Deportivo)
#20c997  // Teal principal

// Pink (Cultural)
#e83e8c  // Pink principal
```

#### Colores por Tipo de Evento
```typescript
const eventTypeColors = {
  CONFERENCIA: '#0056b3',   // Azul oscuro
  TALLER: '#28a745',        // Verde
  SEMINARIO: '#6f42c1',     // Púrpura
  COMPETENCIA: '#fd7e14',   // Naranja
  CULTURAL: '#e83e8c',      // Rosa
  DEPORTIVO: '#20c997',     // Teal
};
```

### 2. TIPOGRAFÍA

#### Font Family
```typescript
// Fuente principal: Roboto (Google Fonts)
import { useFonts, Roboto_400Regular, Roboto_700Bold } from '@expo-google-fonts/roboto';

// Fallback: System fonts
fontFamily: 'System'  // iOS: San Francisco, Android: Roboto
```

#### Font Sizes
```typescript
// Jerarquía de tamaños identificada
fontSize: 10  // Badges pequeños, metadatos
fontSize: 11  // Texto secundario, emails
fontSize: 12  // Texto terciario, subtítulos
fontSize: 13  // Texto de cuerpo pequeño
fontSize: 14  // Texto de cuerpo estándar
fontSize: 15  // Títulos de sección
fontSize: 16  // Títulos de tarjetas
fontSize: 18  // Títulos principales
fontSize: 20  // Títulos grandes
fontSize: 24  // Iconos grandes
```

#### Font Weights
```typescript
fontWeight: '400'  // Regular (texto de cuerpo)
fontWeight: '500'  // Medium (texto destacado)
fontWeight: '600'  // Semi-bold (títulos secundarios)
fontWeight: '700'  // Bold (títulos principales, badges)
```

### 3. ESPACIADO Y LAYOUT

#### Padding/Margin
```typescript
// Sistema de espaciado en múltiplos de 4
2, 3, 4, 6, 8, 10, 12, 14, 16, 20, 24, 48

// Patrones comunes
padding: 12  // Padding de tarjetas
paddingHorizontal: 16  // Padding horizontal de contenedores
paddingVertical: 24  // Padding vertical de secciones
gap: 6, 8, 12  // Espaciado entre elementos (Flexbox gap)
```

#### Border Radius
```typescript
// Sistema de redondeo
borderRadius: 4   // Badges pequeños
borderRadius: 6   // Botones pequeños
borderRadius: 8   // Tarjetas, inputs
borderRadius: 9   // Badges medianos
borderRadius: 10  // Tarjetas principales
borderRadius: 11  // Badges de conteo
borderRadius: 17  // Botones circulares pequeños (34x34)
borderRadius: 20  // Chips de selector
borderRadius: 22  // Avatares (44x44)
```

#### Border Width
```typescript
borderWidth: 1     // Bordes estándar
borderWidth: 1.5   // Bordes destacados (botones)
```

### 4. SOMBRAS Y ELEVACIÓN

**Nota**: El proyecto **NO utiliza sombras** (shadows). La jerarquía visual se logra mediante:
- Colores de fondo con diferentes opacidades
- Bordes con colores semánticos
- Transparencias (rgba)

### 5. ICONOGRAFÍA

#### Librería: @expo/vector-icons (Ionicons)
```typescript
// Iconos más utilizados
'people'              // Grupos
'person-outline'      // Usuarios
'calendar-outline'    // Eventos
'notifications'       // Notificaciones
'create-outline'      // Editar
'trash-outline'       // Eliminar
'add'                 // Crear
'checkmark'           // Confirmar
'close'               // Cerrar
'star'                // Propietario
'shield-checkmark'    // Admin
'chatbubble-outline'  // Mensajes
'send'                // Enviar
'alert-circle'        // Error
'information-circle'  // Info
```

#### Tamaños de Iconos
```typescript
size: 14  // Iconos pequeños (badges)
size: 16  // Iconos de metadatos
size: 22  // Iconos de botones
size: 24  // Iconos de tarjetas
size: 32  // Iconos grandes
```

---

## 🏗️ ARQUITECTURA DE COMPONENTES

### Estructura de Carpetas (Feature-Based)
```
src/
├── components/                    # Componentes globales
│   ├── AppRoot.tsx               # Root component
│   ├── ConfirmModal.tsx          # Modal de confirmación
│   ├── Navbar.tsx                # Barra de navegación
│   ├── FileUploadComponent.tsx   # Subida de archivos
│   └── elements/                 # Elementos reutilizables
│       ├── canonical/            # Componentes canónicos
│       └── demo/                 # Demos de componentes
├── features/                      # Features por dominio (MVC Local)
│   ├── auth/                     # Autenticación
│   │   ├── components/           # Vista (V)
│   │   ├── hooks/                # Controlador (C)
│   │   ├── stores/               # Modelo (M) - MobX
│   │   ├── services/             # API Layer
│   │   ├── types/                # TypeScript interfaces
│   │   └── controllers/          # Business logic
│   ├── events/                   # Eventos académicos
│   │   ├── components/           # EventCard, EventList, EventFilters
│   │   ├── store/                # EventsStore (MobX)
│   │   ├── services/             # EventsService
│   │   ├── types/                # Event, EventType, EventFilters
│   │   └── api/                  # Endpoints
│   ├── groups/                   # Grupos de estudio
│   │   ├── components/           # GroupCard, CreateGroup, EditGroup
│   │   ├── hooks/                # useGroups, useMyGroups
│   │   ├── store/                # GroupAdminStore (MobX)
│   │   ├── services/             # GroupsService
│   │   └── types/                # Group, Membership
│   ├── messages/                 # Chat en tiempo real
│   │   ├── components/           # ChatScreen, MessageBubble
│   │   ├── hooks/                # useChat
│   │   ├── services/             # WebSocketService, MessagesService
│   │   └── types/                # Message
│   ├── students/                 # Comunidad de estudiantes
│   │   ├── components/           # StudentCard
│   │   ├── hooks/                # useCommunityLists
│   │   └── services/             # StudentService
│   ├── connections/              # Red social
│   │   ├── components/           # ConnectionCard
│   │   ├── hooks/                # useConnections
│   │   └── services/             # ConnectionsService
│   ├── notifications/            # Notificaciones push
│   │   ├── components/           # NotificationCard
│   │   ├── hooks/                # useNotifications
│   │   ├── store/                # NotificationStore (MobX)
│   │   └── services/             # NotificationsService
│   ├── courses/                  # Cursos académicos
│   ├── programs/                 # Programas académicos
│   └── files/                    # Gestión de archivos
├── constants/                     # Constantes globales
│   └── api.ts                    # Configuración de Axios
├── hooks/                         # Hooks globales
│   └── useResponsive.ts          # Hook de responsive
├── types/                         # Tipos globales
│   └── files.ts                  # Tipos de archivos
└── lib/                           # Utilidades
    ├── toast.ts                  # Toast notifications
    └── fileService.ts            # Servicio de archivos
```

### Navegación (Expo Router - File-Based)
```
app/
├── _layout.tsx                    # Root layout
├── (auth)/                        # Auth group
│   ├── login.tsx                 # Pantalla de login
│   └── onboarding.tsx            # Onboarding
├── (tabs)/                        # Tab navigation
│   ├── _layout.tsx               # Tab layout
│   ├── index.tsx                 # Home
│   ├── events.tsx                # Eventos
│   ├── groups.tsx                # Grupos
│   ├── community.tsx             # Comunidad
│   ├── connections.tsx           # Conexiones
│   ├── notifications.tsx         # Notificaciones
│   ├── profile.tsx               # Perfil propio
│   └── student-profile.tsx       # Perfil de estudiante
├── groups/                        # Dynamic routes
│   └── [id].tsx                  # Detalle de grupo
└── events/                        # Dynamic routes
    └── [id].tsx                  # Detalle de evento
```

---

## 🧩 COMPONENTES PRINCIPALES

### 1. EventCard
**Ubicación**: `src/features/events/components/EventCard.tsx`

**Tokens utilizados**:
- **Colores**: Event type colors, gold (#D9B97E), white text
- **Tipografía**: fontSize 14-16, fontWeight 600-700
- **Espaciado**: padding 12, borderRadius 10
- **Iconos**: Ionicons (calendar, location, time)

**Patrón de diseño**:
```typescript
// Card con badge de tipo de evento
<TouchableOpacity style={styles.card}>
  <View style={[styles.typeBadge, { backgroundColor: eventTypeColor }]}>
    <Text style={styles.typeText}>{eventType}</Text>
  </View>
  {/* Contenido del evento */}
</TouchableOpacity>
```

### 2. GroupCard
**Ubicación**: `src/features/groups/components/GroupCard.tsx`

**Tokens utilizados**:
- **Colores**: Gold (#D9B97E), dark backgrounds (#1a1a1a), red (#ff4d4d)
- **Tipografía**: fontSize 12-16, fontWeight 500-700
- **Espaciado**: padding 12, gap 8, borderRadius 10
- **Iconos**: people, create-outline, trash-outline, star, shield-checkmark

**Patrón de diseño**:
```typescript
// Card con header, descripción y footer
<TouchableOpacity style={styles.card}>
  <View style={styles.header}>
    <Ionicons name="people" color="#D9B97E" />
    {/* Acciones condicionales (owner/admin) */}
  </View>
  <Text style={styles.description}>{description}</Text>
  <View style={styles.footer}>
    {/* Badges de rol */}
  </View>
</TouchableOpacity>
```

### 3. StudentCard
**Ubicación**: `src/features/students/components/StudentCard.tsx`

**Tokens utilizados**:
- **Colores**: Gold (#D9B97E), white text, gray text (#888, #666)
- **Tipografía**: fontSize 12-16, fontWeight 500-700
- **Espaciado**: padding 12, borderRadius 10
- **Iconos**: person-outline, chatbubble-outline

**Patrón de diseño**:
```typescript
// Card con avatar, info y botón de chat
<TouchableOpacity style={styles.card}>
  <Image source={{ uri: picture }} style={styles.avatar} />
  <View style={styles.infoContainer}>
    <Text style={styles.name}>{full_name}</Text>
    <Text style={styles.program}>{program}</Text>
    <Text style={styles.semester}>Semestre {current_semester}</Text>
  </View>
  {/* Botón de chat condicional */}
</TouchableOpacity>
```

### 4. GroupAdminPanel (Estilos Compartidos)
**Ubicación**: `src/features/groups/components/GroupAdmin/styles.ts`

**Tokens utilizados**:
- **Colores primarios**: #1a1a1a (fondo), #D9B97E (gold), #0d0d0d (header)
- **Colores semánticos**: 
  - Success: #22C55E
  - Error: #EF4444, #FCA5A5
  - Warning: #F97316
  - Info: #38BDF8, #64c8ff
  - Purple: #A78BFA
- **Tipografía**: fontSize 10-15, fontWeight 500-700
- **Espaciado**: padding 12-16, gap 6-8, borderRadius 4-22
- **Badges**: Contadores, roles (owner, admin)

**Patrón de diseño**:
```typescript
// Sistema de estilos compartidos para subcomponentes
export const adminStyles = StyleSheet.create({
  // Layout
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginTop: 20, marginHorizontal: 16 },
  
  // Cards
  requestCard: { backgroundColor: 'rgba(26, 26, 26, 0.9)', borderRadius: 10 },
  memberCard: { backgroundColor: 'rgba(26, 26, 26, 0.9)', borderRadius: 10 },
  
  // Badges
  countBadge: { minWidth: 22, height: 22, borderRadius: 11 },
  ownerBadge: { backgroundColor: 'rgba(217, 185, 126, 0.25)' },
  adminBadge: { backgroundColor: 'rgba(100, 200, 255, 0.2)' },
  
  // Buttons
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5 },
  acceptBtn: { borderColor: '#22C55E', backgroundColor: 'rgba(34, 197, 94, 0.08)' },
  rejectBtn: { borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' },
});
```

---

## 🎭 PATRONES DE DISEÑO IDENTIFICADOS

### 1. Dark Theme Consistente
- **Background principal**: Negro puro (#000000)
- **Cards**: Gris muy oscuro (#1a1a1a) con transparencia
- **Headers**: Gris ultra oscuro (#0d0d0d)
- **Texto**: Blanco (#ffffff) con variaciones en gris para jerarquía

### 2. Gold Accent System
- **Color principal**: #D9B97E (dorado)
- **Uso**: Botones primarios, badges, iconos destacados, texto de énfasis
- **Variaciones**: Opacidades del 5% al 25% para backgrounds y borders

### 3. Semantic Color System
- **Success**: Verde (#22C55E, #28a745)
- **Error**: Rojo (#EF4444, #ff4d4d, #FCA5A5)
- **Warning**: Naranja (#F97316, #fd7e14)
- **Info**: Azul (#38BDF8, #0056b3, #64c8ff)
- **Purple**: Púrpura (#A78BFA, #6f42c1) - Transferencias

### 4. Card-Based Layout
- **Patrón**: Todas las entidades (eventos, grupos, estudiantes) usan tarjetas
- **Estructura**: Header + Content + Footer
- **Interacción**: TouchableOpacity con activeOpacity={0.7}
- **Bordes**: borderRadius 10, borderWidth 1

### 5. Badge System
- **Tipos**: Contadores, roles, estados
- **Forma**: Circular (borderRadius 50%) o redondeado (borderRadius 4-11)
- **Colores**: Semánticos según contexto
- **Tamaño**: minWidth 18-22, height 18-22

### 6. Icon-First Design
- **Uso**: Todos los botones y acciones tienen iconos
- **Librería**: Ionicons de @expo/vector-icons
- **Tamaños**: 14-32px según contexto
- **Colores**: Semánticos o gold (#D9B97E)

### 7. Conditional Rendering (Role-Based)
- **Patrón**: Botones de editar/eliminar solo visibles para owner/admin
- **Implementación**: Computed properties con authStore
- **Ejemplo**: `shouldShowEditButton = currentUser.role === 'superadmin' || event.created_by === currentUser.id_user`

### 8. Loading States
- **Componente**: `<ActivityIndicator />` de React Native
- **Colores**: Gold (#D9B97E) o semánticos
- **Ubicación**: Centrado en contenedores o inline en botones

### 9. Empty States
- **Patrón**: Icono + Texto descriptivo
- **Colores**: Gris (#666) para texto
- **Espaciado**: paddingVertical 24, gap 8

### 10. Error Handling
- **Patrón**: Banner con icono + mensaje + botón de retry
- **Colores**: Rojo (#EF4444, #FCA5A5) con backgrounds transparentes
- **Interacción**: Alert.alert() para confirmaciones

---

## 📦 ASSETS VISUALES

### Ubicación: `/assets`
```
assets/
├── Logo_de_la_Universidad_de_Caldas.svg.png  # Logo institucional (134KB)
├── favicon.png                                # Favicon (1.4KB)
├── icon.png                                   # App icon (22KB)
├── splash-icon.png                            # Splash screen (17KB)
└── adaptive-icon.png                          # Android adaptive icon (17KB)
```

### Características de Assets
- **Logo institucional**: PNG de alta resolución (134KB)
- **Iconos de app**: PNG optimizados (17-22KB)
- **Favicon**: PNG pequeño (1.4KB)
- **No hay iconografía SVG**: Solo PNG

---

## 🔧 CONFIGURACIÓN TÉCNICA

### 1. Axios Configuration
**Ubicación**: `src/constants/api.ts`

**Características**:
- **Base URL**: `process.env.EXPO_PUBLIC_API_URL` (fallback: `http://10.146.13.164:8007/api`)
- **WebSocket URL**: Base URL sin `/api`
- **Timeout**: 10 segundos
- **Interceptors**: JWT Bearer token + refresh automático (FIX-10)
- **Error Handling**: 401 con mutex & promise queueing

### 2. Estado Global
**Stores (MobX)**:
- `AuthStore` - Sesión, tokens, usuario
- `EventsStore` - Eventos, filtros
- `NotificationStore` - Notificaciones, contador
- `GroupAdminStore` - Administración de grupos

**Hooks (Zustand)**: No identificados en la auditoría actual

### 3. Navegación
**Expo Router 6.x** (file-based routing):
- **Auth group**: `(auth)/` - Login, Onboarding
- **Tab navigation**: `(tabs)/` - Home, Events, Groups, Community, etc.
- **Dynamic routes**: `groups/[id].tsx`, `events/[id].tsx`

---

## 🚨 OBSERVACIONES Y RECOMENDACIONES

### ✅ Fortalezas
1. **Consistencia visual**: Paleta de colores coherente en todo el proyecto
2. **Arquitectura clara**: Feature-based con MVC local bien definido
3. **Tipado estricto**: Zero-Any policy implementada
4. **Componentes reutilizables**: Patrón de cards y badges consistente
5. **Dark theme**: Implementación completa y coherente
6. **Iconografía**: Uso consistente de Ionicons

### ⚠️ Áreas de Mejora
1. **No hay sistema de tokens centralizado**: Colores y espaciados están hardcodeados en cada componente
2. **Falta de theme provider**: No hay un contexto de tema global
3. **Estilos duplicados**: Muchos componentes repiten los mismos estilos
4. **No hay design system documentation**: Falta documentación formal del sistema de diseño
5. **Assets limitados**: Solo PNG, no hay SVG para iconografía personalizada
6. **No hay responsive breakpoints**: Falta sistema de breakpoints para diferentes tamaños de pantalla

### 💡 Recomendaciones para Stitch MCP
1. **Crear archivo de tokens**: `src/constants/tokens.ts` con colores, tipografía, espaciado
2. **Implementar ThemeProvider**: Contexto de tema con soporte para light/dark mode
3. **Centralizar estilos comunes**: `src/styles/common.ts` con estilos reutilizables
4. **Documentar componentes**: Agregar Storybook o similar para documentación visual
5. **Optimizar assets**: Convertir PNG a SVG donde sea posible
6. **Implementar responsive system**: Breakpoints y utilidades responsive

---

## 📊 MÉTRICAS DEL PROYECTO

### Componentes Auditados
- **Features**: 10 (auth, events, groups, messages, students, connections, notifications, courses, programs, files)
- **Componentes globales**: 4 (AppRoot, ConfirmModal, Navbar, FileUploadComponent)
- **Screens**: 13 (login, onboarding, home, events, groups, community, connections, notifications, profile, student-profile, event-detail, group-detail)
- **Stores (MobX)**: 4 (AuthStore, EventsStore, NotificationStore, GroupAdminStore)

### Tokens Identificados
- **Colores**: 50+ (primarios, semánticos, variaciones)
- **Font sizes**: 12 tamaños (10-24px)
- **Font weights**: 4 pesos (400, 500, 600, 700)
- **Border radius**: 8 valores (4-22px)
- **Espaciado**: 12 valores (2-48px)
- **Iconos**: 20+ iconos de Ionicons

### Dependencias UI
- **@expo/vector-icons**: ^15.0.3
- **expo-linear-gradient**: ~15.0.8
- **expo-blur**: ~15.0.8
- **react-native-toast-message**: ^2.3.3
- **@expo-google-fonts/roboto**: ^0.4.3

---

## 🎯 CONCLUSIÓN

El frontend de Uniconnect tiene un **sistema de diseño implícito bien definido** pero **no centralizado**. La paleta de colores, tipografía y patrones de componentes son consistentes, pero están dispersos en múltiples archivos StyleSheet.

**Para alimentar el MCP de Stitch**, se recomienda:
1. Extraer todos los tokens a un archivo centralizado
2. Crear un theme provider con soporte para variaciones
3. Documentar los patrones de componentes identificados
4. Establecer guidelines para nuevos componentes

**Estado del proyecto**: ✅ **LISTO PARA STITCH MCP** - El sistema de diseño está bien definido y puede ser mapeado a tokens de Stitch.

---

**Auditoría realizada por**: Kiro AI Agent  
**Fecha**: 30 de Abril, 2026  
**Versión del documento**: 1.0.0
