# ============================================================
# Charge Platform — One-shot deploy script
# ============================================================
# Usage:  ./deploy.ps1
# Voorwaarden: vercel CLI globaal geïnstalleerd, vercel login al gedaan
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "==> Charge deployment starting..." -ForegroundColor Cyan
Write-Host ""

# 1. Sanity check — moet in juiste folder zitten
if (-not (Test-Path "./package.json")) {
    Write-Host "ERROR: package.json niet gevonden. Run dit script vanuit charge-website/" -ForegroundColor Red
    exit 1
}
$pkgName = (Get-Content "./package.json" | ConvertFrom-Json).name
Write-Host "Project: $pkgName" -ForegroundColor Gray

# 2. Git: commit alles wat nog open staat
Write-Host ""
Write-Host "==> Git status check..." -ForegroundColor Cyan
$dirty = (git status --porcelain) 2>&1
if ($dirty) {
    Write-Host "  Uncommitted changes detected. Committing..." -ForegroundColor Yellow
    git add .
    $msg = Read-Host "  Commit message (Enter voor default)"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = "Deploy update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    git commit -m $msg
} else {
    Write-Host "  Working tree clean." -ForegroundColor Green
}

# 3. Push naar GitHub (optioneel — Vercel kan direct uploaden ook)
Write-Host ""
$pushChoice = Read-Host "==> Push naar GitHub? (Y/n)"
if ($pushChoice -ne "n" -and $pushChoice -ne "N") {
    try {
        git push origin main
        Write-Host "  Pushed to origin/main." -ForegroundColor Green
    } catch {
        Write-Host "  Push faalde — controleer remote en credentials." -ForegroundColor Yellow
        Write-Host "  Doorgaan met Vercel deploy via lokale upload..." -ForegroundColor Yellow
    }
}

# 4. Check of vercel CLI aanwezig is
Write-Host ""
Write-Host "==> Vercel CLI check..." -ForegroundColor Cyan
$vercelExists = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelExists) {
    Write-Host "  vercel CLI niet gevonden. Installeren..." -ForegroundColor Yellow
    npm install -g vercel
}

# 5. Check of je ingelogd bent
$whoami = (vercel whoami 2>&1)
if ($whoami -match "Error") {
    Write-Host "  Niet ingelogd. Browser opent voor login..." -ForegroundColor Yellow
    vercel login
} else {
    Write-Host "  Logged in as: $whoami" -ForegroundColor Green
}

# 6. Link de folder indien nog niet gelinkt
if (-not (Test-Path "./.vercel/project.json")) {
    Write-Host ""
    Write-Host "==> Linking project..." -ForegroundColor Cyan
    vercel link
}

# 7. Vraag of env vars al zijn ingesteld
Write-Host ""
Write-Host "==> Environment variables check" -ForegroundColor Cyan
Write-Host "  Heb je deze al ingesteld in Vercel?" -ForegroundColor Gray
Write-Host "    - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor Gray
Write-Host "    - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "    - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host "    - ANTHROPIC_API_KEY" -ForegroundColor Gray
Write-Host "    - CRON_SECRET" -ForegroundColor Gray
Write-Host "    - NEXT_PUBLIC_SITE_URL" -ForegroundColor Gray
$envChoice = Read-Host "==> Alles ingesteld? (Y/n) — N opent prompts om ze nu in te voeren"
if ($envChoice -eq "n" -or $envChoice -eq "N") {
    Write-Host ""
    Write-Host "Voer env vars in (laat leeg om over te slaan):" -ForegroundColor Cyan
    $vars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "ANTHROPIC_API_KEY",
        "CRON_SECRET",
        "NEXT_PUBLIC_SITE_URL"
    )
    foreach ($v in $vars) {
        $val = Read-Host "  $v"
        if (-not [string]::IsNullOrWhiteSpace($val)) {
            $val | vercel env add $v production 2>&1 | Out-Null
            Write-Host "    ✓ $v set" -ForegroundColor Green
        }
    }
}

# 8. Deploy naar production
Write-Host ""
Write-Host "==> Deploying to production..." -ForegroundColor Cyan
$deployOutput = vercel --prod 2>&1
$deployOutput | Out-Host

# 9. Extract URL
$prodUrl = ($deployOutput | Select-String -Pattern "https://[a-z0-9-]+\.vercel\.app" | Select-Object -First 1).Matches.Value
if ($prodUrl) {
    Write-Host ""
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "✓ DEPLOYED" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "  URL: $prodUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Volgende stappen:" -ForegroundColor Cyan
    Write-Host "  1. Open $prodUrl in browser" -ForegroundColor Gray
    Write-Host "  2. Voeg deze URL toe aan Supabase → Auth → Redirect URLs" -ForegroundColor Gray
    Write-Host "  3. Test /login met de super_admin user uit Supabase Auth" -ForegroundColor Gray
}
