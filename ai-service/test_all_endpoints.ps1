# Test All AI Service Endpoints
# ============================================

$baseUrl = "http://localhost:8082/api/ai"

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   AI SERVICE - COMPLETE ENDPOINT TESTING               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{"Content-Type" = "application/json"}
    )
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "TEST: $Name" -ForegroundColor Green
    Write-Host "Method: $Method | Endpoint: $Endpoint" -ForegroundColor Gray
    
    try {
        $url = "$baseUrl$Endpoint"
        
        if ($Method -eq "GET") {
            $response = curl -s -X GET $url
        } elseif ($Method -eq "POST") {
            if ($Body) {
                $bodyJson = $Body | ConvertTo-Json
                $response = curl -s -X POST $url -H "Content-Type: application/json" -d $bodyJson
            } else {
                $response = curl -s -X POST $url
            }
        }
        
        Write-Host "Status: ✅ Response received" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host $response
    } catch {
        Write-Host "Status: ❌ Error" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# ============================================
# GROUP 1: HEALTH & STATUS
# ============================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║ GROUP 1: HEALTH & STATUS                              ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Name "1.1 Health Check" -Method "GET" -Endpoint "/health"

# ============================================
# GROUP 2: GRADING
# ============================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║ GROUP 2: GRADING (Chấm Điểm)                          ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Name "2.1 Mark Exam (English)" -Method "POST" -Endpoint "/mark-exam/125252?language=en"
Test-Endpoint -Name "2.2 Mark Exam (Vietnamese)" -Method "POST" -Endpoint "/mark-exam/125252?language=vi"
Test-Endpoint -Name "2.3 Mark Exam (Auto)" -Method "POST" -Endpoint "/mark-exam/125252?language=auto"

Write-Host "⏳ Waiting for exam to be graded..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Test-Endpoint -Name "2.4 Get Result Summary" -Method "GET" -Endpoint "/result/125252"
Test-Endpoint -Name "2.5 Get Result Details" -Method "GET" -Endpoint "/result/125252/details"

# ============================================
# GROUP 3: BATCH PROCESSING
# ============================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║ GROUP 3: BATCH PROCESSING (Chấm Hàng Loạt)           ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

$batchBody = @{
    attemptIds = @(125252, 125253, 125254)
    language = "en"
}

Test-Endpoint -Name "3.1 Create Batch Job" -Method "POST" -Endpoint "/batch/mark-exams" -Body $batchBody

Write-Host "⏳ Waiting for batch to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Test-Endpoint -Name "3.2 Get Batch Status" -Method "GET" -Endpoint "/batch/status/batch_1735340800000"

# ============================================
# GROUP 4: STATISTICS
# ============================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║ GROUP 4: STATISTICS (Thống Kê)                        ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Name "4.1 Student Statistics" -Method "GET" -Endpoint "/statistics/student/1"
Test-Endpoint -Name "4.2 Class Statistics" -Method "GET" -Endpoint "/statistics/class/1"
Test-Endpoint -Name "4.3 System Statistics" -Method "GET" -Endpoint "/statistics/system"

# ============================================
# GROUP 5: INSIGHTS
# ============================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║ GROUP 5: INSIGHTS (Phân Tích Sâu)                     ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Name "5.1 Student Insights" -Method "GET" -Endpoint "/insights/student/1"

# ============================================
# GROUP 6: RECOMMENDATIONS
# ============================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║ GROUP 6: RECOMMENDATIONS (Gợi Ý Học Tập)             ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Name "6.1 Learning Recommendations" -Method "GET" -Endpoint "/recommendations/1"

# ============================================
# GROUP 7: REPORTS
# ============================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║ GROUP 7: REPORTS (Xuất Báo Cáo)                       ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

Write-Host "Note: Report exports return binary files" -ForegroundColor Yellow
Write-Host "Testing if endpoints exist (without downloading files)..." -ForegroundColor Gray
Write-Host ""

# Test endpoint existence without downloading
try {
    $statusCode = curl -s -o /dev/null -w "%{http_code}" "http://localhost:8082/api/ai/reports/student/1/export?format=pdf"
    Write-Host "7.1 Export Student Report (PDF): HTTP $statusCode" -ForegroundColor Green
} catch {
    Write-Host "7.1 Export Student Report (PDF): Error" -ForegroundColor Red
}

try {
    $statusCode = curl -s -o /dev/null -w "%{http_code}" "http://localhost:8082/api/ai/reports/class/1/export?format=pdf"
    Write-Host "7.2 Export Class Report (PDF): HTTP $statusCode" -ForegroundColor Green
} catch {
    Write-Host "7.2 Export Class Report (PDF): Error" -ForegroundColor Red
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   ✅ TESTING COMPLETE!                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

