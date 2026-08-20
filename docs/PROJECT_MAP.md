# PROJECT_MAP — 파일/역할 지도

> 2026-08-20 개편 — **줄 번호 표를 폐지했습니다.** 작업 1건마다 무효화되어
> 실제로 `HANDOFF`(1456~3398) · `PROJECT_MAP`(1875~) · 실물이 서로 달랐습니다.
> 위치는 `<section id="rt-...">` · `id="fs-..."` 로 찾습니다 — grep 한 번이면 됩니다.

## 레포 루트
| 파일 | 역할 | Git |
|---|---|---|
| `index.html` | 통합 리포트 + 프로토타입. 탭 구성은 `docs/STATUS.md` | 추적 |
| `CLAUDE.md` | AI 작업 규칙 / 참조 진입점 | 추적 |
| `HANDOFF.md` | 새 세션 진입점 — **지금 할 일 · 진행 중 맥락만** | 추적 |
| `README.md` | 사람용 프로젝트 설명 | 추적 |
| `MIGRATION.md` | 문서 구조 재구성 범위와 이력 | 추적 |
| `tools/check.mjs` | **검증 자동화** — 정적 · DOM · 18조합 · `STATUS.md` 생성 | 추적 |
| `tools/tagcheck.mjs` | 태그 정합 (여는/닫는 태그 스택 대조) — `check.mjs` 가 import | 추적 |
| `check.cmd` | 검증 실행 진입점 (더블클릭 · `cd` 를 스크립트가 처리) | 추적 |
| `push.cmd` · `push.ps1` | 커밋 · push (`git add -A`) · push 후 원격과 대조 | 추적 |
| `package.json` | npm 스크립트 (`check` · `check:full` · `check:static`) · playwright devDependency | 추적 |
| `.gitattributes` · `.gitignore` | LF 정규화(`*.ps1`만 CRLF) / 임시 파일 · **`node_modules/`** 제외 | 추적 |
| `node_modules/` | playwright 설치분 | **제외** |
| `Storage/` | 구 버전 보관 (`HANDOFF.md` · `testcase.csv` · `testcase_paste.tsv`) | 추적 |
| `현재 기획 문서/` | 원본 화면설계서 PPTX (v27.6) | 제외(`*.pptx`) |
| `_to_delete/` | 삭제 대기 — 세션에서 직접 지울 수 없어 모아 둔 것 | **제외** |

## docs

**상태 · 진입**
| 문서 | 역할 |
|---|---|
| `STATUS.md` | **실측 현재 상태 — 자동 생성.** HEAD · 규모 · 확정 건수 · TC · 물량. 손으로 고치지 않습니다 |
| `PROJECT_CONTEXT.md` | 프로젝트 맥락 · 기술 구조 · 영역 체계 · PC 전제 · 브레이크포인트 |
| `ENVIRONMENT.md` | 작업 위치 · 실행 환경 · 접근 방식 |
| `PROJECT_STATE.md` | 작업별 **판단과 경위** (수치는 `STATUS.md`) |

**정의 · 판단**
| 문서 | 역할 |
|---|---|
| `REQUIREMENTS.md` | `C-nn` 전문 사본 · 명세 원칙 · 추적성 매트릭스 (원본은 `index.html`, 불일치 시 HTML 우선) |
| `DECISIONS.md` | 확정 위치 · 이월 · 해소 이력 |
| `TRACEABILITY.md` | 식별자 체계 · 코드 칩 수집 규칙 · 변경 영향 분석 절차 |
| `EVIDENCE.md` | 정량 근거 (Microsoft Clarity) |
| `ORIGIN_MO9_0301.md` | **원본 v27.6 slide 75~93 전문** + `origin-slides/` 이미지 19장. pptx 를 열지 않습니다 |
| `ORIGIN_GAP.md` | 원본 대조 결과와 설계 판단 |

**규약 · 검증**
| 문서 | 역할 |
|---|---|
| `RULES.md` | AI/개발 Guardrails + 사고 이력 + **코드 번호 불변(6절)** |
| `MARKUP.md` | `rt-spec` 프레임 마크업 규약 |
| `VALIDATION.md` | 검증 항목과 판정 기준 — 구현은 `tools/check.mjs` |

**진행 · 이력**
| 문서 | 역할 |
|---|---|
| `NEXT_ACTIONS.md` | 남은 일 우선순위 |
| `OPEN_QUESTIONS.md` | **외부 확인 대기** (법무 · 기획 · 피그마 원본) — 문의 창구 1장 |
| `CHANGELOG.md` | 변경 이력 (`Reason` · `Note` 포함) |
| `PROCESS_REVIEW.md` | 진행 과정 점검과 개선 제안 (2026-08-20) |
| `RESUME_C60.md` | `C-60` 작업 이력 — `C-62` 이관으로 **내용 대체됨**, 참고용 |
| `PROJECT_MAP.md` | 이 문서 |

## index.html 내부 지도

**탭** — `R_TABS` 배열이 노출 순서, `FS_TIP_TAB` 이 이름입니다. 현재 구성은 `STATUS.md`에 있고
`node tools/check.mjs` 의 `S3` 항목이 배열 · 라벨 · 섹션 존재의 정합을 판정합니다.

| section id | 역할 | 비고 |
|---|---|---|
| `rt-proto` | 프로토타입 | **엔진 리팩터링 금지** · 시나리오 시뮬레이터 |
| `rt-spec` | 화면설계 | **주 작업 대상** · A ~ **H** 프레임 · 부록 0~6 |
| `rt-func` | 기능정의 | **판정 전용** — 화면 · 개발 범위 / 판정 시퀀스 / 예외 / 판정 데이터 |
| `rt-req` | 요구사항 정의서 | **`C-nn` 전건 정의** · 8장 구성 |
| `rt-tc` | 테스트 케이스 | 참조 전용 · 수행 기록은 외부 시트 |
| `rt-log` | 변경 이력 | 이력 단일 출처 · 검색 + 더보기 |

> `rt-plan`(구 개선안)은 **제거**되었습니다. 그 내용은 `rt-req` 1 · 3 · 4 · 5 · 7장입니다.
> `C-nn` 정의 전문 사본은 `docs/REQUIREMENTS.md` 3절 — 불일치 시 `index.html`이 우선입니다.

### `rt-spec` 내부 앵커
```
문서정보   #fs-sub-info      0 문서 사용 안내 · PAGE INFORMATION #fs-info
화면설계   #fs-sub-design    #fs-index · #fs-full · #fs-a ~ #fs-h   ← 프레임 10개
부록       #fs-sub-appendix  0 도면 번호 표기 · 1 레이아웃 규격 · 2 상태 정의 ·
                            3 노출·운영 규칙 · 4 접근성 명세 · 5 데이터 매핑 · 6 팝업·분기 정의
```
`#fs-sub-design` 소속 프레임 수는 `check.mjs` 의 `D7` 이 판정합니다 —
닫힘 태그가 하나 어긋나면 프레임이 구성 밖으로 빠져 다른 구성에서도 보입니다(2026-08-19 G 프레임 실제 발생).

### CSS 블록
줄 번호 대신 주석 헤더로 찾습니다 — 예)
`/* ===== 05 화면설계 — 피그마 프레임 형식 ===== */` · `코드 칩 호버 상세` · `06 테스트 케이스` · `리포트 탭`.

### `rt-spec` 전용 JS
`fsLogRows` `fsLogNorm` `fsLogPaint` `fsLogFind` `fsLogMore` `fsLogHead`
`fsSyncSticky` `fsToolbarPassed` `fsPinToolbar` `fsSub` `fsCurTab` `fsSpy` `fsSpyQueue`
`fsTipInit` `fsTipBuild` `fsTipShow` `fsTipHide` `fsTipGoto` `fsTipBack` `fsTipCodes` `fsTipMark` `fsTipWrap`
`fsPopPaint` `fsCalign` (도면 생성 · 콜아웃 실측 정렬)

## 운영 원칙
`push.ps1`이 `git add -A`를 쓰므로, 작업 폴더에 남는 임시 파일은 전부 커밋 대상이 됩니다.
새 임시 산출물이 생기면 **먼저 `.gitignore`에 추가**하세요.
