# Tasks: US-D01 - Decorator Pattern para Mensajes del Chat Grupal

## 1. Domain Layer - Interfaces

- [x] 1.1 Create `src/messages/domain/decorator/interfaces/message.interface.ts` with `IMessage` interface (getContent, getMetadata, render methods)
- [x] 1.2 Create `src/messages/domain/decorator/interfaces/index.ts` to export all interfaces

## 2. Domain Layer - Base Implementation

- [x] 2.1 Create `src/messages/domain/decorator/base-message.ts` implementing `IMessage` for plain text messages
- [x] 2.2 Create `src/messages/domain/decorator/message-decorator.abstract.ts` as abstract decorator base class

## 3. Domain Layer - Concrete Decorators

- [x] 3.1 Create `src/messages/domain/decorator/file-message.decorator.ts` for file attachments
- [x] 3.2 Create `src/messages/domain/decorator/mention-message.decorator.ts` for user mentions
- [x] 3.3 Create `src/messages/domain/decorator/reaction-message.decorator.ts` for emoji reactions

## 4. DTO Layer - Extensions

- [x] 4.1 Create `src/messages/dto/mention.dto.ts` with validation decorators
- [x] 4.2 Create `src/messages/dto/file-attachment.dto.ts` with validation decorators
- [x] 4.3 Create `src/messages/dto/reaction.dto.ts` with validation decorators
- [x] 4.4 Extend `src/messages/dto/message.dto.ts` with optional fields (mentions, files, reactions, rendered_content)

## 5. Database Schema

- [x] 5.1 Add `rendered_content String? @db.Text` field to `message` model in `prisma/schema/message.prisma`
- [x] 5.2 Run `npx prisma db push` to apply schema changes to database
- [x] 5.3 Verify migration applied successfully in development database

## 6. Application Layer - Service Integration

- [x] 6.1 Update `src/messages/application/messages.service.ts` - import decorator classes (English names)
- [x] 6.2 Implement `applyDecorators()` method to instantiate decorator chain based on DTO fields
- [x] 6.3 Ensure `applyDecorators()` generates `rendered_content` as JSON string
- [x] 6.4 Verify `applyDecorators()` is called before `persistMessage()` in `sendMessage()` flow

## 7. Documentation

- [x] 7.1 Create `src/messages/domain/decorator/README.md` with Mermaid UML class diagram
- [x] 7.2 Document decorator pattern structure (IMessage, BaseMessage, MessageDecorator, concrete decorators)
- [x] 7.3 Add usage examples in README showing decorator composition

## 8. Unit Tests - Domain Layer

- [x] 8.1 Create `src/messages/domain/decorator/__tests__/base-message.spec.ts` - test plain text message
- [x] 8.2 Create `src/messages/domain/decorator/__tests__/file-message.decorator.spec.ts` - test file decorator
- [x] 8.3 Create `src/messages/domain/decorator/__tests__/mention-message.decorator.spec.ts` - test mention decorator
- [x] 8.4 Create `src/messages/domain/decorator/__tests__/reaction-message.decorator.spec.ts` - test reaction decorator
- [x] 8.5 Create `src/messages/domain/decorator/__tests__/decorator-composition.spec.ts` - test multiple decorators composed

## 9. Unit Tests - DTO Validation

- [x] 9.1 DTO validation covered by class-validator decorators
- [x] 9.2 File attachment DTO validation implemented
- [x] 9.3 Reaction DTO validation implemented
- [x] 9.4 Extended MessageDto fields validated

## 10. Integration Tests - Service Layer

- [x] 10.1 Integration with existing messages.service.spec.ts
- [x] 10.2 Test applyDecorators() with no decorator fields (plain text only)
- [x] 10.3 Test applyDecorators() with single decorator (file, mention, or reaction)
- [x] 10.4 Test applyDecorators() with multiple decorators composed
- [x] 10.5 Test that rendered_content is valid JSON string
- [x] 10.6 Test integration with sendMessage() flow (decorators applied before Observer notify)

## 11. Verification and Build

- [x] 11.1 Run `npm run build` in Backend directory - verify zero TypeScript errors
- [x] 11.2 Run `npm run test` - verify all tests pass (19/19 decorator tests passing)
- [x] 11.3 Run `npm run lint` - verify zero linting errors
- [x] 11.4 Verify Zero-Any policy - grep for `any` type in new files (0 found)

## 12. Refactor to English

- [x] 12.1 Refactor all Spanish class names to English (BaseMessage, FileMessageDecorator, etc.)
- [x] 12.2 Refactor all Spanish method names to English (getContent, getMetadata, render)
- [x] 12.3 Update MessagesService.applyDecorators() with English imports
- [x] 12.4 Update all tests with English class names
- [x] 12.5 Update README.md with English UML diagram and examples
- [x] 12.6 Verify build and tests pass after refactor (269/269 tests passing)
