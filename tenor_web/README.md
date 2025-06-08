# Welcome to Tenor

## What's Tenor?

Tenor is an intelligent, flexible, and lightweight project management tool designed for agile software teams.
Built specifically for Scrum workflows, Tenor uses AI to automate and simplify planning, helping teams stay aligned, reduce overhead, and focus on what matters most: building great software.

## Onboarding & Good Code practices

This section outlines how to get started, contribute effectively, and understand the structure and standards of the project.

### Repository Structure & Contribution Guidelines

General contribution rules can be found in the root-level documentation folder [root-level documentation folder](../README.md)

Before submitting a pull request, please review these guidelines to ensure code consistency and project maintainability.

Full technical documentation is available inside the [Docusaurus site](../tenor_docs/). This includes design decisions, API references, and contribution guides.

### Run the project locally

1. Install dependencies:

```bash
npm install
```

2. Create a .env file:

Use the provided `.env.example` file as a reference. This file includes all required environment variables and project configurations.

3. Run the app in development mode:

```bash
npm run dev
```

Other available scripts can be found in the `package.json` file.

### Component Structure Guidelines

Standard structure for organizing logic inside main view components in the Tenor project. This convention improves readability, maintainability, and onboarding for complex components.:

- Easier to onboard new devs
- Consistent file layout
- Faster debugging and navigation
- Clean separation of concerns

#### 1. React Hooks (Pre-TRPC)

Use for retrieving route/context data or local state unrelated to async calls.

Examples:

```ts
// #region REACT – Pre-TRPC Hooks
const { projectId } = useParams();
const [view, setView] = useState("kanban");
```

#### 2. TRPC Queries & Mutations

Must come **after** Pre-TRPC hooks (e.g. `projectId` is often used in queries).

Examples:

```ts
// #region TRPC
const { data: items } = api.items.getAll.useQuery({ projectId });
const utils = api.useUtils();
```

#### 3. React Hooks (Post-TRPC)

Use for lifecycle or memoization logic **based on TRPC results**.

Examples:

```ts
// #region REACT – Post-TRPC Hooks
useEffect(() => {
  if (!items) return;
  setViewState(items.length > 0 ? "kanban" : "empty");
}, [items]);
```

#### 4. Utility & Constants

All other variables, pure functions, filters, config, etc.

Examples:

```ts
// #region UTILITY
const columns = ["todo", "doing", "done"];
const filterItems = (items: Item[]) => items.filter(...);
```

Use sub-`#region`s if the utility block is long or has internal sections.

#### 5. JSX / Render

Place rendering logic last. Split into subcomponents if needed. Regions are optional here.

- **Mandatory** for complex views (>100 LOC) or core app pages
- **Optional** for very small components or quick utility views

Use VS Code foldable comments:

```ts
// #region TRPC
...
// #endregion
```

Recommended Region Names:

- `REACT – Pre-TRPC Hooks`
- `TRPC`
- `REACT – Post-TRPC Hooks`
- `UTILITY`

### Project Directory Overview

```txt
/src
├── app      # Next.js frontend application (routes, pages, UI)
├── server   # Backend and business logic
├── trpc     # tRPC router definitions and middleware
├── lib      # Shared code and utilities (used by both frontend and backend)
├── styles   # Global styles, CSS variables, and design tokens
```

Beyond component-level organization, Tenor follows a set of conventions to keep logic modular, centralized, and scalable across the codebase.

#### `app/`

- `_components/`: App-wide shared UI components used across multiple pages or layouts.
- `_hooks/`: Reusable logic encapsulated in hooks.
- `useAlert.tsx`: Global alert hook — used for standardized toast/alert handling throughout the app.

#### `server/`

- `api/shortcuts/`: Contains the core business logic for specific features or domains. Each file abstracts TRPC procedure logic and isolates side-effects or mutations.
- `api/routers/`: Houses TRPC router definitions for endpoints, referencing functions from `shortcuts/`.
- `errors.ts`: Centralized module for defining and exporting all custom server-side errors.

## Tech Stack

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

For deployment, follow the guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

To explore the system architecture and design decisions, check out the [app’s diagrams directory](../diagrams/).

## E2E Testing

To ensure long-term reliability and maintainability of the platform, we use Cypress for both end-to-end (E2E) and component testing.

All Cypress-related tests and configurations are organized inside the cypress/ directory. This includes:

- E2E Tests: Simulate full user flows across the app to validate real-world interactions and critical paths.
- Component Tests: Focused tests on isolated UI components to catch issues early in development.
