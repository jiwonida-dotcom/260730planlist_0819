# ENVIRONMENT — 작업 환경

> 세션 시작 시 이 문서로 작업 위치를 확인합니다.
> **실측 상태(HEAD · 파일 규모 · 물량)는 여기에 적지 않습니다** — `docs/STATUS.md`가 단일 출처입니다.
> 2026-08-20 갱신 — 종전 3절 「Git 상태」가 손으로 적힌 스냅샷이라 낡아 있었습니다.

## 1. 작업 위치

| 구분 | 값 |
|---|---|
| 로컬 작업 폴더 | `C:\Users\Administrator\Desktop\요금제 개편` |
| 배포 URL (**현재 기준**) | https://jiwonida-dotcom.github.io/260730planlist_0819/ |
| 구 배포 URL | https://jiwonida-dotcom.github.io/260730planlist_3/ — 살아 있으나 최신 아님 |
| git remote | `https://github.com/jiwonida-dotcom/260730planlist_0819.git` ✅ **2026-08-19 정정 완료** |
| 브랜치 | `main` |

## 2. 폴더 구성

```
요금제 개편/
├ index.html                      ← 주 산출물 (규모는 STATUS.md)
├ CLAUDE.md · HANDOFF.md · README.md · MIGRATION.md
├ tools/check.mjs · tools/tagcheck.py   검증 자동화
├ push.cmd / push.ps1             커밋 · push (git add -A)
├ .gitignore / .gitattributes
├ docs/                           지식 문서 + origin-slides/
├ 현재 기획 문서/                  원본 화면설계서 PPTX (v27.6) — .gitignore 제외
├ Storage/                        구 버전 보관
├ project_structure/              구 구조 잔재
└ _to_delete/                     삭제 대기 (Git 제외)
```

루트에도 화면설계서 PPTX 사본(`… - 복사본.pptx`)이 있습니다 — `*.pptx` 는 `.gitignore` 제외 대상입니다.
`push.ps1`이 `git add -A`를 쓰므로 커밋 전 루트 위생을 확인합니다.

## 3. Git 상태 확인

**손으로 적지 않습니다.** 아래 한 줄이 HEAD · 미커밋 여부를 `docs/STATUS.md`에 씁니다.

```
node tools/check.mjs --status
```

`CLAUDE.md` 0절이 이것을 세션 시작 절차로 지정하고 있습니다.

## 4. 실행 환경

| 도구 | 상태 |
|---|---|
| `node` | 사용 가능 |
| `python3` | 사용 가능 (`tools/tagcheck.py` 가 씀) |
| `git` | 사용 가능 (**커밋까지 가능 · push 불가** — 네트워크 없음) |
| `playwright` + Chromium | 클라우드 세션에서 사용 가능 (`/opt/pw-browsers/chromium`). 로컬에는 없을 수 있음 |

- 로컬 폴더는 세션에 연결되어 있어 직접 읽기 · 쓰기 가능합니다.
- **네트워크가 없습니다.** `git push` · 패키지 설치는 로컬에서 불가하며, push 는 사용자가 `push.cmd`를 실행합니다.
- **파일 삭제 불가** — 삭제 대상은 `_to_delete/`로 이동합니다.
- `playwright` 가 없는 환경에서는 `node tools/check.mjs --static` 이 정적 검사(파일 규모 · 태그 정합 · 탭 구성)만 수행하고,
  브라우저 검사를 건너뛴 사실을 출력합니다 — **조용히 통과하지 않습니다.**

## 5. 알려진 함정 — `.git/index.lock` 잔존

이 폴더는 네트워크/마운트 경유로 접근되므로 **git 이 잡은 잠금 파일이 남는 일이 있습니다.**
`git status` 조차 인덱스를 갱신하며 `.git/index.lock` 을 잡는데, 해제에 실패하면
이후 `git add` 가 `File exists` 로 막힙니다 (2026-08-20 실제 발생).

- `push.ps1` 이 실행 전 잠금 파일을 정리하는 이유가 이것입니다.
- `tools/check.mjs` 는 `git --no-optional-locks status` 를 써서 잠금을 아예 잡지 않습니다.
- 이미 남은 잠금은 삭제가 불가한 환경에서는 `_to_delete/` 로 옮겨 치웁니다.
