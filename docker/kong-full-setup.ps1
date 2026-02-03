# Kong Full Configuration Script for IGCSE Learning Hub
# Run this after Kong is started to configure all services and routes

$KONG_ADMIN_URL = "http://localhost:8001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KONG GATEWAY CONFIGURATION SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Wait for Kong Admin API
Write-Host "[1/4] Waiting for Kong Admin API..." -ForegroundColor Yellow
$retries = 30
for ($i = 1; $i -le $retries; $i++) {
    try {
        $null = Invoke-RestMethod -Uri $KONG_ADMIN_URL -Method Get -ErrorAction Stop
        Write-Host "Kong Admin API is ready!" -ForegroundColor Green
        break
    }
    catch {
        if ($i -eq $retries) {
            Write-Host "Kong Admin API not available after $retries retries!" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 2
    }
}

# Define all services and their routes
$services = @(
    @{
        name   = "auth-service"
        url    = "http://auth-service:8080"
        routes = @(
            @{ name = "auth-route"; paths = @("/api/auth", "/api/v1/auth") }
        )
    },
    @{
        name   = "user-service"
        url    = "http://user-service:8083"
        routes = @(
            @{ name = "user-route"; paths = @("/api/users", "/api/v1/users") },
            @{ name = "admin-users-route"; paths = @("/api/admin/users") }
        )
    },
    @{
        name   = "ai-service"
        url    = "http://ai-service:8082"
        routes = @(
            @{ name = "ai-route"; paths = @("/api/ai") }
        )
    },
    @{
        name   = "exam-service"
        url    = "http://exam-service:8085"
        routes = @(
            @{ name = "exam-route"; paths = @("/api/exams") }
        )
    },
    @{
        name   = "course-service"
        url    = "http://course-service:8079"
        routes = @(
            @{ name = "course-route"; paths = @("/api/courses", "/api/course") }
        )
    },
    @{
        name   = "communication-service"
        url    = "http://communication-service:8089"
        routes = @(
            @{ name = "communication-route"; paths = @("/api/notifications", "/api/communication") }
        )
    },
    @{
        name   = "payment-service"
        url    = "http://payment-service:8084"
        routes = @(
            @{ name = "payment-route"; paths = @("/api/payment", "/api/payments") },
            @{ name = "admin-statistics-route"; paths = @("/api/admin/statistics") }
        )
    }
)

# Create services and routes
Write-Host ""
Write-Host "[2/4] Creating Services and Routes..." -ForegroundColor Yellow

foreach ($service in $services) {
    Write-Host ""
    Write-Host "  Service: $($service.name)" -ForegroundColor Cyan
    
    # Check if service exists
    try {
        $existingService = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/$($service.name)" -Method Get -ErrorAction SilentlyContinue
        Write-Host "    Service already exists, updating..." -ForegroundColor Gray
        
        # Update service
        $serviceBody = @{
            url = $service.url
        } | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/$($service.name)" -Method Patch -Body $serviceBody -ContentType "application/json"
    }
    catch {
        # Create new service
        Write-Host "    Creating new service..." -ForegroundColor Gray
        $serviceBody = @{
            name = $service.name
            url  = $service.url
        } | ConvertTo-Json
        
        try {
            $null = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services" -Method Post -Body $serviceBody -ContentType "application/json"
            Write-Host "    Service created!" -ForegroundColor Green
        }
        catch {
            Write-Host "    Error creating service: $($_.Exception.Message)" -ForegroundColor Red
            continue
        }
    }
    
    # Create routes for this service
    foreach ($route in $service.routes) {
        Write-Host "    Route: $($route.name) -> $($route.paths -join ', ')" -ForegroundColor Gray
        
        # Delete existing route if exists
        try {
            $null = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/routes/$($route.name)" -Method Delete -ErrorAction SilentlyContinue
        }
        catch { }
        
        # Create route
        $routeBody = @{
            name          = $route.name
            paths         = $route.paths
            strip_path    = $false
            preserve_host = $false
        } | ConvertTo-Json
        
        try {
            $null = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services/$($service.name)/routes" -Method Post -Body $routeBody -ContentType "application/json"
            Write-Host "    Route created!" -ForegroundColor Green
        }
        catch {
            Write-Host "    Error creating route: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Configure CORS
Write-Host ""
Write-Host "[3/4] Configuring Global CORS Plugin..." -ForegroundColor Yellow

# Remove existing CORS plugins
try {
    $plugins = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/plugins" -Method Get
    $corsPlugins = $plugins.data | Where-Object { $_.name -eq "cors" }
    foreach ($plugin in $corsPlugins) {
        $null = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/plugins/$($plugin.id)" -Method Delete
    }
}
catch { }

# Add global CORS plugin
$corsConfig = @{
    name   = "cors"
    config = @{
        origins            = @("*")
        methods            = @("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD")
        headers            = @(
            "Accept", "Accept-Version", "Content-Length", "Content-Type",
            "Date", "Authorization", "X-Requested-With", "ngrok-skip-browser-warning",
            "Cache-Control", "X-CSRF-Token"
        )
        exposed_headers    = @("X-Auth-Token", "Authorization", "Content-Type")
        credentials        = $true
        max_age            = 3600
        preflight_continue = $false
    }
} | ConvertTo-Json -Depth 3

try {
    $null = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/plugins" -Method Post -Body $corsConfig -ContentType "application/json"
    Write-Host "CORS plugin configured!" -ForegroundColor Green
}
catch {
    Write-Host "Error configuring CORS: $($_.Exception.Message)" -ForegroundColor Red
}

# Verify configuration
Write-Host ""
Write-Host "[4/4] Verifying Configuration..." -ForegroundColor Yellow

$servicesResult = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/services" -Method Get
$routesResult = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/routes" -Method Get
$pluginsResult = Invoke-RestMethod -Uri "$KONG_ADMIN_URL/plugins" -Method Get

Write-Host "  Total Services: $($servicesResult.data.Count)" -ForegroundColor Gray
Write-Host "  Total Routes: $($routesResult.data.Count)" -ForegroundColor Gray
Write-Host "  Total Plugins: $($pluginsResult.data.Count)" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Kong Proxy: http://localhost:8000" -ForegroundColor Gray
Write-Host "Kong Admin: http://localhost:8001" -ForegroundColor Gray
Write-Host "Konga UI:   http://localhost:1337" -ForegroundColor Gray
