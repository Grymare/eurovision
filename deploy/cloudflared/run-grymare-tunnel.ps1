# Keeps cloudflared running for Grymare tunnels. Launched hidden via start-grymare-tunnel.vbs.
$ErrorActionPreference = 'Continue'

$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$config = Join-Path $env:USERPROFILE '.cloudflared\config.yml'
$log = Join-Path $env:USERPROFILE '.cloudflared\tunnel.log'
$tunnelId = '68dc4207-a2dd-4f32-8906-19d2c658c6b5'

function Write-Log([string]$Message) {
    "$(Get-Date -Format o) $Message" | Add-Content -Path $log
}

$existing = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($existing) {
    Write-Log "cloudflared already running (PID $($existing.Id)); wrapper exiting"
    exit 0
}

while ($true) {
    Write-Log "Starting cloudflared tunnel $tunnelId"

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $cloudflared
    $psi.Arguments = "--config `"$config`" tunnel run $tunnelId"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true

    $process = [System.Diagnostics.Process]::Start($psi)
    $stdout = $process.StandardOutput
    $stderr = $process.StandardError

    while (-not $process.HasExited) {
        while (-not $stdout.EndOfStream) { Write-Log $stdout.ReadLine() }
        while (-not $stderr.EndOfStream) { Write-Log $stderr.ReadLine() }
        Start-Sleep -Milliseconds 500
    }

    while (-not $stdout.EndOfStream) { Write-Log $stdout.ReadLine() }
    while (-not $stderr.EndOfStream) { Write-Log $stderr.ReadLine() }

    Write-Log "cloudflared exited with code $($process.ExitCode); restarting in 10 seconds"
    Start-Sleep -Seconds 10
}
