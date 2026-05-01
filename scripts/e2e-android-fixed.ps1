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

Write-Host "Stopping running emulator instances (if any)..."
$emulatorSerials = @()
foreach ($line in (& $adbPath devices)) {
  if ($line -match "^(emulator-\d+)\s+(device|offline)$") {
    $emulatorSerials += $Matches[1]
  }
}

foreach ($serial in $emulatorSerials) {
  Write-Host "Stopping $serial"
  & $adbPath -s $serial emu kill | Out-Null
}

for ($i = 0; $i -lt 30; $i++) {
  $stillRunning = $false
  foreach ($line in (& $adbPath devices)) {
    if ($line -match "^emulator-\d+\s+(device|offline)$") {
      $stillRunning = $true
      break
    }
  }
  if (-not $stillRunning) {
    break
  }
  Start-Sleep -Seconds 1
}

Write-Host "No active emulator instances left."

Write-Host "Launching '$avdName' with reduced RAM profile (4096 MB)..."
Start-Process -FilePath $emulatorPath -ArgumentList "-avd $avdName -memory 4096 -no-snapshot-load -no-snapshot-save -no-boot-anim -gpu swiftshader_indirect"

Write-Host "Waiting for device..."
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

Write-Host "Device boot completed."
$emulatorSerial = $null
foreach ($line in (& $adbPath devices)) {
  if ($line -match "^(emulator-\d+)\s+device$") {
    $emulatorSerial = $Matches[1]
    break
  }
}
if (-not $emulatorSerial) {
  throw "No active emulator serial found after boot."
}
Write-Host "Using emulator serial: $emulatorSerial"

$env:NODE_ENV = "development"

Write-Host "Running Detox build..."
npm run e2e:build:android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Installing debug APKs for instrumentation..."
$appApk = Join-Path $PSScriptRoot "..\android\app\build\outputs\apk\debug\app-debug.apk"
$testApk = Join-Path $PSScriptRoot "..\android\app\build\outputs\apk\androidTest\debug\app-debug-androidTest.apk"

if (!(Test-Path $appApk)) {
  throw "Main APK not found: $appApk"
}
if (!(Test-Path $testApk)) {
  throw "Test APK not found: $testApk"
}

& $adbPath -s $emulatorSerial install -r -g $appApk | Out-Null
& $adbPath -s $emulatorSerial install -r $testApk | Out-Null

Write-Host "Running Detox tests..."
npx detox test -c android.emu.debug --reuse -- --runInBand
exit $LASTEXITCODE
