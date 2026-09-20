# _smoke-scanner.ps1 [-Keep] : boot backend/dist/scanner.mjs with the ROOT
# node_modules hidden (image-style resolution: only backend/node_modules exists),
# probe the endpoints, then clean up. Placeholder nokey values are fine for the
# 403/400 paths.
param([switch]$Keep)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$backend = Join-Path $root 'backend'
$hidden = Join-Path $root 'node_modules.bak'
$log = Join-Path $env:TEMP 'scanner-boot.log'
$port = 9331
$renamed = $false
$parent = $null

try {
  if (-not $Keep) {
    if (Test-Path (Join-Path $root 'node_modules')) {
      Rename-Item (Join-Path $root 'node_modules') $hidden -Force
      $renamed = $true
      Write-Host '[root node_modules hidden]'
    }
  }

  $env:PORT = "$port"
  $env:SCAN_INTERNAL_KEY = 'testscansecret'
  $env:DATABASE_URL = ''
  Remove-Item $log -ErrorAction SilentlyContinue
  $parent = Start-Process pwsh -ArgumentList '-NoProfile','-c',"Set-Location `"$backend`"; node --enable-source-maps dist/scanner.mjs *> `"$log`"" -PassThru -WindowStyle Hidden

  $up = $false
  for ($i = 0; $i -lt 90; $i++) {
    Start-Sleep -Milliseconds 500
    if ($parent.HasExited) {
      Write-Host '[server process exited before ready]'
      if (Test-Path $log) { Get-Content $log | Select-Object -Last 20 }
      break
    }
    try { $code = & curl.exe -s -o NUL -w '%{http_code}' -m 2 "http://127.0.0.1:$port/health"; if ($LASTEXITCODE -eq 0 -and $code -ne '000') { $up = $true; break } } catch {}
  }

if ($up) {
    Write-Host '== server up, probing =='
    function Probe([string]$name, [string[]]$curlArgs) {
      $out = (& curl.exe -s -w "`n[%{http_code}]" -m 5 @curlArgs 2>&1 | Out-String).Trim()
      Write-Host ("{0,-26} -> {1}" -f $name, $out)
    }
    Probe 'GET  /health'          @("http://127.0.0.1:$port/health")
    Probe 'POST /scan (no key)'   @('-X','POST','-H','Content-Type: application/json','-d','{}',"http://127.0.0.1:$port/scan")
    Probe 'POST /scan (bad key)'  @('-X','POST','-H','x-scan-key: nope','-H','Content-Type: application/json','-d','{}',"http://127.0.0.1:$port/scan")
    Probe 'POST /scan (valid k, no jid)' @('-X','POST','-H','x-scan-key: testscansecret',"http://127.0.0.1:$port/scan")
  } else {
    Write-Host '== server never responded; log: =='
    if (Test-Path $log) { Get-Content $log | Select-Object -Last 25 }
  }
} finally {
  if ($parent) { & taskkill /PID $parent.Id /T /F 2>$null | Out-Null }
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conn) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }
  Remove-Item Env:PORT, Env:SCAN_INTERNAL_KEY, Env:DATABASE_URL -ErrorAction SilentlyContinue
  if ($renamed) { Rename-Item $hidden (Join-Path $root 'node_modules') -Force; Write-Host '[root node_modules restored]' }
}
