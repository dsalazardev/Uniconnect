## ADDED Requirements

### Requirement: Navbar shows all Mobile-equivalent navigation items

The web `Layout` navbar SHALL display navigation links matching Mobile's hamburger menu: Inicio, Perfil, Comunidad, Grupos de estudio, Vínculos, Eventos Académicos, and Notificaciones.

#### Scenario: Authenticated user sees all 7 nav items
- **WHEN** an authenticated user views the web app
- **THEN** the navbar SHALL display all 7 navigation items with labels matching Mobile's menu text

#### Scenario: Unauthenticated user does not see navbar
- **WHEN** an unauthenticated user views the web app
- **THEN** the navbar SHALL NOT render (only `<Outlet />` with login content)

### Requirement: Navbar items navigate to correct routes

Each navbar link SHALL navigate to its corresponding route when clicked.

#### Scenario: Clicking Inicio navigates to /events
- **WHEN** the user clicks "Inicio" in the navbar
- **THEN** the browser navigates to `/events`

#### Scenario: Clicking Comunidad navigates to /students
- **WHEN** the user clicks "Comunidad" in the navbar
- **THEN** the browser navigates to `/students`

#### Scenario: Clicking Vínculos navigates to /connections
- **WHEN** the user clicks "Vínculos" in the navbar
- **THEN** the browser navigates to `/connections`

#### Scenario: Clicking Notificaciones navigates to /notifications
- **WHEN** the user clicks "Notificaciones" in the navbar
- **THEN** the browser navigates to `/notifications`

#### Scenario: Clicking Eventos navigates to /events
- **WHEN** the user clicks "Eventos Académicos" in the navbar
- **THEN** the browser navigates to `/events`

#### Scenario: Clicking Grupos navigates to /groups
- **WHEN** the user clicks "Grupos de estudio" in the navbar
- **THEN** the browser navigates to `/groups`

#### Scenario: Clicking Perfil navigates to /profile
- **WHEN** the user clicks "Perfil" in the navbar
- **THEN** the browser navigates to `/profile`

#### Scenario: Clicking Cerrar Sesión clears auth
- **WHEN** the user clicks "Cerrar Sesión"
- **THEN** `authStore.clearAuth()` is called and the browser navigates to `/login`

### Requirement: Notificaciones shows unread badge count

When the user has unread notifications, the Notificaciones link SHALL display a visual badge with the count.

#### Scenario: Unread count displayed on Navbar
- **WHEN** `notificationsStore.unreadCount` is greater than 0
- **THEN** the Notificaciones nav link SHALL render a badge showing the count

#### Scenario: Zero unread count hides badge
- **WHEN** `notificationsStore.unreadCount` is 0
- **THEN** the Notificaciones nav link SHALL NOT display a badge
