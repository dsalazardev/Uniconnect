## ADDED Requirements

### Requirement: Display enrolled courses in profile
The ProfileScreen SHALL display the courses the student is currently enrolled in, fetched from the correct endpoint.

#### Scenario: Load enrolled courses
- **WHEN** the ProfileScreen mounts
- **THEN** it calls `coursesService.getOwnCourses()` (endpoint `/courses/get-own`) and displays the returned courses with their current state

#### Scenario: Show course state
- **WHEN** a course has `state: "active"`
- **THEN** the UI displays a badge or label indicating the state (e.g., "Cursando", "Finalizado")

### Requirement: Add course modal
The ProfileScreen SHALL provide a button to open a modal for adding new courses from the list of available courses.

#### Scenario: Open add course modal
- **WHEN** the user clicks "Agregar curso"
- **THEN** a modal opens displaying courses from `coursesService.getByStudent()` (endpoint `/courses/get-by-student`) as a selectable list

#### Scenario: Select and enroll in a course
- **WHEN** the user selects a course from the modal and confirms
- **THEN** `coursesService.addCourseToStudent({ id_course, status: "active" })` is called and the course list refreshes

### Requirement: Edit and delete course actions
Each enrolled course in the ProfileScreen SHALL provide actions to change its state or remove the enrollment.

#### Scenario: Edit course state
- **WHEN** the user clicks the edit icon on a course
- **THEN** a small inline selector or modal allows changing the state between "Cursando" and "Finalizado"

#### Scenario: Delete course enrollment
- **WHEN** the user clicks the delete icon on a course
- **THEN** a confirmation dialog appears, and upon confirmation, `coursesService.deleteCourseFromStudent(courseId)` is called
