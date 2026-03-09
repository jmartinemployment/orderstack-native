# OrderStack Native

React Native Bare CLI mobile and tablet client for GetOrderStack. Supports four operational modes: POS (Point of Sale), KDS (Kitchen Display System), Kiosk (self-service ordering), and Register (cashier-facing transaction processing).

---

## Editing Rules

- Do NOT make incremental edits. When changing a file's structure, rewrite the entire file in one pass.
- Do NOT add or remove features not explicitly requested.
- Ask before making architectural decisions.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native (Bare CLI) | 0.84.1 |
| Language | TypeScript (strict) | 5.8+ |
| State | Zustand (with immer middleware) | 5.x |
| Navigation | React Navigation (native stack) | 7.x |
| HTTP | Axios | 1.x |
| Real-time | socket.io-client | 4.x |
| Env | react-native-config | 1.x |
| Animations | react-native-reanimated | 4.x |
| Gestures | react-native-gesture-handler | 2.x |
| Icons | react-native-vector-icons | 10.x |
| Device | react-native-device-info | 15.x |
| Storage | @react-native-async-storage/async-storage | 3.x |

---

## Directory Structure

```
src/
  api/              HTTP client and typed API methods
  components/
    common/         Buttons, inputs, cards, modals, typography
    layout/         Screen wrappers, safe area containers, keyboard avoidance
  constants/        Colors, spacing, typography scale, z-index, breakpoints
  hooks/            Custom React hooks
  models/           TypeScript interfaces and types
  navigation/       React Navigation stack and tab definitions
  screens/
    pos/
    kds/
    kiosk/
    register/
    auth/
    shared/
  services/         Business logic, device detection, printing, peripherals, socket
  store/            Zustand store slices
  utils/            Pure utility functions
  theme/            Design tokens and theme provider
```

---

## Per-Component CLAUDE.md Rule (NON-NEGOTIABLE)

Every directory containing a component or screen MUST have a CLAUDE.md describing:
- Component name and purpose
- File list
- Props interface
- Store dependencies (which Zustand slices)
- Navigation context (routes to and from)
- API calls made
- Applicable skill paths
- Session Notes section

---

## NPM Scripts

| Script | Command |
|--------|---------|
| start | react-native start |
| android | react-native run-android |
| ios | react-native run-ios |
| lint | eslint 'src/**/*.{ts,tsx}' |
| lint:fix | eslint 'src/**/*.{ts,tsx}' --fix |
| test | jest |

---

## Backend

- Production URL: https://get-order-stack-restaurant-backend.onrender.com/api
- Configured via ORDERSTACK_API_URL in .env (loaded by react-native-config)
- Health check: GET /health

## Development Credentials

- Email: owner@taipa.com
- Password: owner123
- Merchant ID: f2cfe8dd-48f3-4596-ab1e-22a28b23ad38

---

## Path Alias Reference

| Alias | Maps To |
|-------|---------|
| @api/* | src/api/* |
| @components/* | src/components/* |
| @constants/* | src/constants/* |
| @hooks/* | src/hooks/* |
| @models/* | src/models/* |
| @navigation/* | src/navigation/* |
| @screens/* | src/screens/* |
| @services/* | src/services/* |
| @store/* | src/store/* |
| @utils/* | src/utils/* |
| @theme/* | src/theme/* |

Aliases are configured in tsconfig.json (TypeScript) and babel.config.js (babel-plugin-module-resolver for runtime).

---

## Skills Registered

| Skill | Purpose |
|-------|---------|
| vercel-react-best-practices | React and data fetching performance patterns |
| vercel-react-native-skills | RN performance, animation, navigation, UI, state |
| vercel-composition-patterns | Component architecture and composition |
| web-design-guidelines | UI quality and accessibility |
| playwright-skill | Browser automation and E2E testing |
| react-native-best-practices (Callstack) | RN optimization from The Ultimate Guide |

---

## MCP Servers

| Server | Scope | Config |
|--------|-------|--------|
| Playwright | project-level | .claude/settings.local.json -> .claude/skills/playwright-skill/run.js |
| Vercel | user-scope | Available automatically after Claude Code restart. Verify: claude mcp list. No project-level config. |
| SonarQube | user-scope | Permissions granted in settings.local.json. No server block. |
| Selenium | user-scope | Permissions granted in settings.local.json. No server block. |

---

## SonarCloud

Project key: jmartinemployment_orderstack-native
All SonarQube rules from the enterprise root CLAUDE.md apply here without exception.

---

## Correctness Over Completion (NON-NEGOTIABLE)

Never stub, mock, or fake a data layer to make a build pass. If a service needs a database, API, or external dependency — wire it up or stop and say "this service needs [X] connected before it works." Do not substitute localStorage, in-memory arrays, or hardcoded data as a shortcut.

Before marking any service as complete:
- [ ] What data source does this service connect to?
- [ ] Did you verify the connection works (not just compiles)?
- [ ] Are there any stubs? If yes, list them explicitly as STUBBED.

---

## No Quick Fixes (NON-NEGOTIABLE)

When a bug is found, trace it to the root cause and fix that. Do not patch symptoms.

---

### Session Notes

**2026-03-09 (Session 1):**
- Project scaffolded with React Native 0.84.1, New Architecture enabled
- Full directory structure, 6 skills, TypeScript strict, ESLint v9 flat config
- Models rewritten to match real backend API (all routes under /api/merchant/:merchantId/...)
- API layer: auth.ts, orders.ts, menu.ts, tables.ts — all wired to real endpoints
- Services: deviceService.ts (persisted device ID), socketService.ts (Socket.io for real-time order events)
- Store: authSlice (with restaurants[] and selectedRestaurantId), orderSlice, cartSlice (with CartItem modifiers)
- LoginScreen: two-phase (credentials -> restaurant picker if multi-restaurant)
- POS Terminal built: menu category tabs, 3-col item grid, cart panel with qty controls and totals, modifier modal, order type selector, table picker, active orders drawer, Socket.io real-time updates, order submission via POST /api/merchant/:id/orders
- KDS, Kiosk, Register screens: entry points with health check and live clock (not yet built out)
- iOS build verified on iPad Pro 13-inch (M5) simulator
- Zero TypeScript errors, zero ESLint errors
- Android build blocked — no Android SDK on machine

**2026-03-09 (Session 2):**
- KDS fully built: KdsDisplayScreen with horizontal ticket layout, OrderTicket component with color-coded headers, live elapsed timer (urgent at 15min+, warning at 10min+), bump-to-next-status, filter tabs (All/New/Confirmed/Preparing/Ready) with counts, empty state, Socket.io real-time updates
- Kiosk fully built: KioskHomeScreen with 3-phase flow (Welcome -> Ordering -> Confirmation), KioskMenuBrowser (sidebar categories + 2-col item grid), KioskCart (qty controls, totals, checkout), reuses POS ModifierModal, orders submitted as orderSource 'kiosk', cancel confirmation dialog
- Register fully built: RegisterScreen with split-panel layout (order list left, detail right), OrderListItem (status badges, elapsed time, item count), OrderDetailPanel (customer/table info, item list with modifiers, totals breakdown, status action buttons), filter tabs (Active/Completed/Cancelled), Socket.io real-time updates, cancel order with confirmation
- All 4 modes complete: POS, KDS, Kiosk, Register
- Zero TypeScript errors, zero ESLint errors
- Next: Bar mode (user will provide separate prompt), iOS rebuild to verify new screens
