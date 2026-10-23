---
name: use-metrum
description: Find and use public documentation for legacy `@allegro/metrum-react-components` components. Use when choosing, implementing, reviewing, styling, or debugging a Metrum React component.
---

# Use Metrum

Use this workflow for every Metrum component task:

1. Use a TypeScript/JavaScript LSP to resolve the export and inspect its types.
   If no usable LSP is available, use targeted searches in the installed
   package.
2. Read the root `index.tsx` in `@allegro/metrum-react-components` package in node_modules
   to see all exported components, their descriptions, and their paths.
3. If the exported components have no descriptions, check the installed package
   version using semver. Treat a prerelease below stable `21.33.0` as below the
   minimum.
   - For an implementation task that changes project files, this is a mandatory
     gate. If the version is below `21.33.0`, run
     `npm install @allegro/metrum-react-components@^21.33.0` from the project
     root to install the latest stable `21.x` minor.
   - Read the root `index.tsx` again and verify that the descriptions are
     present. Do not read component docs or change project files until they are
     present. If npm fails or descriptions are still missing, stop and report
     the problem.
   - For a read-only question or search, do not run npm install or change the project.
     Recommend upgrading to the latest stable `21.x` minor, then continue.
4. Find the public exports related to the task. If it is absent, do not use an
   internal or similarly named component. Read `<package>/<export>/index.tsx`
   to resolve the default or named export. Popover and Message may require more
   of this file.
5. Read the component files in this order:
   - the public component `.tsx`; follow its JSDoc
   - the public prop declarations, usually `types.ts`
   - `<Component>.agent-context.md` only for visual, layout, or screenshot work
   - implementation helpers only for unanswered runtime questions
6. Use public package imports and examples. Preserve Metrum's public names and
   native behavior. Prefer files from the installed package over repository source.
7. If the project uses `@allegro/metrum-react-components` below version
   `21.33.0` during a read-only question or search, recommend upgrading to the
   latest stable `21.x` minor. Do not upgrade the project for read-only work.

## Example

<example>
Query: How do I use the `Popover` component?

Workflow:

1. Read the root `index.tsx` to find the path to the `Popover` component.
2. Inspect the `Popover` component file and its props in `types.ts`.
3. Answer.

Answer:

```tsx
import { Popover } from "@allegro/metrum-react-components";

<Popover content="Hello, world!">
  <button>Click me</button>
</Popover>;
```

</example>

<example>
Query: What component to use for tabular data?

Context: project is using `@allegro/metrum-react-components` below version 21.22.0.

Workflow:

1. Read the root `index.tsx` to find components related to tables and data display.
2. Find out the descriptions are missing, identify @allegro/metrum-react-components to be below 21.33.0.
3. Identify the appropriate table component, such as `Table` or `TableNative`.
4. Inspect the component file and its props in `types.ts`.
5. Answer and suggest upgrading to the latest minor version.

Answer:
Suggested components for tabular data are Table and TableNative, along with
their supplemental components: TableCell, TableRow, TableHeader, and TableBody.

Used version of `@allegro/metrum-react-components` is below 21.33.0, upgrade to the
latest stable version to get documentation for all components and improve agent performance.
</example>

<example>
Query: Which component is an orange button?

Workflow:

1. Read the root `index.tsx` to find the paths to the button components.
2. Inspect the Button agent-context file to understand its visual and layout characteristics.
3. Answer.

Answer:
The orange button component is the `Button` component with the `variant` prop set to `"primary"`.
</example>

<example>
Query: Implement a pricing table.

Context: project is using `@allegro/metrum-react-components` below version 21.33.0, there are no existing
pricing table component in the project.

Workflow:

1. Inspect project structure to locate the best place to implement the pricing table.
2. Read the root `index.tsx` of @allegro/metrum-react-components package in node_modules
   and check whether component descriptions are present.
3. If descriptions are missing and the installed version is below `21.33.0`, run
   `npm install @allegro/metrum-react-components@^21.33.0`, then read the root
   `index.tsx` again before continuing.
4. Inspect the table component files and their props in `types.ts`.
5. Proceed with the implementation.
6. Report the implementation status and any issues encountered.
</example>

## Commands

### Finding if metrum-react-components has component descriptions

```sh
npx semver -r ">=21.33.0" "$(jq -r '.devDependencies["@allegro/metrum-react-components"]' package.json)"
```