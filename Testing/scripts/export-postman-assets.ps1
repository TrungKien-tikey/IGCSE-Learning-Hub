param(
    [switch]$SkipDocCheck
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "auth-test-common.ps1")

$postmanRoot = Join-Path $Script:TestingRoot "postman"
New-Item -ItemType Directory -Path $postmanRoot -Force | Out-Null

$exports = @(
    @{ Version = "v1"; Mode = "regression"; Prefix = "auth-service.v1.f1-f3" },
    @{ Version = "v2"; Mode = "fix"; Prefix = "auth-service.v2.f4-f5" },
    @{ Version = "v3"; Mode = "fix"; Prefix = "auth-service.v3.f6-f7" }
)

$results = @()
foreach ($export in $exports) {
    $generated = Invoke-AuthVersionRunner `
        -Version $export.Version `
        -Mode $export.Mode `
        -GenerateOnly `
        -SkipDocCheck:$SkipDocCheck

    $collectionTarget = Join-Path $postmanRoot "$($export.Prefix).collection.json"
    $environmentTarget = Join-Path $postmanRoot "$($export.Prefix).environment.json"

    Copy-Item -LiteralPath $generated.CollectionPath -Destination $collectionTarget -Force
    Copy-Item -LiteralPath $generated.EnvironmentPath -Destination $environmentTarget -Force

    $results += [pscustomobject]@{
        Version = $export.Version
        Collection = $collectionTarget
        Environment = $environmentTarget
    }
}

$results
