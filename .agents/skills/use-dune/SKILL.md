---
name: use-dune
description: Find and use documentation for `@allegro/dune-components`. Use when choosing, building, reviewing, styling, or debugging a Dune component and you need its purpose, API, examples, behavior, accessibility, or visual details without reading the large `index.d.ts`.
---

# Use Dune

Read only the docs for the component you need. Use the package root `index.mjs`
to find components. Never use the root `index.d.ts` to learn about one component.

Use a TypeScript/JavaScript LSP when possible to find exports and inspect types,
references, hover information, and diagnostics. If no usable LSP is available,
use the package files and targeted searches.

## Find the component

Use this process:

1. Use an LSP to find the export and inspect its types. If no usable LSP is
   available, use the package files and the steps below.
2. Check the installed `@allegro/dune-components/package.json` version:
   - For `0.7.3` and later, read the package root `index.mjs`. Its opening
     comment lists all public exports and describes each component.
     Search these descriptions by purpose to find the component you need.
   - For versions below `0.7.3`:
     - For implementation tasks, upgrade first by running
       `npm install @allegro/dune-components@^0.7.3` from the active project root.
       Then read `index.mjs` again and verify that its descriptions are present.
       Do not read component docs or change project files until they are present.
       If the install fails or descriptions are missing, stop and report it.
     - For read-only questions or searches, do not install or change the project.
       Recommend upgrading to at least `0.7.3`, then read the package root
       `index.mjs` to find the public exports. If the package is missing, report
       that it is unavailable.
3. Use the exact package-root public export. If it does not exist, do not use an
   internal or similarly named component.
4. Read the matching `*.d.ts` files and choose the closest component.

## Load references progressively

1. Read `<Component>.d.ts` first for the API, purpose, usage guidance, examples,
   defaults, behavior, accessibility, related components, and imports. It is
   the source of truth for the public API.
2. For implementation, behavior, or a component choice affected by limitations,
   read `Usage quirks` in `<Component>.agent-context.md`.
3. For component appearance, dimensions, also in different states and variants,
   read the rest of `<Component>.agent-context.md`.
4. Follow references to another component's docs only when the
   decision guide identifies it as a plausible alternative.
