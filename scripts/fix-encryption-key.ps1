# One-shot: generate a fresh 32-byte AES key and store it as the next version of
# the ENCRYPTION_KEY secret (Cloud Run deployments resolve ENCRYPTION_KEY:latest,
# so the newest version wins). No dependency on openssl or cross-line variables.
$ErrorActionPreference = 'Stop'

$ek = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$tmp = Join-Path $env:TEMP 'encryption-key.tmp'

Set-Content -Path $tmp -Value $ek -Encoding ascii -NoNewline
try {
  gcloud secrets versions add ENCRYPTION_KEY --data-file=$tmp
} finally {
  Remove-Item -Path $tmp -Force
}

$latest = gcloud secrets versions access latest --secret=ENCRYPTION_KEY
$trimmed = $latest.Trim()
Write-Host "Stored key length: $($trimmed.Length) (expected 44)"
if ($trimmed.Length -ne 44) { Write-Host 'WARNING: stored key is not 44 base64 chars - check output above.'; exit 1 }
Write-Host 'ENCRYPTION_KEY is set and valid.'