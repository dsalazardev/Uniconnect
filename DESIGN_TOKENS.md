# 🎨 DESIGN TOKENS - UNICONNECT FRONTEND

> **Propósito**: Tokens de diseño extraídos del frontend para alimentar Stitch MCP  
> **Formato**: JSON-like structure para fácil integración  
> **Fecha**: 30 de Abril, 2026

---

## 🎨 COLOR PALETTE

### Primary Colors
```json
{
  "primary": {
    "gold": {
      "base": "#D9B97E",
      "25": "rgba(217, 185, 126, 0.25)",
      "20": "rgba(217, 185, 126, 0.2)",
      "15": "rgba(217, 185, 126, 0.15)",
      "10": "rgba(217, 185, 126, 0.1)",
      "8": "rgba(217, 185, 126, 0.08)",
      "5": "rgba(217, 185, 126, 0.05)"
    }
  }
}
```

### Background Colors
```json
{
  "background": {
    "primary": "#000000",
    "header": "#0d0d0d",
    "card": "#1a1a1a",
    "cardTransparent": "rgba(26, 26, 26, 0.9)"
  }
}
```

### Text Colors
```json
{
  "text": {
    "primary": "#ffffff",
    "secondary": "#888888",
    "tertiary": "#666666",
    "metadata": "#999999",
    "accent": "#D9B97E"
  }
}
```

### Semantic Colors
```json
{
  "semantic": {
    "success": {
      "base": "#22C55E",
      "alt": "#28a745",
      "background": "rgba(34, 197, 94, 0.08)"
    },
    "error": {
      "base": "#EF4444",
      "alt": "#ff4d4d",
      "text": "#FCA5A5",
      "background": "rgba(239, 68, 68, 0.15)",
      "border": "rgba(239, 68, 68, 0.3)"
    },
    "warning": {
      "base": "#F97316",
      "alt": "#fd7e14",
      "background": "rgba(249, 115, 22, 0.25)",
      "border": "rgba(249, 115, 22, 0.2)"
    },
    "info": {
      "base": "#38BDF8",
      "alt": "#0056b3",
      "text": "#64c8ff",
      "background": "rgba(56, 189, 248, 0.08)",
      "badgeBackground": "rgba(100, 200, 255, 0.2)"
    },
    "purple": {
      "base": "#A78BFA",
      "alt": "#6f42c1",
      "background": "rgba(167, 139, 250, 0.08)",
      "border": "rgba(167, 139, 250, 0.4)"
    },
    "teal": {
      "base": "#20c997"
    },
    "pink": {
      "base": "#e83e8c"
    }
  }
}
```

### Event Type Colors
```json
{
  "eventTypes": {
    "CONFERENCIA": "#0056b3",
    "TALLER": "#28a745",
    "SEMINARIO": "#6f42c1",
    "COMPETENCIA": "#fd7e14",
    "CULTURAL": "#e83e8c",
    "DEPORTIVO": "#20c997"
  }
}
```

---

## 📝 TYPOGRAPHY

### Font Family
```json
{
  "fontFamily": {
    "primary": "Roboto",
    "fallback": "System"
  }
}
```

### Font Sizes
```json
{
  "fontSize": {
    "xs": 10,
    "sm": 11,
    "base": 12,
    "md": 13,
    "lg": 14,
    "xl": 15,
    "2xl": 16,
    "3xl": 18,
    "4xl": 20,
    "5xl": 24
  }
}
```

### Font Weights
```json
{
  "fontWeight": {
    "regular": "400",
    "medium": "500",
    "semibold": "600",
    "bold": "700"
  }
}
```

---

## 📏 SPACING

### Padding/Margin Scale
```json
{
  "spacing": {
    "0": 0,
    "1": 2,
    "1.5": 3,
    "2": 4,
    "3": 6,
    "4": 8,
    "5": 10,
    "6": 12,
    "7": 14,
    "8": 16,
    "10": 20,
    "12": 24,
    "24": 48
  }
}
```

### Gap (Flexbox)
```json
{
  "gap": {
    "sm": 6,
    "md": 8,
    "lg": 12
  }
}
```

---

## 🔲 BORDER RADIUS

```json
{
  "borderRadius": {
    "xs": 4,
    "sm": 6,
    "md": 8,
    "lg": 9,
    "xl": 10,
    "2xl": 11,
    "3xl": 17,
    "4xl": 20,
    "5xl": 22,
    "full": 9999
  }
}
```

---

## 🖼️ BORDER WIDTH

```json
{
  "borderWidth": {
    "default": 1,
    "thick": 1.5
  }
}
```

---

## 🎭 COMPONENT TOKENS

### Card
```json
{
  "card": {
    "backgroundColor": "#1a1a1a",
    "backgroundColorTransparent": "rgba(26, 26, 26, 0.9)",
    "borderRadius": 10,
    "borderWidth": 1,
    "padding": 12
  }
}
```

### Badge
```json
{
  "badge": {
    "minWidth": 18,
    "height": 18,
    "borderRadius": 9,
    "paddingHorizontal": 4,
    "fontSize": 10,
    "fontWeight": "700"
  }
}
```

### Count Badge
```json
{
  "countBadge": {
    "minWidth": 22,
    "height": 22,
    "borderRadius": 11,
    "paddingHorizontal": 6,
    "fontSize": 11,
    "fontWeight": "700"
  }
}
```

### Icon Button
```json
{
  "iconButton": {
    "width": 34,
    "height": 34,
    "borderRadius": 17,
    "borderWidth": 1.5
  }
}
```

### Avatar
```json
{
  "avatar": {
    "width": 44,
    "height": 44,
    "borderRadius": 22
  }
}
```

### Chip/Selector
```json
{
  "chip": {
    "paddingVertical": 6,
    "paddingHorizontal": 14,
    "borderRadius": 20,
    "borderWidth": 1,
    "maxWidth": 180,
    "fontSize": 13,
    "fontWeight": "500"
  }
}
```

---

## 🎨 STITCH MCP MAPPING

### Recommended Stitch Configuration

```typescript
// Design System for Stitch MCP
{
  displayName: "Uniconnect Dark Theme",
  theme: {
    // Color Mode
    colorMode: "DARK",
    
    // Custom Colors
    customColor: "#D9B97E",  // Gold primary
    
    // Typography
    headlineFont: "ROBOTO_FLEX",
    bodyFont: "ROBOTO_FLEX",
    labelFont: "ROBOTO_FLEX",
    
    // Shape
    roundness: "ROUND_EIGHT",  // 8px base, escalable a 10-12
    
    // Color Variant
    colorVariant: "TONAL_SPOT",  // Para mantener el gold como acento
    
    // Override Colors (opcional)
    overridePrimaryColor: "#D9B97E",     // Gold
    overrideSecondaryColor: "#22C55E",   // Success green
    overrideTertiaryColor: "#38BDF8",    // Info blue
    overrideNeutralColor: "#1a1a1a",     // Dark card background
    
    // Spacing (opcional - usar defaults de Stitch)
    spacing: {
      "xs": "4px",
      "sm": "8px",
      "md": "12px",
      "lg": "16px",
      "xl": "24px"
    },
    
    // Typography Scale (opcional)
    typography: {
      "display-lg": {
        fontFamily: "Roboto",
        fontSize: "24px",
        fontWeight: "700",
        lineHeight: "1.2"
      },
      "headline-md": {
        fontFamily: "Roboto",
        fontSize: "18px",
        fontWeight: "600",
        lineHeight: "1.3"
      },
      "body-lg": {
        fontFamily: "Roboto",
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "1.5"
      },
      "body-md": {
        fontFamily: "Roboto",
        fontSize: "12px",
        fontWeight: "400",
        lineHeight: "1.5"
      },
      "label-sm": {
        fontFamily: "Roboto",
        fontSize: "11px",
        fontWeight: "500",
        lineHeight: "1.4"
      }
    }
  }
}
```

---

## 📋 COMPONENT PATTERNS

### Card Pattern
```typescript
{
  layout: "vertical",
  backgroundColor: "#1a1a1a",
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "rgba(217, 185, 126, 0.2)",
  padding: 12,
  gap: 8,
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  
  content: {
    flex: 1
  },
  
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  }
}
```

### Badge Pattern
```typescript
{
  minWidth: 22,
  height: 22,
  borderRadius: 11,
  paddingHorizontal: 6,
  backgroundColor: "rgba(217, 185, 126, 0.25)",
  
  text: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff"
  }
}
```

### Button Pattern
```typescript
{
  primary: {
    backgroundColor: "rgba(217, 185, 126, 0.15)",
    borderColor: "#D9B97E",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    
    text: {
      color: "#D9B97E",
      fontSize: 14,
      fontWeight: "600"
    }
  },
  
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center"
  }
}
```

### Icon Pattern
```typescript
{
  sizes: {
    sm: 14,
    md: 16,
    lg: 22,
    xl: 24,
    "2xl": 32
  },
  
  colors: {
    primary: "#D9B97E",
    secondary: "#888888",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F97316",
    info: "#38BDF8"
  }
}
```

---

## 🎯 USAGE GUIDELINES

### Color Usage
- **Gold (#D9B97E)**: Primary actions, highlights, badges, important text
- **White (#ffffff)**: Primary text on dark backgrounds
- **Gray (#888, #666, #999)**: Secondary text, metadata, placeholders
- **Semantic colors**: Success, error, warning, info states
- **Event type colors**: Specific to event categories

### Typography Usage
- **Bold (700)**: Titles, badges, important labels
- **Semi-bold (600)**: Section headers, card titles
- **Medium (500)**: Emphasized body text
- **Regular (400)**: Body text, descriptions

### Spacing Usage
- **2-4px**: Tight spacing (badges, inline elements)
- **6-8px**: Standard gap between elements
- **12px**: Card padding, section spacing
- **16px**: Container horizontal padding
- **24px**: Section vertical padding
- **48px**: Large vertical spacing

### Border Radius Usage
- **4-6px**: Small elements (badges, small buttons)
- **8-10px**: Cards, inputs, standard buttons
- **17-22px**: Circular elements (avatars, icon buttons)
- **20px**: Chips, pills

---

## 🔄 MIGRATION NOTES

### From Current to Stitch
1. **Colors**: Map gold (#D9B97E) as primary color in Stitch
2. **Typography**: Use Roboto Flex in Stitch (closest to current Roboto)
3. **Spacing**: Stitch's default spacing scale aligns well with current 4px-based system
4. **Border Radius**: Use ROUND_EIGHT (8px) as base, customize for specific components
5. **Dark Mode**: Set colorMode to DARK in Stitch config

### Compatibility Notes
- **No shadows**: Current design doesn't use shadows, rely on borders and backgrounds
- **Transparency**: Heavy use of rgba() for layering - ensure Stitch supports opacity
- **Icon library**: @expo/vector-icons (Ionicons) - may need custom icon mapping in Stitch
- **Custom components**: GroupAdminPanel styles are highly customized - may need manual styling

---

**Tokens extraídos por**: Kiro AI Agent  
**Fecha**: 30 de Abril, 2026  
**Versión**: 1.0.0  
**Compatibilidad**: Stitch MCP v1.x
