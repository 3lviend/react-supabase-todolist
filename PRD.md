# Product Requirement Document (PRD): Todolist React ElectricSQL

## Background

### Problem Statement
In the modern web landscape, users expect applications to be reliable and responsive regardless of network conditions. Traditional cloud-first web applications often become unusable during intermittent connectivity, leading to data loss, user frustration, and disrupted workflows. Users need a solution that guarantees data persistence and application availability 100% of the time, even when offline.

### Market Opportunity
The "Local-First" software movement is gaining significant traction as devices become more powerful. By shifting the database to the client (using WASM-based SQLite/PostgreSQL), developers can offer "desktop-class" responsiveness in a web browser. This project leverages **ElectricSQL**, a cutting-edge sync engine, combined with **Supabase**, a proven backend-as-a-service, to deliver a best-in-class local-first experience. This combination addresses the complexity of conflict resolution and synchronization, which has historically been a barrier to entry for local-first development.

### User Personas
*   **Alex, the Field Professional:** Frequently works in areas with spotty internet (e.g., transit, basements). Needs to capture tasks immediately without waiting for a server round-trip.
*   **Sarah, the Privacy Advocate:** Prefers data to reside on her device primarily, using the cloud only for backup and multi-device synchronization.
*   **Devin, the Developer:** actively evaluating the ElectricSQL + Supabase stack. Needs a reference implementation to understand how to architect a production-ready local-first app.

### Vision Statement
To establish the gold standard for local-first web application architecture, demonstrating that complex data synchronization can be robust, invisible, and developed with standard web technologies.

### Product Origin
This project was created to provide a tangible, production-grade example of a collaborative Todo List application using **ElectricSQL** and **Supabase**. It serves as a proof-of-concept for replacing complex optimistic UI logic with a true local database approach.

## Features

### Core Features
1.  **Offline-First CRUD:** Create, Read, Update, and Delete Todo lists and items without any network connection.
2.  **Real-Time Synchronization:** Automatic background synchronization of data between devices via ElectricSQL when online.
3.  **Supabase Authentication:** Secure user identification and session management integrated with the local database.
4.  **Multi-List Management:** Organize tasks into distinct lists with summary views (active/completed counts).
5.  **Search:** Full-text search capability across lists and items using local SQL queries.

### User Benefits & Technical Specifications
*   **Benefit: Zero Latency interactions.**
    *   *Technical Spec:* All read/write operations execute against a local PGlite (PostgreSQL in WASM) instance. UI updates are immediate.
*   **Benefit: Data Consistency & Integrity.**
    *   *Technical Spec:* ElectricSQL handles conflict resolution via CRDT-like patterns and replication protocols, ensuring eventual consistency across devices.
*   **Benefit: Cross-Device Continuity.**
    *   *Technical Spec:* Post-authentication, data syncs automatically. A user starting a list on mobile can finish it on desktop.

### Feature Prioritization (MoSCoW)
*   **Must Have:** Local PGlite database, Bi-directional sync with Supabase, User Auth, Basic List/Task CRUD, Conflict-free merging.
*   **Should Have:** Offline status indicators, Search functionality, Responsive Mobile UI (PWA).
*   **Could Have:** Shared lists (multi-user collaboration), Push notifications, Attachment support.
*   **Won't Have:** PowerSync integration (Removed in favor of exclusive ElectricSQL usage), Complex role-based access control (beyond owner-only).

### Future Enhancements
*   **Collaborative Sharing:** Allow users to invite others to specific lists.
*   **Rich Text Support:** Markdown descriptions for tasks.
*   **Native Mobile Wrappers:** Capacitor/React Native versions using the same core logic.

## User Experience

### UI Design Principles
*   **Optimistic by Default:** The interface never waits for the server. Loading spinners are reserved only for initial boot or auth actions.
*   **Connectivity Awareness:** Subtle indicators show sync status (Connected/Offline) without obstructing the user flow.
*   **Simplicity:** A clean, distraction-free interface focusing on the content (Lists and Tasks).

### User Journey Mapping
1.  **Onboarding:** User lands on the welcome page -> Sign Up/Login via Supabase.
2.  **Initialization:** App boots PGlite -> Establishes replication connection -> Downloads user's dataset.
3.  **Core Loop:** User creates a list -> Adds tasks -> Checks them off. All actions reflect instantly.
4.  **Offline Scenario:** User loses internet -> Continues editing -> App queues changes locally.
5.  **Reconnection:** Internet returns -> App automatically syncs queued changes to Supabase -> UI updates with any remote changes.

### Usability Testing & Accessibility (WCAG)
*   **Contrast & Sizing:** Adherence to WCAG AA standards for color contrast and touch target sizing (min 44px).
*   **Keyboard Navigation:** Full Tabbing support for form inputs and list items.
*   **Screen Readers:** Semantic HTML structure (main, section, list, button) and ARIA labels where necessary.

### Feedback Loops
*   **Sync Status:** Visual icon (Wifi/WifiOff) in the navigation bar to indicate connection state to the user.
*   **Error Handling:** Graceful degradation with user-friendly toast notifications for auth or critical sync errors.

## Milestones

### Development Phases & Critical Path
*   **Phase 1: Foundation (Completed):** Setup Supabase project, initialize React app, configure basic ElectricSQL PGlite integration.
*   **Phase 2: Feature Parity (Completed):** Implement Auth, CRUD for Lists/Todos, and basic styling.
*   **Phase 3: Refactoring (Completed):** Remove legacy sync engines (PowerSync), consolidate on ElectricSQL, refine UI components (Layout, Menus).
*   **Phase 4: Polish & Launch (Current):** Update documentation (README, PRD), final bug fixes (runtime loading), usage verification.

### Review Points & Launch Plan
*   **Code Review:** Verify removal of all unused dependencies and dead code (PowerSync).
*   **Type Safety:** Ensure strict sets of TypeScript rules are met (no implicit any).
*   **Build Verification:** Successful `pnpm build` with new Vite type definitions.

### Post-Launch Evaluation
*   **Performance Monitoring:** Track time-to-interactive and sync latency.
*   **User Feedback:** Collect reports on sync reliability in varying network conditions.

## Technical Requirements

### Tech Stack & System Architecture
*   **Frontend Framework:** React 18, Vite 5.
*   **Language:** TypeScript 5+.
*   **Local Database:** `@electric-sql/pglite` (PostgreSQL in WASM).
*   **State Management:** React Context + `useLiveQuery` (Reactive SQL).
*   **Backend/Auth:** Supabase (PostgreSQL).
*   **UI Library:** Material UI (MUI).

### Security Measures
*   **Authentication:** Supabase GoTrue (JWT-based).
*   **Authorization:** Supabase Row Level Security (RLS) policies enforcing `users` can only access their own `lists` and `todos`.
*   **Environment Security:** Public/Private key separation; API keys stored in `.env.local` (not committed).

### Performance Metrics & Integration Requirements
*   **Initial Load:** Application shell should load in < 1.5s.
*   **Sync Latency:** Local-to-Remote sync within 1s on stable 4G.
*   **Bundle Size:** Optimized vendor chunks; prevent unnecessary inclusion of unused icons/libraries.
