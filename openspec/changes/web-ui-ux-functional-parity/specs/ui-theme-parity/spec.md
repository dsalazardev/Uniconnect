## ADDED Requirements

### Requirement: index.css uses Gold/Dark theme
The global `index.css` SHALL use `#D9B97E` as the accent color and `#1a1a1a` / `#363636` as the background colors, replacing the purple Vite scaffold theme (`#aa3bff` / `#c084fc`). All unused Vite scaffold CSS (`.counter`, `.hero`, `#center`, `#next-steps`) SHALL be removed.

#### Scenario: CSS variables use gold accent
- **WHEN** inspecting `--accent` CSS variable
- **THEN** the value SHALL be `#D9B97E` (light) and `#D9B97E` (dark)

#### Scenario: Vite scaffold CSS is removed
- **WHEN** inspecting `index.css`
- **THEN** NO classes named `.counter`, `.hero`, `#center`, `#next-steps` SHALL exist

#### Scenario: Body background uses dark theme
- **WHEN** inspecting `--bg` CSS variable
- **THEN** the value SHALL be `#1a1a1a` (dark mode) / `#f5f5f5` (light mode)

### Requirement: Navbar uses dark background with gold text
The Layout navbar SHALL use `#1a1a1a` background and gold accents instead of the current blue (`#0056b3`).

#### Scenario: Navbar background is dark
- **WHEN** inspecting the navbar element
- **THEN** `background-color` SHALL be `#1a1a1a` (or `var(--color-dark)`)

#### Scenario: Navbar text is white
- **WHEN** inspecting navbar link elements
- **THEN** `color` SHALL be `#ffffff`

#### Scenario: Navbar hover state
- **WHEN** hovering over a navbar link
- **THEN** background SHALL use `rgba(217, 185, 126, 0.15)` (gold tint)

### Requirement: Login button uses gold background
The login button on the LoginScreen SHALL use `#D9B97E` background with `#1a1a1a` text, matching the mobile AuthButton.

#### Scenario: Login button is gold
- **WHEN** inspecting the login button
- **THEN** `background-color` SHALL be `#D9B97E` and `color` SHALL be `#1a1a1a`

#### Scenario: Login button has hover effect
- **WHEN** hovering over the login button
- **THEN** `background-color` SHALL darken to `#c9a96e`
