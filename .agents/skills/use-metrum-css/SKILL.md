---
name: use-metrum-css
description: Find, decode, and apply exact Metrum CSS utility classes in an Opbox component. Use whenever reading, writing, reviewing or debugging CSS, CSS Modules or `composes:` in a project that depends on `@allegro/metrum-core` or any other `@allegro/metrum-*` package, including responsive and print rules, CSS-variable utilities, and working out what a minified class like `mg9e_8` does.
---

# Use Metrum CSS

Look up Metrum classes in `main.index.css`, a grep-able index of the classes a Metrum package
ships. One line holds one complete meaning, spelled three ways — readable, camelCase,
and the published hash:

```
.m-border-width_1, .mBorderWidth1, .mx7m_1 { border-width:1px }
.m-padding_8, .mPadding8 { padding-top:8px;…;padding-left:8px } /* hashes: mg9e_8 … | alias: padding:8px */
.m-display_block_sm, .mDisplayBlockSm, .mpof_z0_s { @media(min-width:544px){display:block} }
```

Every line is already fully resolved: composition is flattened, so one grep is the whole
answer and nothing needs looking up further.

Search every installed package at once, and use `grep -l` when you need to know which package
a class belongs to:

```bash
grep -h 'display:none' node_modules/@allegro/metrum-*/main.index.css
grep -l '^\.m-type,' node_modules/@allegro/metrum-*/main.index.css
```

`@allegro/metrum-core` holds the utility classes. Component packages (`metrum-typography`,
`metrum-grid`, `metrum-button`, …) holds its own classes, with Core's declarations already
merged into them. So grep the package the class came from and stop there:
typography's index answers `m-type` in full, and you never need to look in Core as well.

**The index has no spaces, so strip every space from your query.** `grep 'padding: 8px'` finds
nothing; `grep 'padding:8px'` works. (Three values do contain a space — `flex:1 1`,
`flex:0 1 auto` and `font-family:"Noto Serif",serif`.)

## Generating the index

The index files do not ship with the packages — generate them with `scripts/metrum-css-index.mjs`,
next to this file. Run it without checking anything first, and chain your first lookup onto it:

```bash
node <skill-dir>/scripts/metrum-css-index.mjs && grep -h 'padding:8px' node_modules/@allegro/metrum-*/main.index.css
```

It takes well under a second, needs only Node, and writes `main.index.css` into every installed
`@allegro/metrum-*` package from the files that package already publishes (`main.css`,
`main.json`). Run it from the project root, or pass the root as
the first argument.

Running it again is cheap and always safe, so do not spend a call working out whether the index
is already there. **Always regenerate after an install**: reinstalling or upgrading a package
deletes its index, and a stale one would describe the wrong version.

## Workflow

1. Grep every declaration your change adds or modifies. There are no "obvious CSS" exceptions:
   look up `margin:0`, `padding:0` and `display:none` too, rather than trusting memory.
2. Compose a class only when its **whole line** is what you want and adds nothing else. The line
   is the complete meaning. Names sharing a line are aliases, so any of them works — pick the
   most descriptive.
3. Check the rule can actually take a composition. `composes:` is only legal in a rule whose
   selector is a single local class, and never inside an at-rule. A declaration in `.a::before`,
   `.a b`, `.a:hover`, `.a[x]` or inside `@media` cannot be composed even when an exact utility
   exists — say so, and leave the CSS as it is.
4. Write it in the local style, following how the surrounding rules lay out their `composes:`
   lines, and name the package:

   ```css
   composes: m-padding_8 from '@allegro/metrum-core';
   ```

   In `.ts`/`.js`, use the camelCase key instead. One key can hold several space-separated
   hashes, so join the lookups with a space:

   ```ts
   import * as coreStyles from '@allegro/metrum-core/main.json';
   const className = [coreStyles.mPadding8, coreStyles.mColorWhite].join(' ');
   ```

5. Replace only the declarations the match covers. Do not refactor unrelated rules.
6. Run the component's existing focused validation.
7. If you changed more than a declaration or two, list what you actually wrote with
   `git diff -U3 -- '*.css'` and check each added line was looked up. It is easy to add five
   declarations and only grep three, and this catches the two you skipped. `-U3` also shows the
   enclosing selector and at-rule, which step 3 depends on.

## Choosing values

**Never change a value to make a utility fit.** If a design, a ticket, or existing behavior
fixed `padding: 9px`, keep it — do not round it to `8px` because `m-padding_8` exists. Write
custom CSS and say why.

If you picked the value yourself, you may reconsider it. Grep the property family first
(`grep 'align-self:' …`) or the name family (`grep '^\.m-padding' …`), then choose a supported
value deliberately.

## Rules

Four-side shorthands are published as longhands. `m-padding_8` is four `padding-*`
declarations, and its line carries `alias: padding:8px`. Grep either spelling.

The index records values exactly as published, so grep alone misses two kinds of real match.
Check both before reporting no match:

- **Token aliases.** `var(--m-color-orange)` is not found, because the index publishes
  `color:var(--m-color-orange-500)`. Resolve the token in
  `node_modules/@allegro/metrum-core/css/` first, then grep the resolved value.
- **Equivalent spellings.** `flex:1` is indexed as `flex:1 1`; both compute to `1 1 0%`. When a
  value is a shorthand with omitted defaults, grep the property alone and compare meaning
  rather than text.

Never conclude that a declaration has no match from a name or property search alone, or from
memory. A no-match claim is valid only after greping the complete declaration in the index
format.

An exact utility is not an exact replacement when the declaration is conditional on a
pseudo-class, attribute selector, media query, supports rule, or print context unless the
indexed line carries the same condition. Do not compose an unconditional utility when that
would broaden the behavior.

## Examples

<example>
Query: What does the class `mg9e_8` on this element do?

Workflow:

1. `grep -h 'mg9e_8' node_modules/@allegro/metrum-*/main.index.css`
2. Read the matching lines in full.

Answer:
`mg9e_8` is `padding-top:8px`, published by `m-padding-top_8`. It is also one of the four
hashes `m-padding_8` compiles to, so if `mvrt_8`, `mj7a_8` and `mh36_8` are on the element too,
the source was `m-padding_8`.
</example>

<example>
Query: I wrote `padding: 8px` — is there a utility?

Workflow:

1. Strip the space and grep `padding:8px`.
2. The `alias: padding:8px` comment on `m-padding_8` confirms the whole line matches.

Answer:

```css
composes: m-padding_8 from '@allegro/metrum-core';
```
</example>

<example>
Query: Replace the raw declarations in `.tabsContainer nav { height: auto }`.

Workflow:

1. `grep -h 'height:auto' node_modules/@allegro/metrum-*/main.index.css` finds `m-height_auto`.
2. The selector is a descendant selector, so `composes:` is illegal here.

Answer:
`m-height_auto` matches the declaration exactly, but it is not applicable: `composes:` requires
a rule whose selector is a single local class, and this rule targets a descendant `nav`. Leave
the declaration as raw CSS.
</example>

## When no utility matches

If the value was fixed for you, keep it and move on. If you chose it yourself, try once more
before writing custom CSS:

1. State the visual or layout behavior you actually want, rather than defending the declaration
   you happened to write.
2. Grep related properties, not only the one you chose. Shrink-wrapping a child in a column flex
   container may be `align-self` rather than `width`; equal flex children may need `flex-grow`,
   `flex-shrink` and `flex-basis` rather than an unmatched `flex` shorthand.
3. Expand unsupported shorthands into their longhands and grep those.
4. Keep custom CSS when nothing suitable exists.
