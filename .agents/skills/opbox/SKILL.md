---
name: opbox
description: Opbox platform reference — architecture, component/plugin/service lifecycle, parameters, i18n, styling, dark mode, analytics, Edge/HTTP, preferences, testing, monitoring, OBT build tooling and configuration, previews, prototypes, refresh/navigation, size limits, slots, static assets and TypeScript support
---

# Opbox

Combined reference covering all Opbox topics below. `article://` links are techdocs URIs — resolve them with an MCP resource-read tool, not a web fetch.

`node_modules/@allegro/opbox-build-tools/docs/...` paths ship with the package and assume the project has the latest version of `opbox-build-tools` installed.
If the file isn't present (dependency missing or outdated), the same content is mirrored at `article://sc-12443/general/<path-after-docs/>` — e.g. `node_modules/@allegro/opbox-build-tools/docs/configuration/modular-css.md` → `article://sc-12443/general/configuration%2Fmodular-css.md` — resolvable with an MCP resource-read tool.
Alternatively, ask the user to install the latest version of `opbox-build-tools`.

## Architecture Overview

- High-level Opbox architecture: opbox-build-tools, opbox-web, opbox-runtime, opbox-web-browser, and how opbox-web creates a component instance and runs its render method.
  `article://sc-29967/general/components%2Foverview.md`
- Full index of the opbox-web-browser client API surface (Analytics, Box views marker, EDGE, EDGE Files, Preferences, Component, Plugin, Services, Page APIs) — a map of what's available client-side.
  `article://sc-12453/general/index.md`
- Reference of errors reported by opbox-web-browser, grouped by module (Component, Analytics, Navigation, opbox-web-client, Plugins, Preferences).
  `article://sc-12453/general/known-errors.md`
- Tagged/coded error reference for opbox-web-browser (`owb-*` error codes) and their formatting scheme.
  `article://sc-12453/general/tagged-errors.md`

## Component Lifecycle

- Definition of an Opbox component: what files it must provide (input data description, opbox-web registry entry, monitoring/alerting setup).
  `article://sc-29967/general/components%2Fwhat-is-a-component.md`
- Component lifecycle in the browser: registering a component implementation for a prototype, constructor parameters, onMount, onUpdate, onUnmount.
  `article://sc-12453/general/component.md`

## Component Parameters

- How parameters/props are passed to a component from presets/Opbox Admin, the propsMapper and propsSerializer functions, and the available context parameter kinds.
  `article://sc-29967/general/components%2Fparameters.md`

## Component Testing

- Component test coverage expectations, unit tests, E2E tests, running tests in the GitHub Actions workflow, and debugging that workflow.
  `article://sc-29967/general/components%2Ftesting.md`

## Analytics

- Why and how Opbox components collect and provide analytics data for business measurement.
  `article://sc-29967/general/components%2Fanalytics.md`
- Client-side Analytics API: standardized measurement of page views, user engagement, immersion level, page height, engagement time, analytics tags and partials.
  `article://sc-12453/general/analytics%2Fabout.md`
- API for sending custom analytics events, including controlling visibility tracking of child boxes/items.
  `article://sc-12453/general/analytics%2Fapi.md`

## Dark Mode

- How dark mode is activated/disabled in Opbox Admin and how it works, and how to support it using Metrum React Components' `MetrumProvider` or vanilla JS, including in preview.
  `article://sc-29967/general/components%2Fdark-mode.md`

## Dynamic Imports

- Using the `import()` syntax with a `webpackChunkName` comment to code-split a module, an example in a component, testing dynamic imports, and the bundle-size tradeoffs of using them.
  `node_modules/@allegro/opbox-build-tools/docs/dynamic-import.md`

## HTTP Requests via Edge

- Why Opbox components can't send server-side HTTP requests directly and must use Edge/data sources instead; sending requests to Edge and local development notes.
  `article://sc-29967/general/components%2Fhttp.md`
- Client-side Edge HTTP client for communicating with services exposed behind the public Edge API: get/put/post/patch/delete for data and files.
  `article://sc-12453/general/edge.md`

## i18n

- How Opbox lets a component serve translated text to non-Polish-speaking users, viewing a component in different languages, Preview/Phoenix environment behavior, and Continuous Localization (CL) for auto-translating new/changed `.po` keys.
  `article://sc-29967/general/components%2Fi18n.md`
- OBT i18n reference: `translations` config in opbox.config.js, `.po` file format, the `_`/`_setLanguage`/`_currentLanguage`/`_configuration` API, interpolation, pluralization (incl. Polish/English rules), translation context, and usage in mocha/jest and other test runners.
  `node_modules/@allegro/opbox-build-tools/docs/i18n.md`

## Import Aliases

- Defining Webpack resolve aliases via the `alias` property in opbox.config.js.
  `node_modules/@allegro/opbox-build-tools/docs/configuration/aliases.md`

## Metrum CSS

- Metrum design system in Opbox: metrum-core, Metrum components, metrum assets, Metrum React Components, CSS modules, custom CSS declarations, breakpoints.
  `article://sc-29967/general/components%2Fcss.md`
- CSS Modules internals: the `composes` declaration syntax and its limitations, virtual classes, the generated `metrum-assets.json` file, and the naming convention for built `main.css`/`client.css` files.
  `node_modules/@allegro/opbox-build-tools/docs/configuration/modular-css.md`

## Monitoring

- Server-side monitoring requirements by Opbox project type and criticality level, alerting policy profiles, and verifying Sentry error reporting.
  `article://sc-29967/general/components%2Fmonitoring.md`
- Debugging a component: Opbox Inspector, browser console, metrics & logs, and Sentry.
  `article://sc-29967/general/components%2Fdebugging.md`
- Debugging a service: Opbox Inspector, browser console, and Sentry.
  `article://sc-29967/general/services%2Fdebugging.md`
- Debugging a plugin: Opbox Inspector (plugin version, props from Admin/Core, client-side props), browser console, metrics & logs, Sentry.
  `article://sc-29967/general/plugins%2Fdebugging.md`

## OBT Commands

- For full reference of `obt` CLI commands execute `npx obt --help -y`. Additional information can be found in `node_modules/@allegro/opbox-build-tools/docs/tasks.md`
- Basic steps to clone, install dependencies and run a component in preview mode.
  `article://sc-29967/general/components%2Fbasic-commands.md`
- What opbox-build-tools is, installing it (incl. eslint-config-opbox/stylelint-config-opbox setup), CLI help, and a summary of its previewing/building/testing capabilities.
  `node_modules/@allegro/opbox-build-tools/docs/index.md`
- `opbox-mcp` (beta): an MCP server that gives AI assistants/IDEs access to Metrum docs, Opbox prototypes, services' OpenAPI schemas, and general component-development info.
  `article://sc-29967/general/components%2Fai-assisted-development.md`

## OBT Configuration

- Complete opbox.config.js options: packageType, client/server entries, preview (incl. custom background and render-page-domain), translations, unitTests/e2eTests/visualRegressionTests/a11yTests/snapshotTests, alias, edgeProxy, terser/terserES6, eslint/stylelint/markdownlint, sizeLimits, telemetry, hotModuleReload, multiprocessBuild, webpackCustomizerPath and more.
  `node_modules/@allegro/opbox-build-tools/docs/configuration/index.md`
- Extending OBT's default Babel config via a project-level `babel.config.js`, incl. per-target (`server`/`client`/`client-esm`) functional config.
  `node_modules/@allegro/opbox-build-tools/docs/configuration/babel.md`
- How OBT shares common third-party libraries across components (`opbox-shared-vendors`) to cut bundle size, and the `assets.preloads` wiring required in `createServerComponent`.
  `node_modules/@allegro/opbox-build-tools/docs/shared-vendors.md`
- Setting up eslint-config-opbox/stylelint-config-opbox/markdownlint, automatic pre-commit formatting via husky+lint-staged, and customizing linter executable locations in a monorepo.
  `node_modules/@allegro/opbox-build-tools/docs/linters.md`

## Plugin Lifecycle

- Definition of an Opbox plugin and its typical use cases.
  `article://sc-29967/general/plugins%2Fwhat-is-a-plugin.md`
- Browser-side Plugin API: registering a plugin and retrieving it with `get` (a plugin can't be registered twice).
  `article://sc-12453/general/plugins.md`
- Building a plugin: package.json/opbox.config.js setup, server-side rendered markup, injecting scripts, custom CSS, retrieving props client-side, publishing.
  `article://sc-29967/general/plugins%2Fdeveloping-a-plugin.md`

## Preferences

- Client-side One Cookie preferences API: `set`, `setMany`, `get`, `getMany`.
  `article://sc-12453/general/preferences.md`

## Preview

- Defining component presets in `src/dummy/presets.ts`, adding example slots/boxes, customizing a preset's URL and box name, setting prototype name/version, implementation variant, and customizing the preview page background.
  `node_modules/@allegro/opbox-build-tools/docs/preview/component-presets.md`
- Defining plugin presets in `src/dummy/presets.ts` and interactive "snippets" (auto-run or triggered scripts) for exercising a plugin's exported functions on the preview page.
  `node_modules/@allegro/opbox-build-tools/docs/preview/plugin-presets.md`
- Mocking Edge requests during local preview so components relying on Edge data can be tested without a real backend.
  `node_modules/@allegro/opbox-build-tools/docs/preview/edge-proxy.md`

## Prototypes

- Creating a prototype (ID, location, version, content, parameters), publishing it, using it on a page by adding a box in Opbox Page Manager, and linking a component implementation to it via `handledPrototypes`.
  `article://sc-29967/general/components%2Fprototype.md`
- Box prototype structure and parameters: version scheme, slot declarations, and a worked "Returns Form" example.
  `article://sc-29967/general/architecture%2Fprototypes%2Fbox-prototype.md`
- Parameter Type prototype: the available simple/ENUM/custom parameter types for box and data source parameters.
  `article://sc-29967/general/architecture%2Fprototypes%2Fprototype-parameters.md`
- When a Data Source or Box prototype's version does or doesn't need to change for a given kind of edit.
  `article://sc-29967/general/architecture%2Fprototypes%2Fversioning.md`
- Defining custom Data Source parameters that become configurable fields in Opbox Admin, and their allowed values.
  `article://sc-29967/general/architecture%2Fdata-sources%2Fcustom-parameters.md`

## Refresh and Navigation

- Lazy loading boxes to improve render time, light refresh, hard refresh, and changing URL parameters via changeParams/changeState.
  `article://sc-29967/general/components%2Frefresh-props.md`
- Client-side Navigation API: changeParams, refreshPage, changeState, and registering/removing their change callbacks.
  `article://sc-12453/general/navigation.md`
- Client-side Page API: changeParams, updatePage, hash handling, and render.slot for regenerating a page or fragment without a full reload.
  `article://sc-12453/general/page.md`
- Subtree render: fetching and re-rendering a page fragment (`window.opbox.page.render.box`), and how to embed lazy content on a page.
  `article://sc-29967/general/architecture%2Fsubtree-render.md`

## Service Lifecycle

- Browser-side Service API: a middleware layer for cross-component communication (`get`, `register`, `dangerouslyGet`), with practical examples.
  `article://sc-12453/general/services.md`
- Definition of an Opbox service.
  `article://sc-29967/general/services%2Fwhat-is-a-service.md`
- Server-side API a service must expose to opbox-web/opbox-web-browser, and the client-side API of a service vs. a component.
  `article://sc-29967/general/services%2Fservice-lifecycle.md`
- Unit testing a service repository, and unit/manual testing a component repository that consumes a service.
  `article://sc-29967/general/services%2Ftesting.md`

## Size Limits

- Configuring `sizeLimits.clientFiles` per file (and per language/ES version) in opbox.config.js, running `obt test:size` in production mode, and reading pass/fail/verbose logs.
  `node_modules/@allegro/opbox-build-tools/docs/size-limits.md`

## Slots

- Declaring a slot, refreshing generated TypeScript slot types, adding a dummy slot to a preset, rendering slot content, and the related propsMapper/propsSerializer usage.
  `article://sc-29967/general/components%2Fslots.md`
- OBT preview helpers `createSlot`, `createBox` and `createImageBox` for building example slot content in presets.
  `node_modules/@allegro/opbox-build-tools/docs/preview/slot-box-gen.md`
- Why every slot declared in a prototype must be included and server-side rendered in all matching presets (never skipped/conditional), and the `owb-020201` client-side error this causes if violated.
  `node_modules/@allegro/opbox-build-tools/docs/slot-render-check.md`

## Static Image Assets

- How OBT collects image assets referenced in code into `dist/client/statics`, how to import and use them in markup, and how their URL differs between preview and production (CDN).
  `node_modules/@allegro/opbox-build-tools/docs/images.md`

## TypeScript Support

- Adding TypeScript to a project, generated `*.css.d.ts` declaration files, static asset (svg/jpg/png/gif) typings, import path aliases via tsconfig.json, and the `obt typescript-verify` command.
  `node_modules/@allegro/opbox-build-tools/docs/configuration/typescript.md`
