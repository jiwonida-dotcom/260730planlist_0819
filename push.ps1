# 요금제 개편 리포트 — 커밋 & 배포
# 사용법 :  .\push.ps1                        (기본 메시지로 커밋 후 push)
#           .\push.ps1 "docs(04): 변경 내용"   (메시지 지정)
#
# 2026-08-20 개편 — 「push 가 됐는지 알 수 없다」는 문제를 없앴습니다.
#   · 성공 안내 URL 이 구 저장소(_3)를 가리켜, 새 저장소로 push 해도 옛 화면을 보게 됐습니다.
#   · push 전후로 로컬 HEAD 와 원격을 대조해 **실제로 올라갔는지**를 확인합니다.
#   · 커밋 실패(예: user.name 미설정)를 성공으로 보고하던 문제도 고쳤습니다.

param([string]$m = "")

Set-Location -LiteralPath $PSScriptRoot
$ErrorActionPreference = "Continue"

$repoUrl  = (git config --get remote.origin.url)
$pagesUrl = "https://jiwonida-dotcom.github.io/260730planlist_0819/"

Write-Host ""
Write-Host "원격 : $repoUrl" -ForegroundColor DarkGray

# ── 1) 잠금 · 임시 파일 정리 (마운트 제약으로 세션에서 삭제되지 않은 것들)
Get-ChildItem -Path .git -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like '*.lock' -or $_.Name -like 'tmp_obj_*' } |
    Remove-Item -Force -ErrorAction SilentlyContinue
if (Test-Path .git\_stale) { Remove-Item .git\_stale -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "[1/4] 잠금 파일 정리 완료" -ForegroundColor Cyan

# ── 2) 변경분이 있으면 커밋
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    if ([string]::IsNullOrWhiteSpace($m)) {
        Write-Host ""
        Write-Host "커밋 메시지가 없습니다." -ForegroundColor Yellow
        Write-Host "  형식 : docs(NN): / fix(NN): / feat(NN): + 변경 항목   (NN = 탭 번호)" -ForegroundColor DarkGray
        Write-Host '  예   : .\push.ps1 "docs(04): C-38 터치 타깃 서술 정리"' -ForegroundColor DarkGray
        $m = Read-Host "메시지 입력 (그냥 Enter = chore: 작업 내용 갱신)"
        if ([string]::IsNullOrWhiteSpace($m)) { $m = "chore: 작업 내용 갱신" }
    }
    git commit -m $m
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "커밋 실패 — 위 오류를 확인하세요. push 하지 않고 중단합니다." -ForegroundColor Red
        Write-Host "  자주 있는 원인 : user.name / user.email 미설정" -ForegroundColor DarkGray
        Write-Host '    git config --global user.name  "jiwon"' -ForegroundColor DarkGray
        Write-Host '    git config --global user.email "jiwonida@gmail.com"' -ForegroundColor DarkGray
        exit 1
    }
    Write-Host "[2/4] 커밋 완료 : $m" -ForegroundColor Cyan
} else {
    Write-Host "[2/4] 새 변경 없음 — 이미 커밋된 것만 전송합니다" -ForegroundColor DarkGray
}

# ── 3) push — 무엇을 올리는지 먼저 보여 준다
$local = (git rev-parse --short HEAD)
git fetch origin --quiet 2>$null
$ahead = (git rev-list --count origin/main..HEAD 2>$null)
if ([string]::IsNullOrWhiteSpace($ahead)) { $ahead = "?" }

if ($ahead -eq "0") {
    Write-Host "[3/4] 올릴 커밋이 없습니다 — 원격이 이미 로컬과 같습니다 ($local)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "배포 화면이 옛 내용으로 보인다면 push 문제가 아니라 캐시입니다 — URL 뒤에 ?v=2" -ForegroundColor Yellow
    Write-Host "  $pagesUrl" -ForegroundColor Green
    exit 0
}

Write-Host "[3/4] push ... (올릴 커밋 $ahead 건)" -ForegroundColor Cyan
git --no-pager log --oneline origin/main..HEAD
git push -u origin HEAD:main
$pushCode = $LASTEXITCODE

# ── 4) 실제로 올라갔는지 대조 — 성공 메시지를 믿지 않고 원격을 다시 읽는다
git fetch origin --quiet 2>$null
$remote = (git rev-parse --short origin/main 2>$null)

Write-Host ""
if ($pushCode -eq 0 -and $local -eq $remote) {
    Write-Host "[4/4] 확인 완료 — 로컬 $local = 원격 $remote" -ForegroundColor Green
    Write-Host ""
    Write-Host "배포 : $pagesUrl  (1~2분 후 반영 · 캐시면 ?v=2)" -ForegroundColor Green
    git --no-pager log --oneline -3
} else {
    Write-Host "[4/4] push 가 반영되지 않았습니다 — 로컬 $local / 원격 $remote" -ForegroundColor Red
    Write-Host ""
    Write-Host "위 오류 메시지를 그대로 Claude 에게 보여 주세요. 확인 순서 :" -ForegroundColor Yellow
    Write-Host "  1) 인증      git credential-manager 로그인 만료 · 토큰 권한" -ForegroundColor DarkGray
    Write-Host "  2) 원격 주소 git remote -v   → 260730planlist_0819 인지" -ForegroundColor DarkGray
    Write-Host "  3) 원격이 앞서 있으면  git pull --rebase  후 다시 push" -ForegroundColor DarkGray
    Write-Host "  4) 네트워크  회사 프록시 · VPN" -ForegroundColor DarkGray
    exit 1
}
