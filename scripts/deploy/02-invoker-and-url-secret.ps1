# 02-invoker-and-url-secret.ps1
# After the scanner exists: grant the API SA run.invoker on hoverchart-scanner,
# and store the scanner URL as (or add it to) the SCANNER_SERVICE_URL secret.
# Cloud Run deployments resolve :latest, so adding a new version picks it up.
param([string]$ProjectId, [string]$Region = 'us-central1')

$ErrorActionPreference = 'Stop'
if (-not $ProjectId) {
  $ProjectId = (gcloud config get-value project 2>$null).Trim()
  if (-not $ProjectId -or $ProjectId -eq 'unset') {
    throw 'Could not determine project. Pass -ProjectId or run: gcloud config set project <id>'
  }
}

# 1) Let the API service account invoke the scanner (OIDC id-token call).
gcloud run services add-iam-policy-binding hoverchart-scanner --region $Region `
  --member="serviceAccount:hoverchart-api-sa@$ProjectId.iam.gserviceaccount.com" `
  --role=roles/run.invoker --quiet
if ($LASTEXITCODE -ne 0) { throw 'run.invoker binding failed - is hoverchart-scanner deployed yet?' }
Write-Host 'Bound hoverchart-api-sa -> roles/run.invoker on hoverchart-scanner.'

# 2) Resolve the scanner URL and store it in SCANNER_SERVICE_URL.
$url = gcloud run services describe hoverchart-scanner --region $Region --format="value(status.url)" --project $ProjectId
if (-not $url) { throw 'Could not read scanner URL - is hoverchart-scanner deployed?' }
Write-Host "Scanner URL: $url"

$tmp = Join-Path $env:TEMP 'scanner-url.tmp'
Set-Content -Path $tmp -Value $url -Encoding ascii -NoNewline

gcloud secrets describe SCANNER_SERVICE_URL --project $ProjectId 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
  gcloud secrets versions add SCANNER_SERVICE_URL --data-file=$tmp
  Write-Host 'Added scanner URL as a new version of SCANNER_SERVICE_URL.'
} else {
  gcloud secrets create SCANNER_SERVICE_URL --data-file=$tmp
  Write-Host 'Created SCANNER_SERVICE_URL with the scanner URL.'
}
Remove-Item -Path $tmp -Force

Write-Host 'DONE: invoker binding + SCANNER_SERVICE_URL set.'