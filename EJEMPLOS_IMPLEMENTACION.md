# 💻 EJEMPLOS DE IMPLEMENTACIÓN - DESIGN SYSTEM

> **Propósito**: Código de ejemplo para implementar el sistema de diseño centralizado  
> **Uso**: Copy-paste ready para acelerar la implementación  
> **Fecha**: 30 de Abril, 2026

---

## 📁 ESTRUCTURA DE ARCHIVOS PROPUESTA

```
src/
├── constants/
│   ├── tokens.ts              # Todos los tokens centralizados
│   ├── colors.ts              # Paleta de colores
│   ├── typography.ts          # Escalas de tipografía
│   ├── spacing.ts             # Sistema de espaciado
│   └── shadows.ts             # Sombras (futuro)
├── theme/
│   ├── ThemeContext.tsx       # Context API para tema
│   ├── ThemeProvider.tsx      # Provider component
│   ├── useTheme.ts            # Hook personalizado
│   └── types.ts               # TypeScript types
└── components/
    └── ui/                    # Componentes base reutilizables
        ├── Card.tsx
        ├── Badge.tsx
        ├── Button.tsx
        ├── Avatar.tsx
        └── index.ts
```

---

## 🎨 1. TOKENS CENTRALIZADOS

### `src/constants/colors.ts`
```typescript
/**
 * Color Palette - Uniconnect Design System
 * Extracted from frontend audit (April 30, 2026)
 */

export const colors = {
  // Primary Colors
  primary: {
    gold: '#D9B97E',
    gold25: 'rgba(217, 185, 126, 0.25)',
    gold20: 'rgba(217, 185, 126, 0.2)',
    gold15: 'rgba(217, 185, 126, 0.15)',
    gold10: 'rgba(217, 185, 126, 0.1)',
    gold8: 'rgba(217, 185, 126, 0.08)',
    gold5: 'rgba(217, 185, 126, 0.05)',
  },

  // Background Colors
  background: {
    primary: '#000000',
    header: '#0d0d0d',
    card: '#1a1a1a',
    cardTransparent: 'rgba(26, 26, 26, 0.9)',
  },

  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: '#888888',
    tertiary: '#666666',
    metadata: '#999999',
    accent: '#D9B97E',
  },

  // Semantic Colors
  semantic: {
    success: {
      base: '#22C55E',
      alt: '#28a745',
      background: 'rgba(34, 197, 94, 0.08)',
    },
    error: {
      base: '#EF4444',
      alt: '#ff4d4d',
      text: '#FCA5A5',
      background: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.3)',
    },
    warning: {
      base: '#F97316',
      alt: '#fd7e14',
      background: 'rgba(249, 115, 22, 0.25)',
      border: 'rgba(249, 115, 22, 0.2)',
    },
    info: {
      base: '#38BDF8',
      alt: '#0056b3',
      text: '#64c8ff',
      background: 'rgba(56, 189, 248, 0.08)',
      badgeBackground: 'rgba(100, 200, 255, 0.2)',
    },
    purple: {
      base: '#A78BFA',
      alt: '#6f42c1',
      background: 'rgba(167, 139, 250, 0.08)',
      border: 'rgba(167, 139, 250, 0.4)',
    },
  },

  // Event Type Colors
  eventTypes: {
    CONFERENCIA: '#0056b3',
    TALLER: '#28a745',
    SEMINARIO: '#6f42c1',
    COMPETENCIA: '#fd7e14',
    CULTURAL: '#e83e8c',
    DEPORTIVO: '#20c997',
  },
} as const;

// Type-safe color access
export type ColorKey = keyof typeof colors;
export type PrimaryColorKey = keyof typeof colors.primary;
export type SemanticColorKey = keyof typeof colors.semantic;
```

### `src/constants/typography.ts`
```typescript
/**
 * Typography Scale - Uniconnect Design System
 */

export const typography = {
  fontFamily: {
    primary: 'Roboto',
    fallback: 'System',
  },

  fontSize: {
    xs: 10,
    sm: 11,
    base: 12,
    md: 13,
    lg: 14,
    xl: 15,
    '2xl': 16,
    '3xl': 18,
    '4xl': 20,
    '5xl': 24,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
} as const;

// Type-safe typography access
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
```

### `src/constants/spacing.ts`
```typescript
/**
 * Spacing Scale - Uniconnect Design System
 * Based on 4px grid system
 */

export const spacing = {
  0: 0,
  1: 2,
  1.5: 3,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  10: 20,
  12: 24,
  24: 48,
} as const;

export const gap = {
  sm: 6,
  md: 8,
  lg: 12,
} as const;

// Type-safe spacing access
export type SpacingKey = keyof typeof spacing;
export type GapKey = keyof typeof gap;
```

### `src/constants/borderRadius.ts`
```typescript
/**
 * Border Radius Scale - Uniconnect Design System
 */

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 9,
  xl: 10,
  '2xl': 11,
  '3xl': 17,
  '4xl': 20,
  '5xl': 22,
  full: 9999,
} as const;

export const borderWidth = {
  default: 1,
  thick: 1.5,
} as const;

// Type-safe border radius access
export type BorderRadiusKey = keyof typeof borderRadius;
```

### `src/constants/tokens.ts` (Consolidado)
```typescript
/**
 * Design Tokens - Uniconnect Design System
 * Consolidated tokens for easy import
 */

export { colors } from './colors';
export { typography } from './typography';
export { spacing, gap } from './spacing';
export { borderRadius, borderWidth } from './borderRadius';

// Re-export types
export type {
  ColorKey,
  PrimaryColorKey,
  SemanticColorKey,
} from './colors';

export type {
  FontSize,
  FontWeight,
} from './typography';

export type {
  SpacingKey,
  GapKey,
} from './spacing';

export type {
  BorderRadiusKey,
} from './borderRadius';
```

---

## 🎭 2. THEME PROVIDER

### `src/theme/types.ts`
```typescript
/**
 * Theme Types - Uniconnect Design System
 */

import { colors, typography, spacing, borderRadius } from '@/src/constants/tokens';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
}

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}
```

### `src/theme/ThemeContext.tsx`
```typescript
/**
 * Theme Context - Uniconnect Design System
 */

import React, { createContext, useContext } from 'react';
import { ThemeContextValue } from './types';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;
```

### `src/theme/ThemeProvider.tsx`
```typescript
/**
 * Theme Provider - Uniconnect Design System
 */

import React, { useState, useMemo, useCallback } from 'react';
import ThemeContext from './ThemeContext';
import { Theme, ThemeMode } from './types';
import { colors, typography, spacing, borderRadius } from '@/src/constants/tokens';

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'dark',
}) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  const theme: Theme = useMemo(() => ({
    mode,
    colors,
    typography,
    spacing,
    borderRadius,
  }), [mode]);

  const toggleMode = useCallback(() => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleSetMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const value = useMemo(() => ({
    theme,
    mode,
    toggleMode,
    setMode: handleSetMode,
  }), [theme, mode, toggleMode, handleSetMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### `src/theme/useTheme.ts`
```typescript
/**
 * useTheme Hook - Uniconnect Design System
 */

import { useThemeContext } from './ThemeContext';
import { Theme } from './types';

export const useTheme = (): Theme => {
  const { theme } = useThemeContext();
  return theme;
};

export const useThemeMode = () => {
  const { mode, toggleMode, setMode } = useThemeContext();
  return { mode, toggleMode, setMode };
};
```

---

## 🧩 3. COMPONENTES REUTILIZABLES

### `src/components/ui/Card.tsx`
```typescript
/**
 * Card Component - Uniconnect Design System
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'transparent';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
}) => {
  const { colors, borderRadius, spacing } = useTheme();

  const cardStyles = StyleSheet.create({
    card: {
      backgroundColor: variant === 'transparent'
        ? colors.background.cardTransparent
        : colors.background.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.primary.gold20,
      padding: spacing[6],
    },
  });

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyles.card, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyles.card, style]}>
      {children}
    </View>
  );
};
```

### `src/components/ui/Badge.tsx`
```typescript
/**
 * Badge Component - Uniconnect Design System
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const { colors, borderRadius, spacing, typography } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return colors.semantic.success.background;
      case 'error':
        return colors.semantic.error.background;
      case 'warning':
        return colors.semantic.warning.background;
      case 'info':
        return colors.semantic.info.background;
      default:
        return colors.primary.gold25;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
        return colors.semantic.success.base;
      case 'error':
        return colors.semantic.error.text;
      case 'warning':
        return colors.semantic.warning.base;
      case 'info':
        return colors.semantic.info.text;
      default:
        return colors.text.primary;
    }
  };

  const badgeStyles = StyleSheet.create({
    badge: {
      minWidth: size === 'sm' ? 18 : 22,
      height: size === 'sm' ? 18 : 22,
      borderRadius: size === 'sm' ? borderRadius.lg : borderRadius['2xl'],
      backgroundColor: getBackgroundColor(),
      paddingHorizontal: spacing[3],
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: size === 'sm' ? typography.fontSize.xs : typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
      color: getTextColor(),
    },
  });

  return (
    <View style={[badgeStyles.badge, style]}>
      <Text style={[badgeStyles.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
};
```

### `src/components/ui/Button.tsx`
```typescript
/**
 * Button Component - Uniconnect Design System
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { colors, borderRadius, spacing, typography } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.text.tertiary;
    
    switch (variant) {
      case 'primary':
        return colors.primary.gold15;
      case 'secondary':
        return colors.semantic.info.background;
      case 'outline':
        return 'transparent';
      default:
        return colors.primary.gold15;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.text.tertiary;
    
    switch (variant) {
      case 'primary':
        return colors.primary.gold;
      case 'secondary':
        return colors.semantic.info.base;
      case 'outline':
        return colors.primary.gold;
      default:
        return colors.primary.gold;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.text.secondary;
    
    switch (variant) {
      case 'primary':
        return colors.primary.gold;
      case 'secondary':
        return colors.semantic.info.text;
      case 'outline':
        return colors.primary.gold;
      default:
        return colors.primary.gold;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing[4], paddingHorizontal: spacing[8] };
      case 'md':
        return { paddingVertical: spacing[5], paddingHorizontal: spacing[12] };
      case 'lg':
        return { paddingVertical: spacing[6], paddingHorizontal: spacing[24] };
      default:
        return { paddingVertical: spacing[5], paddingHorizontal: spacing[12] };
    }
  };

  const buttonStyles = StyleSheet.create({
    button: {
      backgroundColor: getBackgroundColor(),
      borderColor: getBorderColor(),
      borderWidth: 1.5,
      borderRadius: borderRadius.md,
      ...getPadding(),
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing[4],
    },
    text: {
      color: getTextColor(),
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
    },
  });

  return (
    <TouchableOpacity
      style={[buttonStyles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && <ActivityIndicator size="small" color={getTextColor()} />}
      <Text style={[buttonStyles.text, textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};
```

---

## 🔄 4. EJEMPLO DE MIGRACIÓN

### Antes (Sin tokens)
```typescript
// EventCard.tsx (ANTES)
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  badge: {
    backgroundColor: 'rgba(217, 185, 126, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
```

### Después (Con tokens)
```typescript
// EventCard.tsx (DESPUÉS)
import { useTheme } from '@/src/theme/useTheme';

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { colors, borderRadius, spacing, typography } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.background.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.primary.gold20,
      padding: spacing[6],
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
    },
    badge: {
      backgroundColor: colors.primary.gold25,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: borderRadius.xs,
    },
  });

  return (
    <Card onPress={() => router.push(`/events/${event.id_event}`)}>
      {/* Contenido */}
    </Card>
  );
};
```

---

## 🚀 5. SETUP EN APP ROOT

### `src/components/AppRoot.tsx`
```typescript
/**
 * App Root - Uniconnect
 * Setup de Theme Provider
 */

import React from 'react';
import { ThemeProvider } from '@/src/theme/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface AppRootProps {
  children: React.ReactNode;
}

export const AppRoot: React.FC<AppRootProps> = ({ children }) => {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        {children}
      </ThemeProvider>
    </SafeAreaProvider>
  );
};
```

### `app/_layout.tsx`
```typescript
/**
 * Root Layout - Expo Router
 */

import { Stack } from 'expo-router';
import { AppRoot } from '@/src/components/AppRoot';

export default function RootLayout() {
  return (
    <AppRoot>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </AppRoot>
  );
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup Inicial
- [ ] Crear carpeta `src/constants/`
- [ ] Crear `colors.ts`, `typography.ts`, `spacing.ts`, `borderRadius.ts`
- [ ] Crear `tokens.ts` consolidado
- [ ] Crear carpeta `src/theme/`
- [ ] Crear `types.ts`, `ThemeContext.tsx`, `ThemeProvider.tsx`, `useTheme.ts`
- [ ] Integrar `ThemeProvider` en `AppRoot.tsx`

### Fase 2: Componentes Base
- [ ] Crear carpeta `src/components/ui/`
- [ ] Implementar `Card.tsx`
- [ ] Implementar `Badge.tsx`
- [ ] Implementar `Button.tsx`
- [ ] Implementar `Avatar.tsx`
- [ ] Crear `index.ts` para exports

### Fase 3: Migración
- [ ] Migrar `EventCard.tsx`
- [ ] Migrar `GroupCard.tsx`
- [ ] Migrar `StudentCard.tsx`
- [ ] Migrar resto de componentes de `features/events/`
- [ ] Migrar resto de componentes de `features/groups/`
- [ ] Migrar resto de features

### Fase 4: Testing
- [ ] Tests unitarios de componentes UI
- [ ] Tests de integración con ThemeProvider
- [ ] Visual regression testing
- [ ] Performance testing

---

**Código de ejemplo por**: Kiro AI Agent  
**Fecha**: 30 de Abril, 2026  
**Versión**: 1.0.0  
**Listo para**: Copy-paste e implementación inmediata
