## ADDED Requirements

### Requirement: Groups feature type imports
The web groups feature SHALL have a `types/index.ts` barrel that resolves all imports from `../types` used by hooks.

#### Scenario: Groups hooks compile without errors
- **WHEN** `npx tsc --noEmit` is run
- **THEN** `useGroups.ts`, `useMyGroups.ts`, `useGroupInfo.ts`, `useGroupInvitations.ts`, `useJoinRequest.ts`, `usePendingJoinRequests.ts`, `useTransferOwnership.ts`, `useDirectMessage.ts` SHALL compile without "Cannot find module '../types'" errors

### Requirement: Messages feature type and service imports
The web messages feature SHALL provide all modules imported by `useChat.ts`.

#### Scenario: useChat compiles without errors
- **WHEN** `npx tsc --noEmit` is run
- **THEN** `useChat.ts` SHALL compile without errors for imports from `../types`, `../config/websocket.config`, and `../services/files.service`

#### Scenario: Types barrel exists
- **WHEN** `src/features/messages/types/index.ts` is loaded
- **THEN** it SHALL export `Message`, `MessageSendData`, `TypingData`, and all other message types from `@uniconnect/shared`

#### Scenario: Websocket config exists
- **WHEN** `src/features/messages/config/websocket.config.ts` is loaded
- **THEN** it SHALL export `getServerUrl()` returning `VITE_WEBSOCKET_URL` with a fallback to `http://localhost:8007`

#### Scenario: Shared FilesService provides platform-agnostic methods
- **WHEN** `shared/src/services/files.service.ts` is loaded
- **THEN** it SHALL export `FilesService` class with `validateFiles()`, `getFileSize()`, and `getPresignedDownloadUrl(fileId)` methods
- **THEN** `validateFiles()` SHALL accept an array of files and return `{ valid: boolean; error?: string }`
- **THEN** `getFileSize(bytes)` SHALL return a human-readable size string
- **THEN** `getPresignedDownloadUrl(fileId)` SHALL call `GET /files/:id/download` and return the presigned URL

#### Scenario: Web FilesService extends shared
- **WHEN** `web/src/features/messages/services/files.service.ts` is loaded
- **THEN** it SHALL extend or compose the shared `FilesService`
- **THEN** it SHALL add `downloadAndOpenFile()` using browser Blob/URL API
- **THEN** it SHALL NOT duplicate `validateFiles()`, `getFileSize()`, or `getPresignedDownloadUrl()`

#### Scenario: FILES_ENDPOINTS exists in shared
- **WHEN** `shared/src/api/endpoints/files.ts` is loaded
- **THEN** it SHALL export `FILES_ENDPOINTS` with `GET_DOWNLOAD_URL(fileId)`, `UPLOAD`, and other file-related endpoint constants
- **THEN** it SHALL be registered in `shared/src/api/endpoints/index.ts`
