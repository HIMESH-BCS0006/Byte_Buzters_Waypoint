# AI Tool Disclosure Log

- **Who:** Antigravity AI Coding Assistant (Gemini 3.6 Flash)
- **Tool:** Google Antigravity Agentic IDE
- **What Generated:**
  - Initialized Vite + React + TypeScript + Tailwind CSS dispatcher project setup, folder structure `src/{api,components,features,hooks,lib,pages,routes}`, Orval API client configuration (`orval.config.ts`), custom mutator (`src/api/http.ts`) with Bearer token authentication and `ApiError` parsing, dispatcher console pages/components/routing, and Vitest + Testing Library smoke test.
  - Implemented Dispatcher App Shell per Spec 04 Section 2.3: `LoginPage` (`POST /auth/login`), `AuthProvider` token storage and `GET /me` verification, `RequireDispatcher` route guard rendering `WrongRolePage` for non-dispatcher roles, multi-depot selection context (D24), `useBusinessNow()` hook utilizing `GET /ref/config` business clock (cutoff 16:00), `useLiveEvents()` real-time status/polling fallback hook, shared UI components (`PageHeader`, `LoadingState`, `EmptyState`, `ErrorState`, `ViolationList`, `StatusBadge`), Asia/Colombo time helpers (`src/lib/time.ts`), sidebar navigation (Dashboard, Orders, Planning, Deferred, Loading Coordination, Live Monitoring), header with depot selector, delivery date, connection status badge, and demo mode indicator. Added unit tests for route guard redirects, `ApiError` envelope parsing, and `ViolationList` component.
- **What Reviewed:** Human developer reviewed generated code, verified Orval schema generation, tested type safety via `tsc`, and verified Vitest unit test suite execution.
