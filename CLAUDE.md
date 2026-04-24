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

## Critical Rules — Read Before Making Any Change

### 1. Never use native `alert()` or `confirm()`
Always use the injected `ConfirmationService` for all user-facing dialogs and alerts.
Native browser dialogs are inconsistent with the Material Design UI and block the JS thread.
```typescript
// WRONG
alert('Something went wrong');
confirm('Are you sure?');

// CORRECT
this.confirmationService.alert('Something went wrong', 'error');
this.confirmationService.confirm('Are you sure?').subscribe(yes => { ... });
```

### 2. Always clean up RxJS subscriptions
`AuthGuard` is a singleton. Any `subscribe()` inside `canActivate()` without `take(1)` or
`takeUntilDestroyed()` will accumulate a new subscription on every route navigation.
```typescript
// WRONG — leaks a subscription on every route change
this.someService.someObservable$.subscribe(val => (this.data = val));

// CORRECT — auto-unsubscribes after first emission
this.someService.someObservable$.pipe(take(1)).subscribe(val => (this.data = val));

// CORRECT in components — use AsyncPipe in templates wherever possible
```

### 3. Never modify clinical code values
Files containing **ICD-10**, **LOINC**, or **SnomedCT** codes are clinical data, not dead code.
Do not rename, restructure, or remove any constant containing these values without explicit
clinical team approval. They are used for interoperability with national health systems.

### 4. Use optional chaining on `currentLanguageSet`
`currentLanguageSet` may be `undefined` on first load (before the language file is fetched).
Always use optional chaining: `this.currentLanguageSet?.alerts?.info?.someKey ?? 'fallback'`.

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
