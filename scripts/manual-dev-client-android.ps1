$ErrorActionPreference = "Stop"

$avdName = "Pixel_7_API_35"
$localSdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"

if ($env:ANDROID_SDK_ROOT -and (Test-Path (Join-Path $env:ANDROID_SDK_ROOT "platform-tools\adb.exe"))) {
  $sdkRoot = $env:ANDROID_SDK_ROOT
} elseif (Test-Path (Join-Path $localSdkRoot "platform-tools\adb.exe")) {
  $sdkRoot = $localSdkRoot
} else {
  throw "Android SDK was not found. Set ANDROID_SDK_ROOT or install SDK to $localSdkRoot."
}

$adbPath = Join-Path $sdkRoot "platform-tools\adb.exe"
$emulatorPath = Join-Path $sdkRoot "emulator\emulator.exe"

if (!(Test-Path $emulatorPath)) {
  throw "Android emulator binary not found at $emulatorPath."
}

$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_HOME = $sdkRoot

if (-not $env:PATH.Contains((Join-Path $sdkRoot "platform-tools"))) {
  $env:PATH = "$(Join-Path $sdkRoot "platform-tools");$env:PATH"
}
if (-not $env:PATH.Contains((Join-Path $sdkRoot "emulator"))) {
  $env:PATH = "$(Join-Path $sdkRoot "emulator");$env:PATH"
}

Write-Host "Using Android SDK: $sdkRoot"
Write-Host "Target AVD: $avdName"

& $adbPath kill-server | Out-Null
& $adbPath start-server | Out-Null

$avds = & $emulatorPath -list-avds
if (-not ($avds -contains $avdName)) {
  throw "AVD '$avdName' not found. Available AVDs:`n$($avds -join "`n")"
}

$hasRunningEmulator = $false
foreach ($line in (& $adbPath devices)) {
  if ($line -match "^emulator-\d+\s+device$") {
    $hasRunningEmulator = $true
    break
  }
}

if (-not $hasRunningEmulator) {
  Write-Host "Launching emulator '$avdName' (visible mode)..."
  Start-Process -FilePath $emulatorPath -ArgumentList "-avd $avdName -memory 4096 -no-snapshot-load -no-boot-anim -gpu swiftshader_indirect"
}

Write-Host "Waiting for emulator boot..."
& $adbPath wait-for-device

$bootCompleted = ""
for ($i = 0; $i -lt 180; $i++) {
  $bootCompleted = (& $adbPath shell getprop sys.boot_completed 2>$null).Trim()
  if ($bootCompleted -eq "1") {
    break
  }
  Start-Sleep -Seconds 2
}

if ($bootCompleted -ne "1") {
  throw "Emulator boot timeout. sys.boot_completed='$bootCompleted'."
}

Write-Host "Starting Expo dev-client for manual testing..."
npm start -- --android
