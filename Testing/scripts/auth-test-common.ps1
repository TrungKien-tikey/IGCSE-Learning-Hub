Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Script:RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Script:TestingRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Script:GeneratedRoot = Join-Path $Script:TestingRoot ".generated"
$Script:ArtifactsRoot = Join-Path $Script:TestingRoot "artifacts"
$Script:JwtSecret = "daylakeybimatcuatoiphaidudaivaphucktap123456789"

function Get-RunDateString {
    return (Get-Date -Format "yyyy-MM-dd")
}

function ConvertTo-Base64Url {
    param([byte[]]$Bytes)

    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function New-Hs256Jwt {
    param(
        [hashtable]$Payload,
        [string]$Secret
    )

    $header = @{ alg = "HS256"; typ = "JWT" }
    $headerJson = $header | ConvertTo-Json -Compress
    $payloadJson = $Payload | ConvertTo-Json -Compress

    $headerEncoded = ConvertTo-Base64Url -Bytes ([System.Text.Encoding]::UTF8.GetBytes($headerJson))
    $payloadEncoded = ConvertTo-Base64Url -Bytes ([System.Text.Encoding]::UTF8.GetBytes($payloadJson))
    $unsignedToken = "$headerEncoded.$payloadEncoded"

    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($Secret))
    try {
        $signature = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($unsignedToken))
    }
    finally {
        $hmac.Dispose()
    }

    $signatureEncoded = ConvertTo-Base64Url -Bytes $signature
    return "$unsignedToken.$signatureEncoded"
}

function New-ExpiredAccessToken {
    param(
        [string]$Email = "user5@example.com",
        [string]$Role = "STUDENT",
        [long]$UserId = 1
    )

    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $payload = @{
        sub = $Email
        email = $Email
        role = $Role
        userId = $UserId
        verificationStatus = "VERIFIED"
        iat = $now - 7200
        exp = $now - 3600
    }

    return New-Hs256Jwt -Payload $payload -Secret $Script:JwtSecret
}

function New-BoundaryEmail {
    param(
        [string]$Suffix,
        [switch]$TooLong
    )

    $suffixValue = $Suffix.ToLowerInvariant()
    if ($suffixValue.Length -gt 20) {
        $suffixValue = $suffixValue.Substring(0, 20)
    }

    $localPrefix = "codex$($suffixValue)"
    if ($localPrefix.Length -gt 64) {
        $localPrefix = $localPrefix.Substring(0, 64)
    }

    $local = $localPrefix + ("a" * (64 - $localPrefix.Length))
    $label1 = "b" * 63
    $label2 = "c" * 63
    $label3Length = if ($TooLong) { 58 } else { 57 }
    $label3 = "d" * $label3Length

    return "$local@$label1.$label2.$label3.com"
}

function Get-RunLabel {
    param(
        [ValidateSet("v1", "v2", "v3")]
        [string]$Version,
        [ValidateSet("regression", "fix", "retest")]
        [string]$Mode
    )

    $date = Get-RunDateString
    switch ($Version) {
        "v1" { return "local-dev-auth-v1-regression-$date" }
        "v2" { return "local-dev-auth-v2-$Mode-$date" }
        "v3" { return "local-dev-auth-v3-$Mode-$date" }
    }
}

function Get-VersionBranchName {
    param(
        [ValidateSet("v1", "v2", "v3")]
        [string]$Version
    )

    switch ($Version) {
        "v1" { return "test/v1-f1-f3-baseline" }
        "v2" { return "test/v2-f4-f5" }
        "v3" { return "test/v3-f6-f7" }
    }
}

function Test-TcpPort {
    param(
        [string]$HostName,
        [int]$Port
    )

    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $asyncResult = $client.BeginConnect($HostName, $Port, $null, $null)
        $connected = $asyncResult.AsyncWaitHandle.WaitOne(2000)
        if (-not $connected) {
            return $false
        }
        $client.EndConnect($asyncResult) | Out-Null
        return $true
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Test-AuthServiceHealthy {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8088/api/auth/health" -UseBasicParsing -TimeoutSec 5
        return ($response.StatusCode -eq 200)
    }
    catch {
        return $false
    }
}

function Wait-AuthServiceHealthy {
    param(
        [int]$TimeoutSeconds = 60
    )

    $attempts = [Math]::Ceiling($TimeoutSeconds / 2)
    for ($i = 0; $i -lt $attempts; $i++) {
        if (Test-AuthServiceHealthy) {
            return $true
        }
        Start-Sleep -Seconds 2
    }

    return $false
}

function Assert-InfraDependenciesReady {
    $dbReady = Test-TcpPort -HostName "localhost" -Port 3310
    $mqReady = Test-TcpPort -HostName "localhost" -Port 5672
    if (-not $dbReady) {
        throw "MySQL port 3310 is not reachable."
    }
    if (-not $mqReady) {
        throw "RabbitMQ port 5672 is not reachable."
    }
}

function Assert-AuthServiceReady {
    if (-not (Test-AuthServiceHealthy)) {
        throw "auth-service health check failed on http://localhost:8088/api/auth/health"
    }
}

function Start-ManagedAuthService {
    if (Test-AuthServiceHealthy) {
        return @{
            Started = $false
            Process = $null
            StdoutPath = $null
            StderrPath = $null
        }
    }

    if (-not (Get-Command "java" -ErrorAction SilentlyContinue)) {
        throw "Java runtime is not available in PATH, so auth-service cannot be started automatically."
    }

    $runtimeRoot = Join-Path $Script:ArtifactsRoot "runtime"
    New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null

    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $stdoutPath = Join-Path $runtimeRoot "auth-service.$timestamp.stdout.log"
    $stderrPath = Join-Path $runtimeRoot "auth-service.$timestamp.stderr.log"
    $authServiceRoot = Resolve-Path (Join-Path $Script:RepoRoot "auth-service")
    $jarRelativePath = "target\auth-service-0.0.1-SNAPSHOT.jar"

    $process = Start-Process -FilePath "java" `
        -ArgumentList @("-jar", $jarRelativePath) `
        -WorkingDirectory $authServiceRoot.Path `
        -RedirectStandardOutput $stdoutPath `
        -RedirectStandardError $stderrPath `
        -PassThru

    if (-not (Wait-AuthServiceHealthy -TimeoutSeconds 60)) {
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -Force
        }

        $stderrTail = if (Test-Path -LiteralPath $stderrPath) {
            (Get-Content -Tail 20 -LiteralPath $stderrPath -ErrorAction SilentlyContinue) -join [Environment]::NewLine
        }
        else {
            ""
        }

        throw "Managed auth-service did not become healthy. Check runtime logs: $stdoutPath ; $stderrPath`n$stderrTail"
    }

    return @{
        Started = $true
        Process = $process
        StdoutPath = $stdoutPath
        StderrPath = $stderrPath
    }
}

function Stop-ManagedAuthService {
    param([hashtable]$RuntimeInfo)

    if ($null -eq $RuntimeInfo) {
        return
    }

    if (-not $RuntimeInfo["Started"]) {
        return
    }

    $process = $RuntimeInfo["Process"]
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
    }
}

function Assert-InfraReady {
    Assert-InfraDependenciesReady
    Assert-AuthServiceReady
}

function Assert-CanonicalizedDocs {
    $checks = @(
        @{
            Path = Join-Path $Script:TestingRoot "BVA-test.md"
            Patterns = @(
                "POST {{auth_base}}/api/auth/forgot-password\?email=",
                "TC_FP_03\s+email\s+Not found\s+notfound@example.com\s+400 Bad Request",
                "TC_CP_02\s+oldPassword\s+Wrong\s+wrongOldPass\s+400 Bad Request",
                "POST {{auth_base}}/api/auth/logout header: Authorization: \(omit\)",
                "GET {{auth_base}}/api/auth/health"
            )
        },
        @{
            Path = Join-Path $Script:TestingRoot "intergration-test.md"
            Patterns = @(
                "Number of TCs\s+36",
                "Round 1\s+18\s+0\s+18\s+0",
                "TC_FP_03\s+Tu choi forgot-password khi email khong ton tai\s+POST {{auth_base}}/api/auth/forgot-password\?email=notfound@example.com\s+400 Bad Request",
                "TC_CP_02\s+Tu choi doi mat khau khi oldPassword sai voi JWT hop le",
                "Function6 \(securityFilterChain\)",
                "Function7 \(doFilterInternal\)"
            )
        },
        @{
            Path = Join-Path $Script:TestingRoot "logbug.md"
            Patterns = @(
                "## Release Tracks",
                "test/v1-f1-f3-baseline",
                "Version 2 - Active Queue \(Function 4 to 5\)",
                "TC_FP_03.*400 Bad Request",
                "TC_CP_02.*400 Bad Request",
                "Version 3 - Active Queue \(Function 6 to 7\)"
            )
        }
    )

    foreach ($check in $checks) {
        $content = Get-Content -Raw -LiteralPath $check.Path -Encoding UTF8
        foreach ($pattern in $check.Patterns) {
            if ($content -notmatch $pattern) {
                throw "Canonicalization check failed for $($check.Path). Missing pattern: $pattern"
            }
        }
    }
}

function Get-RunContext {
    param(
        [ValidateSet("v1", "v2", "v3")]
        [string]$Version,
        [ValidateSet("regression", "fix", "retest")]
        [string]$Mode
    )

    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $shortSuffix = (Get-Date -Format "MMddHHmmss")

    return [ordered]@{
        version = $Version
        mode = $Mode
        branch = Get-VersionBranchName -Version $Version
        runLabel = Get-RunLabel -Version $Version -Mode $Mode
        timestamp = $timestamp
        authBase = "http://localhost:8088"
        validUserEmail = "user5@example.com"
        validUserPassword = "abc321"
        duplicateEmail = "user4@example.com"
        registerEmail1 = "codex+rg02+$shortSuffix@example.com"
        registerEmail2 = "codex+rg01+$shortSuffix@example.com"
        registerEmail3 = "codex+rg08+$shortSuffix@example.com"
        emailBoundary254 = New-BoundaryEmail -Suffix $shortSuffix
        emailBoundary255 = New-BoundaryEmail -Suffix $shortSuffix -TooLong
        expiredAccessToken = New-ExpiredAccessToken
        malformedToken = "malformed_token"
        invalidJwtToken = "invalid_jwt_token"
        invalidPrefixValue = "Token abc123"
        changeNewPassword = "abc123456"
        reportRoot = Join-Path $Script:ArtifactsRoot (Get-RunLabel -Version $Version -Mode $Mode)
    }
}

function Get-TestCases {
    param([hashtable]$Context)

    $jsonHeader = @(@{ key = "Content-Type"; value = "application/json" })

    return @(
        [ordered]@{
            Version = "v1"; Function = "Function 1 - login"; Id = "TC_LG_01"; Name = "Missing email";
            Method = "POST"; Url = "{{auth_base}}/api/auth/login"; Headers = $jsonHeader;
            Body = '{"password":"abc321"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 1 - login"; Id = "TC_LG_02"; Name = "Invalid email format";
            Method = "POST"; Url = "{{auth_base}}/api/auth/login"; Headers = $jsonHeader;
            Body = '{"email":"user5example.com","password":"abc321"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 1 - login"; Id = "TC_LG_03"; Name = "Valid email and valid password";
            Method = "POST"; Url = "{{auth_base}}/api/auth/login"; Headers = $jsonHeader;
            Body = '{"email":"{{valid_user_email}}","password":"{{valid_user_password}}"}'; ExpectedStatus = 200;
            StoreToken = $true
        },
        [ordered]@{
            Version = "v1"; Function = "Function 1 - login"; Id = "TC_LG_04"; Name = "Missing password";
            Method = "POST"; Url = "{{auth_base}}/api/auth/login"; Headers = $jsonHeader;
            Body = '{"email":"{{valid_user_email}}"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 1 - login"; Id = "TC_LG_05"; Name = "Wrong password";
            Method = "POST"; Url = "{{auth_base}}/api/auth/login"; Headers = $jsonHeader;
            Body = '{"email":"{{valid_user_email}}","password":"wrongpass"}'; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v1"; Function = "Function 1 - login"; Id = "TC_LG_06"; Name = "Empty password";
            Method = "POST"; Url = "{{auth_base}}/api/auth/login"; Headers = $jsonHeader;
            Body = '{"email":"{{valid_user_email}}","password":""}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_01"; Name = "Empty fullName";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"","email":"{{register_email_2}}","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_02"; Name = "fullName min boundary";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"A","email":"{{register_email_1}}","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 201
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_03"; Name = "fullName over max boundary";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX","email":"user+3@example.com","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_04"; Name = "Missing email";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"Test User","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_05"; Name = "Invalid email format";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"Test User","email":"userexample.com","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_06"; Name = "Email max boundary";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"Test User","email":"{{email_boundary_254}}","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 201
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_07"; Name = "Email over max boundary";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"Test User","email":"{{email_boundary_255}}","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v1"; Function = "Function 2 - register"; Id = "TC_RG_08"; Name = "Duplicate email";
            Method = "POST"; Url = "{{auth_base}}/api/auth/register"; Headers = $jsonHeader;
            Body = '{"fullName":"Test User","email":"{{duplicate_email}}","password":"Passw0rd!","role":"STUDENT"}'; ExpectedStatus = 409
        },
        [ordered]@{
            Version = "v1"; Function = "Function 3 - logout"; Id = "TC_LO_01"; Name = "Missing token";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v1"; Function = "Function 3 - logout"; Id = "TC_LO_02"; Name = "Malformed token";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{malformed_token}}" }); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v1"; Function = "Function 3 - logout"; Id = "TC_LO_03"; Name = "Expired token";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{expired_access_token}}" }); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v1"; Function = "Function 3 - logout"; Id = "TC_LO_04"; Name = "Valid token";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{access_token}}" }); Body = $null; ExpectedStatus = 200
        },
        [ordered]@{
            Version = "v2"; Function = "Function 4 - forgotPassword"; Id = "TC_FP_01"; Name = "Missing email query param";
            Method = "POST"; Url = "{{auth_base}}/api/auth/forgot-password"; Headers = @(); Body = $null; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v2"; Function = "Function 4 - forgotPassword"; Id = "TC_FP_02"; Name = "Invalid email format via query param";
            Method = "POST"; Url = "{{auth_base}}/api/auth/forgot-password?email=userexample.com"; Headers = @(); Body = $null; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v2"; Function = "Function 4 - forgotPassword"; Id = "TC_FP_03"; Name = "Email not found";
            Method = "POST"; Url = "{{auth_base}}/api/auth/forgot-password?email=notfound@example.com"; Headers = @(); Body = $null; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v2"; Function = "Function 4 - forgotPassword"; Id = "TC_FP_04"; Name = "Valid existing email";
            Method = "POST"; Url = "{{auth_base}}/api/auth/forgot-password?email={{valid_user_email}}"; Headers = @(); Body = $null; ExpectedStatus = 200
        },
        [ordered]@{
            Version = "v2"; Function = "Function 5 - changePassword"; Id = "TC_CP_01"; Name = "Missing oldPassword with valid JWT";
            Method = "POST"; Url = "{{auth_base}}/api/auth/change-password"; Headers = @(@{ key = "Content-Type"; value = "application/json" }, @{ key = "Authorization"; value = "Bearer {{access_token}}" });
            Body = '{"newPassword":"{{change_new_password}}","confirmPassword":"{{change_new_password}}"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v2"; Function = "Function 5 - changePassword"; Id = "TC_CP_02"; Name = "Wrong oldPassword with valid JWT";
            Method = "POST"; Url = "{{auth_base}}/api/auth/change-password"; Headers = @(@{ key = "Content-Type"; value = "application/json" }, @{ key = "Authorization"; value = "Bearer {{access_token}}" });
            Body = '{"oldPassword":"wrongOldPass","newPassword":"{{change_new_password}}","confirmPassword":"{{change_new_password}}"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v2"; Function = "Function 5 - changePassword"; Id = "TC_CP_03"; Name = "Missing newPassword with valid JWT";
            Method = "POST"; Url = "{{auth_base}}/api/auth/change-password"; Headers = @(@{ key = "Content-Type"; value = "application/json" }, @{ key = "Authorization"; value = "Bearer {{access_token}}" });
            Body = '{"oldPassword":"{{valid_user_password}}"}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v2"; Function = "Function 5 - changePassword"; Id = "TC_CP_04"; Name = "Empty newPassword with valid JWT";
            Method = "POST"; Url = "{{auth_base}}/api/auth/change-password"; Headers = @(@{ key = "Content-Type"; value = "application/json" }, @{ key = "Authorization"; value = "Bearer {{access_token}}" });
            Body = '{"oldPassword":"{{valid_user_password}}","newPassword":"","confirmPassword":""}'; ExpectedStatus = 400
        },
        [ordered]@{
            Version = "v2"; Function = "Function 5 - changePassword"; Id = "TC_CP_05"; Name = "Valid change password";
            Method = "POST"; Url = "{{auth_base}}/api/auth/change-password"; Headers = @(@{ key = "Content-Type"; value = "application/json" }, @{ key = "Authorization"; value = "Bearer {{access_token}}" });
            Body = '{"oldPassword":"{{valid_user_password}}","newPassword":"{{change_new_password}}","confirmPassword":"{{change_new_password}}"}'; ExpectedStatus = 200
        },
        [ordered]@{
            Version = "v3"; Function = "Function 6 - securityFilterChain"; Id = "TC_SFC_01"; Name = "Protected endpoint without token";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v3"; Function = "Function 6 - securityFilterChain"; Id = "TC_SFC_02"; Name = "Protected endpoint with invalid token";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{invalid_jwt_token}}" }); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v3"; Function = "Function 6 - securityFilterChain"; Id = "TC_SFC_03"; Name = "Protected endpoint with valid token";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{access_token}}" }); Body = $null; ExpectedStatus = 200
        },
        [ordered]@{
            Version = "v3"; Function = "Function 6 - securityFilterChain"; Id = "TC_SFC_04"; Name = "Public endpoint without auth";
            Method = "GET"; Url = "{{auth_base}}/api/auth/health"; Headers = @(); Body = $null; ExpectedStatus = 200
        },
        [ordered]@{
            Version = "v3"; Function = "Function 7 - doFilterInternal"; Id = "TC_DFI_01"; Name = "Missing Authorization header";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v3"; Function = "Function 7 - doFilterInternal"; Id = "TC_DFI_02"; Name = "Invalid Bearer prefix";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "{{invalid_prefix_value}}" }); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v3"; Function = "Function 7 - doFilterInternal"; Id = "TC_DFI_03"; Name = "Invalid JWT";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{invalid_jwt_token}}" }); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v3"; Function = "Function 7 - doFilterInternal"; Id = "TC_DFI_04"; Name = "Expired JWT";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{expired_access_token}}" }); Body = $null; ExpectedStatus = 401
        },
        [ordered]@{
            Version = "v3"; Function = "Function 7 - doFilterInternal"; Id = "TC_DFI_05"; Name = "Valid JWT";
            Method = "POST"; Url = "{{auth_base}}/api/auth/logout"; Headers = @(@{ key = "Authorization"; value = "Bearer {{access_token}}" }); Body = $null; ExpectedStatus = 200
        }
    )
}

function Get-SetupItems {
    param(
        [ValidateSet("v1", "v2", "v3")]
        [string]$Version
    )

    $jsonHeader = @(@{ key = "Content-Type"; value = "application/json" })

    switch ($Version) {
        "v2" {
            return @(
                [ordered]@{
                    Function = "Function 5 - changePassword"
                    Name = "SETUP - login valid token for F5"
                    Method = "POST"
                    Url = "{{auth_base}}/api/auth/login"
                    Headers = $jsonHeader
                    Body = '{"email":"{{valid_user_email}}","password":"{{valid_user_password}}"}'
                    ExpectedStatus = 200
                    StoreToken = $true
                }
            )
        }
        "v3" {
            return @(
                [ordered]@{
                    Function = "Function 6 - securityFilterChain"
                    BeforeId = "TC_SFC_03"
                    Name = "SETUP - fresh login token for TC_SFC_03"
                    Method = "POST"
                    Url = "{{auth_base}}/api/auth/login"
                    Headers = $jsonHeader
                    Body = '{"email":"{{valid_user_email}}","password":"{{valid_user_password}}"}'
                    ExpectedStatus = 200
                    StoreToken = $true
                },
                [ordered]@{
                    Function = "Function 7 - doFilterInternal"
                    BeforeId = "TC_DFI_05"
                    Name = "SETUP - fresh login token for TC_DFI_05"
                    Method = "POST"
                    Url = "{{auth_base}}/api/auth/login"
                    Headers = $jsonHeader
                    Body = '{"email":"{{valid_user_email}}","password":"{{valid_user_password}}"}'
                    ExpectedStatus = 200
                    StoreToken = $true
                }
            )
        }
        default {
            return @()
        }
    }
}

function New-PostmanEvent {
    param(
        [int]$ExpectedStatus,
        [string]$ItemName,
        [switch]$StoreToken
    )

    $scriptLines = @(
        "pm.test(""$ItemName returns $ExpectedStatus"", function () {",
        "    pm.response.to.have.status($ExpectedStatus);",
        "});"
    )

    if ($StoreToken) {
        $scriptLines += @(
            "",
            "if (pm.response.code === 200) {",
            "    const data = pm.response.json();",
            "    pm.expect(data.token).to.be.a(""string"").and.not.empty;",
            "    pm.collectionVariables.set(""access_token"", data.token);",
            "    pm.environment.set(""access_token"", data.token);",
            "    if (data.refreshToken) {",
            "        pm.collectionVariables.set(""refresh_token"", data.refreshToken);",
            "        pm.environment.set(""refresh_token"", data.refreshToken);",
            "    }",
            "}"
        )
    }

    return @(
        @{
            listen = "test"
            script = @{
                type = "text/javascript"
                exec = $scriptLines
            }
        }
    )
}

function New-RequestItem {
    param([hashtable]$Definition)

    $itemName = if ($Definition.Contains("Id")) { $Definition["Id"] } else { $Definition["Name"] }
    $displayName = if ($Definition.Contains("Id")) { "$($Definition["Id"]) - $($Definition["Name"])" } else { $Definition["Name"] }

    $request = [ordered]@{
        method = $Definition["Method"]
        header = $Definition["Headers"]
        url = $Definition["Url"]
    }

    if ($null -ne $Definition["Body"]) {
        $request.body = [ordered]@{
            mode = "raw"
            raw = $Definition["Body"]
            options = @{
                raw = @{
                    language = "json"
                }
            }
        }
    }

    return [ordered]@{
        name = $displayName
        request = $request
        event = New-PostmanEvent -ExpectedStatus $Definition["ExpectedStatus"] -ItemName $itemName -StoreToken:([bool]($Definition["StoreToken"]))
    }
}

function New-VersionFolder {
    param(
        [ValidateSet("v1", "v2", "v3")]
        [string]$Version,
        [array]$Cases,
        [array]$SetupItems
    )

    if ($null -eq $SetupItems) {
        $SetupItems = @()
    }

    $versionName = switch ($Version) {
        "v1" { "V1 - F1-F3" }
        "v2" { "V2 - F4-F5" }
        "v3" { "V3 - F6-F7" }
    }

    $functionNames = $Cases | ForEach-Object { $_["Function"] } | Select-Object -Unique
    $subFolders = @()

    foreach ($functionName in $functionNames) {
        $functionItems = @()
        $functionCases = $Cases | Where-Object { $_["Function"] -eq $functionName }
        $functionSetups = $SetupItems | Where-Object { $_["Function"] -eq $functionName }

        foreach ($case in $functionCases) {
            $matchingSetup = $functionSetups | Where-Object { $_.Contains("BeforeId") -and $_["BeforeId"] -eq $case["Id"] }
            foreach ($setup in $matchingSetup) {
                $functionItems += New-RequestItem -Definition $setup
            }

            $functionItems += New-RequestItem -Definition $case
        }

        $setupWithoutBefore = $functionSetups | Where-Object { -not $_.Contains("BeforeId") }
        if (@($setupWithoutBefore).Count -gt 0) {
            $prefixItems = @()
            foreach ($setup in $setupWithoutBefore) {
                $prefixItems += New-RequestItem -Definition $setup
            }
            $functionItems = $prefixItems + $functionItems
        }

        $subFolders += [ordered]@{
            name = $functionName
            item = $functionItems
        }
    }

    return [ordered]@{
        name = $versionName
        item = $subFolders
    }
}

function New-CollectionObject {
    param(
        [hashtable]$Context,
        [string[]]$CaseIds
    )

    $allCases = Get-TestCases -Context $Context
    if ($CaseIds -and @($CaseIds).Count -gt 0) {
        $filteredCases = $allCases | Where-Object { $CaseIds -contains $_["Id"] }
    }
    else {
        $filteredCases = $allCases | Where-Object { $_["Version"] -eq $Context.version }
    }

    if (-not $filteredCases -or @($filteredCases).Count -eq 0) {
        throw "No test cases matched for version $($Context.version)."
    }

    $setupItems = Get-SetupItems -Version $Context.version
    $folder = New-VersionFolder -Version $Context.version -Cases $filteredCases -SetupItems $setupItems

    return [ordered]@{
        info = [ordered]@{
            name = "Auth Service Versioned Tests"
            description = "Generated by Testing/scripts/auth-test-common.ps1 for $($Context.runLabel)"
            schema = "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        }
        item = @($folder)
        variable = @(
            @{ key = "auth_base"; value = $Context.authBase },
            @{ key = "valid_user_email"; value = $Context.validUserEmail },
            @{ key = "valid_user_password"; value = $Context.validUserPassword },
            @{ key = "duplicate_email"; value = $Context.duplicateEmail },
            @{ key = "register_email_1"; value = $Context.registerEmail1 },
            @{ key = "register_email_2"; value = $Context.registerEmail2 },
            @{ key = "register_email_3"; value = $Context.registerEmail3 },
            @{ key = "email_boundary_254"; value = $Context.emailBoundary254 },
            @{ key = "email_boundary_255"; value = $Context.emailBoundary255 },
            @{ key = "expired_access_token"; value = $Context.expiredAccessToken },
            @{ key = "malformed_token"; value = $Context.malformedToken },
            @{ key = "invalid_jwt_token"; value = $Context.invalidJwtToken },
            @{ key = "invalid_prefix_value"; value = $Context.invalidPrefixValue },
            @{ key = "change_new_password"; value = $Context.changeNewPassword },
            @{ key = "access_token"; value = "" },
            @{ key = "refresh_token"; value = "" }
        )
    }
}

function New-EnvironmentObject {
    param([hashtable]$Context)

    return [ordered]@{
        id = [guid]::NewGuid().ToString()
        name = "Auth Service Local - $($Context.runLabel)"
        values = @(
            @{ key = "auth_base"; value = $Context.authBase; enabled = $true },
            @{ key = "valid_user_email"; value = $Context.validUserEmail; enabled = $true },
            @{ key = "valid_user_password"; value = $Context.validUserPassword; enabled = $true },
            @{ key = "duplicate_email"; value = $Context.duplicateEmail; enabled = $true },
            @{ key = "register_email_1"; value = $Context.registerEmail1; enabled = $true },
            @{ key = "register_email_2"; value = $Context.registerEmail2; enabled = $true },
            @{ key = "register_email_3"; value = $Context.registerEmail3; enabled = $true },
            @{ key = "email_boundary_254"; value = $Context.emailBoundary254; enabled = $true },
            @{ key = "email_boundary_255"; value = $Context.emailBoundary255; enabled = $true },
            @{ key = "expired_access_token"; value = $Context.expiredAccessToken; enabled = $true },
            @{ key = "malformed_token"; value = $Context.malformedToken; enabled = $true },
            @{ key = "invalid_jwt_token"; value = $Context.invalidJwtToken; enabled = $true },
            @{ key = "invalid_prefix_value"; value = $Context.invalidPrefixValue; enabled = $true },
            @{ key = "change_new_password"; value = $Context.changeNewPassword; enabled = $true },
            @{ key = "access_token"; value = ""; enabled = $true },
            @{ key = "refresh_token"; value = ""; enabled = $true }
        )
    }
}

function Write-GeneratedAssets {
    param(
        [hashtable]$Context,
        [string[]]$CaseIds
    )

    New-Item -ItemType Directory -Path $Script:GeneratedRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $Context.reportRoot -Force | Out-Null

    $collection = New-CollectionObject -Context $Context -CaseIds $CaseIds
    $environment = New-EnvironmentObject -Context $Context

    $collectionPath = Join-Path $Script:GeneratedRoot "auth-service.$($Context.version).collection.json"
    $environmentPath = Join-Path $Script:GeneratedRoot "auth-service.$($Context.version).environment.json"
    $metadataPath = Join-Path $Context.reportRoot "run-metadata.json"

    $collection | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $collectionPath -Encoding UTF8
    $environment | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $environmentPath -Encoding UTF8

    [ordered]@{
        version = $Context.version
        mode = $Context.mode
        runLabel = $Context.runLabel
        branch = $Context.branch
        collectionPath = $collectionPath
        environmentPath = $environmentPath
        artifactRoot = $Context.reportRoot
        caseIds = $CaseIds
        generatedAt = (Get-Date).ToString("s")
    } | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $metadataPath -Encoding UTF8

    return @{
        CollectionPath = $collectionPath
        EnvironmentPath = $environmentPath
        MetadataPath = $metadataPath
    }
}

function Get-VariableState {
    param([hashtable]$Context)

    return [ordered]@{
        auth_base = $Context.authBase
        valid_user_email = $Context.validUserEmail
        valid_user_password = $Context.validUserPassword
        duplicate_email = $Context.duplicateEmail
        register_email_1 = $Context.registerEmail1
        register_email_2 = $Context.registerEmail2
        register_email_3 = $Context.registerEmail3
        email_boundary_254 = $Context.emailBoundary254
        email_boundary_255 = $Context.emailBoundary255
        expired_access_token = $Context.expiredAccessToken
        malformed_token = $Context.malformedToken
        invalid_jwt_token = $Context.invalidJwtToken
        invalid_prefix_value = $Context.invalidPrefixValue
        change_new_password = $Context.changeNewPassword
        access_token = ""
        refresh_token = ""
    }
}

function Resolve-TemplateString {
    param(
        [AllowNull()]
        [string]$Text,
        [hashtable]$Variables
    )

    if ($null -eq $Text) {
        return $null
    }

    $resolved = $Text
    foreach ($key in $Variables.Keys) {
        $resolved = $resolved.Replace("{{$key}}", [string]$Variables[$key])
    }

    return $resolved
}

function Get-VersionExecutionList {
    param(
        [hashtable]$Context,
        [string[]]$CaseIds
    )

    $allCases = Get-TestCases -Context $Context
    if ($CaseIds -and @($CaseIds).Count -gt 0) {
        $cases = $allCases | Where-Object { $CaseIds -contains $_["Id"] }
    }
    else {
        $cases = $allCases | Where-Object { $_["Version"] -eq $Context.version }
    }

    if (-not $cases -or @($cases).Count -eq 0) {
        throw "No test cases matched for version $($Context.version)."
    }

    $setupItems = Get-SetupItems -Version $Context.version
    $executionList = @()
    $functionNames = $cases | ForEach-Object { $_["Function"] } | Select-Object -Unique

    foreach ($functionName in $functionNames) {
        $functionCases = $cases | Where-Object { $_["Function"] -eq $functionName }
        $functionSetups = $setupItems | Where-Object { $_["Function"] -eq $functionName }

        $setupWithoutBefore = $functionSetups | Where-Object { -not $_.Contains("BeforeId") }
        foreach ($setup in $setupWithoutBefore) {
            $executionList += $setup
        }

        foreach ($case in $functionCases) {
            $matchingSetup = $functionSetups | Where-Object { $_.Contains("BeforeId") -and $_["BeforeId"] -eq $case["Id"] }
            foreach ($setup in $matchingSetup) {
                $executionList += $setup
            }

            $executionList += $case
        }
    }

    return $executionList
}

function Read-ErrorResponseBody {
    param($Response)

    try {
        $stream = $Response.GetResponseStream()
        if ($null -eq $stream) {
            return ""
        }

        $reader = [System.IO.StreamReader]::new($stream)
        try {
            return $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
            $stream.Dispose()
        }
    }
    catch {
        return ""
    }
}

function Invoke-RequestDefinition {
    param(
        [hashtable]$Definition,
        [hashtable]$Variables
    )

    $resolvedUrl = Resolve-TemplateString -Text $Definition["Url"] -Variables $Variables
    $resolvedBody = Resolve-TemplateString -Text $Definition["Body"] -Variables $Variables
    $headers = @{}
    foreach ($header in @($Definition["Headers"])) {
        $headers[[string]$header["key"]] = Resolve-TemplateString -Text ([string]$header["value"]) -Variables $Variables
    }

    $contentType = $null
    if ($headers.ContainsKey("Content-Type")) {
        $contentType = $headers["Content-Type"]
        $headers.Remove("Content-Type")
    }

    $params = @{
        Method = $Definition["Method"]
        Uri = $resolvedUrl
        TimeoutSec = 20
        UseBasicParsing = $true
    }

    if ($headers.Count -gt 0) {
        $params["Headers"] = $headers
    }
    if ($contentType) {
        $params["ContentType"] = $contentType
    }
    if ($null -ne $resolvedBody) {
        $params["Body"] = $resolvedBody
    }

    $statusCode = $null
    $responseBody = ""
    $errorMessage = $null

    try {
        $response = Invoke-WebRequest @params
        $statusCode = [int]$response.StatusCode
        $responseBody = [string]$response.Content
    }
    catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $responseBody = Read-ErrorResponseBody -Response $_.Exception.Response
        }
    }

    if ($Definition["StoreToken"] -and $statusCode -eq 200 -and $responseBody) {
        try {
            $json = $responseBody | ConvertFrom-Json
            if ($json.token) {
                $Variables["access_token"] = [string]$json.token
            }
            if ($json.refreshToken) {
                $Variables["refresh_token"] = [string]$json.refreshToken
            }
        }
        catch {
        }
    }

    return [ordered]@{
        function = $Definition["Function"]
        id = if ($Definition.Contains("Id")) { $Definition["Id"] } else { $Definition["Name"] }
        name = $Definition["Name"]
        isSetup = (-not $Definition.Contains("Id"))
        method = $Definition["Method"]
        url = $resolvedUrl
        expectedStatus = $Definition["ExpectedStatus"]
        actualStatus = $statusCode
        passed = ($statusCode -eq $Definition["ExpectedStatus"])
        errorMessage = $errorMessage
        responseBody = $responseBody
    }
}

function Write-NativeSummary {
    param(
        [hashtable]$Context,
        [array]$Results
    )

    $summaryPath = Join-Path $Context.reportRoot "summary.json"
    $summary = [ordered]@{
        version = $Context.version
        runLabel = $Context.runLabel
        totalRequests = @($Results).Count
        failedRequests = @($Results | Where-Object { -not $_["passed"] }).Count
        totalAssertions = @($Results).Count
        failedAssertions = @($Results | Where-Object { -not $_["passed"] }).Count
        startedAt = (Get-Date).ToString("s")
        completedAt = (Get-Date).ToString("s")
        runner = "native-powershell"
    }

    $summary | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $summaryPath -Encoding UTF8
}

function Invoke-NativeRun {
    param(
        [hashtable]$Context,
        [string[]]$CaseIds
    )

    $resultsPath = Join-Path $Context.reportRoot "native-results.json"
    $cliPath = Join-Path $Context.reportRoot "native-cli.txt"
    $variables = Get-VariableState -Context $Context
    $executionList = Get-VersionExecutionList -Context $Context -CaseIds $CaseIds
    $results = @()
    $cliLines = @()

    foreach ($definition in $executionList) {
        $result = Invoke-RequestDefinition -Definition $definition -Variables $variables
        $results += $result

        $label = if ($result["passed"]) { "PASS" } else { "FAIL" }
        $cliLine = "[{0}] {1} expected {2} actual {3} {4} {5}" -f `
            $label, `
            $result["id"], `
            $result["expectedStatus"], `
            $result["actualStatus"], `
            $result["method"], `
            $result["url"]

        $cliLines += $cliLine
        Write-Host $cliLine
    }

    $results | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $resultsPath -Encoding UTF8
    $cliLines | Set-Content -LiteralPath $cliPath -Encoding UTF8
    Write-NativeSummary -Context $Context -Results $results

    $exitCode = if (@($results | Where-Object { -not $_["passed"] }).Count -gt 0) { 1 } else { 0 }

    return @{
        ExitCode = $exitCode
        ReportPath = $resultsPath
        CliPath = $cliPath
        Runner = "native-powershell"
    }
}

function Get-NewmanInvoker {
    if (Get-Command "newman" -ErrorAction SilentlyContinue) {
        return @("newman")
    }

    if (Get-Command "npx.cmd" -ErrorAction SilentlyContinue) {
        return @("npx.cmd", "--yes", "newman")
    }

    throw "Newman is not installed and npx.cmd is not available in PATH."
}

function Test-NewmanAvailable {
    try {
        Get-NewmanInvoker | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Invoke-NewmanRun {
    param(
        [hashtable]$Context,
        [string]$CollectionPath,
        [string]$EnvironmentPath
    )

    $folderName = switch ($Context.version) {
        "v1" { "V1 - F1-F3" }
        "v2" { "V2 - F4-F5" }
        "v3" { "V3 - F6-F7" }
    }

    $reportPath = Join-Path $Context.reportRoot "newman-report.json"
    $cliPath = Join-Path $Context.reportRoot "newman-cli.txt"
    $invoker = Get-NewmanInvoker

    $arguments = @()
    if (@($invoker).Count -gt 1) {
        $arguments += $invoker[1..($invoker.Count - 1)]
    }

    $arguments += @(
        "run",
        $CollectionPath,
        "--environment", $EnvironmentPath,
        "--folder", $folderName,
        "--reporters", "cli,json",
        "--reporter-json-export", $reportPath
    )

    $previousNodeNoWarnings = $env:NODE_NO_WARNINGS
    $env:NODE_NO_WARNINGS = "1"
    try {
        $null = & $invoker[0] @arguments 2>&1 | Tee-Object -FilePath $cliPath
        $exitCode = $LASTEXITCODE
    }
    finally {
        if ($null -eq $previousNodeNoWarnings) {
            Remove-Item Env:NODE_NO_WARNINGS -ErrorAction SilentlyContinue
        }
        else {
            $env:NODE_NO_WARNINGS = $previousNodeNoWarnings
        }
    }

    return @{
        ExitCode = $exitCode
        ReportPath = $reportPath
        CliPath = $cliPath
        Runner = "newman"
    }
}

function Write-NewmanSummary {
    param(
        [hashtable]$Context,
        [string]$ReportPath
    )

    if (-not (Test-Path -LiteralPath $ReportPath)) {
        return
    }

    $report = Get-Content -Raw -LiteralPath $ReportPath -Encoding UTF8 | ConvertFrom-Json
    $summary = [ordered]@{
        version = $Context.version
        runLabel = $Context.runLabel
        totalRequests = $report.run.stats.requests.total
        failedRequests = @($report.run.failures).Count
        totalAssertions = $report.run.stats.assertions.total
        failedAssertions = $report.run.stats.assertions.failed
        startedAt = $report.run.timings.started
        completedAt = $report.run.timings.completed
    }

    $summaryPath = Join-Path $Context.reportRoot "summary.json"
    $summary | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $summaryPath -Encoding UTF8
}

function Restore-OriginalPasswordIfNeeded {
    param([hashtable]$Context)

    if ($Context.version -ne "v2") {
        return
    }

    $loginBody = @{ email = $Context.validUserEmail; password = $Context.changeNewPassword } | ConvertTo-Json -Compress
    try {
        $loginResponse = Invoke-RestMethod -Method Post -Uri "$($Context.authBase)/api/auth/login" -ContentType "application/json" -Body $loginBody -TimeoutSec 5
    }
    catch {
        return
    }

    if (-not $loginResponse.token) {
        return
    }

    $restoreBody = @{
        oldPassword = $Context.changeNewPassword
        newPassword = $Context.validUserPassword
        confirmPassword = $Context.validUserPassword
    } | ConvertTo-Json -Compress

    try {
        Invoke-RestMethod -Method Post -Uri "$($Context.authBase)/api/auth/change-password" -Headers @{ Authorization = "Bearer $($loginResponse.token)" } -ContentType "application/json" -Body $restoreBody -TimeoutSec 5 | Out-Null
    }
    catch {
        Write-Warning "Password restore attempt failed after V2 run. Please restore user5@example.com manually if needed."
    }
}

function Remove-GeneratedRegisterUsers {
    param([hashtable]$Context)

    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        return
    }

    $emails = @($Context.registerEmail1, $Context.registerEmail2, $Context.emailBoundary254)
    $quotedEmails = ($emails | ForEach-Object { "'$_'" }) -join ","
    $sql = "DELETE FROM users WHERE email IN ($quotedEmails);"

    try {
        & docker exec igcse_mysql mysql -uroot -proot auth_db -e $sql | Out-Null
    }
    catch {
        Write-Warning "Test-user cleanup failed. You may need to remove generated users manually."
    }
}

function Invoke-AuthVersionRunner {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("v1", "v2", "v3")]
        [string]$Version,

        [ValidateSet("regression", "fix", "retest")]
        [string]$Mode = $(if ($Version -eq "v1") { "regression" } else { "fix" }),

        [string[]]$CaseIds,
        [switch]$GenerateOnly,
        [switch]$SkipInfraCheck,
        [switch]$SkipDocCheck
    )

    $context = Get-RunContext -Version $Version -Mode $Mode
    $managedService = $null

    if (-not $SkipDocCheck) {
        Assert-CanonicalizedDocs
    }

    $generated = Write-GeneratedAssets -Context $context -CaseIds $CaseIds
    if ($GenerateOnly) {
        return [pscustomobject]@{
            Version = $Version
            Mode = $Mode
            RunLabel = $context.runLabel
            CollectionPath = $generated.CollectionPath
            EnvironmentPath = $generated.EnvironmentPath
            ArtifactRoot = $context.reportRoot
        }
    }

    try {
        if (-not $SkipInfraCheck) {
            Assert-InfraDependenciesReady
        }

        $managedService = Start-ManagedAuthService
        if (-not $managedService["Started"]) {
            Assert-AuthServiceReady
        }

        if (Test-NewmanAvailable) {
            $runResult = Invoke-NewmanRun -Context $context -CollectionPath $generated.CollectionPath -EnvironmentPath $generated.EnvironmentPath
            Write-NewmanSummary -Context $context -ReportPath $runResult["ReportPath"]
        }
        else {
            $runResult = Invoke-NativeRun -Context $context -CaseIds $CaseIds
        }

        if ($runResult["ExitCode"] -ne 0) {
            throw "Test runner reported failures for $($context.runLabel). See $($context.reportRoot)"
        }

        return [pscustomobject]@{
            Version = $Version
            Mode = $Mode
            RunLabel = $context.runLabel
            ArtifactRoot = $context.reportRoot
            ReportPath = $runResult["ReportPath"]
            CliPath = $runResult["CliPath"]
            Runner = $runResult["Runner"]
        }
    }
    finally {
        if ($Version -eq "v1") {
            Remove-GeneratedRegisterUsers -Context $context
        }
        elseif ($Version -eq "v2") {
            Restore-OriginalPasswordIfNeeded -Context $context
        }

        Stop-ManagedAuthService -RuntimeInfo $managedService
    }
}
