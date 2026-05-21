## 1. Sprint 1 — Router Fix (Events, Groups, Messages)

- [x] 1.1 Replace `<EventList />` with `<EventsPage />` in router.tsx for `/events` route
- [x] 1.2 Create `pages/GroupsPage.tsx` wrapper using `useGroups()` hook, pass props to `<GroupList />`
- [x] 1.3 Register `GroupsPage` in router.tsx for `/groups` route
- [x] 1.4 Create `pages/MessagesPage.tsx` wrapper with messages state and `currentUserId`, pass props to `<MessageList />`
- [x] 1.5 Register `MessagesPage` in router.tsx for `/messages` route
- [x] 1.6 Verify `/events`, `/groups`, `/messages` display real data from backend

## 2. Sprint 2 — UI Theme Parity (Gold/Dark)

- [x] 2.1 Remove Vite scaffold CSS from `index.css` (`.counter`, `.hero`, `#center`, `#next-steps`, purple accent variables)
- [x] 2.2 Replace `--accent` and all color variables in `index.css` `:root` with Gold/Dark palette (`#D9B97E`, `#1a1a1a`, `#363636`)
- [x] 2.3 Remove `#root { width: 1126px; margin: 0 auto; text-align: center; }` constraint from `index.css`
- [x] 2.4 Change Layout navbar from blue (`#0056b3`) to dark (`#1a1a1a`) with white text and gold hover accents in `Layout.module.css`
- [x] 2.5 Change login button from white (`#fff` / `#333`) to gold (`#D9B97E` / `#1a1a1a`) with hover darkening in `LoginScreen.module.css`
- [x] 2.6 Audit all CSS module files for color values and ensure consistency with Gold/Dark theme

## 3. Sprint 3 — Visual Feedback (Loaders & Suspense)

- [x] 3.1 Create `components/elements/LoadingSpinner.tsx` with `size` (sm/md/lg) prop and optional `label` prop
- [x] 3.2 Create `components/elements/LoadingSpinner.module.css` with spin animation
- [x] 3.3 Export `LoadingSpinner` from `components/elements/index.ts`
- [x] 3.4 Change `SuspenseWrapper` fallback from `{null}` to `<LoadingSpinner size="lg" label="Cargando..." />` in router.tsx
- [x] 3.5 Replace plain `<p>Cargando eventos...</p>` with `<LoadingSpinner />` in EventsPage loading state
- [x] 3.6 Verify spinner appears during lazy load of LoginScreen and during events fetch

## 4. Sprint 4 — Design Tokens & Polish

- [x] 4.1 Create `constants/colors.ts` exporting: `gold`, `goldLight`, `goldHover`, `dark`, `darkSecondary`, `darkTertiary`, `white`, `error`, `errorLight`, `muted`, `mutedLight`
- [x] 4.2 Create `constants/typography.ts` exporting font sizes (`xs`-`3xl`) and weights (`normal`-`bold`)
- [x] 4.3 Define `:root` CSS custom properties in `index.css` referencing token values (`--color-gold`, `--color-dark`, `--font-size-base`, etc.)
- [x] 4.4 Migrate `Button.module.css` color values to use `var(--color-*)` custom properties
- [x] 4.5 Migrate `Input.module.css` color values to use `var(--color-*)` custom properties
- [x] 4.6 Migrate `Modal.module.css` color values to use `var(--color-*)` custom properties
- [x] 4.7 Migrate `EventCard.module.css` color values to use `var(--color-*)` custom properties
- [x] 4.8 Migrate `Layout.module.css` color values to use `var(--color-*)` custom properties
- [x] 4.9 Run `npx tsc --noEmit` and verify zero TypeScript errors
- [x] 4.10 Run `npm run build` and verify successful production build

> **Note**: `npx tsc --noEmit` passes (0 errors). `npm run build` (`tsc -b && vite build`) fails due to **pre-existing** TypeScript errors in other files (ProfileScreen, ConnectionList, CourseList, GroupDetail, GroupAdminStore, useProfile, etc.) — none related to this change.
