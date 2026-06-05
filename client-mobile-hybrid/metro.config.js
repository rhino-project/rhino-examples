// Metro configuration for the LOCAL linked `@rhino-dev/rhino-react` dev lib.
//
// Why this file exists
// --------------------
// `package.json` points the lib at `file:../../rhino-react` (a symlink in
// node_modules). The lib's `package.json` declares its `react-native` entry as
// `./src/index.ts` — i.e. Metro bundles the lib's TypeScript SOURCE, not its
// pre-built `dist`. That's great for live editing the lib, but it means Metro
// must (a) WATCH the lib's source folder and (b) resolve the lib's bare imports
// (`react`, `@tanstack/react-query`, `axios`, ...) back into THIS app's
// node_modules. The lib has its OWN node_modules (with its own copy of React),
// so without forcing a single copy you get the classic duplicate-React
// "Invalid hook call" crash.
//
// The fixes below:
//   1. watchFolders: let Metro see + hot-reload the lib's src outside the app root.
//   2. resolver.nodeModulesPaths: search the APP's node_modules first.
//   3. resolver.extraNodeModules: hard-pin the singletons (React/RN/react-query/
//      axios/clsx/tailwind-merge/async-storage) to the app's single copy so a
//      symlinked lib import can never reach a second copy.
// Note: we deliberately do NOT set `disableHierarchicalLookup` — react-native
// resolves some of its own deps (e.g. @react-native/virtualized-lists) from its
// nested node_modules, which that flag would break. The `extraNodeModules`
// hard-pins below are enough to guarantee a single React/RN instance.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
// The local dev lib lives two levels up: rhino-examples/client-mobile-hybrid -> rhino-react
const rhinoReactRoot = path.resolve(projectRoot, '../../rhino-react');

const config = getDefaultConfig(projectRoot);

// 1. Watch the local lib's source so edits to rhino-react/src hot-reload.
config.watchFolders = [rhinoReactRoot];

// 2. Always resolve modules from THIS app's node_modules.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// 3. Hard-pin every package that must be a single instance. The lib's `src`
//    imports these as bare specifiers; the symlink would otherwise let them
//    resolve from the lib's own node_modules (a second React == broken hooks).
const singletons = [
  'react',
  'react-dom',
  'react-native',
  'react-native-web',
  '@tanstack/react-query',
  'axios',
  'clsx',
  'tailwind-merge',
  '@react-native-async-storage/async-storage',
];
config.resolver.extraNodeModules = singletons.reduce((acc, name) => {
  acc[name] = path.resolve(projectRoot, 'node_modules', name);
  return acc;
}, {});

module.exports = config;
