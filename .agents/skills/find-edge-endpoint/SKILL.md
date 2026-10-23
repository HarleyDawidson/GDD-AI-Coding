---
name: find-edge-endpoint
description: Find an Allegro edge endpoint by intent (e.g. "fetch multiple offers", "resolve a content group") and determine how to call it from an Opbox component via window.opbox.edge — required headers (Accept, Content-Type) and the response type. Queries the Opbox resource catalog semantic search API, then reads the owning service's OpenAPI definition via devhub-mcp. Use this skill whenever an edge endpoint is needed — asked to find which API/service provides some data, wire up an Edge/HTTP request in an Opbox component, or figure out what headers and response type an endpoint uses.
---

# Find Edge Endpoint

This skill finds edge-exposed service endpoints in the Opbox resource catalog using semantic search, resolves the calling contract (request headers and response type) from the service's OpenAPI definition, and shows how to call the endpoint from an Opbox component with `window.opbox.edge`. The search matches **intents** ("fetch multiple offers in one request", "record a content view for frequency capping") as well as descriptions of what the endpoint does.

## Step 1 — Search the catalog

```
GET https://opbox-resource-catalog.allegrogroup.com/api/resources/endpoints
```

Query parameters:

| Parameter        | Required | Description |
|------------------|----------|-------------|
| `query`          | no       | Free-text search — an intent or a description of what the endpoint does. Omitting it lists endpoints without relevance scoring. |
| `edgeOnly`       | yes      | **Always set to `true`.** The found endpoints are called through the public Edge API via `window.opbox.edge`, so only edge-exposed endpoints are usable. |
| `serviceName`    | no       | Filter to a single service's endpoints (exact name, e.g. `offer-facade`). |
| `includeRelated` | no       | `true` adds a `relatedResources` array describing the services that own the returned endpoints (what the service does, stores, when to use it, repository URL). |
| `limit`          | no       | Max results. Default `500`, allowed range `1`–`5000`. |

Example:

```bash
curl -s "https://opbox-resource-catalog.allegrogroup.com/api/resources/endpoints?query=fetch%20multiple%20offers&edgeOnly=true&includeRelated=true&limit=10"
```

Remember to URL-encode the query (spaces as `%20`).

### Response

```json
{
  "resources": [
    {
      "kind": "endpoint",
      "name": "offer-facade GET /offers",
      "description": "Fetches a batch of offers by a list of numeric IDs supplied via the id parameter...",
      "intents": ["fetch multiple offers in one request", "batch-load offers for a listing page"],
      "method": "GET",
      "path": "/offers",
      "requiredInputs": "list of offer IDs",
      "scId": "sc-8189",
      "serviceName": "offer-facade",
      "edge": true,
      "score": 0.75
    }
  ],
  "relatedResources": [
    {
      "kind": "service",
      "name": "offer-facade",
      "description": "## What it does\n...\n## What it stores\n...\n## When to use it\n...",
      "repositoryUrl": "https://github.com/allegro-internal/...",
      "scId": "sc-8189"
    }
  ]
}
```

Key fields:
- `method` + `path` — identify the operation inside the OpenAPI definition in step 2.
- `scId` — the service's SC ID; this is the input to `getApiDefinition` in step 2.
- `edge` — whether the endpoint is exposed on edge (always `true` with `edgeOnly=true`).
- `score` — semantic relevance (only present when `query` is given); results are sorted by it, higher is better.
- `requiredInputs` — quick summary of what the caller must supply; the authoritative list comes from the OpenAPI definition.
- `relatedResources` — service-level context (only with `includeRelated=true`); useful for confirming you picked the right service and for finding its repository.

## Step 2 — Resolve headers and response type from the OpenAPI definition

Once an endpoint is picked, the search result alone doesn't tell you how to call it. Fetch the owning service's OpenAPI definition with the **`getApiDefinition` tool from devhub-mcp**, passing the endpoint's `scId` (e.g. `sc-8189`).

The definition can be very large (hundreds of KB) — the tool result may be saved to a file instead of returned inline. Don't read it whole; slice out the one operation you picked with `openapi-extract`, using the endpoint's `path` and `method`:

```bash
npx --yes openapi-extract --path /listing --method get <saved-spec-file> > operation.yaml
```

The output is a valid mini-spec containing just that operation — its `parameters` (with `$ref`'d parameter components copied along), its `responses` with media types, and every transitively referenced schema — so the calling contract and full response structure are all in one small file.

Caveat: the shrink factor depends on the response schema's footprint. If the endpoint returns a fat object whose schema drags in most of the service's components, the extracted file can still be too large to read whole — in that case fall back to `grep`/`sed` on it (or on the original spec): locate the operation block by its `path` and `method`, then follow only the `$ref`s you need.

From the operation, extract:

1. **`Accept` header** — take the media type of the successful (`2xx`) response `content`; that is what the response `Content-Type` will be and what the caller should send as `Accept`. If several media types are declared, prefer the versioned vendor one (`application/vnd.allegro...+json`) over plain `application/json`. Operations often also declare an `Accept` header in `parameters` (as a `$ref` into `components/parameters`) whose description states the accepted value — check it to confirm.
2. **`Content-Type` header** — only relevant when the operation has a `requestBody`; use its `content` media type. No `requestBody` (typical for GET) → no `Content-Type` to send.
3. **Return type** — the schema of the successful response (`$ref` into `components/schemas`, e.g. `#/components/schemas/offers`). Follow the ref if the caller needs the response structure, not just the type name.
4. **Other required inputs** — required `parameters` (query, path, header) of the operation.

## Step 3 — Call the endpoint with `window.opbox.edge`

Opbox components must not send HTTP requests to services directly — they go through the public Edge API using the client-side `window.opbox.edge` HTTP client. It supports `get`, `put`, `post`, `patch` and `delete`; request data is automatically serialized and each method returns a `Promise<HttpClientResponse<T>>` (`{ status, data, headers }`). Pass the headers resolved in step 2 via the `headers` option:

```javascript
// GET — headers via the options object (2nd argument)
window.opbox.edge.get('/path-to-endpoint?param=value', {
    headers: { Accept: 'application/vnd.allegro.some.type.v1+json' },
})
    .then(({ status, data }) => {
        doSomethingWithData(data);
    });

// POST/PUT/PATCH — body as 2nd argument (auto-serialized), options as 3rd
window.opbox.edge.put('/capping', { scenarioIds: ['abc'], date: 1753600000000 }, {
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});
```

Other useful `OpboxEdgeOptions`: `withCredentials`, `signal` (AbortController), `validateStatus`, `responseType`, `disableDefaultHeaders`. For file uploads there is a separate client with the same API at `window.opbox.edgeUpload`.

Docs (`article://` links are techdocs URIs — resolve them with an MCP resource-read tool, not a web fetch):

- Client-side Edge HTTP client reference: method signatures, full `OpboxEdgeOptions`, response object, `window.opbox.edgeUpload` for files.
  `article://sc-12453/general/edge.md`
- Why Opbox components can't send server-side HTTP requests directly and must use Edge/data sources instead; sending requests to Edge and local development notes.
  `article://sc-29967/general/components%2Fhttp.md`
- Mocking Edge requests during local preview (`edgeProxy` in opbox.config.js).
  `node_modules/@allegro/opbox-build-tools/docs/preview/edge-proxy.md`

## Worked example — search offers by phrase

Goal: a component needs to display offers matching a text search phrase.

1. Search: `query=search%20offers%20by%20phrase&edgeOnly=true&includeRelated=true&limit=10` → top result `listing-api GET /listing` (`scId: sc-975`, score ~0.71) — "Searches marketplace listings and returns matching offers, categories, filters, and counters. Supply a significant listing criterion such as phrase, sellerId, ... categoryId ...". The runner-up `offer-facade GET /offers` (~0.63) fetches offers **by IDs**, so it's the wrong access pattern for a phrase search — the description, not just the score, settles the choice.
2. `getApiDefinition("sc-975")` → the spec is ~216 KB, so slice out the operation: `npx --yes openapi-extract --path /listing --method get <saved-spec-file>` (~40 KB mini-spec). In it:
   - `responses.200.content` declares two media types, `application/vnd.allegro.public.v3+json` and `application/json`, both with schema `#/components/schemas/ApiV3Response` — send the versioned one as `Accept`.
   - No `requestBody`, so no `Content-Type` header is needed.
   - The `ApiV3Response` schema and everything it references are included, if the component needs the response structure.
3. Call it from the component:

   ```javascript
   window.opbox.edge.get(`/listing?phrase=${encodeURIComponent(phrase)}`, {
       headers: { Accept: 'application/vnd.allegro.public.v3+json' },
   })
       .then(({ data }) => renderListing(data));
   ```

   The response `data` is the `ApiV3Response` schema, served as `application/vnd.allegro.public.v3+json`.

## Picking the right endpoint

- Use the user's wording as the `query` — the search is semantic, so full phrases ("batch-load offers for a listing page") work better than single keywords ("offers").
- Request with a small `limit` (e.g. `10`) to keep results reviewable.
- Pick the top result if its score clearly stands out; when the top few are close (e.g. a list endpoint vs a by-id endpoint), decide by `method`, `path` shape, and `description` — or ask the user which access pattern they need.
- **A failed search is a retry trigger, not a conclusion.** If nothing matches, rephrase: describe the data being fetched instead of the action (or vice versa), try domain synonyms, or drop the `serviceName` filter to widen the net (keep `edgeOnly=true`). Only report "not found" after several genuinely different phrasings have failed, and say which queries you tried.

## Edge cases

- **`limit` out of range** (`< 1` or `> 5000`): the API returns a `FST_ERR_VALIDATION` error with details.
- **Low scores across the board** (e.g. everything below ~0.4): the query likely doesn't match any endpoint well — rephrase or broaden, following the retry loop above.
- **Endpoint found but missing from the OpenAPI definition**: the catalog and the definition can drift; search the definition for the path with parameter placeholders in mind (`/offers/{offerId}` vs `/offers/{id}`), and fall back to the service's repository (`relatedResources[].repositoryUrl`) if the operation truly isn't there.
