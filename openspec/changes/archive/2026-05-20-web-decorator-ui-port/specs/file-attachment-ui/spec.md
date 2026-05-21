## ADDED Requirements

### Requirement: Render file attachments by MIME type
The WithFileAttachment component SHALL render each file in `message.files[]` with an icon specific to its `mime_type`.

#### Scenario: Render image files with preview
- **WHEN** a file has `mime_type` starting with `image/`
- **THEN** the file SHALL be rendered as an `<img>` thumbnail with an overlay download button

#### Scenario: Render PDF files
- **WHEN** a file has `mime_type` equal to `application/pdf`
- **THEN** the component SHALL show a `FileText` icon with orange (`#FF5722`) background and the filename

#### Scenario: Render video files
- **WHEN** a file has `mime_type` starting with `video/`
- **THEN** the component SHALL show a `Video` icon with purple (`#7C3AED`) background and the filename

#### Scenario: Render Word documents
- **WHEN** a file has `mime_type` containing `word` or `document`
- **THEN** the component SHALL show a `FileText` icon with blue (`#2563EB`) background

#### Scenario: Render Excel spreadsheets
- **WHEN** a file has `mime_type` containing `sheet` or `excel`
- **THEN** the component SHALL show a `Grid` icon with green (`#16A34A`) background

#### Scenario: Render compressed archives
- **WHEN** a file has `mime_type` containing `zip`, `rar`, or `compressed`
- **THEN** the component SHALL show a `Archive` icon with amber (`#D97706`) background

#### Scenario: Render unknown file types
- **WHEN** a file has `mime_type` that does not match any known category
- **THEN** the component SHALL show a generic `Paperclip` icon with gray (`#6B7280`) background

#### Scenario: Show file size
- **WHEN** rendering any file attachment
- **THEN** the file size SHALL be displayed next to the filename, formatted as KB/MB

#### Scenario: No files attached
- **WHEN** `files` array is empty or undefined
- **THEN** the component SHALL render only its children (pass-through)

### Requirement: Download file on click
Clicking a file attachment SHALL trigger a download via the filesService.

#### Scenario: Download image file
- **WHEN** user clicks an image attachment
- **THEN** the system SHALL call `filesService.getPresignedDownloadUrl(file.id_file)` and open the URL

#### Scenario: Download document file
- **WHEN** user clicks a document attachment
- **THEN** the system SHALL call `filesService.downloadAndOpenFile()` to trigger browser download
