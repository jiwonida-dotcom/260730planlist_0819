# 요금제 개편 리포트 — 커밋 & 배포
# 사용법 :  .\push.ps1              (기본 메시지로 커밋 후 push)
#           .\push.ps1 "docs(05): 변경 내용"

param([string]$m = "docs: 내용 갱신")

Set-Location -LiteralPath $PSScriptRoot

# 1) Cowork 세션이 남긴 잠금 · 임시 파일 정리 (마운트 제약으로 삭제되지 않은 것들)
Get-ChildItem -Path .git -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like '*.lock' -or $_.Name -like 'tmp_obj_*' } |
    Remove-Item -Force -ErrorAction SilentlyContinue
if (Test-Path .git\_stale) { Remove-Item .git\_stale -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "[1/3] 잠금 파일 정리 완료" -ForegroundColor Cyan

# 2) 변경분이 있으면 커밋
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m $m
    Write-Host "[2/3] 커밋 완료 : $m" -ForegroundColor Cyan
} else {
    Write-Host "[2/3] 새 변경 없음 — 기존 커밋만 전송" -ForegroundColor DarkGray
}

# 3) push
Write-Host "[3/3] push ..." -ForegroundColor Cyan
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "완료 — https://jiwonida-dotcom.github.io/260730planlist_3/ (1~2분 후 반영)" -ForegroundColor Green
    git --no-pager log --oneline -3
} else {
    Write-Host "push 실패 — 위 오류 메시지를 Claude에게 알려주세요" -ForegroundColor Red
}
