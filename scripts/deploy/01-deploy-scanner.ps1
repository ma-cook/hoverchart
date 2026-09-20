# 01-deploy-scanner.ps1
# Build + push + Cloud Run deploy the hoverchart-scanner service.
# Prereq: ENCRYPTION_KEY, SCAN_INTERNAL_KEY secrets exist; scanner SA is set up
# (00-setup-scanner-sa.ps1). Must run BEFORE 02 and 03.
param([string]$ProjectId)

$ErrorActionPreference = 'Stop'
if (-not $ProjectId) {
  $ProjectId = (gcloud config get-value project 2>$null).Trim()
  if (-not $ProjectId -or $ProjectId -eq 'unset') {
    throw 'Could not determine project. Pass -ProjectId or run: gcloud config set project <id>'
  }
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)   # scripts/deploy -> repo root
Set-Location $repoRoot

# Build context is the repo root; backend/cloudbuild-scanner.yaml references the
# repo-root context (COPY backend/... COPY src/...).
gcloud builds submit . --config backend/cloudbuild-scanner.yaml --project=$ProjectId
if ($LASTEXITCODE -ne 0) { throw 'Scanner cloud build failed - see log above.' }

Write-Host 'DONE: hoverchart-scanner deployed.'