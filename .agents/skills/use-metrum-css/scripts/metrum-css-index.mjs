#!/usr/bin/env node
// Generates a grep-able `main.index.css` inside every installed `@allegro/metrum-*` package,
// built only from the files the package publishes (`package.json`, `main.json`, `main.css`).
// Reinstalling a package removes its index. No dependencies beyond Node itself.
//
// Usage: node metrum-css-index.mjs [project-dir]
// Output: node_modules/@allegro/metrum-*/main.index.css

import {
  existsSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from 'node:fs';
import {
  dirname, join, relative, resolve,
} from 'node:path';
import { pathToFileURL } from 'node:url';

const METRUM_PREFIX = 'metrum-';
const METRUM_SCOPE = `@allegro/${METRUM_PREFIX}`;
const CLASS_PATTERN = /\.((?:\\.|[A-Za-z_])(?:\\.|[\w-])*)/g;
const DIRECTIONS = ['top', 'right', 'bottom', 'left'];
const DIRECTION_SEGMENT_PATTERN = new RegExp(`-(${DIRECTIONS.join('|')})`, 'g');

// --- CSS parsing -------------------------------------------------------------------------------
// A minimal parser for the published `main.css`: rules, at-rules (nested) and declarations.

const parseDeclaration = (statement) => {
  const colon = statement.indexOf(':');
  if (colon < 0) {
    return undefined;
  }
  return {
    type: 'decl',
    prop: statement.slice(0, colon).trim(),
    value: statement.slice(colon + 1).replace(/\s*!\s*important\s*$/i, '').trim(),
  };
};

const parseCss = (css) => {
  const root = { type: 'root', nodes: [] };
  let parent = root;
  let buffer = '';
  let parenDepth = 0;

  const flushDeclaration = () => {
    const statement = buffer.trim();
    buffer = '';
    if (!statement || statement.startsWith('@') || parent === root) {
      return;
    }
    const declaration = parseDeclaration(statement);
    if (declaration) {
      parent.nodes.push(declaration);
    }
  };

  for (let index = 0; index < css.length; index += 1) {
    const character = css[index];
    if (character === '/' && css[index + 1] === '*') {
      const end = css.indexOf('*/', index + 2);
      index = end < 0 ? css.length : end + 1;
    } else if (character === '\\') {
      buffer += css.slice(index, index + 2);
      index += 1;
    } else if (character === '"' || character === "'") {
      let end = index + 1;
      while (end < css.length && css[end] !== character) {
        end += css[end] === '\\' ? 2 : 1;
      }
      buffer += css.slice(index, end + 1);
      index = end;
    } else if (character === '(' || character === ')') {
      parenDepth += character === '(' ? 1 : -1;
      buffer += character;
    } else if (parenDepth > 0) {
      buffer += character;
    } else if (character === '{') {
      const prelude = buffer.trim();
      buffer = '';
      const atRule = prelude.match(/^@([\w-]+)\s*([\s\S]*)$/);
      const node = atRule
        ? { type: 'atrule', name: atRule[1], params: atRule[2].trim(), parent, nodes: [] }
        : { type: 'rule', selector: prelude, parent, nodes: [] };
      parent.nodes.push(node);
      parent = node;
    } else if (character === ';') {
      flushDeclaration();
    } else if (character === '}') {
      flushDeclaration();
      parent = parent.parent ?? root;
    } else {
      buffer += character;
    }
  }
  return root;
};

const walkRules = (container, callback) => {
  for (const node of container.nodes ?? []) {
    if (node.type === 'rule') {
      callback(node);
    }
    walkRules(node, callback);
  }
};

// --- Index generation (port of metrum-ds tools/build/src/tasks/css-index.ts) --------------------

const normalizeValue = (value) => value
  .trim()
  .replace(/\s+/g, ' ')
  .replace(/\s*([,:])\s*/g, '$1')
  .replace(/\(\s+/g, '(')
  .replace(/\s+\)/g, ')');

const stripEnclosingParentheses = (value) => {
  if (!value.startsWith('(') || !value.endsWith(')')) {
    return value;
  }
  let depth = 0;
  for (const [index, character] of [...value].entries()) {
    depth += Number(character === '(') - Number(character === ')');
    if (depth === 0 && index < value.length - 1) {
      return value;
    }
  }
  return value.slice(1, -1);
};

const normalizeAtRule = (atRule) => {
  const params = stripEnclosingParentheses(normalizeValue(atRule.params));
  return `@${atRule.name}${params ? `(${params})` : ''}`;
};

const getAtRules = (rule) => {
  const atRules = [];
  for (let node = rule.parent; node && node.type !== 'root'; node = node.parent) {
    if (node.type === 'atrule') {
      atRules.unshift(normalizeAtRule(node));
    }
  }
  return atRules;
};

const getDeclarations = (rule) => rule.nodes
  .filter((node) => node.type === 'decl' && node.prop !== 'composes')
  .map((declaration) => ({
    property: declaration.prop.toLowerCase(),
    value: normalizeValue(declaration.value),
  }));

const getComposes = (rule) => rule.nodes
  .filter((node) => node.type === 'decl' && node.prop === 'composes')
  .flatMap((declaration) => declaration.value.split(/\s+from\s+/)[0].split(/[\s,]+/).filter(Boolean));

const unescapeClass = (name) => name.replace(/\\(.)/g, '$1');
const escapeClass = (name) => name.replace(/[^\w-]/g, (character) => `\\${character}`);

const getClassNames = (selector) => Array
  .from(selector.matchAll(CLASS_PATTERN), (match) => unescapeClass(match[1]));

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const selectorForClass = (selector, name) => selector
  .replace(new RegExp(`\\.${escapeRegExp(escapeClass(name))}(?![\\w-])`, 'g'), '&')
  .replace(/\s+/g, ' ')
  .trim();

const parseSourceClasses = (css) => {
  const classes = new Map();
  walkRules(parseCss(css), (rule) => {
    const declarations = getDeclarations(rule);
    const composes = getComposes(rule);

    for (const name of getClassNames(rule.selector)) {
      const source = classes.get(name) ?? { composes: [], groups: [] };
      source.composes.push(...composes);
      if (declarations.length > 0) {
        source.groups.push({
          atRules: getAtRules(rule),
          selector: selectorForClass(rule.selector, name),
          declarations,
        });
      }
      classes.set(name, source);
    }
  });
  return classes;
};

const unique = (values) => [...new Set(values)];

const resolveGroups = (name, sources, mappings, targetHashes, stack = []) => {
  if (stack.includes(name)) {
    throw new Error(`circular composition ${[...stack, name].join(' -> ')}`);
  }
  const source = sources.get(name);
  if (!source) {
    throw new Error(`no CSS rule for ${name}`);
  }

  const ownHashes = (mappings[name] ?? '').split(/\s+/).filter(Boolean);
  const groups = ownHashes.some((hash) => targetHashes.has(hash)) ? [...source.groups] : [];
  for (const composedName of source.composes) {
    if (!mappings[composedName]) {
      throw new Error(`${name} composes ${composedName}, which no installed package defines`);
    }
    groups.push(...resolveGroups(composedName, sources, mappings, targetHashes, [...stack, name]));
  }
  return groups;
};

const groupKey = (group) => JSON.stringify([group.atRules, group.selector]);

const mergeGroups = (groups) => {
  const merged = new Map();
  for (const group of groups) {
    const key = groupKey(group);
    const current = merged.get(key) ?? {
      atRules: group.atRules,
      selector: group.selector,
      declarations: [],
    };
    for (const declaration of group.declarations) {
      const existing = current.declarations.findIndex(({ property }) => property === declaration.property);
      if (existing >= 0) {
        current.declarations.splice(existing, 1);
      }
      current.declarations.push(declaration);
    }
    merged.set(key, current);
  }
  return [...merged.values()].sort((a, b) => groupKey(a).localeCompare(groupKey(b)));
};

const declarationCss = (declarations) => declarations
  .map(({ property, value }) => `${property}:${value}`)
  .join(';');

const wrapGroup = (group) => {
  let signatureCss = declarationCss(group.declarations);
  if (group.selector !== '&') {
    signatureCss = `${group.selector}{${signatureCss}}`;
  }
  for (const atRule of [...group.atRules].reverse()) {
    signatureCss = `${atRule}{${signatureCss}}`;
  }
  return signatureCss;
};

const groupsCss = (groups) => groups.map(wrapGroup).join('');

const shorthandAliases = (groups) => unique(groups.flatMap((group) => {
  const collapsed = new Map();
  for (const { property, value } of group.declarations) {
    const shorthand = property.replace(DIRECTION_SEGMENT_PATTERN, '');
    if (shorthand !== property) {
      collapsed.set(shorthand, [...(collapsed.get(shorthand) ?? []), value]);
    }
  }

  return [...collapsed]
    .filter(([, values]) => values.length === DIRECTIONS.length && unique(values).length === 1)
    .map(([shorthand, [value]]) => `${shorthand}:${value}`);
}));

const comment = (notes) => (notes.length ? ` /* ${notes.join(' | ')} */` : '');

// The camelCase key `main.json` publishes next to a readable name. Metrum builds it with lodash's
// camelCase (`m-color-white-80p` -> `mColorWhite80P`); some packages also publish other spellings,
// so prefer lodash's and otherwise take any key with the same letters and digits.
const camelCase = (name) => name
  .split(/[^A-Za-z0-9]+|(?<=[0-9])(?=[A-Za-z])/)
  .filter(Boolean)
  .map((word, index) => (index ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()))
  .join('');
const squash = (name) => name.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
const findExportName = (name, mappings) => (mappings[camelCase(name)] ? camelCase(name) : Object.keys(mappings)
  .find((key) => key !== name && !/[-_]/.test(key) && squash(key) === squash(name)));

const buildUtilityClasses = (readableCss, mappings, ownNames) => {
  const sources = parseSourceClasses(readableCss);
  const readableNames = [...ownNames].filter((name) => name.startsWith('m-')).sort();

  const missingMappings = [...sources.keys()]
    .filter((name) => name.startsWith('m-') && !mappings[name]).sort();
  const missingRules = readableNames.filter((name) => !sources.has(name));
  if (missingMappings.length || missingRules.length) {
    throw new Error([
      missingMappings.length ? `CSS classes missing from main.json: ${missingMappings.join(', ')}` : '',
      missingRules.length ? `main.json classes missing from CSS: ${missingRules.join(', ')}` : '',
    ].filter(Boolean).join('; '));
  }

  return readableNames.map((name) => {
    const exportName = findExportName(name, mappings);
    if (!exportName || mappings[exportName] !== mappings[name]) {
      throw new Error(`main.json has no matching camelCase key for ${name}`);
    }
    const hashes = mappings[name].split(/\s+/).filter(Boolean);
    const groups = mergeGroups(resolveGroups(name, sources, mappings, new Set(hashes)));
    if (groups.length === 0) {
      throw new Error(`no CSS declarations found for ${name}`);
    }
    return {
      name, exportName, hashes, groups,
    };
  });
};

const utilityLines = (classes) => {
  const merged = new Map();
  for (const utility of classes) {
    const key = `${utility.hashes.join('+')}|${groupsCss(utility.groups)}`;
    merged.set(key, [...(merged.get(key) ?? []), utility]);
  }

  return [...merged.values()].map((aliases) => {
    const [{ hashes, groups }] = aliases;
    const spellings = [
      ...unique(aliases.map(({ name }) => `.${name}`)),
      ...unique(aliases.map(({ exportName }) => `.${exportName}`)),
      // A shared hash is only a truthful selector when it carries the whole meaning on its
      // own; an aggregate's hashes are fragments of it, so they stay in the comment.
      ...(hashes.length === 1 ? [`.${hashes[0]}`] : []),
    ];
    const shorthands = shorthandAliases(groups);
    const notes = [
      ...(hashes.length === 1 ? [] : [`hashes: ${hashes.join(' ')}`]),
      ...(shorthands.length ? [`alias: ${shorthands.join(' ')}`] : []),
    ];
    return `${spellings.join(', ')} { ${groupsCss(groups)} }${comment(notes)}`;
  }).sort();
};

// --- Package discovery ------------------------------------------------------------------------

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const isIndexable = (dir) => ['package.json', 'main.json', 'main.css'].every((file) => existsSync(join(dir, file)));

const resolvePackageDir = (name, fromDir) => {
  for (let dir = fromDir; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }
    if (dirname(dir) === dir) {
      return undefined;
    }
  }
};

const composedPackages = (pkgName, css) => unique(
  Array.from(css.matchAll(/composes:[^;}]*?\sfrom\s+["']([^"']+)["']/g), (match) => match[1]),
).filter((name) => name.startsWith(METRUM_SCOPE) && name !== pkgName).sort();

export const createCssIndex = (packageDir) => {
  const dir = realpathSync(packageDir);
  const pkg = readJson(join(dir, 'package.json'));
  const ownMappings = readJson(join(dir, 'main.json'));
  const ownCss = readFileSync(join(dir, 'main.css'), 'utf8');
  const dependencies = composedPackages(pkg.name, ownCss).map((name) => {
    const dependencyDir = resolvePackageDir(name, dir);
    if (!dependencyDir || !isIndexable(dependencyDir)) {
      throw new Error(`it composes from ${name}, which is not installed`);
    }
    return dependencyDir;
  });
  const mappings = Object.assign(
    {},
    ...dependencies.map((dependencyDir) => readJson(join(dependencyDir, 'main.json'))),
    ownMappings,
  );
  const readableCss = [
    ...dependencies.map((dependencyDir) => readFileSync(join(dependencyDir, 'main.css'), 'utf8')),
    ownCss,
  ].join('\n');

  const classes = buildUtilityClasses(readableCss, mappings, new Set(Object.keys(ownMappings)));
  const utilities = utilityLines(classes);

  return [
    `/* ${pkg.name} ${pkg.version} — grep-able index of every published class. Not for import. */`,
    '/* Each line holds one complete meaning, spelled as: readable, camelCase, published hash. */',
    '/* Every line is fully resolved: composition is already flattened, so one grep is the whole */',
    '/* answer and no line needs looking up further. */',
    '/* Formatting is canonical: no space after ":", none after "@media". Strip spaces when grepping. */',
    '',
    `/* ${utilities.length} composable utilities. Use the readable name in a CSS Modules composition. */`,
    ...utilities,
    '',
  ].join('\n');
};

const findInstalledPackages = (projectDir) => {
  const packages = new Map();
  for (let dir = projectDir; ; dir = dirname(dir)) {
    const scopeDir = join(dir, 'node_modules', '@allegro');
    if (existsSync(scopeDir)) {
      for (const entry of readdirSync(scopeDir).sort()) {
        const packageDir = join(scopeDir, entry);
        if (entry.startsWith(METRUM_PREFIX) && !packages.has(entry) && isIndexable(packageDir)) {
          packages.set(entry, packageDir);
        }
      }
    }
    if (dirname(dir) === dir) {
      return packages;
    }
  }
};

const INDEX_FILENAME = 'main.index.css';

const main = () => {
  const projectDir = resolve(process.argv[2] ?? '.');
  const packages = findInstalledPackages(projectDir);
  if (packages.size === 0) {
    console.log(`No @allegro/metrum-* package with CSS is installed for ${projectDir}. `
      + 'Install the project\'s dependencies first.');
    process.exitCode = 1;
    return;
  }

  const written = [];
  const failures = [];
  for (const packageDir of packages.values()) {
    const { name, version } = readJson(join(packageDir, 'package.json'));
    const indexPath = join(packageDir, INDEX_FILENAME);
    try {
      writeFileSync(indexPath, createCssIndex(packageDir));
      written.push(`  ${relative(process.cwd(), indexPath)} (${version})`);
    } catch {
      rmSync(indexPath, { force: true });
      failures.push(`Creating the index for ${name} ${version} failed.`);
    }
  }

  console.log(`Wrote ${written.length} Metrum CSS index file(s):`);
  console.log(written.join('\n'));
  // Every failure seen across all used Metrum versions is a component composing a class
  // unavailable in the installed metrum-core
  if (failures.length) {
    console.log(`\n${failures.join('\n')}`);
    console.log('Update @allegro/metrum-core to the latest version and retry the script. '
      + '@allegro/metrum-core never has breaking changes, so this is a safe operation.');
  }
  if (written.length === 0) {
    process.exitCode = 1;
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  main();
}
