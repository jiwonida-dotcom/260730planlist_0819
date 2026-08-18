# MARKUP — `rt-spec` 프레임 마크업 규약

> 01 화면설계 탭(`<section id="rt-spec">`)의 코드를 수정할 때 반드시 따르는 구조 규약입니다.
> 금지사항은 `docs/RULES.md`를 함께 확인합니다.

## 1. 프레임 기본 구조

```html
<article class="fs-frame" id="fs-e">
  <div class="fs-fhead">                     영역명 + PAGE CODE
  <div class="fs-fbody"><div class="fs-fmain">
    <div class="fs-state sp">                상태 1개 = 화면(좌·sticky) | 조건+명세(우)
      <div class="fs-screen"><div class="fs-mock">…목업…</div></div>
      <div class="fs-cond">                  노출 조건
      <div class="fs-rows">
        <div class="fs-row"><div class="fs-no">01</div><div class="fs-dl">
          <div><dt>Component</dt><dd><p>…</p></dd></div>
    <div class="fs-state sp more">           2번째 이후 상태 (점선 구분)
  <div class="fs-fside">                     HISTORY 띠 (프레임 최하단)
```

### 명세 행 라벨 순서
`Component` · `Interaction` · `Action` · `Value` · `Memo`

## 2. 접이식 프레임
`<details class="fs-frame">` + `<summary class="fs-fhead">` 를 사용합니다.
JS 토글을 쓰지 않는 이유는 **키보드·스크린리더 기본 동작을 확보**하기 위함입니다.

현재 접이식은 3개입니다 — 변경 이력(`#fs-log`) · INDEX(`#fs-index`) · 전체 화면(`#fs-full`).
A~G 프레임은 현재 항상 펼침 상태입니다(`docs/NEXT_ACTIONS.md` 우선순위 4 참조).

## 3. 목업 클래스 재사용
목업은 **프로토타입 탭의 CSS 클래스를 그대로 재사용**합니다. 새 클래스를 만들지 않습니다.

| 그룹 | 클래스 |
|---|---|
| 카드 | `.card` `.card-main` `.badges` `.bdg` `.rank` `.radio` `.pname` `.prices` `.info` `.chips` `.benefit` `.cmpbox` |
| 컨트롤 | `.tabbar` `.ctrls` `.chip` `.filterbox` |
| 시트 | `.sheet` `.ctable` `.selbtn` |
| 하단 고정 | `.ph-sticky` `.sum` `.cta` |
| 상태 | `.empty` `.toast` |

## 4. 콜아웃 · 영역 마커

### 콜아웃 (빨간 번호)
```html
<b class="fs-cal">01</b>
```
- 부모 요소에 `style="position:relative"` 필요
- 변형: `.o` 좌측 바깥(-32px) · `.r` 우측 · `.r.o` 우측 바깥 · `.up` 중앙 상단
- **`<table>`의 직접 자식으로 넣지 않습니다.** HTML 파싱 규칙(foster parenting)으로 테이블 밖으로 밀려납니다. 래퍼 `div`를 씁니다.

### 영역 마커
```html
<b class="fs-am">A</b>
```
전체 화면 구성 도면에서 A~G 위치를 표시할 때 사용합니다.

## 5. 번호 정합 규칙
- **콜아웃 번호 ↔ 명세 행 번호는 1:1 대응**입니다.
- `SYS` 행(화면에 그려지는 요소가 없는 행)만 번호를 붙이지 않습니다.
- 행을 추가·삭제하면 **양쪽 번호를 함께 재정렬**합니다.

## 6. 클래스명 혼동 주의
| 클래스 | 역할 |
|---|---|
| `.fs-dim` | 흐린 텍스트 (인라인 span) |
| `.fs-veil` | 비교 시트 딤 (목업 내부 오버레이) |

과거 이름이 겹쳐 텍스트 span이 전면 오버레이로 변해 **페이지 전체가 어두워진 사고**가 있었습니다.

## 7. 코드 칩 (C-nn · O-nn)
본문에 `C-26`, `O-18` 형태로 쓴 코드는 **코드 칩**으로 렌더되어 호버(키보드는 Tab 포커스) 시 정의 툴팁이 뜨고, 클릭(Enter) 시 정의가 있는 탭·구성으로 이동합니다.

- 정의 수집은 `fsTipBuild()`가 담당합니다.
- **정의는 반드시 04 또는 05 탭의 `<span class="cid">C-nn</span>` 행**에 둬야 수집됩니다. 다른 위치에 두면 칩이 죽습니다.
- `WCAG 4.1.2`처럼 번호가 붙은 접근성 기준은 부록 4 접근성 명세의 해당 요건으로 연결됩니다.

## 8. 전용 JS 함수
| 그룹 | 함수 |
|---|---|
| 변경 이력 | `fsLogRows` `fsLogNorm` `fsLogPaint` `fsLogFind` `fsLogMore` `fsLogHead` |
| sticky · 구성 | `fsSyncSticky` `fsToolbarPassed` `fsPinToolbar` `fsSub` |
| 현재 영역 표시 | `fsCurTab` `fsSpy` `fsSpyQueue` |
| 코드 칩 | `fsTipInit` `fsTipBuild` `fsTipShow` `fsTipHide` `fsTipGoto` `fsTipBack` `fsTipCodes` |

이 함수들의 sticky 관련 동작은 `docs/RULES.md` 2절 6~7번, 코드 칩은 11번 제약을 따릅니다.
