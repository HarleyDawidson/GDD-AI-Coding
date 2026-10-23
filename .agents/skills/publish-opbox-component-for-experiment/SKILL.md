---
name: publish-opbox-component-for-experiment
description: Publish an Opbox component beta version through the manual "Upload and publish" GitHub Actions workflow. Use for experimental versions meant to be released as experiments to production; use publish-opbox-component-for-testing for local versions or VTE publishing.
---

## Steps

### 1. Determine the Component

If the user did not specify a path, use the current working directory.

Verify it is an Opbox component by checking for `opbox.config.js` and
`package.json`.

### 2. Determine the Branch

Get the current branch:

```bash
git branch --show-current
```

Use the branch the user specifies, or fall back to the current branch.
If inside a worktree, obtain the branch name from the worktree metadata
(`git worktree list`).

Do not publish from `master` or `main` — those branches are published
automatically on pull-request merge. If the user is on `master` or `main`,
stop and ask them to switch to a feature branch.

### 3. Build the Component

Run the build before publishing:

```bash
npm run build
```

If the build fails, report the error and stop without triggering the workflow.

### 4. Trigger the GitHub Actions Workflow

Use GitHub CLI to trigger the manual "Upload and publish" workflow:

```bash
gh workflow run upload-and-publish.yml \
  --ref <branch-name> \
  -f publicationType=beta
```

The workflow file is `upload-and-publish.yml` in Opbox component repositories.

When the workflow is triggered, note the run URL to report it to the user.

### 6. Report the Result

Extract the `serviceCatalogId` from `package.json` and strip the `sc-` prefix:

```bash
jq -r '.serviceCatalogId' package.json | sed 's/^sc-//'
```

Construct the ADP deployment link:

```text
https://console.allegrogroup.com/catalog/default/component/<scId>/deployment
```

Report:

- **Workflow run**: the GitHub Actions run URL, noted when the workflow was triggered.
- **Deployment**: the ADP deployment link so the user can install the published version on a VTE.

## Edge Cases

- **Not an Opbox component**: If `opbox.config.js` is missing, explain that
  this skill only works for Opbox components.
- **On `master`/`main`**: Stop and ask the user to switch to a feature branch.
- **Workflow not found**: Check available workflows with `gh workflow list`
  and look for a similar publish or release workflow. If none can be found, suggest
  using [reusable one from `allegro-internal/opbox-component-template` repo](https://github.com/allegro-internal/opbox-component-template/blob/master/.github/workflows/upload-and-publish-reusable.yml).
- **No GitHub CLI**: Provide the GitHub Actions workflow-dispatch URL so the
  user can trigger the manual workflow in the GitHub UI.
- **Workflow failure**: Show the failed logs and suggest investigating the CI
  issue before retrying.
