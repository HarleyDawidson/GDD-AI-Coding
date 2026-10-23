---
name: find-metrum-icon
description: Find an icon by visual description (e.g. "gray outline icon of an owl with a graduation cap") or intent (e.g. "education benefit", "professional development"). Queries the Opbox resource catalog semantic search API and returns matching metrum icons with their names and image URLs. Use this skill any time an icon is needed — asked to find, pick, or suggest an icon, illustrate a benefit/feature/action with one, or fill an icon slot in a component.
---

# Find Metrum Icon

This skill finds metrum icons in the Opbox resource catalog using semantic search. The search matches both **visual descriptions** ("owl with a graduation cap") and **intents** ("education benefit", "learning academy").

## API

```
GET https://opbox-resource-catalog.allegrogroup.com/api/resources/icons
```

Query parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `query`   | no       | Free-text search — a visual description or an intent. Omitting it lists icons without relevance scoring. |
| `limit`   | no       | Max results. Default `500`, allowed range `1`–`5000`. |
| `tags`    | no       | Filter by tag: `LIGHT`, `DARK`, or `DUNE`. Can be repeated (`tags=LIGHT&tags=DUNE`). Any other value is a validation error. |

Example:

```bash
curl -s "https://opbox-resource-catalog.allegrogroup.com/api/resources/icons?query=education%20benefit&limit=10"
```

Remember to URL-encode the query (spaces as `%20`).

## Response

```json
{
  "resources": [
    {
      "kind": "icon",
      "name": "actionBenefitsAcademy",
      "description": "Gray outline icon of an owl with a graduation cap bar on top and a small dash at the bottom.",
      "package": "metrum-asset",
      "tags": ["LIGHT"],
      "url": "https://a.allegroimg.com/original/.../action-benefits-academy-...",
      "intents": ["employee training", "learning academy", "education benefit", "professional development"],
      "score": 0.68
    }
  ]
}
```

Key fields:
- `name` — the icon identifier (use this to reference the icon in code).
- `package` — which package the icon ships in. `metrum-asset` means the icon can be imported from `@allegro/metrum-assets` as a named export whose value is the icon's URL string, e.g. for `actionBenefitsAcademy`:
  ```js
  import { actionBenefitsAcademy } from '@allegro/metrum-assets';
  // actionBenefitsAcademy === 'https://a.allegroimg.com/original/.../action-benefits-academy-...'
  ```
- `url` — the icon image URL. It serves SVG; to get a viewable PNG, replace `/original/` with `/s360/` in the URL:
  ```
  https://a.allegroimg.com/original/343d64/.../action-benefits-academy-...  → SVG
  https://a.allegroimg.com/s360/343d64/.../action-benefits-academy-...     → PNG, 360px
  ```
  The Read tool can't fetch URLs — download the PNG to a local temp file first, then view that file with Read:
  ```bash
  curl -s -o /tmp/icon.png "https://a.allegroimg.com/s360/343d64/.../action-benefits-academy-..."
  ```
- `score` — semantic relevance (only present when `query` is given); results are sorted by it, higher is better.
- `description` / `intents` — what the search matched against.

## Steps

1. Take the user's description or intent as the `query`. Use their wording as-is — the search is semantic, so full phrases work better than single keywords.
2. Request with a small `limit` (e.g. `10`) to keep results reviewable.
3. Only pass `tags` if the user explicitly asked for a specific variant (`LIGHT`/`DARK`/`DUNE`).
4. Pick the top result if its score clearly stands out from the rest; otherwise treat the top few candidates as ambiguous and verify visually before deciding (step 5).
5. Verify visually whenever the choice is ambiguous or matters: convert each candidate's `url` from `/original/` (SVG) to `/s360/` (PNG), download it to a local temp file with `curl`, and view that file with the Read tool.
   - If the user (or a prior step) already provided a reference image of the icon they're looking for, view both the reference and the candidate PNGs side by side and confirm they depict the same icon before recommending it.
   - Otherwise, view the top candidates' PNGs and pick the one that best matches the user's description.
   - Don't rely on `score` or `description` text alone when a visual mismatch is plausible — the search is semantic and can rank a close-but-wrong icon first.
6. **A failed search is a retry trigger, not a conclusion.** If nothing matched or no candidate passes visual verification, your interpretation of what you're looking for is the most likely culprit — especially when the query came from your own reading of a reference image (the same shape can plausibly read as e.g. a map pin, a shield, or a teardrop). Before concluding "not found":
   - Re-view the reference image (if there is one) and write down alternative readings you have **not** tried yet — different object identities, a pure-geometry description of the strokes and shapes ("gray outline, rounded shape tapering to a point at the bottom, small circle inside"), and a likely intent ("location", "delivery address").
   - Run a new search for each alternative and visually verify the new candidates as in step 5.
   - Only report "not found" after several genuinely different interpretations have failed, and say which queries you tried.

## Edge cases

- **`limit` out of range** (`< 1` or `> 5000`) or **invalid `tags` value**: the API returns a `FST_ERR_VALIDATION` error with details.
- **Low scores across the board** (e.g. everything below ~0.4): the query likely doesn't match any icon well — rephrase (try describing the visual shape instead of the intent, or vice versa) or broaden the query, following the retry loop in step 6.
