param(
    [ValidateSet("fix", "retest", "regression")]
    [string]$Mode = "fix",
    [string[]]$CaseIds,
    [switch]$GenerateOnly,
    [switch]$SkipInfraCheck,
    [switch]$SkipDocCheck
)

. (Join-Path $PSScriptRoot "auth-test-common.ps1")

Invoke-AuthVersionRunner -Version "v3" -Mode $Mode -CaseIds $CaseIds -GenerateOnly:$GenerateOnly -SkipInfraCheck:$SkipInfraCheck -SkipDocCheck:$SkipDocCheck
