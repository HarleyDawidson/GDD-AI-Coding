# Issue tracker: GitHub

Repository: `<owner/repo>` (include the host for GitHub Enterprise). Pass this value as `--repo` to every `gh issue` and `gh label` command below. Specs and tickets are GitHub issues; use `gh`.

## Publish and read

- **Publish a spec or ticket:** `gh issue create --repo <repo> --title "..." --body-file <file> --label <ready-label>`. Read `<ready-label>` from `docs/agents/triage-labels.md`. Use a file for multiline content.
- **Read an issue and its discussion:** `gh issue view <number> --repo <repo> --json number,title,body,labels,comments`.
- **Find an issue:** `gh issue list --repo <repo> --state all --search "..." --json number,title,body,labels`.
- **Readiness:** inspect existing labels with `gh label list --repo <repo>` (increase `--limit` if needed). Create a missing readiness label with `gh label create <ready-label> --repo <repo> --description "Specified and ready for implementation"`. Apply it to an existing issue with `gh issue edit <number> --repo <repo> --add-label <ready-label>`.

## Ticket relationships

Publish blockers before dependent tickets so their numbers are available.

- **Parent:** if splitting an existing issue, add `--parent <parent-number>` when creating each child ticket. Keep the parent issue open and its content unchanged.
- **Blocked by:** add `--blocked-by <number>,<number>` when creating a dependent ticket. This is separate from the parent relationship. Omit the textual `Blocked by` section when native dependencies are set.
- If the repository does not support a native relationship, record `Part of #<parent>` or `Blocked by: #<number>, #<number>` in the child body and report the fallback. Authentication or network failures are not evidence that relationships are unsupported.

## Wayfinding operations

These operations apply to decision tickets from `wayfinder`; use their type labels rather than the implementation-readiness label.

- **Map:** create one issue with `gh issue create --repo <repo> --title "..." --body-file <file> --label wayfinder:map`. Use the map template from `wayfinder` (Destination, Notes, Decisions so far, Not yet specified, Out of scope).
- **Child ticket:** create an issue with `--parent <map-number>` and one `wayfinder:<type>` label (`research`, `prototype`, `grilling`, or `task`). If sub-issues are unavailable, put `Part of #<map>` in the child and add it to a task list in the map body. The map's child order is the selection order.
- **Blocking:** create all decision tickets first, then connect them with `gh issue edit <child> --repo <repo> --add-blocked-by <blocker>`. A ticket is unblocked only when every blocker is closed. If native dependencies are unavailable, use `Blocked by: #<number>, #<number>` and check the referenced issues' states.
- **Frontier query:** fetch the map's children with `gh issue view <map> --repo <repo> --json subIssues` (or read its fallback task list). Inspect children with `gh issue view <child> --repo <repo> --json state,assignees,blockedBy`; read each blocker's state as needed. Include only open children with no open blocker and no assignee; first in map order wins. Include all children when retrieving large maps.
- **Claim:** recheck the chosen ticket, then assign it to the driving developer before any work: `gh issue edit <child> --repo <repo> --add-assignee @me` (use the developer's login if the authenticated account differs). Other sessions skip assigned tickets.
- **Resolve:** post the answer with `gh issue comment <child> --repo <repo> --body-file <answer-file>`, close with `gh issue close <child> --repo <repo>`, then append a named link and one-line summary to the map's Decisions so far.
- **Maintain the map:** fetch the latest body before editing it with `gh issue edit <map> --repo <repo> --body-file <file>` so other sessions' updates are preserved. Add newly specified child tickets and connect their blockers. For an out-of-scope ticket, comment the reason, close it, and link it under Out of scope instead of Decisions so far.

Setup creates any missing `wayfinder:*` labels listed above. Use `gh label create <name> --repo <repo>` if one is later missing, preserving existing labels.
