# Tasks: Fix Backend Tests Mocks

## 1. Fix messages.service.spec.ts (9 tests)

- [ ] 1.1 Add import for `createPrismaMock` from `../test/mocks/prisma.mock`
- [ ] 1.2 Add import for `PrismaService` from `../prisma/prisma.service`
- [ ] 1.3 Create `prismaMock` variable in `beforeEach()` using `createPrismaMock()`
- [ ] 1.4 Add `{ provide: PrismaService, useValue: prismaMock }` to providers array
- [ ] 1.5 Verify all 9 tests pass with `npm test -- messages.service.spec.ts`

## 2. Fix messages.controller.spec.ts (1 test)

- [ ] 2.1 Update line 78 expectation to include third parameter: `expect(service.findRecentByGroup).toHaveBeenCalledWith(1, 50, undefined)`
- [ ] 2.2 Verify the test passes with `npm test -- messages.controller.spec.ts`

## 3. Fix files.controller.spec.ts (3 tests)

- [ ] 3.1 Add import for `S3Client` from `@aws-sdk/client-s3`
- [ ] 3.2 Add import for `ConfigService` from `@nestjs/config`
- [ ] 3.3 Create `mockS3Client` object with `send: jest.fn().mockResolvedValue({})`
- [ ] 3.4 Create `mockConfigService` object with `get` method that returns test values for AWS config keys
- [ ] 3.5 Add `{ provide: S3Client, useValue: mockS3Client }` to providers array
- [ ] 3.6 Add `{ provide: ConfigService, useValue: mockConfigService }` to providers array
- [ ] 3.7 Verify all tests pass with `npm test -- files.controller.spec.ts`

## 4. Validation

- [ ] 4.1 Run full test suite with `npm test` and verify 316/316 tests pass
- [ ] 4.2 Verify no TypeScript compilation errors with `npm run build`
- [ ] 4.3 Verify git diff shows only changes to `.spec.ts` files
- [ ] 4.4 Verify no `any` types were introduced (follow Zero-any policy)
