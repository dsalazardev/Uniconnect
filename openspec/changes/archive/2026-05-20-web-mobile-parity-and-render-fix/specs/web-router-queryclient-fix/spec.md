## ADDED Requirements

### Requirement: QueryClientProvider wraps RouterProvider

The `main.tsx` entry point SHALL ensure that `<QueryClientProvider>` is an ancestor of `<RouterProvider>` so that React Query hooks used inside route components have access to the query client context.

#### Scenario: Current nesting is verified correct
- **WHEN** inspecting `main.tsx` and `App.tsx`
- **THEN** the nesting SHALL be `<QueryClientProvider> → <App> → <RouterProvider> → routes`
- **THEN** React Query hooks in any route component SHALL have access to the query client context

#### Scenario: React Query hooks work inside routes
- **WHEN** a route component calls `useQuery()` or `useQueryClient()` from `@tanstack/react-query`
- **THEN** the hook SHALL NOT throw "No QueryClient set" runtime error
