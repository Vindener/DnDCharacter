#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  fail('Usage: node ua-arch-analyze.js <input.json> <output.json>');
}

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  fail('Failed to read/parse input JSON: ' + e.message);
}

const fileNodes = input.fileNodes || [];
const importEdges = input.importEdges || [];
const allEdges = input.allEdges || [];

const nodeById = new Map();
for (const n of fileNodes) nodeById.set(n.id, n);

// ---------- A. Directory Grouping ----------

function dirOf(filePath) {
  const idx = filePath.lastIndexOf('/');
  return idx === -1 ? '' : filePath.slice(0, idx);
}

const filePaths = fileNodes.map(n => n.filePath || n.name || '');

function computeCommonPrefix(paths) {
  if (paths.length === 0) return '';
  const splitPaths = paths.map(p => p.split('/'));
  let prefix = splitPaths[0].slice(0, -1); // exclude filename
  for (let i = 1; i < splitPaths.length; i++) {
    const segs = splitPaths[i].slice(0, -1);
    let j = 0;
    while (j < prefix.length && j < segs.length && prefix[j] === segs[j]) j++;
    prefix = prefix.slice(0, j);
    if (prefix.length === 0) break;
  }
  return prefix.length ? prefix.join('/') + '/' : '';
}

const commonPrefix = computeCommonPrefix(filePaths);

function extPattern(name) {
  if (/\.test\.[jt]sx?$/.test(name)) return 'test';
  if (/\.spec\.[jt]sx?$/.test(name)) return 'test';
  if (/\.config\./.test(name)) return 'config';
  if (/\.d\.ts$/.test(name)) return 'types';
  const m = name.match(/\.([^.]+)$/);
  return m ? m[1] : 'other';
}

// Determine if flat structure: check if any file (after prefix) has a subdirectory
let hasSubdirs = false;
for (const p of filePaths) {
  let rest = p;
  if (commonPrefix && rest.startsWith(commonPrefix)) rest = rest.slice(commonPrefix.length);
  if (rest.includes('/')) { hasSubdirs = true; break; }
}

const directoryGroups = {};
function addToGroup(group, id) {
  if (!directoryGroups[group]) directoryGroups[group] = [];
  directoryGroups[group].push(id);
}

if (!hasSubdirs) {
  for (const n of fileNodes) {
    const grp = extPattern(n.name || n.filePath || '');
    addToGroup(grp, n.id);
  }
} else {
  for (const n of fileNodes) {
    let p = n.filePath || n.name || '';
    let rest = p;
    let usedPrefix = false;
    if (commonPrefix && rest.startsWith(commonPrefix)) {
      rest = rest.slice(commonPrefix.length);
      usedPrefix = true;
    }
    let group;
    if (rest.includes('/')) {
      group = rest.slice(0, rest.indexOf('/'));
    } else {
      // file directly under prefix (or no prefix scenario) - use its own dir segment or 'root'
      if (usedPrefix) {
        group = 'root';
      } else {
        const d = dirOf(p);
        group = d ? d.split('/')[0] : 'root';
      }
    }
    addToGroup(group, n.id);
  }

  // Recursively subdivide oversized groups (e.g. a monorepo "src" bucket that
  // dominates the file count) by their next path segment, so structural
  // analysis downstream operates on meaningful architectural units rather
  // than one giant catch-all bucket.
  const OVERSIZE_ABS_THRESHOLD = 50;
  const OVERSIZE_RATIO_THRESHOLD = 0.15;
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 5) {
    changed = false;
    iterations++;
    for (const grp of Object.keys(directoryGroups)) {
      const ids = directoryGroups[grp];
      if (ids.length < OVERSIZE_ABS_THRESHOLD) continue;
      if (ids.length / fileNodes.length < OVERSIZE_RATIO_THRESHOLD) continue;

      // Determine the path prefix this group represents so we can find the
      // next segment for each member file.
      const subGroups = {};
      let anySplit = false;
      for (const id of ids) {
        const n = nodeById.get(id);
        const p = n.filePath || n.name || '';
        let rest = p;
        if (commonPrefix && rest.startsWith(commonPrefix)) rest = rest.slice(commonPrefix.length);
        // rest now starts with "<grp>/..." (or equals grp for root-level files already handled)
        const afterGroup = rest.startsWith(grp + '/') ? rest.slice(grp.length + 1) : null;
        if (afterGroup && afterGroup.includes('/')) {
          const sub = grp + '/' + afterGroup.slice(0, afterGroup.indexOf('/'));
          if (!subGroups[sub]) subGroups[sub] = [];
          subGroups[sub].push(id);
          anySplit = true;
        } else {
          const sub = grp; // stays in a residual bucket for direct children
          if (!subGroups[sub]) subGroups[sub] = [];
          subGroups[sub].push(id);
        }
      }

      const subGroupKeys = Object.keys(subGroups);
      // Only apply the split if it actually breaks the group into more than
      // one bucket (otherwise leave as-is to avoid infinite loop).
      if (anySplit && subGroupKeys.length > 1) {
        delete directoryGroups[grp];
        for (const [sub, subIds] of Object.entries(subGroups)) {
          directoryGroups[sub] = (directoryGroups[sub] || []).concat(subIds);
        }
        changed = true;
      }
    }
  }
}

// ---------- B. Node Type Grouping ----------

const nodeTypeGroups = {};
for (const n of fileNodes) {
  const t = n.type || 'unknown';
  if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
  nodeTypeGroups[t].push(n.id);
}

// ---------- C. Import Adjacency Matrix ----------

const fanOut = {};
const fanIn = {};
const adjacency = {}; // id -> Set of imported ids

for (const e of importEdges) {
  if (!nodeById.has(e.source) || !nodeById.has(e.target)) continue;
  fanOut[e.source] = (fanOut[e.source] || 0) + 1;
  fanIn[e.target] = (fanIn[e.target] || 0) + 1;
  if (!adjacency[e.source]) adjacency[e.source] = new Set();
  adjacency[e.source].add(e.target);
}

// id -> group lookup
const idToGroup = {};
for (const [grp, ids] of Object.entries(directoryGroups)) {
  for (const id of ids) idToGroup[id] = grp;
}

// group -> imports from / imported by (sets)
const groupImportsFrom = {};
const groupImportedBy = {};
for (const grp of Object.keys(directoryGroups)) {
  groupImportsFrom[grp] = new Set();
  groupImportedBy[grp] = new Set();
}

for (const e of importEdges) {
  const sg = idToGroup[e.source];
  const tg = idToGroup[e.target];
  if (!sg || !tg) continue;
  if (sg !== tg) {
    groupImportsFrom[sg].add(tg);
    groupImportedBy[tg].add(sg);
  }
}

// ---------- D. Cross-Category Dependency Analysis ----------

const crossCategoryCounts = {}; // key: fromType|toType|edgeType -> count
for (const e of allEdges) {
  const s = nodeById.get(e.source);
  const t = nodeById.get(e.target);
  if (!s || !t) continue;
  if (s.type === t.type && e.type === 'imports') continue; // handled elsewhere, but still count if cross-category
  const key = `${s.type}|${t.type}|${e.type}`;
  crossCategoryCounts[key] = (crossCategoryCounts[key] || 0) + 1;
}

const crossCategoryEdges = Object.entries(crossCategoryCounts)
  .map(([key, count]) => {
    const [fromType, toType, edgeType] = key.split('|');
    return { fromType, toType, edgeType, count };
  })
  .filter(x => x.fromType !== x.toType || x.edgeType !== 'imports')
  .sort((a, b) => b.count - a.count);

// ---------- E. Inter-Group Import Frequency ----------

const interGroupCounts = {}; // "from|to" -> count
for (const e of importEdges) {
  const sg = idToGroup[e.source];
  const tg = idToGroup[e.target];
  if (!sg || !tg || sg === tg) continue;
  const key = `${sg}|${tg}`;
  interGroupCounts[key] = (interGroupCounts[key] || 0) + 1;
}

const interGroupImports = Object.entries(interGroupCounts)
  .map(([key, count]) => {
    const [from, to] = key.split('|');
    return { from, to, count };
  })
  .sort((a, b) => b.count - a.count);

// ---------- F. Intra-Group Import Density ----------

const intraGroupDensity = {};
for (const grp of Object.keys(directoryGroups)) {
  let internalEdges = 0;
  let totalEdges = 0;
  const idsSet = new Set(directoryGroups[grp]);
  for (const e of importEdges) {
    const sIn = idsSet.has(e.source);
    const tIn = idsSet.has(e.target);
    if (sIn || tIn) {
      totalEdges++;
      if (sIn && tIn) internalEdges++;
    }
  }
  intraGroupDensity[grp] = {
    internalEdges,
    totalEdges,
    density: totalEdges > 0 ? internalEdges / totalEdges : 0
  };
}

// ---------- G. Directory Pattern Matching ----------

const DIR_PATTERN_MAP = {
  routes: 'api', api: 'api', controllers: 'api', endpoints: 'api', handlers: 'api',
  services: 'service', core: 'service', lib: 'service', domain: 'service', logic: 'service',
  models: 'data', db: 'data', data: 'data', persistence: 'data', repository: 'data', entities: 'data', repositories: 'data',
  components: 'ui', views: 'ui', pages: 'ui', ui: 'ui', layouts: 'ui', screens: 'ui',
  middleware: 'middleware', plugins: 'middleware', interceptors: 'middleware', guards: 'middleware',
  utils: 'utility', helpers: 'utility', common: 'utility', shared: 'utility', tools: 'utility',
  config: 'config', constants: 'config', env: 'config', settings: 'config',
  __tests__: 'test', test: 'test', tests: 'test', spec: 'test', specs: 'test',
  types: 'types', interfaces: 'types', schemas: 'types', contracts: 'types', dtos: 'types',
  hooks: 'hooks',
  store: 'state', state: 'state', reducers: 'state', actions: 'state', slices: 'state',
  assets: 'assets', static: 'assets', public: 'assets',
  migrations: 'data',
  management: 'config', commands: 'config',
  templatetags: 'utility',
  signals: 'service',
  serializers: 'api',
  cmd: 'entry',
  internal: 'service',
  pkg: 'utility',
  dto: 'types', request: 'types', response: 'types',
  entity: 'data',
  controller: 'api',
  routers: 'api',
  composables: 'service',
  blueprints: 'api',
  mailers: 'service', jobs: 'service', channels: 'service',
  bin: 'entry',
  docs: 'documentation', documentation: 'documentation', wiki: 'documentation',
  deploy: 'infrastructure', deployment: 'infrastructure', infra: 'infrastructure', infrastructure: 'infrastructure',
  '.github': 'ci-cd', '.gitlab': 'ci-cd', '.circleci': 'ci-cd',
  k8s: 'infrastructure', kubernetes: 'infrastructure', helm: 'infrastructure', charts: 'infrastructure',
  terraform: 'infrastructure', tf: 'infrastructure',
  docker: 'infrastructure',
  sql: 'data', database: 'data', schema: 'data',
  // project-specific extras
  functions: 'service',
  android: 'infrastructure',
  dm: 'service',
  navigation: 'api',
  context: 'state',
  i18n: 'utility',
  scripts: 'infrastructure',
  firestoretests: 'test',
  'firestore-tests': 'test',
  modules: 'service',
};

const patternMatches = {};
for (const grp of Object.keys(directoryGroups)) {
  const segs = grp.toLowerCase().split('/');
  const lastSeg = segs[segs.length - 1];
  const firstSeg = segs[0];
  if (DIR_PATTERN_MAP[grp.toLowerCase()]) {
    patternMatches[grp] = DIR_PATTERN_MAP[grp.toLowerCase()];
  } else if (DIR_PATTERN_MAP[lastSeg]) {
    patternMatches[grp] = DIR_PATTERN_MAP[lastSeg];
  } else if (DIR_PATTERN_MAP[firstSeg]) {
    patternMatches[grp] = DIR_PATTERN_MAP[firstSeg];
  }
}

// ---------- H. Deployment Topology Detection ----------

const infraFiles = [];
let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;

for (const n of fileNodes) {
  const fp = n.filePath || '';
  const base = path.basename(fp);
  if (/^Dockerfile/.test(base)) { hasDockerfile = true; infraFiles.push(fp); }
  if (/^docker-compose/.test(base)) { hasCompose = true; infraFiles.push(fp); }
  if (/\.ya?ml$/.test(base) && /(k8s|kubernetes|helm)/i.test(fp)) { hasK8s = true; infraFiles.push(fp); }
  if (/\.tf$/.test(base) || /\.tfvars$/.test(base)) { hasTerraform = true; infraFiles.push(fp); }
  if (/^\.github\/workflows\//.test(fp) || base === '.gitlab-ci.yml' || base === 'Jenkinsfile') { hasCI = true; infraFiles.push(fp); }
  if (base === 'Makefile') infraFiles.push(fp);
}

const deploymentTopology = {
  hasDockerfile,
  hasCompose,
  hasK8s,
  hasTerraform,
  hasCI,
  infraFiles: [...new Set(infraFiles)]
};

// ---------- I. Data Pipeline Detection ----------

const schemaFiles = [];
const migrationFiles = [];
const dataModelFiles = [];
const apiHandlerFiles = [];

for (const n of fileNodes) {
  const fp = n.filePath || '';
  const base = path.basename(fp).toLowerCase();
  const tags = n.tags || [];
  if (/\.sql$/.test(base) || /\.graphql$/.test(base) || /\.gql$/.test(base) || /\.proto$/.test(base) || base === 'firestore.rules') {
    schemaFiles.push(fp);
  }
  if (/migrations?\//i.test(fp) && /\.sql$/.test(base)) {
    migrationFiles.push(fp);
  }
  const grp = idToGroup[n.id];
  const pattern = patternMatches[grp];
  if (pattern === 'data' || tags.includes('data-model') || tags.includes('model')) {
    dataModelFiles.push(fp);
  }
  if (pattern === 'api' || tags.includes('api-handler') || tags.includes('endpoint')) {
    apiHandlerFiles.push(fp);
  }
}

const dataPipeline = {
  schemaFiles: [...new Set(schemaFiles)],
  migrationFiles: [...new Set(migrationFiles)],
  dataModelFiles: [...new Set(dataModelFiles)],
  apiHandlerFiles: [...new Set(apiHandlerFiles)]
};

// ---------- J. Documentation Coverage ----------

const docFiles = fileNodes.filter(n => n.type === 'document' || /\.md$/.test(n.filePath || '') || /\.rst$/.test(n.filePath || ''));
const groupsWithDocsSet = new Set();
for (const grp of Object.keys(directoryGroups)) {
  const hasReadme = directoryGroups[grp].some(id => {
    const n = nodeById.get(id);
    return n && /readme/i.test(path.basename(n.filePath || ''));
  });
  if (hasReadme) groupsWithDocsSet.add(grp);
}
const totalGroups = Object.keys(directoryGroups).length;
const groupsWithDocs = groupsWithDocsSet.size;
const undocumentedGroups = Object.keys(directoryGroups).filter(g => !groupsWithDocsSet.has(g));

const docCoverage = {
  groupsWithDocs,
  totalGroups,
  coverageRatio: totalGroups > 0 ? Number((groupsWithDocs / totalGroups).toFixed(2)) : 0,
  undocumentedGroups
};

// ---------- K. Dependency Direction ----------

const dependencyDirection = [];
const seenPairs = new Set();
for (const { from, to, count } of interGroupImports) {
  const pairKey = [from, to].sort().join('|');
  if (seenPairs.has(pairKey)) continue;
  seenPairs.add(pairKey);
  const reverseCount = interGroupCounts[`${to}|${from}`] || 0;
  if (count > reverseCount) {
    dependencyDirection.push({ dependent: from, dependsOn: to });
  } else if (reverseCount > count) {
    dependencyDirection.push({ dependent: to, dependsOn: from });
  }
}

// ---------- File Stats ----------

const filesPerGroup = {};
for (const [grp, ids] of Object.entries(directoryGroups)) filesPerGroup[grp] = ids.length;

const nodeTypeCounts = {};
for (const [t, ids] of Object.entries(nodeTypeGroups)) nodeTypeCounts[t] = ids.length;

const fileStats = {
  totalFileNodes: fileNodes.length,
  filesPerGroup,
  nodeTypeCounts
};

// ---------- Output ----------

const result = {
  scriptCompleted: true,
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats,
  fileFanIn: fanIn,
  fileFanOut: fanOut
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
} catch (e) {
  fail('Failed to write output JSON: ' + e.message);
}

console.log('Analysis complete. Wrote results to', outputPath);
process.exit(0);
