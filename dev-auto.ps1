# 자동 디버깅 및 재시작 스크립트
# 사용법: .\dev-auto.ps1
# 에러 발생 시 자동으로 정리하고 재시작합니다

$logPath = ".cursor\debug.log"
$sessionId = "debug-session-$(Get-Date -Format 'yyyyMMddHHmmss')"

function Write-DebugLog {
    param($hypothesisId, $location, $message, $data = @{})
    $logEntry = @{
        sessionId = $sessionId
        runId = "run1"
        hypothesisId = $hypothesisId
        location = $location
        message = $message
        data = $data
        timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    } | ConvertTo-Json -Compress
    Add-Content -Path $logPath -Value $logEntry -ErrorAction SilentlyContinue
}

Write-Host "`n=== 자동 개발 서버 시작 (에러 시 자동 재시작) ===" -ForegroundColor Cyan
Write-Host "종료하려면 Ctrl+C를 누르세요`n" -ForegroundColor Yellow

Write-DebugLog "ALL" "dev-auto.ps1:8" "Script started" @{sessionId=$sessionId}

function Clean-DevServer {
    Write-Host "[정리 중] 개발 서버 정리..." -ForegroundColor Yellow
    Write-DebugLog "A" "dev-auto.ps1:Clean-DevServer:entry" "Clean-DevServer called"
    
    # 포트 3000을 사용하는 프로세스 확인 및 종료
    $port3000 = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
    Write-DebugLog "A" "dev-auto.ps1:Clean-DevServer:before-port-check" "Before port 3000 check" @{port3000Found=($port3000 -ne $null)}
    
    if ($port3000) {
        $processId = ($port3000 -split '\s+')[-1]
        Write-DebugLog "A" "dev-auto.ps1:Clean-DevServer:port-found" "Port 3000 in use" @{processId=$processId}
        
        if ($processId -match '^\d+$') {
            Write-Host "[정리 중] 포트 3000 프로세스(PID: $processId) 종료..." -ForegroundColor Yellow
            Write-DebugLog "A" "dev-auto.ps1:Clean-DevServer:before-stop" "Before Stop-Process" @{processId=$processId}
            
            $processBefore = Get-Process -Id $processId -ErrorAction SilentlyContinue
            Write-DebugLog "A" "dev-auto.ps1:Clean-DevServer:process-before" "Process state before stop" @{exists=($processBefore -ne $null); id=$processId}
            
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            
            $processAfter = Get-Process -Id $processId -ErrorAction SilentlyContinue
            Write-DebugLog "A" "dev-auto.ps1:Clean-DevServer:process-after" "Process state after stop" @{exists=($processAfter -ne $null); id=$processId}
            
            $portAfter = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
            Write-DebugLog "D" "dev-auto.ps1:Clean-DevServer:port-after-stop" "Port 3000 state after stop" @{stillInUse=($portAfter -ne $null)}
        }
    }
    
    # 모든 Node.js 프로세스 종료 (현재 PowerShell 제외)
    $nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.Id -ne $PID}
    Write-DebugLog "C" "dev-auto.ps1:Clean-DevServer:node-processes" "Node.js processes found" @{count=$nodeProcesses.Count; ids=($nodeProcesses.Id -join ",")}
    
    if ($nodeProcesses) {
        Write-Host "[정리 중] Node.js 프로세스 종료..." -ForegroundColor Yellow
        $nodeIds = $nodeProcesses.Id
        Write-DebugLog "C" "dev-auto.ps1:Clean-DevServer:before-node-stop" "Before stopping Node processes" @{processIds=($nodeIds -join ",")}
        
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        
        $nodeProcessesAfter = Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.Id -ne $PID} -ErrorAction SilentlyContinue
        Write-DebugLog "C" "dev-auto.ps1:Clean-DevServer:after-node-stop" "Node processes after stop" @{remainingCount=$nodeProcessesAfter.Count; remainingIds=($nodeProcessesAfter.Id -join ",")}
    }
    
    # Lock 파일 삭제
    $lockExistsBefore = Test-Path ".next\dev\lock"
    Write-DebugLog "B" "dev-auto.ps1:Clean-DevServer:lock-before" "Lock file state before delete" @{exists=$lockExistsBefore}
    
    if ($lockExistsBefore) {
        Remove-Item ".next\dev\lock" -Force -ErrorAction SilentlyContinue
        Write-Host "[정리 완료] Lock 파일 삭제 완료" -ForegroundColor Green
        
        Start-Sleep -Milliseconds 500
        $lockExistsAfter = Test-Path ".next\dev\lock"
        Write-DebugLog "B" "dev-auto.ps1:Clean-DevServer:lock-after" "Lock file state after delete" @{exists=$lockExistsAfter}
    }
    
    Start-Sleep -Seconds 1
    Write-DebugLog "ALL" "dev-auto.ps1:Clean-DevServer:exit" "Clean-DevServer completed"
}

# 초기 정리
Clean-DevServer

# 재시작 카운터
$restartCount = 0
$maxRestarts = 10

while ($restartCount -lt $maxRestarts) {
    Write-Host "`n[시작 중] 개발 서버 시작... (재시작 횟수: $restartCount)" -ForegroundColor Cyan
    Write-DebugLog "E" "dev-auto.ps1:while-loop:start" "Starting pnpm dev" @{restartCount=$restartCount}
    
    # 시작 전 상태 확인
    $portBeforeStart = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
    $lockBeforeStart = Test-Path ".next\dev\lock"
    Write-DebugLog "ALL" "dev-auto.ps1:while-loop:before-start" "State before pnpm dev" @{portInUse=($portBeforeStart -ne $null); lockExists=$lockBeforeStart}
    
    try {
        # pnpm dev 실행 (PowerShell의 & 연산자 사용)
        Write-DebugLog "E" "dev-auto.ps1:while-loop:before-pnpm" "Before executing pnpm dev"
        Write-DebugLog "G" "dev-auto.ps1:while-loop:env-check" "Environment check" @{PATH=$env:PATH; PWD=(Get-Location).Path}
        
        # pnpm이 PATH에 있는지 확인
        Write-DebugLog "G" "dev-auto.ps1:while-loop:before-get-command" "Before Get-Command pnpm"
        $pnpmPath = $null
        try {
            $pnpmPath = Get-Command pnpm -ErrorAction Stop
            Write-DebugLog "G" "dev-auto.ps1:while-loop:pnpm-found" "pnpm command found" @{found=true; path=$pnpmPath.Source; commandType=$pnpmPath.CommandType}
        } catch {
            Write-DebugLog "G" "dev-auto.ps1:while-loop:pnpm-not-found" "pnpm command not found" @{error=$_.Exception.Message}
            throw "pnpm command not found in PATH: $($_.Exception.Message)"
        }
        
        # PowerShell의 & 연산자로 직접 실행 (동기적으로 실행됨)
        Write-DebugLog "E" "dev-auto.ps1:while-loop:executing-pnpm" "Executing pnpm dev with & operator" @{pnpmPath=$pnpmPath.Source}
        
        # $ErrorActionPreference를 확인
        Write-DebugLog "E" "dev-auto.ps1:while-loop:error-preference" "Error action preference" @{preference=$ErrorActionPreference}
        
        & pnpm dev
        
        # 정상 종료된 경우 (Ctrl+C로 종료된 경우)
        Write-Host "`n[종료] 서버가 정상 종료되었습니다." -ForegroundColor Green
        Write-DebugLog "ALL" "dev-auto.ps1:while-loop:normal-exit" "Normal exit"
        break
        
    } catch {
        Write-Host "`n[에러 발생] $($_.Exception.Message)" -ForegroundColor Red
        Write-DebugLog "E" "dev-auto.ps1:while-loop:error" "Error caught" @{error=$_.Exception.Message; restartCount=$restartCount}
        
        $restartCount++
        
        # 에러 발생 후 상태 확인
        $portAfterError = netstat -ano | Select-String ":3000" | Select-String "LISTENING"
        $lockAfterError = Test-Path ".next\dev\lock"
        Write-DebugLog "ALL" "dev-auto.ps1:while-loop:after-error" "State after error" @{portInUse=($portAfterError -ne $null); lockExists=$lockAfterError}
        
        if ($restartCount -ge $maxRestarts) {
            Write-Host "`n[중지] 최대 재시작 횟수($maxRestarts)에 도달했습니다." -ForegroundColor Red
            Write-DebugLog "ALL" "dev-auto.ps1:while-loop:max-restarts" "Max restarts reached"
            break
        }
        
        Write-Host "[자동 재시작] 3초 후 재시작합니다... ($restartCount/$maxRestarts)" -ForegroundColor Yellow
        Clean-DevServer
        Start-Sleep -Seconds 3
    }
}

Write-Host "`n[종료] 스크립트를 종료합니다." -ForegroundColor Gray
