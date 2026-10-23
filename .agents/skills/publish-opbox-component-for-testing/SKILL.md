---
name: publish-opbox-component-for-testing
description: Publish an Opbox component snapshot for testing from a local development environment. Builds and publishes it with `obt deploy`, installs and enables it on a VTE, and reports the result. Use when asked to publish a local version or publish to a VTE. For publishing an experimental version use `publish-opbox-component-for-experiment`.
---

## Steps

### 1. Determine the Component

If the user didn't specify a path, use the current working directory.

Verify it's an Opbox component by checking for `opbox.config.js` and `package.json`.

### 2. Check for `obt deploy` Support

Check if the project has `@allegro/opbox-build-tools` with the `deploy` command available:

```bash
npx obt deploy --help -y
```

If the command is not available (exit code non-zero or unrecognized command), suggest
upgrading `@allegro/opbox-build-tools` at least to `14.95.0` or do it for the user if
you're already making changes.

### 3. Run `obt deploy`

If the user provided a **VTE identity**:

```bash
npx obt deploy --vte-identity=<vte-identity>
```

If no VTE identity was provided:

```bash
npx obt deploy -y
```

The command builds and publishes the snapshot, then installs and enables it on the selected VTE.
Without `--vte-identity`, it automatically selects the first VTE owned by the logged-in user.
Run without `-y` to allow interactive selection if needed.

### 4. Report to User

Report the status of `obt deploy`, resolved package version and ADP deployment link from the deploy command output.

Example output:
```text
Deployment status: success
Resolved package version: `1.2.3-feature-branch-local-snapshot.14`
Deployed to [obiadowa-zofia](https://allegro.pl.base.vte42.vte.alledc.net) VTE
ADP deployment link: https://console.allegrogroup.com/catalog/default/component/sc-123/deployment
```

## Edge Cases

- **Not an Opbox component**: If `opbox.config.js` is missing, inform the user this skill only works for Opbox components.
- **Deploy failure**: Report the error output and stop.
- **Missing `obt deploy`**: Upgrade `@allegro/opbox-build-tools` to latest version (at least `14.95.0`).
