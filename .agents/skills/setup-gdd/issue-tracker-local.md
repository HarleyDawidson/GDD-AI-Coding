# Issue tracker: Local Markdown

Specs and tickets live under `.scratch/<feature-slug>/`.

- **Publish a spec:** write `spec.md` in the feature directory.
- **Publish tickets:** write one file per ticket at `issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Use the ticket template from `to-tickets`.
- **Read a spec or ticket:** read the referenced file, including any comments or discussion appended to it. Resolve a bare ticket number within its feature directory; ask if ambiguous.
- **Readiness:** record the status mapped from `ready-for-agent` in `docs/agents/triage-labels.md` near the top of each spec or ticket.
- **Parent:** link each ticket to its source spec or parent ticket, if there is one. Preserve the parent file.
- **Blocked by:** list blocking ticket numbers/titles in each ticket, or `None (can start immediately)`. These are dependencies, not parent links.

Create missing directories and preserve existing files; update an existing artifact only when the requested work calls for it.

## Wayfinding operations

Decision tickets from `wayfinder` use the following layout and lifecycle instead of the spec/implementation-ticket conventions above:

- **Map:** `.scratch/<effort>/map.md`, using the map template from `wayfinder` (Destination, Notes, Decisions so far, Not yet specified, Out of scope).
- **Child ticket:** `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in its body, `Type: research|prototype|grilling|task`, and initially `Status: open`. Each file belongs to the map in its effort directory.
- **Blocking:** a `Blocked by: NN, NN` line near the top, or `None`. Create tickets first, then wire their dependencies. A ticket is unblocked when every listed file has `Status: resolved`.
- **Frontier:** scan this map's issue files for open, unblocked, unclaimed tickets; first by number wins. Treat an existing ticket with no Status field as open.
- **Claim:** recheck the chosen file, set `Status: claimed`, and save before any work. Other sessions skip claimed tickets.
- **Resolve:** append the answer under `## Answer`, set `Status: resolved`, then append a named link and one-line summary to Decisions so far in the map.
- **Maintain the map:** reread files before updating them to preserve other sessions' changes. Add newly specified tickets and blockers. For an out-of-scope ticket, record the reason, mark it resolved, and link it under Out of scope instead of Decisions so far.
