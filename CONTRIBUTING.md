# Contributing to AMRIT MMU UI

Thank you for your interest in contributing to the AMRIT Mobile Medical Unit UI. This document covers everything you need to get your changes from idea to merged PR.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Setting Up the Repository](#setting-up-the-repository)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Convention](#commit-convention)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Filing Issues](#filing-issues)
- [Community](#community)

---

## Code of Conduct

This project follows the [AMRIT community standards](https://github.com/PSMRI/AMRIT). Be respectful and constructive in all interactions.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18.10.0 (recommended) |
| npm | comes with Node |
| Git | any recent version |

> **Note:** The project is built and tested against **Node 18**. Later versions (e.g., v22) generally work but are not officially supported.

---

## Setting Up the Repository

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/MMU-UI.git
cd MMU-UI

# 2. Add upstream remote
git remote add upstream https://github.com/PSMRI/MMU-UI.git

# 3. Initialize the Common-UI submodule
git submodule update --init --recursive
cd Common-UI && git checkout develop && cd ..

# 4. Install dependencies
npm install

# 5. Create the local environment file (gitignored — never commit this)
cp src/environments/environment.local.ts src/environments/environment.ts
```

Edit `src/environments/environment.ts` to point API base URLs at your local or dev backend services.

### Running the dev server

```bash
npm start
```

The app is served at **`http://localhost:4202/#/login`**.

---

## Development Workflow

```bash
# Sync your fork before starting new work
git fetch upstream
git checkout develop
git merge upstream/develop

# Create a feature/fix branch (see Branching Strategy below)
git checkout -b feat/short-description

# Make changes, then verify
npm run lint        # ESLint + Prettier
npm test            # Karma/Jasmine unit tests
npm run build       # ensure the dev build stays green
```

---

## Coding Standards

- **License header** — every new source file must start with the AMRIT GPL-3.0 license block. Copy it from any existing `.ts` file (e.g., `src/app/app.component.ts`).
- **Component selector prefix** — `app-` (kebab-case) for components, `app` (camelCase) for directives.
- **Formatting** — Prettier is enforced via ESLint (`prettier/recommended`). Settings: 2-space indent, single quotes, semicolons, 80-character line width, ES5 trailing commas.
- **TypeScript** — strict mode is on. Avoid `any` unless absolutely necessary; the ESLint rule is set to `warn`, not `error`, but strive for typed code.
- **No commented-out code** — remove dead code before opening a PR.
- **Angular Material** — use existing `MaterialModule` imports; do not add raw CDK/Material imports directly in feature modules.

The pre-commit hook runs `lint-staged`, which auto-fixes and re-stages any ESLint violations in `src/**/*.ts` before each commit.

---

## Commit Convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by **commitlint** on every commit via Husky.

Use the interactive helper to avoid hook rejections:

```bash
npm run commit
```

Allowed types:

| Type | When to use |
|------|-------------|
| `feat` | New feature or user-visible behaviour |
| `fix` | Bug fix |
| `refactor` | Code change with no feature/fix impact |
| `style` | Formatting-only changes |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `perf` | Performance improvement |
| `build` | Changes to build scripts or dependencies |
| `ci` | CI/CD configuration |
| `chore` | Maintenance tasks |
| `revert` | Reverting a previous commit |

---

## Submitting a Pull Request

1. Ensure `npm run lint`, `npm test`, and `npm run build` all pass locally.
2. Push your branch to your fork and open a PR against `PSMRI/MMU-UI:main`.
3. Fill in the PR template (describe the problem, what changed, and how to test it).
4. Link to the related issue (if any) using `Closes #<issue-number>`.
5. Wait for a review. Address all comments before requesting a re-review.
6. Do **not** squash or force-push after a review has started unless asked by a maintainer.

> PRs that change `src/environments/environment.ts` or any file listed in `.gitignore` will be rejected automatically.

---

## Filing Issues

File bugs, feature requests, and questions in the **[main AMRIT issue tracker](https://github.com/PSMRI/AMRIT/issues)** rather than this repository. Centralising feedback helps the maintainers triage efficiently.

---

## Community

Join the [AMRIT Discord server](https://discord.gg/FVQWsf5ENS) to connect with other contributors, ask questions, and stay up to date with development.
