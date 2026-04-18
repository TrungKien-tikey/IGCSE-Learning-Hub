param(
    [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

$branches = @(
    "test/v1-f1-f3-baseline",
    "test/v2-f4-f5",
    "test/v3-f6-f7"
)

foreach ($branch in $branches) {
    $exists = git branch --list $branch
    if ($exists) {
        Write-Output "Exists: $branch"
        continue
    }

    if ($WhatIf) {
        Write-Output "Would create: $branch"
        continue
    }

    git branch $branch | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create branch '$branch'. Check git permissions for .git/refs/heads."
    }

    Write-Output "Created: $branch"
}
