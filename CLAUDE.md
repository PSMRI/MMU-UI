# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AMRIT MMU (Mobile Medical Unit) UI — an Angular 16 healthcare application for the PSMRI AMRIT platform. Supports nurse, doctor, lab technician, pharmacist, radiologist, and oncologist workflows including patient registration, vitals capture, clinical examination, diagnosis, prescriptions, lab tests, drug dispensing, and offline data sync for van operations.

## Build & Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server on **port 4202** (`ng serve`) |
| `npm run build` | Production build |
| `npm run build-dev` | AOT dev build (increased heap) |
| `npm run build-prod` | AOT production build (increased heap) |
| `npm run build-ci` | CI build (generates `environment.ci.ts` from template + env vars) |
| `npm test` | Run tests (Karma + Jasmine) |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run commit` | Commitizen conventional commit prompt |

## Git Submodule: Common-UI

`Common-UI/` is a git submodule from `https://github.com/PSMRI/Common-UI`. It provides:
- `registrar` module (patient registration + `SessionStorageService`)
- `feedback` module
- `tracking` module (Matomo analytics)

Initialize with:
```bash
cd Common-UI && git submodule update --init --recursive && git checkout develop
```

Import paths use `Common-UI/src/...` (e.g., `Common-UI/src/registrar/registration.module`).

## Architecture

### Module Structure
- **AppModule** — root module with hash-based routing (`useHash: true`)
- **CoreModule** — singleton services, guards, shared components, directives. Uses `CoreModule.forRoot()` pattern
- **Feature modules** (lazy-loaded): `nurse-doctor`, `lab`, `pharmacist`, `data-sync`, `registrar` (from Common-UI), `feedback` (from Common-UI)
- **MaterialModule** — re-exports all Angular Material modules

### State Management
No NgRx — uses Angular services with `BehaviorSubject`/`Subject` for reactive state. Key examples:
- `NurseService` — cross-component clinical state (RBS, NCD, IDRS, assessment)
- `HttpServiceService` — language/i18n state via `currentLangugae$` BehaviorSubject
- `SessionStorageService` (Common-UI) — encrypted sessionStorage via `ng-cryptostore`, key from `environment.encKey`

### HTTP / Auth
- `HttpInterceptorService` — attaches auth tokens (`Authorization`, `ServerAuthorization`), manages spinner, handles 27-minute session timeout with warning dialog, auto-logout on 401/5002
- Auth tokens stored in sessionStorage as `authenticationToken` and `isAuthenticated`
- `AuthGuard` protects clinical routes; `CanDeactivateGuardService` prevents navigation with unsaved changes

### Key Services (core)
- `ConfirmationService` — alert/confirm/remarks dialogs via `CommonDialogComponent` + `MatDialog`
- `IotService` — Bluetooth device integration at `http://localhost:8085/ezdx-hub-connect-srv`
- `SpinnerService` — global loading indicator

### Routing
Root routes: `login`, `service`, `servicePoint`, `registrar`, `nurse-doctor`, `lab`, `pharmacist`, `datasync`
Nurse-doctor sub-routes: role-specific worklists, patient workarea (`attendant/:attendant/patient/:beneficiaryRegID`), case sheet print, reports

## Code Conventions

- **License header**: All source files begin with the AMRIT GPL-3.0 license block
- **Component prefix**: `app` (kebab-case for components, camelCase for directives)
- **Commit convention**: Conventional Commits enforced via commitlint. Types: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `revert`, `style`, `test`
- **Pre-commit hook**: `lint-staged` runs ESLint `--fix` on `src/**/*.ts`
- **Formatting**: Prettier — 2-space tabs, single quotes, semicolons, 80 char width, ES5 trailing commas
- **TypeScript**: strict mode, ES5 target, strict templates enabled

## Frontend UI Standard — Zard UI + shadcn + Tailwind (migration)

The app is being migrated **off Angular Material and Bootstrap** to **Zard UI (`Common-UI/v2/ui`, shadcn-style components) + Tailwind CSS v4 (utility-first)** on the shared AMRIT blue+white theme. When you create or migrate any screen/component:

- **Reference the REAL shadcn + Tailwind docs first — never build from memory.** Use the shadcn MCP / **context7** (`/llmstxt/ui_shadcn_llms_txt`, `/tailwindlabs/tailwindcss.com`) for the actual block/component structure and exact utility names, every time. Building "shadcn-ish" from memory is the #1 mistake.
- **A migrated screen contains ZERO Angular Material and ZERO Bootstrap.** No `mat-*`/`matInput`/`MaterialModule` in the template, no Bootstrap classes (`row`/`col-*`/`btn`/`d-flex`/`container`). `MatDialog`/`ConfirmationService` may remain *temporarily* during coexistence; migrate to `ZardDialogService` when reworking that area.
- **Utility-first only — no component CSS.** Style inline with Tailwind utilities; **delete the component `.scss`/`.css`** and `styleUrls`. Use theme tokens (`bg-card`, `text-muted-foreground`, `bg-primary`, `border-input`, `rounded-lg`…); **never hardcode hex or inline `style=`**. Use Zard components for all controls (`z-card`, `z-form-field`/`z-input`, `z-select`, `z-button`, `z-menu`, …); import from `Common-UI/v2/...`.
- **Border radius MUST match across the form** — inputs, buttons, and select triggers all use the theme radius (`var(--radius)`, 10px). See the gotcha below; verify they're identical.
- **Every component standalone** (no `NgModule`); icons via `@ng-icons/lucide` + `provideIcons(...)`.

### Critical gotchas (Material/Bootstrap still load globally; Tailwind preflight is OFF)
Bootstrap is in the lowest `@layer`, so utilities beat it — but **unlayered legacy CSS (Material theme, `styles.css`) still beats utilities**:
1. **Bare `<button>` (incl. the `z-select` trigger) renders square + native-gray** — Material ships an unlayered `button{border-radius:0}` and there's no preflight reset. Fixed app-wide by the unlayered reset in `src/styles.css`: `[z-button], z-select [role='combobox'] { -webkit-appearance:none; appearance:none; border-radius:var(--radius) }`. **Remove this block once Material is removed AND Tailwind preflight is re-enabled.**
2. **Never put text in a bare `<h1>`–`<h6>`** — unlayered Material typography overrides `text-*`. Use `z-card-title`/`z-card-description`, a `label`, or a non-heading element.
3. **Password eye toggle** = a plain boxless `<button>` (`appearance-none border-0 bg-transparent inline-flex items-center justify-center`) inside the input — shadcn's addon pattern, not a Button component. `::-ms-reveal` is suppressed in `tailwind.css` so Edge's native eye doesn't duplicate it.
4. **`@ng-icons` size** comes from the `size` attribute (`--ng-icon__size`, an unlayered `:host` rule) — Tailwind `size-*` classes don't size an `ng-icon`. Inside a `z-button`, omit `size=` and let the button size it.
5. **Watch out:** never write `*/` inside a CSS comment (e.g. `rounded-*/...`) — it closes the comment early and breaks the file.

**Full guidance + per-screen recipe: the `frontend-ui` skill** (`.claude/skills/frontend-ui/SKILL.md`).

## Environment Configuration

Environment files in `src/environments/`. CI build uses EJS template (`environment.ci.ts.template`) with env vars for API endpoints, encryption keys, captcha config, and tracking config. Key environment properties:
- API base URLs: `commonAPI`, `mmuAPI`, `tmAPI`, `schedulerAPI`, etc.
- `encKey` — sessionStorage encryption key
- `siteKey` / `captchaChallengeUrl` — captcha configuration
- `tracking` — Matomo analytics config (siteId, trackerUrl, enabled)
- `isMMUOfflineSync` — enables offline data sync feature

## Key Dependencies

- Angular 16.2 + Angular Material 16.2
- Bootstrap 5.3 (layout) + Font Awesome 4.7 (icons)
- RxJS 7.8, Moment.js 2.30
- `ng-cryptostore` — encrypted sessionStorage
- `exceljs` + `file-saver` — Excel report generation
- `ngx-webcam` — webcam capture
- `ng2-charts` / `chart.js` — charts
- `recordrtc` — audio recording
