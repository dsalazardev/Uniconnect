# Spec: Responsive Layout

## ADDED Requirements

### Requirement: Layout adapts to screen size using useResponsive hook
The home screen SHALL use the `useResponsive` hook from `src/hooks/useResponsive.ts` to detect screen size and render appropriate layout. Mobile layout (width < 768px) SHALL use single column. Desktop layout (width ≥ 1024px) SHALL use three-column layout with sidebar, central content (max-width 1200px), and right panel.

#### Scenario: Mobile layout renders single column
- **WHEN** user views home screen on mobile device (width < 768px)
- **THEN** layout renders as single column with vertical scroll
- **THEN** sidebar and right panel are NOT rendered
- **THEN** content takes full width

#### Scenario: Desktop layout renders three columns
- **WHEN** user views home screen on desktop (width ≥ 1024px)
- **THEN** layout renders with left sidebar, central content, and right panel
- **THEN** central content has max-width of 1200px
- **THEN** sidebar is fixed width 240px
- **THEN** right panel is fixed width 300px

#### Scenario: Tablet layout renders appropriately
- **WHEN** user views home screen on tablet (768px ≤ width < 1024px)
- **THEN** layout renders as single column (mobile behavior)
- **THEN** content is centered with appropriate padding

### Requirement: Layout uses StyleSheet nativo
The layout SHALL be implemented using React Native's StyleSheet.create() without external UI libraries. All responsive logic SHALL be handled through conditional rendering based on useResponsive hook values.

#### Scenario: Styles are created with StyleSheet
- **WHEN** component renders
- **THEN** all styles are defined using StyleSheet.create()
- **THEN** no inline styles are used for layout
- **THEN** no external UI library styles are imported

#### Scenario: Conditional rendering based on screen size
- **WHEN** useResponsive returns isMobile: true
- **THEN** only mobile components are rendered
- **WHEN** useResponsive returns isDesktop: true
- **THEN** desktop-specific components (sidebar, right panel) are rendered

### Requirement: Layout maintains performance
The layout SHALL use React.memo for expensive components and avoid unnecessary re-renders when screen size changes.

#### Scenario: Components memoized appropriately
- **WHEN** screen size changes
- **THEN** only affected layout components re-render
- **THEN** event cards and group cards do not re-render unnecessarily

### Requirement: Layout uses design tokens for spacing
The layout SHALL use spacing tokens from DESIGN_TOKENS.md: spacing[8] (16px) for horizontal padding, spacing[6] (12px) for gaps, and spacing[12] (24px) for section margins.

#### Scenario: Layout applies correct spacing tokens
- **WHEN** layout is rendered
- **THEN** horizontal padding is 16px (spacing[8])
- **THEN** gap between sections is 12px (spacing[6])
- **THEN** section margins are 24px (spacing[12])
