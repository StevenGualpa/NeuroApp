# test_achievement_system.ps1
# Script para probar el sistema de verificación de logros

Write-Host "🧪 Probando sistema de verificación de logros..." -ForegroundColor Cyan

# URL del backend
$baseUrl = "https://facturago.onrender.com"

# Datos de prueba para una actividad completada
$gameData = @{
    user_id = 29  # ID del usuario de prueba
    activity_type = "completion"
    stars = 3
    is_perfect = $true
    completion_time = 25  # 25 segundos
    errors = 0
    used_help = $false
    showed_improvement = $true
    session_duration = 25
} | ConvertTo-Json

Write-Host "📊 Datos de la actividad:" -ForegroundColor Yellow
Write-Host $gameData

# Endpoint para evaluar logros
$evaluateUrl = "$baseUrl/achievement-evaluation/user/29/evaluate"

Write-Host "`n🚀 Enviando datos al backend..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri $evaluateUrl -Method POST -Body $gameData -ContentType "application/json"
    
    Write-Host "✅ Respuesta del backend:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success) {
        $newlyUnlocked = $response.data.newly_unlocked
        $totalPoints = $response.data.total_points
        
        Write-Host "`n🎉 Logros desbloqueados: $($newlyUnlocked.Count)" -ForegroundColor Magenta
        Write-Host "⭐ Puntos totales: $totalPoints" -ForegroundColor Yellow
        
        if ($newlyUnlocked.Count -gt 0) {
            Write-Host "`n🏆 Logros desbloqueados:" -ForegroundColor Cyan
            foreach ($achievement in $newlyUnlocked) {
                Write-Host "  - $($achievement.title) ($($achievement.icon))" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n🔍 Obteniendo logros del usuario..." -ForegroundColor Cyan

try {
    $achievementsUrl = "$baseUrl/achievement-evaluation/user/29/achievements"
    $achievementsResponse = Invoke-RestMethod -Uri $achievementsUrl -Method GET
    
    Write-Host "✅ Logros del usuario:" -ForegroundColor Green
    $achievementsResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error obteniendo logros: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 Obteniendo estadísticas..." -ForegroundColor Cyan

try {
    $statsUrl = "$baseUrl/achievement-evaluation/user/29/stats"
    $statsResponse = Invoke-RestMethod -Uri $statsUrl -Method GET
    
    Write-Host "✅ Estadísticas del usuario:" -ForegroundColor Green
    $statsResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error obteniendo estadísticas: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Prueba completada!" -ForegroundColor Green
