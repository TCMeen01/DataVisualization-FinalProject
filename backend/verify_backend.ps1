# Backend Verification Script
# Validates all backend endpoints return correct data

$ErrorActionPreference = "Stop"
$BASE_URL = "http://localhost:8000"
$PASSED = 0
$FAILED = 0
$TESTS = @()

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [scriptblock]$Validator
    )

    Write-Info "Testing: $Name"

    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction Stop
        $result = & $Validator $response

        if ($result) {
            Write-Success "$Name - PASS"
            $script:PASSED++
            $script:TESTS += @{Name=$Name; Status="PASS"}
        } else {
            Write-Failure "$Name - FAIL (validation failed)"
            $script:FAILED++
            $script:TESTS += @{Name=$Name; Status="FAIL"; Reason="Validation failed"}
        }
    } catch {
        Write-Failure "$Name - FAIL ($($_.Exception.Message))"
        $script:FAILED++
        $script:TESTS += @{Name=$Name; Status="FAIL"; Reason=$_.Exception.Message}
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Backend Verification Script" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Check CSV files exist
Write-Info "Checking prerequisites..."
$dataDir = Join-Path $PSScriptRoot "data"
$videosFile = Join-Path $dataDir "videos_processed.csv"
$channelsFile = Join-Path $dataDir "channels_processed.csv"

if (-not (Test-Path $videosFile)) {
    Write-Failure "CSV file not found: $videosFile"
    Write-Host "Please ensure videos_processed.csv is in backend/data/" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $channelsFile)) {
    Write-Failure "CSV file not found: $channelsFile"
    Write-Host "Please ensure channels_processed.csv is in backend/data/" -ForegroundColor Yellow
    exit 1
}

Write-Success "CSV files found"
Write-Host ""

# Test 1: Health endpoint
Test-Endpoint -Name "Health Endpoint" -Url "$BASE_URL/health" -Validator {
    param($response)
    return ($response.ok -eq $true)
}

# Test 2: Schema endpoint
Test-Endpoint -Name "Schema Endpoint" -Url "$BASE_URL/api/data/schema" -Validator {
    param($response)
    $videosValid = ($response.videos -ne $null) -and ($response.videos.columns.Count -eq 37)
    $channelsValid = ($response.channels -ne $null) -and ($response.channels.columns.Count -eq 25)
    return ($videosValid -and $channelsValid)
}

# Test 3: Overview endpoint
Test-Endpoint -Name "Overview Endpoint" -Url "$BASE_URL/api/data/overview" -Validator {
    param($response)
    $kpisValid = ($response.total_channels -eq 56) -and
                 ($response.total_videos -eq 30778) -and
                 ($response.total_views -gt 50000000000) -and
                 ($response.short_form_ratio -ge 0) -and
                 ($response.short_form_ratio -le 1)
    $chartsValid = ($response.chart_a1 -ne $null) -and
                   ($response.chart_a2 -ne $null) -and
                   ($response.chart_a3 -ne $null)
    return ($kpisValid -and $chartsValid)
}

# Test 4: Overview with category filter
Test-Endpoint -Name "Overview Category Filter" -Url "$BASE_URL/api/data/overview?category=Music" -Validator {
    param($response)
    return ($response.chart_a1 -ne $null) -and ($response.chart_a2 -ne $null) -and ($response.chart_a3 -ne $null)
}

# Test 5: Short-form endpoint
Test-Endpoint -Name "Short-form Endpoint" -Url "$BASE_URL/api/data/short-form?year_from=2020" -Validator {
    param($response)
    return ($response.chart_b1 -ne $null) -and ($response.chart_b2 -ne $null)
}

# Test 6: Channels endpoint
Test-Endpoint -Name "Channels Endpoint" -Url "$BASE_URL/api/data/channels?tier=Mega" -Validator {
    param($response)
    return ($response.chart_c1 -ne $null) -and ($response.chart_c2 -ne $null)
}

# Test 7: Anomaly endpoint
Test-Endpoint -Name "Anomaly Endpoint" -Url "$BASE_URL/api/data/anomaly?year_from=2024" -Validator {
    param($response)
    return ($response.chart_d1 -ne $null) -and ($response.chart_d2 -ne $null)
}

# Test 8: Interaction endpoint
Test-Endpoint -Name "Interaction Endpoint" -Url "$BASE_URL/api/data/interaction?categories=Gaming,Music" -Validator {
    param($response)
    return ($response.chart_e1 -ne $null) -and ($response.chart_e2 -ne $null)
}

# Test 9: Economy endpoint
Test-Endpoint -Name "Economy Endpoint" -Url "$BASE_URL/api/data/economy?year_from=2024-01" -Validator {
    param($response)
    return ($response.chart_f1 -ne $null) -and ($response.chart_f2 -ne $null)
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Summary" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

# Show individual test results
foreach ($test in $TESTS) {
    if ($test.Status -eq "PASS") {
        Write-Host "✓ $($test.Name)" -ForegroundColor Green
    } else {
        Write-Host "✗ $($test.Name)" -ForegroundColor Red
        if ($test.Reason) {
            Write-Host "  Reason: $($test.Reason)" -ForegroundColor DarkGray
        }
    }
}

Write-Host "`n----------------------------------------" -ForegroundColor Yellow
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red
Write-Host "Total:  $($PASSED + $FAILED)" -ForegroundColor White

if ($FAILED -eq 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n✗ Some tests failed. Check output above for details." -ForegroundColor Red
}
Write-Host ""

if ($FAILED -gt 0) {
    exit 1
}
