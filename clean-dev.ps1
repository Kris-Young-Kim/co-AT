# 개발 서버 정리 스크립트
# 사용법: .\clean-dev.ps1

Write-Host "`n=== 개발 서버 정리 중... ===" -ForegroundColor Yellow

# 포트 3000을 사용하는 프로세스 확인 및 종료
$port3000 = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if ($port3000) {
    $processId = ($port3000 -split '\s+')[-1]
    if ($processId -match '^\d+$') {
        Write-Host "포트 3000을 사용하는 프로세스(PID: $processId) 종료 중..." -ForegroundColor Yellow
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# 모든 Node.js 프로세스 종료 (현재 PowerShell 제외)
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.Id -ne $PID}
if ($nodeProcesses) {
    Write-Host "Node.js 프로세스 종료 중..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Lock 파일 삭제
if (Test-Path ".next\dev\lock") {
    Remove-Item ".next\dev\lock" -Force -ErrorAction SilentlyContinue
    Write-Host "Lock 파일 삭제 완료" -ForegroundColor Green
} else {
    Write-Host "Lock 파일 없음" -ForegroundColor Gray
}

# 포트 확인
$stillInUse = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
if ($stillInUse) {
    Write-Host "`n⚠ 경고: 포트 3000이 여전히 사용 중입니다." -ForegroundColor Red
    Write-Host "수동으로 프로세스를 종료해주세요." -ForegroundColor Yellow
} else {
    Write-Host "`n✓ 정리 완료! 이제 'pnpm dev'를 실행하세요." -ForegroundColor Green
}

Write-Host "`n"
