# TRACEABILITY — 추적성 모델

## 목표
이 프로젝트를 향후 AI-native workflow로 확장하기 위한 연결 구조입니다.
현재는 문서와 HTML 내부 ID를 중심으로 추적합니다.

## 권장 관계
```text
Problem
  ↓
Evidence
  ↓
Decision
  ↓
Requirement
  ↓
Screen / Area
  ↓
Prototype / Component
  ↓
Test Case
  ↓
Validation
  ↓
Release
  ↓
Post-release Evidence
```

**Test Case 단계까지 실체가 있습니다** — 06 테스트 케이스 탭 106건이 각 케이스의 근거 열에 C-nn과 STEP을 달고 있습니다.

## 현재 사용 중인 식별자
| 종류 | 형식 | 범위 |
|---|---|---|
| Problem | `P-n` | P1 ~ P5 (전건 해소) |
| Confirmed requirement | `C-nn` | C-01 ~ C-59 |
| Open item | `O-nn` | O-17 ~ O-27 (O-18 이월 · O-27 범위 밖, 나머지 해소) |
| Screen / Area | `S-02_X` | S-02_A ~ S-02_G |
| Report section | `rt-*` | rt-spec / rt-proto / rt-func / rt-req / rt-plan / rt-tc |
| 프레임 앵커 | `fs-*` | fs-info / fs-log / fs-index / fs-full / fs-a ~ fs-g |
| Test case | `TC-*` | 기능 `TC-F-nn` 등, 총 106건 |
| 검증 시퀀스 | `STEP n` | STEP 1 ~ 14 (03 기능정의) |

## 코드 칩 — 문서 내 자동 추적
`C-nn` · `O-nn` 표기는 **코드 칩**으로 렌더되어, 커서를 올리면(키보드는 Tab 포커스) 정의가 뜨고 클릭하면(Enter) 정의가 있는 탭·구성으로 이동합니다. `fsTipBuild()`가 정의를 수집합니다.

따라서 **새 코드의 정의는 반드시 04 또는 05 탭의 `span.cid` 행**에 둬야 자동 수집됩니다. 다른 위치에 두면 칩이 죽습니다.

## 현재 알려진 추적성 결함
| 항목 | 상태 |
|---|---|
| ~~`C-26`~~ | **2026-08-17 해소** — E 영역 · 부록 2 · 부록 4 3곳에 칩 부착 |
| `C-41` | 정의 탭(04) 외 05에도 표기 |
| 참조 0건 | C-02 · C-05 · C-06 · C-44 — 배경·범위 서술 성격, 결함 아님 |

전체 매트릭스는 `docs/REQUIREMENTS.md` 4절에 있습니다.

## 변경 영향 분석 절차
예) `C-26` 변경 시

1. `docs/REQUIREMENTS.md` 4절에서 참조 위치 확인
2. 관련 S-02 영역 확인 (E 영역 카드 선택 상태)
3. 관련 Prototype 확인 (`.card` `.radio` 선택 상태)
4. 06 테스트 케이스 탭에서 근거 열에 `C-26`이 달린 케이스 확인
5. `docs/VALIDATION.md` 검증 재실행
6. `docs/CHANGELOG.md` · `HANDOFF.md` · 외부 수행 기록 시트 A~I열 갱신

## 다음 단계
현재 HTML을 즉시 JSON/DB로 전환하지 않습니다.
먼저 문서에서 위 관계를 안정적으로 유지한 뒤, **반복적으로 필요한 항목만** 구조화합니다.
