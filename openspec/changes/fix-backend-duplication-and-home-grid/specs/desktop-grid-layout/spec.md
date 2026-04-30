# Spec: Desktop Grid Layout Reconstruction

**Capability**: `desktop-grid-layout`  
**Type**: Modified  
**Priority**: HIGH

---

## Overview

Rebuild the home screen desktop layout to implement a proper 3-column grid with centered content feed and no empty spaces.

---

## Requirements

### Functional Requirements

**FR1**: Desktop layout uses 3-column grid: Sidebar (240px) + Center Feed (max 800px) + Right Panel (300px).

**FR2**: Center feed is horizontally centered within available space.

**FR3**: Center feed has max-width of 800px to prevent content stretching.

**FR4**: All content (events carousel, groups section) is displayed in center feed.

**FR5**: No empty spaces or visual gaps in layout.

**FR6**: Mobile layout remains unchanged (single column).

**FR7**: Responsive breakpoints use existing `useResponsive()` hook.

---

## Layout Structure

### Desktop Layout (≥ 1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────┐  ┌────────────────────────────┐  ┌──────────────┐  │
│  │         │  │                            │  │              │  │
│  │ Sidebar │  │      Center Feed           │  │ Right Panel  │  │
│  │ 240px   │  │      (max 800px)           │  │ 300px        │  │
│  │         │  │                            │  │              │  │
│  │ Nav     │  │  Header                    │  │ Featured     │  │
│  │ Links   │  │  ┌──────────────────────┐  │  │ Groups       │  │
│  │         │  │  │ Events Carousel      │  │  │              │  │
│  │ • Home  │  │  │ (Horizontal scroll)  │  │  │ • Group 1    │  │
│  │ • Events│  │  └──────────────────────┘  │  │ • Group 2    │  │
│  │ • Groups│  │                            │  │ • Group 3    │  │
│  │ • Comm. │  │  ┌──────────────────────┐  │  │ • Group 4    │  │
│  │ • Conn. │  │  │ Groups Section       │  │  │ • Group 5    │  │
│  │ • Notif.│  │  │ (Grid of 4 cards)    │  │  │ • Group 6    │  │
│  │ • Prof. │  │  └──────────────────────┘  │  │ • Group 7    │  │
│  │         │  │                            │  │ • Group 8    │  │
│  │         │  │  (Scrollable)              │  │              │  │
│  │         │  │                            │  │ (Scrollable) │  │
│  └─────────┘  └────────────────────────────┘  └──────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (< 768px)

```
┌────────────────────┐
│                    │
│  Header            │
│                    │
│  ┌──────────────┐  │
│  │ Events       │  │
│  │ Carousel     │  │
│  └──────────────┘  │
│                    │
│  ┌──────────────┐  │
│  │ Groups       │  │
│  │ Section      │  │
│  └──────────────┘  │
│                    │
│  (Scrollable)      │
│                    │
└────────────────────┘
```

---

## Component Structure

### Desktop Layout Component

```tsx
const HomeScreen: React.FC = observer(() => {
  const { isMobile, isDesktop } = useResponsive();

  useEffect(() => {
    eventsStore.loadEvents();
  }, []);

  if (isMobile) {
    return <MobileLayout />;
  }

  return (
    <View style={styles.desktopContainer}>
      <Sidebar />
      
      <ScrollView 
        style={styles.centerFeed} 
        showsVerticalScrollIndicator={false}
      >
        <Header />
        
        <View style={styles.centerContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            <EventsCarousel />
          </View>
          
          <View style={styles.section}>
            <GroupsSection />
          </View>
        </View>
      </ScrollView>
      
      <RightPanel />
    </View>
  );
});
```

### Mobile Layout Component

```tsx
const MobileLayout: React.FC = () => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header />
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <EventsCarousel />
        </View>
        
        <View style={styles.section}>
          <GroupsSection />
        </View>
      </View>
    </ScrollView>
  );
};
```

---

## Styles

### Desktop Container

```typescript
desktopContainer: {
  flex: 1,
  flexDirection: 'row',
  backgroundColor: '#000000',
},
```

**Properties**:
- `flex: 1` - Fill available height
- `flexDirection: 'row'` - Horizontal layout
- `backgroundColor: '#000000'` - Consistent background

### Center Feed

```typescript
centerFeed: {
  flex: 1,
  backgroundColor: '#000000',
},
```

**Properties**:
- `flex: 1` - Fill available width between sidebar and panel
- `backgroundColor: '#000000'` - Consistent background

### Center Content

```typescript
centerContent: {
  maxWidth: 800,
  alignSelf: 'center',
  width: '100%',
  paddingHorizontal: 16,
},
```

**Properties**:
- `maxWidth: 800` - Prevent content stretching on wide screens
- `alignSelf: 'center'` - Center horizontally within parent
- `width: '100%'` - Fill available width up to max
- `paddingHorizontal: 16` - Consistent spacing

### Sidebar (Unchanged)

```typescript
sidebar: {
  width: 240,
  backgroundColor: '#0d0d0d',
  padding: 16,
  gap: 8,
},
```

### Right Panel (Unchanged)

```typescript
rightPanel: {
  width: 300,
  backgroundColor: '#0d0d0d',
  padding: 16,
  borderLeftWidth: 1,
  borderLeftColor: 'rgba(217, 185, 126, 0.1)',
},
```

---

## Responsive Behavior

### Breakpoints

| Screen Size | Layout | Sidebar | Center Feed | Right Panel |
|-------------|--------|---------|-------------|-------------|
| < 768px     | Mobile | Hidden  | Full width  | Hidden      |
| 768-1023px  | Mobile | Hidden  | Full width  | Hidden      |
| ≥ 1024px    | Desktop| 240px   | Flex (max 800px) | 300px  |

### useResponsive Hook

```typescript
const { isMobile, isDesktop } = useResponsive();

// isMobile: true if width < 768px
// isDesktop: true if width >= 1024px
```

---

## Visual Hierarchy

### Z-Index Layers

1. **Background**: `#000000` (base layer)
2. **Sidebar/Panel**: `#0d0d0d` (elevated)
3. **Cards**: `rgba(26, 26, 26, 0.9)` (content)
4. **Overlays**: Higher z-index as needed

### Spacing

- **Section margins**: 24px vertical
- **Card gaps**: 12px
- **Content padding**: 16px horizontal
- **Panel padding**: 16px all sides

---

## Performance

### Rendering Optimization

- **Conditional rendering**: Only render desktop components when `isDesktop === true`
- **ScrollView optimization**: `showsVerticalScrollIndicator={false}` reduces overhead
- **Memoization**: Use `useMemo()` for filtered events list

### Layout Calculation

- **Flexbox**: Native layout engine, minimal overhead
- **Max-width constraint**: Prevents unnecessary re-layouts on resize
- **Fixed widths**: Sidebar and panel have fixed widths for predictable layout

---

## Testing

### Visual Tests

```typescript
describe('Desktop Layout', () => {
  it('should render 3-column layout on desktop', () => {
    // Arrange
    mockUseResponsive({ isMobile: false, isDesktop: true });
    
    // Act
    const { getByTestId } = render(<HomeScreen />);
    
    // Assert
    expect(getByTestId('sidebar')).toBeVisible();
    expect(getByTestId('center-feed')).toBeVisible();
    expect(getByTestId('right-panel')).toBeVisible();
  });
  
  it('should center content feed with max-width', () => {
    // Arrange
    mockUseResponsive({ isMobile: false, isDesktop: true });
    
    // Act
    const { getByTestId } = render(<HomeScreen />);
    
    // Assert
    const centerContent = getByTestId('center-content');
    expect(centerContent.props.style).toMatchObject({
      maxWidth: 800,
      alignSelf: 'center',
    });
  });
});

describe('Mobile Layout', () => {
  it('should render single-column layout on mobile', () => {
    // Arrange
    mockUseResponsive({ isMobile: true, isDesktop: false });
    
    // Act
    const { queryByTestId } = render(<HomeScreen />);
    
    // Assert
    expect(queryByTestId('sidebar')).toBeNull();
    expect(queryByTestId('right-panel')).toBeNull();
    expect(queryByTestId('center-feed')).toBeVisible();
  });
});
```

---

## Acceptance Criteria

- [x] AC1: Desktop layout renders 3 columns (sidebar + center + panel)
- [x] AC2: Center feed has max-width of 800px
- [x] AC3: Center feed is horizontally centered
- [x] AC4: Events carousel is visible in center feed
- [x] AC5: Groups section is visible in center feed
- [x] AC6: No empty spaces or visual gaps
- [x] AC7: Mobile layout unchanged (single column)
- [x] AC8: Responsive breakpoints work correctly
- [x] AC9: Background color is consistent (#000000)
- [x] AC10: All content is scrollable vertically
