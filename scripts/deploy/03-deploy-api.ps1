# 03-deploy-api.ps1
# Redeploy the main API so it picks up ENCRYPTION_KEY, SCAN_INTERNAL_KEY and
# SCANNER_SERVICE_URL (all referenced from backend/cloudbuild.yaml).
param([string]$ProjectId)

$ErrorActionPreference = 'Stop'
if (-not $ProjectId) {
  $ProjectId = (gcloud config get-value project 2>$null).Trim()
  if (-not $ProjectId -or $ProjectId -eq 'unset') {
    throw 'Could not determine project. Pass -ProjectId or run: gcloud config set project <id>'
  }
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

gcloud builds submit . --config backend/cloudbuild.yaml --project=$ProjectId
if ($LASTEXITCODE -ne 0) { throw 'API cloud build failed - see log above.' }

Write-Host 'DONE: hoverchat-api redeployed with background-scan wiring.'