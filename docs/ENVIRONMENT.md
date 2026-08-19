# ENVIRONMENT — 작업 환경

> 2026-08-18 등록. 세션 시작 시 이 문서로 작업 위치를 확인합니다.

## 1. 작업 위치

| 구분 | 값 |
|---|---|
| 로컬 작업 폴더 | `C:\Users\Administrator\Desktop\요금제 개편` |
| 배포 URL (**현재 기준**) | https://jiwonida-dotcom.github.io/260730planlist_0819/ |
| 구 배포 URL | https://jiwonida-dotcom.github.io/260730planlist_3/ — 살아 있으나 최신 아님 |
| 로컬 git remote | `https://github.com/jiwonida-dotcom/260730planlist_3.git` ⚠ **`_0819`로 정정 필요** |
| 브랜치 | `main` |

### ⚠ remote 불일치 (미조치)
현재 기준 배포처는 `_0819`인데 로컬 `origin`은 `_3`을 가리킵니다.
이 상태로 `push.cmd`를 실행하면 **구 저장소로 push**됩니다. 정정 명령:

```
git remote set-url origin https://github.com/jiwonida-dotcom/260730planlist_0819.git
```

정정 후 `HANDOFF.md` 1절과 `docs/MIGRATION.md`의 URL 표기도 함께 갱신해야 합니다.

## 2. 폴더 구성 (실측 2026-08-18)

```
요금제 개편/
├ index.html                      609KB · 4,562줄  ← 주 산출물
├ CLAUDE.md · HANDOFF.md · README.md · MIGRATION.md
├ push.cmd / push.ps1             커밋 · push (git add -A)
├ .gitignore / .gitattributes
├ docs/                           지식 문서 15종 + origin-slides/
├ 현재 기획 문서/                  원본 화면설계서 PPTX (v27.6)
├ Storage/                        구 버전 보관
├ project_structure/              구 구조 잔재
└ _to_delete/                     삭제 대기 (Git 제외)
```

루트에도 화면설계서 PPTX 사본(`… - 복사본.pptx`, 9.8MB)이 있습니다.
`push.ps1`이 `git add -A`를 쓰므로 커밋 전 루트 위생을 확인합니다.

## 3. Git 상태 (2026-08-18 23:10 기준)

| 항목 | 값 |
|---|---|
| HEAD | `c9b8761` — `docs: 내용 갱신` (2026-08-17 15:55) |
| 미커밋 | `index.html` · `docs/CHANGELOG.md` · `docs/PROJECT_STATE.md` |

문서상 기준 커밋은 `f14d366`(index.html 558KB · 3,987줄)이나 **실물은 그보다 앞서 있습니다.**
작업 시작 시 `git log`로 실제 HEAD를 대조하세요.

## 4. 접근 방식

- 로컬 폴더는 세션에 연결되어 있어 직접 읽기 · 쓰기 가능합니다.
- 로컬 환경에는 **네트워크가 없습니다.** `git push` · 패키지 설치는 로컬에서 불가하며,
  push는 사용자가 `push.cmd`를 실행합니다.
- 파일 삭제 불가 — 삭제 대상은 `_to_delete/`로 이동합니다.
