#!/usr/bin/env bash
# Local Android release build (AAB or APK), signed with the production upload key,
# bypassing EAS Build cloud queue/quota. Requires a one-time signing setup — see
# docs/local-android-build.md.
set -euo pipefail

cd "$(dirname "$0")/.."

BUILD_TYPE="aab"
PROFILE="production"
OUTPUT_DIR=".builds"
GRADLE_PROPS="$HOME/.gradle/gradle.properties"
BUILD_GRADLE="android/app/build.gradle"

usage() {
  cat <<'EOF'
Usage: scripts/build-android-local.sh [--apk] [--skip-version-sync]

  --apk                 Build a release APK (assembleRelease) instead of an AAB
                         (bundleRelease). Default: AAB.
  --skip-version-sync   Do not query/update the EAS remote versionCode counter.
                         Uses (local cache + 1) instead. Only for offline use.

One-time setup required before first run: docs/local-android-build.md
EOF
}

SKIP_VERSION_SYNC=0
for arg in "$@"; do
  case "$arg" in
    --apk) BUILD_TYPE="apk" ;;
    --skip-version-sync) SKIP_VERSION_SYNC=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $arg" >&2; usage; exit 1 ;;
  esac
done

echo "== 1/6 Preflight =="

if ! grep -q "^MYAPP_UPLOAD_STORE_FILE=" "$GRADLE_PROPS" 2>/dev/null; then
  echo "ERROR: $GRADLE_PROPS is missing MYAPP_UPLOAD_STORE_FILE (and the matching" >&2
  echo "STORE_PASSWORD/KEY_ALIAS/KEY_PASSWORD). Without it this build would silently" >&2
  echo "fall back to the debug keystore and Play Console would reject the upload." >&2
  echo "One-time setup: docs/local-android-build.md" >&2
  exit 1
fi

CURRENT_NODE="$(node -v)"
if [ "$CURRENT_NODE" != "v20.19.4" ]; then
  echo "WARN: running Node $CURRENT_NODE, EAS profiles pin v20.19.4. This only bundles" >&2
  echo "JS/runs Gradle here (no npm install), so it is usually fine — but if Metro/" >&2
  echo "babel behaves oddly, retry under v20.19.4." >&2
fi

if [ ! -f .env ] || ! grep -q "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID" .env; then
  echo "ERROR: .env is missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID — Google Sign-In will" >&2
  echo "be misconfigured in the built app. Check eas.json build.production.env for the" >&2
  echo "expected value." >&2
  exit 1
fi

echo "== 2/6 Resolving versionCode =="

mkdir -p "$OUTPUT_DIR"
VERSION_CACHE="$OUTPUT_DIR/.last-remote-versioncode"
NEW_VC=""

if [ "$SKIP_VERSION_SYNC" -eq 1 ]; then
  LAST=$(cat "$VERSION_CACHE" 2>/dev/null || echo 0)
  NEW_VC=$((LAST + 1))
  echo "Offline mode: using cached versionCode $LAST + 1 = $NEW_VC (NOT verified against EAS remote)."
else
  REMOTE_OUTPUT="$(npx --yes eas-cli@latest build:version:get --platform android --non-interactive 2>&1)" || {
    echo "ERROR: could not reach EAS to read the remote versionCode:" >&2
    echo "$REMOTE_OUTPUT" >&2
    echo "Fix connectivity/login, or rerun with --skip-version-sync (unsynced, offline)." >&2
    exit 1
  }
  REMOTE_VC="$(echo "$REMOTE_OUTPUT" | grep -oE '[0-9]+' | tail -1)"
  if [ -z "$REMOTE_VC" ]; then
    echo "ERROR: could not parse versionCode from eas-cli output:" >&2
    echo "$REMOTE_OUTPUT" >&2
    exit 1
  fi
  NEW_VC=$((REMOTE_VC + 1))
  echo "Remote versionCode is $REMOTE_VC -> this build will use $NEW_VC."
fi

echo "== 3/6 Patching build.gradle (temporary — restored automatically) =="

cp "$BUILD_GRADLE" "$BUILD_GRADLE.local-build-bak"
restore_build_gradle() {
  mv -f "$BUILD_GRADLE.local-build-bak" "$BUILD_GRADLE" 2>/dev/null || true
}
trap restore_build_gradle EXIT

sed -i -E "s/versionCode [0-9]+/versionCode $NEW_VC/" "$BUILD_GRADLE"

echo "== 4/6 Building ($BUILD_TYPE, profile=$PROFILE) =="

pushd android >/dev/null
if [ "$BUILD_TYPE" = "aab" ]; then
  ./gradlew bundleRelease
  ARTIFACT="app/build/outputs/bundle/release/app-release.aab"
else
  ./gradlew assembleRelease
  ARTIFACT="app/build/outputs/apk/release/app-release.apk"
fi
popd >/dev/null

echo "== 5/6 Copying artifact out (before any gradle clean) =="

STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$OUTPUT_DIR/mythgate-v${NEW_VC}-${STAMP}.${BUILD_TYPE}"
cp "android/$ARTIFACT" "$DEST"
echo "Built: $DEST"
sha256sum "$DEST" 2>/dev/null || shasum -a 256 "$DEST"

echo "== 6/6 Syncing versionCode =="

echo "$NEW_VC" > "$VERSION_CACHE"

if [ "$SKIP_VERSION_SYNC" -eq 1 ]; then
  echo "Cached locally as $NEW_VC (unsynced). Sync with EAS remote before your next cloud build:"
else
  echo "IMPORTANT: EAS remote versionCode is still $((NEW_VC - 1)) — 'eas build:version:set' has"
  echo "no non-interactive flag, so this script cannot push it for you. Before uploading this"
  echo "artifact (or running any cloud/local build again), run this yourself and type '$NEW_VC'"
  echo "at the prompt (it is an interactive text input — clear any pre-filled text first, typed"
  echo "characters insert rather than replace):"
fi
echo "  npx eas-cli build:version:set --platform android"

echo "Done. AAB/APK is signed with the production upload key iff MYAPP_UPLOAD_* in"
echo "$GRADLE_PROPS pointed at it — spot-check by comparing keytool -printcert -jarfile"
echo "on $DEST against the SHA-1 registered in Play App Signing."
