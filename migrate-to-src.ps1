# Migration script to rename frontend/ to src/
# Run this script in PowerShell from the project root

Write-Host "Migrating frontend/ to src/..." -ForegroundColor Yellow

if (Test-Path "src") {
    Write-Host "ERROR: src/ directory already exists!" -ForegroundColor Red
    Write-Host "Please remove or rename the existing src/ directory first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: frontend/ directory not found!" -ForegroundColor Red
    exit 1
}

try {
    # Use robocopy to copy files (more reliable than Move-Item)
    Write-Host "Copying files..." -ForegroundColor Cyan
    robocopy frontend src /E /MOVE /NFL /NDL /NJH /NJS
    
    if ($LASTEXITCODE -le 1) {
        Write-Host "Successfully migrated frontend/ to src/" -ForegroundColor Green
        Write-Host "You can now delete the frontend/ directory if it still exists." -ForegroundColor Yellow
    } else {
        Write-Host "Migration completed with warnings. Exit code: $LASTEXITCODE" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Migration failed - $_" -ForegroundColor Red
    exit 1
}

Write-Host "Migration complete!" -ForegroundColor Green

