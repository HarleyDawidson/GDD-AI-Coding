---
name: setup-gdd
description: "Configure GitHub Issues or local Markdown for the GDD workshop: specs, tickets, the ready-for-agent label, and existing domain docs. Includes wayfinder maps. Run before to-spec, to-tickets, code-review, or wayfinder."
disable-model-invocation: true
---

# Setup GDD

Configure the repository for `grilling`, `to-spec`, `to-tickets`, `tdd`, `code-review`, and `wayfinder`. `grilling` needs no setup; `tdd` only consumes existing domain docs.

## 1. Read existing configuration

Read root `AGENTS.md` / `CLAUDE.md`, `docs/agents/`, Git remotes, and existing `.scratch/` conventions. Locate `GLOSSARY.md`, `GLOSSARY-MAP.md`, and relevant ADR directories. Preserve existing configuration and user-written sections.

## 2. Resolve missing choices

- **Tracker:** reuse an existing GitHub or local-Markdown configuration. Otherwise ask the user to choose: recommend GitHub when the remote identifies a GitHub repository, local files otherwise. Confirm the target repository if ambiguous. If the existing tracker is unsupported, ask before replacing its configuration.
- **Readiness:** always configure the `ready-for-agent` role, because `to-spec` and `to-tickets` require it. Reuse an existing mapping; otherwise use `ready-for-agent`. Ask only if an existing label convention makes the mapping ambiguous.
- **Wayfinder:** retain the tracker template's `## Wayfinding operations` section. On GitHub, also ensure `wayfinder:map`, `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, and `wayfinder:task` exist. These are separate from the readiness mapping. Local mode records ticket types and lifecycle states in files.
- **Domain docs:** record how to read existing docs; no layout choice or new glossary/ADR is needed.

For GitHub, check `gh auth status`, access to the selected repository, and that `gh issue create --help` includes `--parent` and `--blocked-by`. For wayfinder, also check `gh issue edit --help` for `--add-blocked-by` and `--add-assignee`, and `gh issue view --help` for `subIssues` and `blockedBy` JSON fields. Resolve missing prerequisites with the user before completing setup; keep the selected tracker.

## 3. Preview and write

Prepare these files from the templates, retaining existing conventions and unrelated sections:

- `docs/agents/issue-tracker.md`: [GitHub](issue-tracker-github.md) or [local Markdown](issue-tracker-local.md). For GitHub, fill in the selected repository. Include the complete `Wayfinding operations` section in either mode.
- `docs/agents/triage-labels.md`: [one readiness role](triage-labels.md), including when no `triage` skill is installed.
- `docs/agents/domain.md`: [existing domain docs](domain.md), using the locations found in step 1.

Edit existing `CLAUDE.md`, otherwise existing `AGENTS.md`; if neither exists, create `AGENTS.md`. Update the existing `## Agent skills` block in place or add it, preserving unrelated entries:

```markdown
## Agent skills

- Issue tracker, ticket relationships, and wayfinder operations: see `docs/agents/issue-tracker.md`.
- Readiness label/status: see `docs/agents/triage-labels.md`.
- Existing glossary and ADRs: see `docs/agents/domain.md`.
```

Show the combined draft and any proposed GitHub label creation for confirmation before writing. On GitHub, create only missing readiness and wayfinder labels; keep existing labels unchanged. Local mode needs no remote operations.

Report the selected tracker and changed files. These files can be edited directly later. Report any unresolved prerequisite instead of claiming setup is complete.
