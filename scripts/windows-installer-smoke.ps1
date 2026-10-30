$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Find-BarRegistration([string]$hive) {
  $key = "${hive}:\Software\Microsoft\Windows\CurrentVersion\Uninstall"
  if (Test-Path $key) {
    Get-ChildItem $key | Where-Object { $_.GetValue('DisplayName', '') -eq 'B.A.R' }
  }
}
if (@(Find-BarRegistration 'HKCU').Count -or @(Find-BarRegistration 'HKLM').Count) { throw 'Smoke test requires a disposable Windows account with no existing B.A.R installation' }
$installer = @(Get-ChildItem desktop-dist/BAR-*-windows-x64-setup.exe)
if ($installer.Count -ne 1) { throw 'Expected exactly one Windows x64 installer' }
$installDir = Join-Path $env:LOCALAPPDATA 'Programs/BAR-CI-Smoke'
if (Test-Path $installDir) { throw "Refusing to reuse existing installation: $installDir" }
$originalPath = $env:Path
$originalUserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$installed = $false
$registrationPath = $null
try {
  # NSIS /D must be last and unquoted. The path can contain spaces.
  $process = Start-Process -FilePath $installer[0].FullName -ArgumentList @('/S', '/currentuser', "/D=$installDir") -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "Installer exited $($process.ExitCode)" }
  $installed = $true
  $exe = Join-Path $installDir 'BAR.exe'
  if (!(Test-Path $exe)) { throw 'Installed executable missing' }
  $shortcut = Join-Path ([Environment]::GetFolderPath('Programs')) 'B.A.R.lnk'
  if (!(Test-Path $shortcut)) { throw 'Start menu shortcut missing' }
  $registration = @(Find-BarRegistration 'HKCU')
  if ($registration.Count -ne 1) { throw 'Expected one current-user uninstall registration' }
  $registrationPath = $registration[0].PSPath
  if (!(Get-ItemPropertyValue $registrationPath -Name UninstallString).Contains($installDir)) { throw 'Uninstall registration points outside this installation' }
  if (@(Find-BarRegistration 'HKLM').Count) { throw 'Installer unexpectedly registered machine-wide' }
  if ([Environment]::GetEnvironmentVariable('Path', 'User') -ne $originalUserPath) { throw 'Installer unexpectedly changed user PATH' }
  $env:BAR_DESKTOP_EXECUTABLE = $exe
  $env:BAR_TEST_KEEP_PROJECT = '1'
  # Exercise the installed application, not Electron from node_modules.
  node desktop/gui-smoke.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Installed GUI smoke test failed' }
} finally {
  $env:Path = $originalPath
  if ($installed) {
    $uninstallers = @(Get-ChildItem $installDir -Filter '*Uninstall*.exe')
    if ($uninstallers.Count -ne 1) { throw 'Expected one registered uninstaller' }
    $process = Start-Process -FilePath $uninstallers[0].FullName -ArgumentList '/S' -Wait -PassThru
    if ($process.ExitCode -ne 0) { throw "Uninstaller exited $($process.ExitCode)" }
    # NSIS may finish cleanup through a temporary process after the parent exits.
    $deadline = (Get-Date).AddSeconds(30)
    while ((Test-Path (Join-Path $installDir 'BAR.exe')) -and ((Get-Date) -lt $deadline)) { Start-Sleep -Milliseconds 250 }
    if (Test-Path (Join-Path $installDir 'BAR.exe')) { throw 'Uninstall left the executable behind' }
    if (Test-Path (Join-Path ([Environment]::GetFolderPath('Programs')) 'B.A.R.lnk')) { throw 'Uninstall left Start menu shortcut behind' }
    if ($registrationPath -and (Test-Path $registrationPath)) { throw 'Uninstall left its registration behind' }
  }
}
$evidence = Get-Content desktop-test-results/gui-report.json -Raw | ConvertFrom-Json
$testRoot = [IO.Path]::GetFullPath($evidence.projectRoot)
$safePrefix = Join-Path ([IO.Path]::GetTempPath()) 'bar-desktop-smoke-'
if (!$testRoot.StartsWith($safePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unexpected smoke fixture location; refusing cleanup' }
$fixture = Join-Path $testRoot 'Card.tsx'
if (!(Test-Path $fixture) -or ([IO.File]::ReadAllText($fixture) -cne $evidence.originalFixture)) { throw 'Uninstall modified the user project fixture' }
Remove-Item -LiteralPath $testRoot -Recurse -Force
Write-Output 'Installed GUI audit/repair/export smoke and uninstall passed.'
