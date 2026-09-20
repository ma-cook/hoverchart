# 00-setup-scanner-sa.ps1
# Create the scanner runtime service account + project-level IAM roles.
# Prereq: secrets ENCRYPTION_KEY and SCAN_INTERNAL_KEY must already exist
# (see fix-encryption-key.ps1 for ENCRYPTION_KEY).
param([string]$ProjectId)

$ErrorActionPreference = 'Stop'
if (-not $ProjectId) {
  $ProjectId = (gcloud config get-value project 2>$null).Trim()
  if (-not $ProjectId -or $ProjectId -eq 'unset') {
    throw 'Could not determine project. Pass -ProjectId or run: gcloud config set project <id>'
  }
}

$sa = "hoverchart-scanner-sa@$ProjectId.iam.gserviceaccount.com"

gcloud iam service-accounts describe $sa --project $ProjectId 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud iam service-accounts create hoverchart-scanner-sa --display-name="Hoverchart scanner Cloud Run" --project $ProjectId --quiet
  Write-Host "Created service account: $sa"
} else {
  Write-Host "Service account already exists: $sa"
}

foreach ($role in @('roles/cloudsql.client', 'roles/storage.objectAdmin', 'roles/secretmanager.secretAccessor')) {
  gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$sa" --role=$role --quiet
  Write-Host "Bound $sa -> $role"
}

# The Cloud Build deployer (hoverchart-api-sa, the build's default account) must be
# able to act AS the scanner runtime SA when `gcloud run deploy --service-account=`
# runs; without this you get iam.serviceAccounts.actAs denied.
gcloud iam service-accounts add-iam-policy-binding $sa `
  --member="serviceAccount:hoverchart-api-sa@$ProjectId.iam.gserviceaccount.com" `
  --role=roles/iam.serviceAccountUser --quiet
Write-Host 'Bound hoverchart-api-sa -> iam.serviceAccountUser on scanner SA.'

Write-Host 'DONE: scanner SA created and project IAM roles bound.'