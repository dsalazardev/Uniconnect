## ADDED Requirements

### Requirement: Centralized color constants exist
The system SHALL provide a `constants/colors.ts` file exporting all brand colors used across the application.

#### Scenario: colors.ts exports brand palette
- **WHEN** inspecting `constants/colors.ts`
- **THEN** the file SHALL export at minimum: `gold`, `goldLight`, `goldHover`, `dark`, `darkSecondary`, `darkTertiary`, `white`, `error`, `errorLight`, `muted`, `mutedLight`

#### Scenario: Colors match mobile de-facto palette
- **WHEN** comparing exported color values to mobile `StyleSheet.create()` usage
- **THEN** `gold` SHALL be `#D9B97E` and `dark` SHALL be `#1a1a1a`

### Requirement: Centralized typography constants exist
The system SHALL provide a `constants/typography.ts` file exporting font sizes, weights, and font family definitions.

#### Scenario: typography.ts exports font definitions
- **WHEN** inspecting `constants/typography.ts`
- **THEN** the file SHALL export font sizes (`xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`) and font weights (`normal`, `medium`, `semibold`, `bold`)

### Requirement: CSS custom properties reference token constants
The `index.css` `:root` SHALL define CSS custom properties whose values reference the design tokens from `colors.ts` and `typography.ts`, ensuring a single source of truth.

#### Scenario: CSS variables match token values
- **WHEN** inspecting `:root` in `index.css`
- **THEN** `--color-gold` SHALL equal the `gold` export from `colors.ts`, `--color-dark` SHALL equal the `dark` export, etc.

#### Scenario: CSS modules reference variables
- **WHEN** inspecting any `.module.css` file modified by this change
- **THEN** color values SHALL use `var(--color-*)` instead of hardcoded hex values where the token exists
