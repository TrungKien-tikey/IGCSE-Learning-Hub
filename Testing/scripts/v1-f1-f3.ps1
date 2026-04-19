param(
    [ValidateSet("regression", "retest")]
    [string]$Mode = "regression",
    [string[]]$CaseIds,
    [switch]$GenerateOnly,
    [switch]$SkipInfraCheck,
    [switch]$SkipDocCheck
)

. (Join-Path $PSScriptRoot "auth-test-common.ps1")

Invoke-AuthVersionRunner -Version "v1" -Mode $Mode -CaseIds $CaseIds -GenerateOnly:$GenerateOnly -SkipInfraCheck:$SkipInfraCheck -SkipDocCheck:$SkipDocCheck
