@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem  index.html 검증 — push.cmd 와 같은 방식으로 더블클릭 실행용
rem    check.cmd              인자 없으면 --status (STATUS.md 갱신)
rem    check.cmd --full       레이아웃 18조합까지 (playwright 필요)
rem    check.cmd --static     브라우저 없이 정적 검사만

where node >nul 2>nul
if errorlevel 1 (
  echo node 를 찾을 수 없습니다. Node.js 설치 후 다시 실행하세요.
  echo.
  pause
  exit /b 1
)

set ARGS=%*
if "%~1"=="" set ARGS=--status

node "%~dp0tools\check.mjs" %ARGS%
echo.
pause
