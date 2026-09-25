# Contributing to MMU-UI

## Prerequisites

- **Node.js**: v18.10.0 or higher
- **Angular CLI**: v16.2.x (`npm install -g @angular/cli`)
- **Git**: v2.x or higher

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PSMRI/MMU-UI.git
   cd MMU-UI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Initialize Common-UI submodule:
   ```bash
   cd Common-UI && git submodule update --init --recursive && git checkout develop
   ```

4. Start the dev server:
   ```bash
   npm start
   ```
   Access at `http://localhost:4202/#/login`

## Branch Naming

Use prefixes for clarity:
- `feat/` — New features
- `fix/` — Bug fixes
- `chore/` — Dependencies, build, tooling
- `docs/` — Documentation updates
- `refactor/` — Code improvements

Example: `feat/patient-registration-flow`

## Commits

Conventional Commits are **enforced** by Husky + commitlint:

```
type(scope): description

Valid types: feat, fix, build, chore, ci, docs, perf, refactor, revert, style, test
Example: feat(vitals): add blood pressure validation
```

Use `npm run commit` for an interactive prompt.

## PR Checklist

Before submitting a PR:

- [ ] `npm run lint:fix` — ESLint passes
- [ ] No `console.log()` in production code (only `console.warn/error` allowed)
- [ ] `npm test` — Tests pass
- [ ] Branch follows naming convention
- [ ] Commit messages follow Conventional Commits
- [ ] Code uses Angular services for state (BehaviorSubject pattern)

## Code Standards

### State Management
- Use `BehaviorSubject` in services for reactive state
- No NgRx — services manage component communication
- Example: `NurseService`, `HttpServiceService`

### No Console Output
- Remove all `console.log()` from production code
- Only `console.warn()` and `console.error()` are allowed
- ESLint enforces this via `no-console` rule

### TypeScript & Templates
- Strict mode enabled (`strict: true`)
- Strict templates enabled (`strictTemplates: true`)
- Use `any` only when unavoidable (rule disabled, but discouraged)

## Running Tests

```bash
npm test
```

Tests run in watch mode. Files are re-tested on change.

## Questions?

See [CLAUDE.md](CLAUDE.md) for detailed architecture notes.
File issues in the [main AMRIT repo](https://github.com/PSMRI/AMRIT/issues).
