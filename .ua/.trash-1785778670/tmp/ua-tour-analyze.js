#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function fail(msg) {
  console.error('ERROR: ' + msg);
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  fail('Usage: node ua-tour-analyze.js <input.json> <output.json>');
}

let input;
try {
  const raw = fs.readFileSync(inputPath, 'utf8');
  input = JSON.parse(raw);
} catch (e) {
  fail('Failed to read/parse input JSON: ' + e.message);
}

const nodes = Array.isArray(input.nodes) ? input.nodes : [];
const edges = Array.isArray(input.edges) ? input.edges : [];
const layers = Array.isArray(input.layers) ? input.layers : [];

if (nodes.length === 0) {
  fail('No nodes found in input');
}

const nodeById = new Map();
for (const n of nodes) {
  nodeById.set(n.id, n);
}

// ---- Fan-in / Fan-out ----
const fanIn = new Map();
const fanOut = new Map();
for (const n of nodes) {
  fanIn.set(n.id, 0);
  fanOut.set(n.id, 0);
}
for (const e of edges) {
  if (nodeById.has(e.source)) {
    fanOut.set(e.source, (fanOut.get(e.source) || 0) + 1);
  }
  if (nodeById.has(e.target)) {
    fanIn.set(e.target, (fanIn.get(e.target) || 0) + 1);
  }
}

function topN(map, n, keyName) {
  const arr = Array.from(map.entries()).map(([id, count]) => ({
    id,
    [keyName]: count,
    name: nodeById.get(id) ? nodeById.get(id).name : id,
  }));
  arr.sort((a, b) => b[keyName] - a[keyName]);
  return arr.slice(0, n);
}

const fanInRanking = topN(fanIn, 20, 'fanIn');
const fanOutRanking = topN(fanOut, 20, 'fanOut');

// ---- Entry point candidates ----
const ENTRY_FILENAMES = new Set([
  'index.ts',
  'index.js',
  'main.ts',
  'main.js',
  'app.ts',
  'app.js',
  'server.ts',
  'server.js',
  'mod.rs',
  'main.go',
  'main.py',
  'main.rs',
  'manage.py',
  'app.py',
  'wsgi.py',
  'asgi.py',
  'run.py',
  '__main__.py',
  'Application.java',
  'Main.java',
  'Program.cs',
  'config.ru',
  'index.php',
  'App.swift',
  'Application.kt',
  'main.cpp',
  'main.c',
  'App.tsx',
  'App.jsx',
]);

// Compute fan-out top 10% threshold and fan-in bottom 25% threshold (over file-type nodes)
const fileNodes = nodes.filter((n) => n.type === 'file');
const fanOutValues = fileNodes.map((n) => fanOut.get(n.id) || 0).sort((a, b) => a - b);
const fanInValues = fileNodes.map((n) => fanIn.get(n.id) || 0).sort((a, b) => a - b);

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.floor(p * (sortedArr.length - 1));
  return sortedArr[idx];
}

const fanOutTop10Threshold = percentile(fanOutValues, 0.9);
const fanInBottom25Threshold = percentile(fanInValues, 0.25);

function depthOfPath(filePath) {
  if (!filePath) return 99;
  const parts = filePath.split('/').filter(Boolean);
  return parts.length;
}

const entryScores = [];
for (const n of nodes) {
  let score = 0;
  const baseName = n.name || (n.filePath ? path.basename(n.filePath) : '');
  if (n.type === 'file') {
    if (ENTRY_FILENAMES.has(baseName)) score += 3;
    const depth = depthOfPath(n.filePath);
    if (depth <= 2) score += 1;
    const fo = fanOut.get(n.id) || 0;
    const fi = fanIn.get(n.id) || 0;
    if (fo >= fanOutTop10Threshold && fanOutTop10Threshold > 0) score += 1;
    if (fi <= fanInBottom25Threshold) score += 1;
  } else if (n.type === 'document') {
    const depth = depthOfPath(n.filePath);
    if (baseName.toLowerCase() === 'readme.md' && depth <= 1) {
      score += 5;
    } else if (baseName.toLowerCase().endsWith('.md') && depth <= 1) {
      score += 2;
    }
  }
  if (score > 0) {
    entryScores.push({ id: n.id, score, name: n.name, summary: n.summary });
  }
}
entryScores.sort((a, b) => b.score - a.score);
const entryPointCandidates = entryScores.slice(0, 5);

// ---- BFS from top code entry point ----
// Find top code (non-document) entry point candidate
let topCodeEntry = null;
for (const cand of entryScores) {
  const node = nodeById.get(cand.id);
  if (node && node.type !== 'document') {
    topCodeEntry = cand;
    break;
  }
}
// Fallback: if none found, pick highest fan-out file node
if (!topCodeEntry && fileNodes.length > 0) {
  const sorted = fileNodes.slice().sort((a, b) => (fanOut.get(b.id) || 0) - (fanOut.get(a.id) || 0));
  if (sorted.length > 0) {
    topCodeEntry = { id: sorted[0].id, score: 0, name: sorted[0].name };
  }
}

const bfsTraversal = { startNode: null, order: [], depthMap: {}, byDepth: {} };

if (topCodeEntry) {
  const startId = topCodeEntry.id;
  bfsTraversal.startNode = startId;

  // Build forward adjacency using imports/calls edges only
  const adj = new Map();
  for (const e of edges) {
    if (e.type === 'imports' || e.type === 'calls') {
      if (!adj.has(e.source)) adj.set(e.source, []);
      adj.get(e.source).push(e.target);
    }
  }

  const visited = new Set([startId]);
  const queue = [[startId, 0]];
  const order = [];
  const depthMap = {};
  while (queue.length > 0) {
    const [id, depth] = queue.shift();
    order.push(id);
    depthMap[id] = depth;
    const neighbors = adj.get(id) || [];
    for (const nb of neighbors) {
      if (!visited.has(nb) && nodeById.has(nb)) {
        visited.add(nb);
        queue.push([nb, depth + 1]);
      }
    }
  }
  bfsTraversal.order = order;
  bfsTraversal.depthMap = depthMap;
  const byDepth = {};
  for (const [id, depth] of Object.entries(depthMap)) {
    if (!byDepth[depth]) byDepth[depth] = [];
    byDepth[depth].push(id);
  }
  bfsTraversal.byDepth = byDepth;
}

// ---- Non-code file inventory ----
const nonCodeFiles = {
  documentation: [],
  infrastructure: [],
  data: [],
  config: [],
};
for (const n of nodes) {
  const entry = { id: n.id, name: n.name, summary: n.summary };
  if (n.type === 'document') {
    nonCodeFiles.documentation.push(entry);
  } else if (n.type === 'service' || n.type === 'pipeline' || n.type === 'resource') {
    nonCodeFiles.infrastructure.push(entry);
  } else if (n.type === 'table' || n.type === 'schema' || n.type === 'endpoint') {
    nonCodeFiles.data.push(entry);
  } else if (n.type === 'config') {
    nonCodeFiles.config.push(entry);
  }
}

// ---- Tightly coupled clusters ----
// Build undirected edge map for imports/calls to find bidirectional pairs
const edgeSet = new Set();
const edgeCount = new Map(); // "a|b" (sorted) -> count
for (const e of edges) {
  if (e.type === 'imports' || e.type === 'calls') {
    edgeSet.add(e.source + '->' + e.target);
  }
}

const bidirectionalPairs = [];
for (const e of edges) {
  if (e.type === 'imports' || e.type === 'calls') {
    const reverse = e.target + '->' + e.source;
    if (edgeSet.has(reverse) && e.source < e.target) {
      bidirectionalPairs.push([e.source, e.target]);
    }
  }
}

// Union-Find to group bidirectional pairs into clusters, then expand
const parent = new Map();
function find(x) {
  if (!parent.has(x)) parent.set(x, x);
  if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
  return parent.get(x);
}
function union(a, b) {
  const ra = find(a);
  const rb = find(b);
  if (ra !== rb) parent.set(ra, rb);
}
for (const [a, b] of bidirectionalPairs) {
  union(a, b);
}

const clusterGroups = new Map();
for (const [a, b] of bidirectionalPairs) {
  const root = find(a);
  if (!clusterGroups.has(root)) clusterGroups.set(root, new Set());
  clusterGroups.get(root).add(a);
  clusterGroups.get(root).add(b);
}

// Expand clusters: add nodes connecting to 2+ existing members (imports/calls either direction)
const allAdjUndirected = new Map();
for (const e of edges) {
  if (e.type === 'imports' || e.type === 'calls') {
    if (!allAdjUndirected.has(e.source)) allAdjUndirected.set(e.source, new Set());
    allAdjUndirected.get(e.source).add(e.target);
    if (!allAdjUndirected.has(e.target)) allAdjUndirected.set(e.target, new Set());
    allAdjUndirected.get(e.target).add(e.source);
  }
}

const clusters = [];
for (const [root, members] of clusterGroups.entries()) {
  const memberSet = new Set(members);
  // Try expanding up to size 5
  let changed = true;
  while (memberSet.size < 5 && changed) {
    changed = false;
    const candidateCounts = new Map();
    for (const m of memberSet) {
      const neighbors = allAdjUndirected.get(m) || new Set();
      for (const nb of neighbors) {
        if (!memberSet.has(nb)) {
          candidateCounts.set(nb, (candidateCounts.get(nb) || 0) + 1);
        }
      }
    }
    let bestCandidate = null;
    let bestCount = 0;
    for (const [cand, count] of candidateCounts.entries()) {
      if (count >= 2 && count > bestCount) {
        bestCandidate = cand;
        bestCount = count;
      }
    }
    if (bestCandidate) {
      memberSet.add(bestCandidate);
      changed = true;
    }
  }
  const memberArr = Array.from(memberSet).slice(0, 5);
  // Count edges within this cluster
  let count = 0;
  for (const e of edges) {
    if ((e.type === 'imports' || e.type === 'calls') && memberArr.includes(e.source) && memberArr.includes(e.target)) {
      count++;
    }
  }
  clusters.push({ nodes: memberArr, edgeCount: count });
}

clusters.sort((a, b) => b.edgeCount - a.edgeCount);
const topClusters = clusters.slice(0, 10);

// ---- Layers ----
const layerOutput = {
  count: layers.length,
  list: layers.map((l) => ({ id: l.id, name: l.name, description: l.description })),
};

// ---- Node summary index ----
const nodeSummaryIndex = {};
for (const n of nodes) {
  nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary };
}

const result = {
  scriptCompleted: true,
  entryPointCandidates,
  fanInRanking,
  fanOutRanking,
  bfsTraversal,
  nonCodeFiles,
  clusters: topClusters,
  layers: layerOutput,
  nodeSummaryIndex,
  totalNodes: nodes.length,
  totalEdges: edges.length,
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
} catch (e) {
  fail('Failed to write output JSON: ' + e.message);
}

console.log('Analysis complete. Written to ' + outputPath);
process.exit(0);
