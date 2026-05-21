## Context

The Frontend-web monorepo workspace was scaffolded (Fases 10-11) with React 19 + Vite 8 + React Router 7, but its feature implementations lag behind Frontend-mobile in three dimensions: (1) critical runtime bugs (G1-G6 partially fixed ad-hoc), (2) missing UI primitives (toasts, icons, design system), and (3) absent components (GroupAdminPanel, FilePickerModal, AppRoot). The mobile frontend has a mature `components/elements/` design system, `expo-vector-icons`, and a robust toast utility — none of which exist on web.

## Goals / Non-Goals

**Goals:**
- Ratify the ad-hoc G1-G6 fixes already applied
- Create reusable web UI primitives (Button, Modal, Input) matching mobile's `elements/` barrel
- Add a production-quality toast notification system
- Replace emoji icon placeholders with `lucide-react`
- Build missing feature components: GroupAdminPanel, FilePickerModal, notification-observer.service, AppRoot
- Achieve total architecture and design parity between mobile and web frontends

**Non-Goals:**
- No backend changes
- No mobile changes
- No shared package changes (all types already exist)
- No routing architecture changes (React Router 7 stays)
- No state management changes (MobX + React Query stays)

## Decisions

### D1: react-hot-toast over sonner
- **Chosen**: `react-hot-toast` — proven in Next.js ecosystems, 5.4kB gzipped, no extra deps
- **Rejected**: `sonner` — newer but less battle-tested; `react-hot-toast` has better SSR compat
- **Why**: Both are valid; `react-hot-toast` is more widely adopted in the React ecosystem

### D2: lucide-react over react-icons
- **Chosen**: `lucide-react` — tree-shakeable, consistent 24px grid, TypeScript native
- **Rejected**: `react-icons` — bundles multiple icon sets, larger footprint; `@heroicons` — Tailwind-specific
- **Why**: `lucide-react` is the closest web equivalent to `@expo/vector-icons` in terms of developer experience

### D3: Barrel re-exports over feature-level types/
- **Chosen**: Each web feature gets a `types/index.ts` barrel that re-exports from `@uniconnect/shared`
- **Why**: Avoids duplicating type definitions; keeps imports short (`'../types'`); matches the pattern already used in mobile

### D4: AppRoot as initialization gate
- **Chosen**: New `AppRoot` component wraps the Layout and shows loading/error state until authStore.isInitialized is true
- **Why**: Matches mobile's AppRoot pattern; prevents flash of unauthenticated UI; centralizes initialization logic

## Risks / Trade-offs

- **[R1] Toast system adds 5.4kB to bundle**: Acceptable — toasts are critical for UX parity
- **[R2] lucide-react adds ~15kB gzipped (tree-shaken)**: Acceptable — icons are a core UI requirement
- **[R3] Ad-hoc G1-G6 fixes may have edge cases**: Mitigation: Each fix will be reviewed and tested during `opsx-apply`
- **[R4] No existing component parity tests**: Mitigation: Manual verification against mobile component behavior during implementation
