# 00b-grant-ci-sa.ps1
# ONE-TIME bootstrap: grant the GitHub Actions OIDC runner SA the project-level
# roles needed for the automated scanner provisioning in deploy-backend.yml.
#
# The workflow (Ensure ENCRYPTION_KEY / SCAN_INTERNAL_KEY, Provision scanner
# service account, Wire invoker, Smoke test) runs gcloud AS this SA, so it must
# be able to:
#   - create + update Secret Manager secrets      -> secretmanager.admin
#   - create SAs + bind project/SA IAM policies   -> iam.serviceAccountAdmin,
#                                                    resourcemanager.projectIamAdmin
#   - bind run.invoker + deploy Cloud Run         -> run.admin, cloudbuild.builds.editor
#
# This is inherently a manual step: a CI pipeline cannot grant itself IAM. Run
# once with your owner/admin gcloud; after that every push is automatic.
#
# Usage: .\scripts\deploy\00b-grant-ci-sa.ps1 [-ProjectId hoverchart] [-CiSa <email>]
param([string]$ProjectId, [string]$CiSa)

$ErrorActionPreference = 'Stop'
if (-not $ProjectId) {
  $ProjectId = (gcloud config get-value project 2>$null).Trim()
  if (-not $ProjectId -or $ProjectId -eq 'unset') {
    throw 'Could not determine project. Pass -ProjectId or run: gcloud config set project <id>'
  }
}
if (-not $CiSa) {
  $CiSa = "hoverchart-api-sa@$ProjectId.iam.gserviceaccount.com"
  Write-Host "NOTE: pass -CiSa if your GCP_SERVICE_ACCOUNT secret differs from $CiSa"
}

$member = "serviceAccount:$CiSa"
foreach ($role in @(
  'roles/secretmanager.admin',
  'roles/iam.serviceAccountAdmin',
  'roles/resourcemanager.projectIamAdmin',
  'roles/run.admin',
  'roles/cloudbuild.builds.editor'
)) {
  gcloud projects add-iam-policy-binding $ProjectId --member=$member --role=$role --quiet
  Write-Host "Bound $CiSa -> $role"
}

Write-Host 'DONE: CI runner SA is now able to run the full deploy-backend.yml pipeline.'
Write-Host "Re-run the workflow (workflow_dispatch) or push to main to retry."