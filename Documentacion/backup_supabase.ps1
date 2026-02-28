# PressFit Supabase Backup Script
# Exports all table data to a timestamped migration JSON file
# Run from the project root: pwsh Documentacion/backup_supabase.ps1

$SUPABASE_URL = "https://suaxmalkquricsbwkczt.supabase.co"
$SERVICE_KEY  = "YOUR_SUPABASE_SERVICE_ROLE_KEY"

$headers = @{
    "apikey"       = $SERVICE_KEY
    "Authorization"= "Bearer $SERVICE_KEY"
    "Accept"       = "application/json"
    "User-Agent"   = "PressFit-Backup/1.0"
}

# Tables to export (in dependency order)
$tables = @(
    "usuarios",
    "ejercicios",
    "fotos_progreso",
    "notas_personales_ejercicios",
    "rutinas_semanales",
    "rutinas_diarias",
    "ejercicios_programados",
    "series"
)

$backup = @{
    metadata = @{
        backup_date  = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
        supabase_url = $SUPABASE_URL
        tables       = $tables
    }
    data = @{}
}

$totalRows = 0

foreach ($table in $tables) {
    Write-Host "  Fetching $table..." -NoNewline
    $allRows = @()
    $offset  = 0
    $limit   = 1000
    $more    = $true

    while ($more) {
        $url = "$SUPABASE_URL/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}&order=created_at.asc"
        try {
            $rows = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
            if ($rows -and $rows.Count -gt 0) {
                $allRows += $rows
                $offset  += $rows.Count
                $more     = ($rows.Count -eq $limit)
            } else {
                $more = $false
            }
        } catch {
            $errMsg = $_.ErrorDetails.Message
            Write-Host " ERROR: $errMsg" -ForegroundColor Red
            $backup.data[$table] = @{ error = $errMsg }
            $more = $false
            continue
        }
    }

    $backup.data[$table] = $allRows
    $count = $allRows.Count
    $totalRows += $count
    Write-Host " $count rows" -ForegroundColor Green
}

# Save to Documentacion folder with timestamp
$timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$outputPath = "Documentacion\backup_${timestamp}.json"

$backup | ConvertTo-Json -Depth 20 | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host ""
Write-Host "Backup complete!" -ForegroundColor Cyan
Write-Host "  Total rows : $totalRows"
Write-Host "  Output file: $outputPath"
Write-Host "  Size       : $([math]::Round((Get-Item $outputPath).Length / 1KB, 1)) KB"
