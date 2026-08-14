const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude native build output (Gradle build/ and CMake .cxx/) from Metro's file watcher.
// ~15 autolinked native modules each get their own android/build + android/.cxx tree once a
// release variant is built (tens of thousands of intermediate files combined) — Expo's
// default blockList only excludes .expo/types, so watching these caused Metro to hit the
// OS inotify watch limit (ENOSPC) on this Linux dev machine.
config.resolver.blockList = [/android[\\/](.*[\\/])?build[\\/].*/, /android[\\/](.*[\\/])?\.cxx[\\/].*/].concat(
  config.resolver.blockList ?? [],
);

module.exports = config;
