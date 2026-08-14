# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# manual: PERF-2 — react-native-reanimated / react-native-worklets already auto-merge these
# via each library's own consumerProguardFiles (verified in
# node_modules/react-native-reanimated/android/proguard-rules.pro and
# node_modules/react-native-worklets/android/proguard-rules.pro). Kept explicit here as a
# documented safety net — these exact classes were on the path of two native crashes fixed
# 2026-08-14 in Modal.tsx (Crashlytics SIGSEGV in libworklets.so/libhermes.so).
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }

# manual: PERF-2 — react-native-screens ships no consumerProguardFiles. Android instantiates
# Fragment by class name via reflection from saved instance state; without this, a minified
# release build can crash or blank-navigate after backgrounding/back navigation.
-keep class com.swmansion.rnscreens.** { *; }

# manual: PERF-2 — react-native-gesture-handler ships no consumerProguardFiles; tightly
# coupled to Reanimated's worklets event dispatch.
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.swmansion.common.** { *; }

# manual: PERF-2 — react-native-keyboard-controller ships no consumerProguardFiles. This
# library was already the source of two native crashes in this app (SIGSEGV in
# libworklets.so/libreactnative.so, fixed 2026-08-14). Without this keep, R8 risks masking
# or deepening that same crash category in release-only builds.
-keep class com.reactnativekeyboardcontroller.** { *; }

# manual: PERF-2 — react-native-pager-view ships no consumerProguardFiles; peer dependency
# for @react-navigation/material-top-tabs (DM/Character tabs).
-keep class com.reactnativepagerview.** { *; }

# manual: PERF-2 — @react-native-firebase's own React Native bridge (io.invertase.firebase,
# distinct from the underlying Google Firebase SDKs) ships no consumerProguardFiles in any
# of its 6 packages used here.
-keep class io.invertase.firebase.** { *; }

# Add any project specific keep options here:
