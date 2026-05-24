# Register a Windows Scheduled Task to keep cloudflared running after logon/startup.
# Runs fully hidden (no console window). From project root:
#   .\deploy\register-cloudflared-task.ps1

$ErrorActionPreference = 'Stop'

$taskName = 'Grymare-Cloudflared'
$deployDir = Join-Path $PSScriptRoot 'cloudflared'
$userDir = Join-Path $env:USERPROFILE '.cloudflared'

if (-not (Test-Path $userDir)) {
    New-Item -ItemType Directory -Path $userDir -Force | Out-Null
}

Copy-Item -Path (Join-Path $deployDir 'run-grymare-tunnel.ps1') -Destination (Join-Path $userDir 'run-grymare-tunnel.ps1') -Force
Copy-Item -Path (Join-Path $deployDir 'start-grymare-tunnel.vbs') -Destination (Join-Path $userDir 'start-grymare-tunnel.vbs') -Force

$vbsPath = Join-Path $userDir 'start-grymare-tunnel.vbs'
$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbsPath`""
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn
$triggerStartup = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Days 3650) `
    -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger @($triggerLogon, $triggerStartup) `
    -Settings $settings `
    -Principal $principal `
    -Description 'Runs cloudflared tunnel for grymare.com hostnames (hidden)' `
    -Force | Out-Null

Write-Host "Registered scheduled task '$taskName' (hidden, no console window)."
Write-Host "Start now:  Start-ScheduledTask -TaskName '$taskName'"
Write-Host "Check tunnel: cloudflared tunnel info 68dc4207-a2dd-4f32-8906-19d2c658c6b5"
Write-Host "Logs:       $env:USERPROFILE\.cloudflared\tunnel.log"
