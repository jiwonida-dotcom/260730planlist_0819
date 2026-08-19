# PROJECT_MAP — 파일/역할 지도

## 레포 루트
| 파일 | 역할 | Git |
|---|---|---|
| `index.html` | 통합 리포트 + 프로토타입 (6개 탭) | 추적 |
| `CLAUDE.md` | AI 작업 규칙 / 참조 진입점 | 추적 |
| `HANDOFF.md` | 새 AI 세션에서 가장 먼저 읽는 현재 상태 | 추적 |
| `README.md` | 사람용 프로젝트 설명 | 추적 |
| `MIGRATION.md` | 문서 구조 재구성 범위와 이력 | 추적 |
| `push.cmd` | 커밋 · push 실행 진입점 | 추적 |
| `push.ps1` | 실제 커밋 · push 로직 | 추적 |
| `.gitattributes` | LF 정규화 (`*.ps1`만 CRLF) | 추적 |
| `.gitignore` | 임시 파일 · zip · `_to_delete/` 제외 | 추적 |
| `Storage/` | 구 버전 보관 (`HANDOFF.md` · `testcase.csv` · `testcase_paste.tsv`) | 추적 |
| `_to_delete/` | 삭제 대기 — 세션에서 직접 지울 수 없어 모아 둔 것 | **제외** |

## docs
| 문서 | 역할 |
|---|---|
| `PROJECT_CONTEXT.md` | 프로젝트 맥락 · 기술 구조 · 영역 체계 · PC 전제 · 브레이크포인트 |
| `PROJECT_STATE.md` | 기준 커밋 · 물량 · 최근 진행 · 미처리 |
| `DECISIONS.md` | 확정(C-nn) 위치 · 이월(O-18) · 해소 이력 |
| `REQUIREMENTS.md` | **C-01~C-59 전문(59건)** · 명세 원칙 · 추적성 매트릭스 · 표기 교정 현황 |
| `EVIDENCE.md` | 정량 근거 |
| `RULES.md` | AI/개발 Guardrails + 사고 이력 |
| `MARKUP.md` | `rt-spec` 프레임 마크업 규약 |
| `VALIDATION.md` | 6폭 × 3구성 검증 매트릭스 |
| `CHANGELOG.md` | 변경 이력 |
| `NEXT_ACTIONS.md` | 다음 작업 우선순위 |
| `ORIGIN_GAP.md` | **원본 화면설계서(v27.6) 대비 누락 정의** — 제안 C-48~C-58 · O-21~O-25 |
| `TRACEABILITY.md` | 추적성 모델 |
| `PROJECT_MAP.md` | 이 문서 |

## index.html 내부 지도
| section id | 탭 | 시작 줄 | 비고 |
|---|---|---:|---|
| `rt-proto` | 02 프로토타입 | 882 | 엔진 리팩터링 금지 |
| `rt-plan` | 05 개선안 | 931 | C-nn 53건 정의 |
| `rt-func` | 03 기능정의 | — | **판정 전용** — 화면·개발 범위 / 판정 시퀀스 / 예외 / 판정 데이터. 요소 명세·개선 근거는 두지 않고 참조만 (2026-08-19 재구성) |
| `rt-req` | 04 요구사항 정의서 | 1298 | C-28·32·36·41·42·43 정의 (6건) |
| `rt-tc` | 06 테스트 케이스 | 1406 | 106건, 참조 전용 |
| `rt-spec` | 01 화면설계 | 1456 | **주 작업 대상** · 파일 끝(3398)까지 |

> C-nn **정의 전문은 `docs/REQUIREMENTS.md` 3절에 사본**이 있습니다. 불일치 시 `index.html`이 우선입니다.

### CSS 블록 (줄 번호)
| 시작 | 블록 |
|---:|---|
| 32 | 상단 |
| 50 | 레이아웃 |
| 69 | 기기 프레임 |
| 141 | 화면 요소 |
| 182 | 카드 |
| 335 | 시뮬레이터 |
| 360 | 포커스 표시 (WCAG 2.4.7) |
| 374 | 리포트 크롬 (`r-` 접두어) |
| **486** | **05 화면설계 — 피그마 프레임 형식** |
| **576** | **코드 칩 호버 상세 (C-nn · O-nn)** |
| 591 | 06 테스트 케이스 |
| 3011 | 리포트 탭 |

### `rt-spec` 전용 JS
`fsLogRows` `fsLogNorm` `fsLogPaint` `fsLogFind` `fsLogMore` `fsLogHead`
`fsSyncSticky` `fsToolbarPassed` `fsPinToolbar` `fsSub` `fsCurTab` `fsSpy` `fsSpyQueue`
`fsTipInit` `fsTipBuild` `fsTipShow` `fsTipHide` `fsTipGoto` `fsTipBack` `fsTipCodes`

## 운영 원칙
`push.ps1`이 `git add -A`를 쓰므로, 작업 폴더에 남는 임시 파일은 전부 커밋 대상이 됩니다.
새 임시 산출물이 생기면 **먼저 `.gitignore`에 추가**하세요.
