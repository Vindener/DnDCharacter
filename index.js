/* eslint-env commonjs, node */
/* eslint-disable @typescript-eslint/no-require-imports -- see comment below */
// PERF-1: this file deliberately uses require() instead of import. Babel's ESM->CJS
// transform (verified directly: @babel/plugin-transform-modules-commonjs) hoists every
// `import` to the very top of the file regardless of source position, so plain imports
// would make it impossible to bracket individual startup stages with marks below —
// require() calls run exactly in the order written (and can be made conditional), which
// is what we need here.
const { markStartup, isStartupTraceEnabled } = require('./src/shared/services/telemetry/startupTrace');

markStartup('entry');

if (isStartupTraceEnabled()) {
  // Deliberately pull each SRD stage forward, one require() at a time, so its one-time
  // synchronous cost (JSON parse, then Zod validation, then uk localization) is individually
  // observable instead of being buried inside the App -> AppNavigator -> TabNavigator ->
  // screens import chain. This is a NO-OP on total cost: these same modules would be
  // required anyway once a screen imports them, and Metro's module cache means each one
  // only ever pays its parse/validate cost once, on first require — we're just moving WHEN
  // that first require happens by a few call-frames, not adding new work. Never runs unless
  // tracing is on, so with tracing off the load order is exactly what it was before this file
  // changed. No edits made inside src/data/srd or src/domain/srd themselves.
  require('./src/data/srd');
  markStartup('srd-json-loaded');

  require('./src/domain/srd/srdRepository');
  markStartup('srd-parsed');

  require('./src/domain/srd/localization');
  markStartup('srd-localized');
}

const { registerRootComponent } = require('expo');
const App = require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
