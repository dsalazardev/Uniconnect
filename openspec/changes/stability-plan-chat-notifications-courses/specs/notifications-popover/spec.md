## ADDED Requirements

### Requirement: Notifications accessible from Navbar bell icon
The Layout component SHALL render the notification center as a dropdown overlay triggered by clicking the bell icon in the Navbar, without navigating to a separate route.

#### Scenario: Open notifications popover
- **WHEN** the user clicks the bell icon in the Navbar
- **THEN** a dropdown overlay appears below the bell icon showing the notification list

#### Scenario: Close popover on click outside
- **WHEN** the user clicks anywhere outside the dropdown overlay
- **THEN** the overlay closes

#### Scenario: Close popover on bell re-click
- **WHEN** the user clicks the bell icon while the popover is open
- **THEN** the overlay closes

### Requirement: Unread badge on bell icon
The bell icon in the Navbar SHALL display an unread count badge when there are unread notifications.

#### Scenario: Badge with unread count
- **WHEN** there are 3 unread notifications
- **THEN** the bell icon shows a badge with "3"

#### Scenario: No badge when zero unread
- **WHEN** there are 0 unread notifications
- **THEN** no badge is displayed on the bell icon

### Requirement: Remove notifications route
The `/notifications` route SHALL be removed from the router configuration.

#### Scenario: Navigation to old route
- **WHEN** the user navigates to `/notifications` manually or via bookmark
- **THEN** the router redirects to `/events` or shows a 404
