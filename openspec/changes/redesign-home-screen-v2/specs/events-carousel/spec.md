# Spec: Events Carousel

## ADDED Requirements

### Requirement: Carousel displays upcoming events from EventsStore
The carousel SHALL display events from `EventsStore.events` filtered to show only future events (date >= today). Events SHALL be sorted by date ascending. The carousel SHALL call `EventsStore.loadEvents()` on component mount if events are not loaded.

#### Scenario: Carousel loads events on mount
- **WHEN** home screen mounts and EventsStore.events is empty
- **THEN** system calls EventsStore.loadEvents()
- **THEN** carousel displays loading indicator while loading

#### Scenario: Carousel displays future events only
- **WHEN** EventsStore contains 5 events (3 future, 2 past)
- **THEN** carousel displays only the 3 future events
- **THEN** events are sorted by date ascending (soonest first)

#### Scenario: Carousel shows empty state
- **WHEN** no future events exist
- **THEN** carousel displays "No hay eventos próximos" message
- **THEN** empty state uses text color #666 (colors.text.tertiary)

### Requirement: Event cards use semantic colors by type
Each event card SHALL use the color defined in DESIGN_TOKENS.md eventTypes mapping: CONFERENCIA (#0056b3), TALLER (#28a745), SEMINARIO (#6f42c1), COMPETENCIA (#fd7e14), CULTURAL (#e83e8c), DEPORTIVO (#20c997).

#### Scenario: Conference event uses blue color
- **WHEN** event type is CONFERENCIA
- **THEN** event card badge background is #0056b3

#### Scenario: Workshop event uses green color
- **WHEN** event type is TALLER
- **THEN** event card badge background is #28a745

#### Scenario: All event types have correct colors
- **WHEN** carousel displays events of all 6 types
- **THEN** each event card uses its corresponding semantic color
- **THEN** colors match DESIGN_TOKENS.md eventTypes exactly

### Requirement: Carousel is horizontally scrollable
The carousel SHALL use ScrollView with horizontal={true} and showsHorizontalScrollIndicator={false}. Event cards SHALL have fixed width of 280px with gap of 12px (spacing[6]) between cards.

#### Scenario: Carousel scrolls horizontally
- **WHEN** user swipes left on carousel
- **THEN** carousel scrolls to show next events
- **THEN** scroll is smooth without janky behavior

#### Scenario: Cards have consistent sizing
- **WHEN** carousel renders
- **THEN** each event card is 280px wide
- **THEN** gap between cards is 12px
- **THEN** first card has left margin of 16px (spacing[8])

### Requirement: Event cards are tappable
Event cards SHALL be wrapped in TouchableOpacity with onPress handler that navigates to `/events/${event.id_event}` using Expo Router.

#### Scenario: Tapping event navigates to detail
- **WHEN** user taps event card with id_event 5
- **THEN** system navigates to /events/5
- **THEN** navigation uses Expo Router push

### Requirement: Carousel uses design tokens
The carousel SHALL use tokens from DESIGN_TOKENS.md: card background rgba(26, 26, 26, 0.9), border radius 10px (borderRadius.xl), padding 12px (spacing[6]), and typography scales for title (fontSize['2xl']) and metadata (fontSize.sm).

#### Scenario: Event cards apply correct tokens
- **WHEN** event card renders
- **THEN** background is rgba(26, 26, 26, 0.9)
- **THEN** border radius is 10px
- **THEN** padding is 12px
- **THEN** title font size is 16px (fontSize['2xl'])
- **THEN** date/location font size is 11px (fontSize.sm)
