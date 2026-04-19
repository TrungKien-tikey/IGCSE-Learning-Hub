param(
    [ValidateSet("fix", "retest")]
    [string]$Mode = "fix",
    [string[]]$CaseIds,
    [switch]$GenerateOnly,
    [switch]$SkipInfraCheck,
    [switch]$SkipDocCheck
)

. (Join-Path $PSScriptRoot "auth-test-common.ps1")

Invoke-AuthVersionRunner -Version "v2" -Mode $Mode -CaseIds $CaseIds -GenerateOnly:$GenerateOnly -SkipInfraCheck:$SkipInfraCheck -SkipDocCheck:$SkipDocCheck
