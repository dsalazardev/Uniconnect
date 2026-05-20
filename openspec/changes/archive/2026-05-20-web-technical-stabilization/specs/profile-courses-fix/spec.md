## ADDED Requirements

### Requirement: Profile shows only enrolled courses

The ProfileScreen SHALL display only the authenticated user's enrolled courses, not all courses in the system. The `useProfile` hook SHALL fetch courses from `coursesService.getByStudent()` (hitting `GET /courses/get-by-student`) instead of `studentsService.getCourses()` (hitting `GET /courses`).

#### Scenario: Profile displays enrolled courses
- **WHEN** the user views their profile page
- **THEN** the "Mis Cursos" section shows only courses where the user is enrolled
- **THEN** each course card shows the course name and enrollment state

#### Scenario: Profile has no enrolled courses
- **WHEN** the user has no enrolled courses
- **THEN** the "Mis Cursos" section is not rendered
- **THEN** no empty course list is shown

### Requirement: Phone edit uses derived state

The ProfileScreen SHALL NOT use `useEffect` to sync phone/bio values with profile data. Instead, it SHALL compute the initial value directly when the edit modal opens via `handleOpenEdit`.

#### Scenario: Phone edit modal opens with correct data
- **WHEN** the user clicks "Editar Perfil"
- **THEN** the phone field is pre-filled with `profile?.phone ?? ''`
- **THEN** the bio field is empty (or pre-filled if bio is added to the profile type later)
