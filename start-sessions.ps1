# start-sessions.ps1
# 각 worktree에서 Claude Code 세션을 새 창으로 실행한다.
# 사용법: 루트(appa_go)에서  powershell -ExecutionPolicy Bypass -File .\start-sessions.ps1
# (실행 정책 때문에 막히면 위처럼 -ExecutionPolicy Bypass 를 붙인다.)

$base = "C:\Users\user\Documents"

# 디렉토리 -> 담당 모듈 (CLAUDE.md §1 과 일치)
$sessions = [ordered]@{
  "appa_go-game"  = "game.js"
  "appa_go-ui"    = "ui.js"
  "appa_go-audio" = "audio.js"
  "appa_go-data"  = "data/ + assets/ + generate-*.mjs"
}

foreach ($dir in $sessions.Keys) {
  $path = Join-Path $base $dir
  if (-not (Test-Path $path)) {
    Write-Warning "worktree 없음: $path (git worktree add 먼저)"
    continue
  }
  $role = $sessions[$dir]
  # 새 PowerShell 창: 해당 worktree로 이동 → 안내 출력 → claude 실행
  $cmd = "Set-Location '$path'; Write-Host '=== 담당: $role  (브랜치: ' -NoNewline; git branch --show-current; Write-Host ') ==='; claude"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
  Write-Host "실행: $dir  ->  $role"
}

Write-Host ""
Write-Host "통합(integrator) 세션은 루트(appa_go, main 브랜치)에서 따로 운영하세요."
