/* ===========================================================================
 * tagcheck.mjs — 태그 정합성 (docs/VALIDATION.md 2절 항목 5)
 *
 * 브라우저는 어긋난 태그를 자동 교정하므로 DOM 검사로는 잡히지 않습니다.
 * 2026-08-19 에 실제로 발생한 두 결함이 이 검사의 대상입니다.
 *   · F 영역 선택 상태의 여분 </div> → G 프레임이 fs-sub-design 밖으로 빠짐
 *   · SYS 행이 직전 명세 행 안에 중첩 → 좁은 폭에서 명세 붕괴
 *
 * 2026-08-20 — 종전에는 python3 + html.parser 로 검사했으나, Windows 에서
 * `python3` 이 스토어 스텁으로 잡혀 실행이 실패했습니다(exit 1). 런타임을
 * 하나로 줄이는 편이 안전하므로 Node 로 옮겼습니다.
 *
 * 단독 실행:  node tools/tagcheck.mjs index.html
 * =========================================================================== */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
/* 종료 태그가 선택적인 요소 — 생략을 오류로 보지 않는다 */
const OPTIONAL_END = new Set(['p', 'li', 'td', 'th', 'tr', 'tbody', 'thead',
  'tfoot', 'option', 'dt', 'dd']);
/* 내용이 원시 텍스트라 안쪽 '<' 를 태그로 세지 않는 요소 */
const RAW = new Set(['script', 'style', 'textarea']);

const NAME_START = /[A-Za-z]/;
const NAME_CHAR = /[A-Za-z0-9:._-]/;

export function checkTags(src) {
  const stack = [];        // { tag, line }
  const stray = [];
  const mismatch = [];
  let line = 1;
  let i = 0;
  const n = src.length;

  const advance = (to) => {                       // to 까지 소비하며 줄 수를 센다
    for (let k = i; k < to && k < n; k++) if (src[k] === '\n') line++;
    i = to < 0 ? n : to;
  };

  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;
    advance(lt);

    /* 주석 · 선언 · 처리 지시 */
    if (src.startsWith('<!--', i)) {
      const end = src.indexOf('-->', i + 4);
      advance(end < 0 ? n : end + 3);
      continue;
    }
    if (src.startsWith('<!', i) || src.startsWith('<?', i)) {
      const end = src.indexOf('>', i + 2);
      advance(end < 0 ? n : end + 1);
      continue;
    }

    /* 종료 태그 */
    if (src.startsWith('</', i)) {
      let j = i + 2;
      while (j < n && NAME_CHAR.test(src[j])) j++;
      const tag = src.slice(i + 2, j).toLowerCase();
      const gt = src.indexOf('>', j);
      const openLine = line;
      advance(gt < 0 ? n : gt + 1);
      if (!tag || VOID.has(tag)) continue;

      let found = -1;
      for (let k = stack.length - 1; k >= 0; k--) if (stack[k].tag === tag) { found = k; break; }
      if (found < 0) {
        stray.push({ tag, line: openLine });
        continue;
      }
      /* found 위에 남은 것들 — 종료 태그가 선택적이면 정상, 아니면 어긋남 */
      for (let k = found + 1; k < stack.length; k++) {
        if (!OPTIONAL_END.has(stack[k].tag)) {
          mismatch.push({ tag: stack[k].tag, openedAt: stack[k].line, closedBy: tag, closedAt: openLine });
        }
      }
      stack.length = found;
      continue;
    }

    /* 시작 태그가 아니면 '<' 를 그냥 텍스트로 넘긴다 */
    if (!NAME_START.test(src[i + 1] || '')) { advance(i + 1); continue; }

    let j = i + 1;
    while (j < n && NAME_CHAR.test(src[j])) j++;
    const tag = src.slice(i + 1, j).toLowerCase();
    const openLine = line;

    /* 속성 구간 — 인용부호 안의 '>' 를 태그 끝으로 오인하지 않는다 */
    let quote = null, selfClose = false, k = j;
    for (; k < n; k++) {
      const c = src[k];
      if (quote) { if (c === quote) quote = null; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === '>') break;
    }
    if (k > j && src[k - 1] === '/') selfClose = true;
    advance(k < n ? k + 1 : n);

    if (VOID.has(tag) || selfClose) continue;

    if (RAW.has(tag)) {                            // 닫는 태그까지 통째로 건너뛴다
      const close = src.toLowerCase().indexOf('</' + tag, i);
      if (close < 0) { advance(n); continue; }
      const gt = src.indexOf('>', close);
      advance(gt < 0 ? n : gt + 1);
      continue;
    }

    stack.push({ tag, line: openLine });
  }

  const unclosed = stack.filter(s => !OPTIONAL_END.has(s.tag))
    .map(s => ({ tag: s.tag, line: s.line }));

  return { stray, unclosed, mismatch, ok: !(stray.length || unclosed.length || mismatch.length) };
}

/* 단독 실행 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('node:fs');
  const file = process.argv[2] || 'index.html';
  const r = checkTags(readFileSync(file, 'utf8'));
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.ok ? 0 : 1);
}
