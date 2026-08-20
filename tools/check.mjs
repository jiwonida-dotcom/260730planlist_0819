#!/usr/bin/env node
/* ===========================================================================
 * check.mjs — index.html 검증 자동화
 *
 * docs/VALIDATION.md 2절의 판정 기준을 코드로 옮긴 것입니다.
 * 사람이 브라우저에서 눈으로 확인하고 결과를 손으로 전사하던 작업을 대체합니다.
 *
 *   node tools/check.mjs              정적 + DOM 검사 (1회 로드)
 *   node tools/check.mjs --full       + 18조합(6폭 × 3구성) 레이아웃 검사
 *   node tools/check.mjs --status     docs/STATUS.md 갱신 (실측값 단일 출처)
 *   node tools/check.mjs --record     VALIDATION.md 5절 기록 블록 출력
 *   node tools/check.mjs --static     브라우저 없이 정적 검사만
 *
 * 의존 — Node 만 있으면 정적 검사가 돕니다. --full 의 레이아웃 검사에만 playwright 가 필요합니다.
 *
 * 설계 원칙 — 판정 로직을 다시 쓰지 않는다.
 *   정의 수집은 페이지의 fsTipBuild(), 도면 생성은 fsPopPaint() 를 그대로 호출해
 *   검사와 구현이 갈라지지 않게 합니다. (H 프레임이 프로토타입 렌더 함수를
 *   재사용하는 것과 같은 이유입니다)
 *
 * 종료 코드 — 0 전건 PASS / 1 FAIL 있음 / 2 실행 실패
 * =========================================================================== */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { checkTags } from './tagcheck.mjs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const FILE = path.join(ROOT, 'index.html');

const argv = process.argv.slice(2);
const FULL = argv.includes('--full');
const STATIC_ONLY = argv.includes('--static');
const WRITE_STATUS = argv.includes('--status');
const RECORD = argv.includes('--record');

const WIDTHS = [1400, 1280, 1180, 1000, 768, 420];
const SUBS = ['info', 'design', 'appendix'];
const NARROW = [360, 420, 560, 640];

/* ---------------------------------------------------------------- 결과 수집 */
const results = [];
const facts = {};
const add = (id, name, ok, detail) =>
  results.push({ id, name, ok, detail: detail === undefined ? '' : String(detail) });
const info = (id, name, detail) => results.push({ id, name, ok: null, detail: String(detail) });

/* ---------------------------------------------------------------- 정적 검사 */
function staticChecks() {
  const src = readFileSync(FILE, 'utf8');
  const bytes = statSync(FILE).size;
  const lines = src.split('\n').length - (src.endsWith('\n') ? 1 : 0);
  facts.bytes = bytes;
  facts.kb = Math.round(bytes / 1024);
  facts.lines = lines;
  info('S1', '파일 규모', `${facts.kb}KB · ${lines.toLocaleString()}줄`);

  /* 태그 정합 — 브라우저는 어긋난 태그를 자동 교정하므로 따로 본다.
     2026-08-20: python3 + html.parser 에서 Node 구현으로 이관 —
     Windows 에서 python3 이 스토어 스텁으로 잡혀 실행이 실패했다. 런타임은 하나로 둔다 */
  const t = checkTags(src);
  const bad = [...t.stray, ...t.unclosed, ...t.mismatch];
  add('S2', '태그 정합', bad.length === 0,
    bad.length === 0 ? '0건' : `${bad.length}건 — 첫 건 ${JSON.stringify(bad[0])}`);

  /* 탭 구성 — R_TABS 와 FS_TIP_TAB 라벨, 섹션 존재가 어긋나면 이동·툴팁이 깨진다 */
  const mTabs = src.match(/var\s+R_TABS\s*=\s*\[([^\]]+)\]/);
  const mLabel = src.match(/var\s+FS_TIP_TAB\s*=\s*\{([^}]+)\}/);
  if (mTabs) {
    const tabs = mTabs[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
    facts.tabs = tabs;
    const labels = {};
    if (mLabel) {
      for (const kv of mLabel[1].split(',')) {
        const m = kv.match(/\s*(\w+)\s*:\s*'([^']*)'/);
        if (m) labels[m[1]] = m[2];
      }
    }
    facts.tabLabels = tabs.map(t => labels[t] || `(라벨 없음: ${t})`);
    const missSection = tabs.filter(t => !src.includes(`<section id="rt-${t}"`));
    const missLabel = tabs.filter(t => !labels[t]);
    const extraLabel = Object.keys(labels).filter(k => !tabs.includes(k));
    const bad = [...missSection.map(t => `섹션 없음 ${t}`),
                 ...missLabel.map(t => `라벨 없음 ${t}`),
                 ...extraLabel.map(t => `잔재 라벨 ${t}`)];
    add('S3', `탭 구성 ${tabs.length}개`, bad.length === 0,
      bad.length ? bad.join(' · ') : facts.tabLabels.join(' / '));
  } else {
    add('S3', '탭 구성', false, 'R_TABS 를 찾지 못함');
  }
}

/* ---------------------------------------------------------------- 페이지 감사 */
/* 이 함수는 브라우저 안에서 실행됩니다 (page.evaluate) */
function pageAudit() {
  const q = s => Array.from(document.querySelectorAll(s));
  const txt = e => (e && e.textContent || '').trim();
  const o = {};

  /* id 중복 — 부록 4처럼 런타임 id 생성이 있는 표에서 실제로 발생한 적 있음 */
  const seen = Object.create(null), dup = [];
  q('[id]').forEach(el => {
    if (seen[el.id]) { if (!dup.includes(el.id)) dup.push(el.id); } else seen[el.id] = 1;
  });
  o.dupIds = dup;

  /* 행 중첩 — 값 칸 안에 행이 통째로 들어가면 좁은 폭에서 명세가 무너진다 */
  o.rowNest = q('.fs-row .fs-row').length;

  /* 물량 */
  o.vol = {
    frame: q('.fs-frame').length,
    state: q('.fs-state').length,
    row: q('.fs-row').length,
    sys: q('.fs-row > .fs-no.sys').length,
    cal: q('.fs-cal').length,
    am: q('.fs-am').length,
    details: q('#rt-spec details').length,
  };
  o.vol.rowNum = o.vol.row - o.vol.sys;

  /* 콜아웃 ↔ 명세 행 1:1 (SYS 행 제외) — 상태 블록 단위 */
  o.calMismatch = [];
  q('.fs-state').forEach(st => {
    const cals = Array.from(st.querySelectorAll('.fs-cal')).map(txt);
    const nos = Array.from(st.querySelectorAll('.fs-row > .fs-no'))
      .map(txt).filter(t => !/SYS/i.test(t));
    if (!cals.length && !nos.length) return;
    const frame = st.closest('.fs-frame');
    const where = (frame ? frame.id : '?') + ' / ' + txt(st.querySelector('.fs-sname,.fs-shead,h4,h3')).slice(0, 20);
    if (cals.length !== nos.length) {
      o.calMismatch.push({ where, cal: cals.length, row: nos.length, reason: '건수' });
      return;
    }
    for (let i = 0; i < cals.length; i++) {
      if (cals[i] !== nos[i]) {
        o.calMismatch.push({ where, at: i + 1, cal: cals[i], row: nos[i], reason: '순서' });
        break;
      }
    }
  });

  /* 배지 — 규격 23×23 · 렌더 실패(자식을 둘 수 없는 요소에 붙으면 폭 0) */
  o.calBadSize = [];
  o.calUnrendered = 0;
  q('.fs-cal').forEach(c => {
    const r = c.getBoundingClientRect();
    if (r.width <= 5) { o.calUnrendered++; return; }
    if (Math.abs(r.width - 23) > 1.5 || Math.abs(r.height - 23) > 1.5) {
      o.calBadSize.push([txt(c), +r.width.toFixed(1), +r.height.toFixed(1)]);
    }
  });

  /* 구성 소속 — 닫힘 태그가 어긋나면 프레임이 구성 밖으로 빠져 다른 구성에서도 보인다 */
  const design = document.getElementById('fs-sub-design');
  o.designChildren = design
    ? Array.from(design.children).filter(e => /ARTICLE|DETAILS/.test(e.tagName)).map(e => e.id)
    : null;

  /* H 프레임 도면 — 프로토타입 렌더 함수 결과이므로 프로토타입이 깨지면 도면도 빈다 */
  const hosts = q('#rt-spec .fs-mock[data-pop]');
  o.popHosts = hosts.length;
  o.popEmpty = hosts.filter(h => h.childElementCount === 0).map(h => h.getAttribute('data-pop'));
  o.popCalMissing = [];
  if (typeof FS_POP === 'object' && FS_POP) {
    hosts.forEach(h => {
      const key = h.getAttribute('data-pop');
      const want = (FS_POP[key] && FS_POP[key].cal || []).length;
      const got = h.querySelectorAll('.fs-cal').length;
      if (want !== got) o.popCalMissing.push({ pop: key, 정의: want, 배치: got });
    });
  }
  o.hStates = document.getElementById('fs-h')
    ? document.querySelectorAll('#fs-h .fs-state').length : null;

  /* 정의 — 페이지의 수집 함수를 그대로 쓴다 */
  const map = (typeof fsTipBuild === 'function') ? fsTipBuild() : (window.FS_TIP_MAP || {});
  const codes = Object.keys(map);
  const cNums = codes.filter(c => /^C-\d+$/.test(c)).map(c => +c.slice(2)).sort((a, b) => a - b);
  o.defC = cNums.length;
  o.defCMax = cNums.length ? cNums[cNums.length - 1] : 0;
  o.gaps = [];
  for (let i = 1; i <= o.defCMax; i++) if (!cNums.includes(i)) o.gaps.push('C-' + String(i).padStart(2, '0'));

  /* 중복 정의 — fsTipBuild 는 첫 건만 담으므로 원시 셀을 따로 센다 */
  const cnt = Object.create(null);
  q('td.id > span.cid').forEach(sp => {
    const c = txt(sp);
    if (!/^[A-Z]+-\d+$/.test(c)) return;
    cnt[c] = (cnt[c] || 0) + 1;
  });
  o.defDup = Object.keys(cnt).filter(k => cnt[k] > 1).map(k => `${k}×${cnt[k]}`);
  o.defAll = codes.length;

  /* 죽은 칩 — 코드 표기인데 정의가 없는 것 */
  const dead = [];
  q('span.cid').forEach(c => {
    if (c.parentNode && c.parentNode.className === 'id') return;
    (txt(c).match(/[A-Z]+-\d+/g) || []).forEach(code => {
      if (!map[code] && !dead.includes(code)) dead.push(code);
    });
  });
  o.deadChips = dead;

  /* 테스트 케이스 집계 */
  const tc = q('#rt-tc td.id').map(txt).filter(t => /^TC-/.test(t));
  o.tcTotal = tc.length;
  o.tcByKind = {};
  tc.forEach(t => {
    const k = t.split('-')[1];
    o.tcByKind[k] = (o.tcByKind[k] || 0) + 1;
  });
  o.tcDup = (() => {
    const c = Object.create(null), d = [];
    tc.forEach(t => { c[t] = (c[t] || 0) + 1; });
    Object.keys(c).forEach(k => { if (c[k] > 1) d.push(k); });
    return d;
  })();

  return o;
}

/* 변경 이력 — 헤더 집계가 실제 행과 맞는지 (rt-log 탭 활성 상태에서) */
function logAudit() {
  /* fsLogHead() 와 같은 셀렉터를 쓴다 — 다른 기준으로 세면 검사가 구현과 갈라진다 */
  const rows = document.querySelectorAll('.fs-logtbl tbody tr').length;
  const cnt = (document.getElementById('fs-log-cnt') || {}).textContent || '';
  const hint = (document.getElementById('fs-log-hint') || {}).textContent || '';
  const m = cnt.match(/(\d+)\s*건/);
  return { rows, headCount: m ? +m[1] : null, hint: hint.trim() };
}

/* 프로토타입 불변량 — 카드 선택 전후 크기 · 44px 터치 타깃 */
function protoAudit() {
  const out = { ok: true };
  const card = document.querySelector('#scr .card, .card');
  if (!card) { out.skip = '카드를 찾지 못함'; return out; }
  const before = card.getBoundingClientRect();
  out.before = [+before.width.toFixed(2), +before.height.toFixed(2)];
  const btn = card.querySelector('button, .radio, [role=radio]');
  if (btn) { btn.click(); }
  const card2 = document.querySelector('#scr .card, .card');
  const after = card2.getBoundingClientRect();
  out.after = [+after.width.toFixed(2), +after.height.toFixed(2)];
  out.invariant = Math.abs(before.width - after.width) < 0.5 && Math.abs(before.height - after.height) < 0.5;

  /* 44px 미만 컨트롤 — 히트 영역을 ::after 로 확보한 것은 제외할 수 없으므로
     시각 크기가 44 미만이면서 ::after 가 없는 것만 센다 */
  const small = [];
  Array.from(document.querySelectorAll('#scr button, #scr a[href], #scr input, #scr [role=radio]'))
    .forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const af = getComputedStyle(el, '::after');
      const hasHit = af && af.content !== 'none' && parseFloat(af.height || '0') >= 44;
      if (!hasHit && (r.height < 43.5)) {
        small.push([(el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 18), +r.height.toFixed(1)]);
      }
    });
  out.small = small;
  return out;
}

/* 레이아웃 — 폭 × 구성 조합 */
function layoutAudit() {
  const q = s => Array.from(document.querySelectorAll(s));
  const vw = innerWidth, vh = innerHeight;
  const out = { clip: [], overlay: [], narrow: [] };

  /* 잘림 — 가로 스크롤로 도달 가능한 조상은 제외 */
  q('.fs-cal, .fs-am').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 1) return;
    let p = el.parentElement;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p);
      if (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        if (p.scrollWidth <= p.clientWidth + 1) {
          const pr = p.getBoundingClientRect();
          if (r.left < pr.left - 1 || r.right > pr.right + 1) {
            out.clip.push([(el.textContent || '').trim().slice(0, 8), p.className.slice(0, 24)]);
            break;
          }
        }
      }
      p = p.parentElement;
    }
  });

  /* 예상 밖 오버레이 — 뷰포트 35% 이상을 덮는 것 */
  q('body *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < vw * vh * 0.35) return;
    if (el.closest('.fs-mock') || el.classList.contains('fs-veil')) return;  /* 목업 내부 딤은 정상 */
    out.overlay.push([el.className.slice(0, 30), Math.round(r.width) + '×' + Math.round(r.height)]);
  });

  /* 좁은 폭 값 칸 — 한 글자씩 줄바꿈되지 않을 것 */
  let min = Infinity, minWhere = '';
  q('.fs-row .fs-dl dd').forEach(el => {
    const w = el.getBoundingClientRect().width;
    if (w > 1 && w < min) { min = w; minWhere = (el.textContent || '').trim().slice(0, 14); }
  });
  out.valMin = min === Infinity ? null : +min.toFixed(1);
  out.valMinWhere = minWhere;
  return out;
}

/* ---------------------------------------------------------------- 실행 */
async function run() {
  staticChecks();

  if (STATIC_ONLY) return finish();

  let chromium;
  try {
    chromium = require('playwright').chromium;
  } catch {
    try { chromium = require('playwright-core').chromium; } catch { /* noop */ }
  }
  if (!chromium) {
    info('B0', '브라우저 검사',
      'playwright 없음 — 정적 검사만 수행. 설치: npm i -D playwright && npx playwright install chromium (docs/ENVIRONMENT.md 4절)');
    return finish();
  }

  /* 브라우저 확보 — 환경마다 다른 경로를 순서대로 시도한다.
     내려받은 Chromium 이 없어도 Windows 에 항상 있는 Edge 로 돌 수 있게 둔다 */
  const attempts = [];
  if (process.env.PW_CHROMIUM) attempts.push(['PW_CHROMIUM', { executablePath: process.env.PW_CHROMIUM }]);
  const linuxPath = '/opt/pw-browsers/chromium/chrome-linux/chrome';
  if (existsSync(linuxPath)) attempts.push(['/opt/pw-browsers', { executablePath: linuxPath }]);
  attempts.push(['playwright 내려받은 Chromium', {}]);
  attempts.push(['Edge (channel msedge)', { channel: 'msedge' }]);
  attempts.push(['Chrome (channel chrome)', { channel: 'chrome' }]);

  let browser = null, via = '', tried = [];
  for (const [label, opts] of attempts) {
    try { browser = await chromium.launch(opts); via = label; break; }
    catch (e) { tried.push(`${label} → ${String(e).split('\n')[0].slice(0, 90)}`); }
  }
  if (!browser) {
    add('B1', '브라우저 실행', false,
      '실행 가능한 브라우저를 찾지 못했습니다 — ' + tried.join(' | '));
    return finish();
  }
  info('B1', '브라우저', via);

  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });

  await page.goto('file://' + FILE, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.evaluate(() => { showTab('spec'); fsSub('design'); });
  await page.waitForTimeout(700);

  const a = await page.evaluate(pageAudit);
  facts.audit = a;

  add('D1', 'JS 오류 · 콘솔 오류', errs.length === 0, errs.length ? errs.slice(0, 3).join(' | ') : '0건');
  add('D2', 'id 중복', a.dupIds.length === 0, a.dupIds.length ? a.dupIds.join(', ') : '0건');
  add('D3', '행 중첩 (.fs-row 안 .fs-row)', a.rowNest === 0, a.rowNest + '건');
  add('D4', '콜아웃 ↔ 명세 행 1:1', a.calMismatch.length === 0,
    a.calMismatch.length ? JSON.stringify(a.calMismatch.slice(0, 2)) : `불일치 0건 (콜아웃 ${a.vol.cal} · 번호 행 ${a.vol.rowNum})`);
  add('D5', '배지 규격 23×23', a.calBadSize.length === 0,
    a.calBadSize.length ? JSON.stringify(a.calBadSize.slice(0, 3)) : '0건');
  add('D6', '배지 렌더 실패', a.calUnrendered === 0, a.calUnrendered + '건');
  add('D7', '구성 소속 (#fs-sub-design)', (a.designChildren || []).length === 10,
    (a.designChildren || []).join(' '));
  add('D8', 'H 프레임 도면 생성', a.popHosts > 0 && a.popEmpty.length === 0,
    `호스트 ${a.popHosts} · 빈 목업 ${a.popEmpty.length} · 상태 ${a.hStates}`);
  add('D9', '도면 콜아웃 타깃', a.popCalMissing.length === 0,
    a.popCalMissing.length ? JSON.stringify(a.popCalMissing) : '누락 0건');
  add('D10', `C-nn 정의 ${a.defC}건`, a.gaps.length === 0 && a.defDup.length === 0,
    `최대 C-${a.defCMax} · 결번 ${a.gaps.length ? a.gaps.join(',') : 0} · 중복 ${a.defDup.length ? a.defDup.join(',') : 0}`);
  add('D11', '죽은 칩', a.deadChips.length === 0,
    a.deadChips.length ? a.deadChips.join(', ') : '0건');
  add('D12', `테스트 케이스 ${a.tcTotal}건`, a.tcDup.length === 0,
    Object.entries(a.tcByKind).map(([k, v]) => `${k} ${v}`).join(' · ') + (a.tcDup.length ? ` · 중복 ${a.tcDup.join(',')}` : ''));
  info('D13', '물량', `프레임 ${a.vol.frame} · 상태 ${a.vol.state} · 명세 행 ${a.vol.row}(SYS ${a.vol.sys}) · 콜아웃 ${a.vol.cal} · 마커 ${a.vol.am} · details ${a.vol.details}`);

  /* 변경 이력 */
  await page.evaluate(() => showTab('log'));
  await page.waitForTimeout(300);
  const lg = await page.evaluate(logAudit);
  facts.log = lg;
  if (lg.headCount === null) info('D14', '변경 이력 헤더', `행 ${lg.rows} · 헤더 건수 표기 없음`);
  else add('D14', '변경 이력 헤더 ↔ 행', lg.headCount === lg.rows,
    `헤더 ${lg.headCount}건 / 실제 ${lg.rows}행 · ${lg.hint}`);

  /* 프로토타입 불변량 */
  await page.evaluate(() => showTab('proto'));
  await page.waitForTimeout(400);
  let pa = null;
  try { pa = await page.evaluate(protoAudit); } catch (e) { pa = { skip: String(e).slice(0, 80) }; }
  facts.proto = pa;
  if (pa && pa.skip) info('D15', '프로토타입 불변량', '건너뜀 — ' + pa.skip);
  else if (pa) {
    add('D15', '카드 선택 전후 크기 불변', pa.invariant, `${pa.before.join('×')} → ${pa.after.join('×')}`);
    add('D16', '44px 미만 컨트롤', pa.small.length === 0,
      pa.small.length ? JSON.stringify(pa.small.slice(0, 4)) : '0건');
  }

  /* 18조합 */
  if (FULL) {
    const bad = { clip: 0, overlay: 0, tab: 0 };
    let valMin = Infinity, valWhere = '', valAt = '';
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 1000 });
      await page.evaluate(() => showTab('spec'));
      for (const s of SUBS) {
        await page.evaluate(sub => fsSub(sub), s);
        await page.waitForTimeout(220);
        const L = await page.evaluate(layoutAudit);
        bad.clip += L.clip.length;
        bad.overlay += L.overlay.length;
        if (L.clip.length) facts.firstClip = facts.firstClip || { w, s, e: L.clip[0] };
        if (L.overlay.length) facts.firstOverlay = facts.firstOverlay || { w, s, e: L.overlay[0] };
      }
      /* 탭 전환 */
      const okTabs = await page.evaluate(tabs => {
        for (const t of tabs) {
          showTab(t);
          const v = document.getElementById('rt-' + t);
          if (!v || v.className.indexOf('on') < 0) return t;
        }
        return null;
      }, facts.tabs);
      if (okTabs) bad.tab++;
    }
    for (const w of NARROW) {
      await page.setViewportSize({ width: w, height: 1000 });
      await page.evaluate(() => { showTab('spec'); fsSub('design'); });
      await page.waitForTimeout(220);
      const L = await page.evaluate(layoutAudit);
      if (L.valMin !== null && L.valMin < valMin) { valMin = L.valMin; valWhere = L.valMinWhere; valAt = w; }
    }
    add('L1', '콜아웃 · 마커 잘림 (18조합)', bad.clip === 0,
      bad.clip ? `${bad.clip}건 — 첫 건 ${JSON.stringify(facts.firstClip)}` : '0건');
    add('L2', '35% 초과 오버레이 (18조합)', bad.overlay === 0,
      bad.overlay ? `${bad.overlay}건 — 첫 건 ${JSON.stringify(facts.firstOverlay)}` : '0건');
    add('L3', `${facts.tabs.length}개 탭 전환 (6폭)`, bad.tab === 0, bad.tab ? `실패 ${bad.tab}폭` : '전부 정상');
    if (valMin !== Infinity) {
      facts.valMin = valMin;
      add('L4', '좁은 폭 값 칸 폭 하한', valMin >= 100, `최소 ${valMin}px @${valAt} (${valWhere})`);
    }
  }

  await browser.close();
  return finish();
}

/* ---------------------------------------------------------------- 출력 */
function statusMd() {
  const a = facts.audit || {};
  const v = a.vol || {};
  let head = '(git 없음)';
  try {
    head = execFileSync('git', ['-C', ROOT, 'log', '-1', '--format=%h %ad %s', '--date=short'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* noop */ }
  let dirty = '';
  try {
    /* --no-optional-locks — status 가 인덱스를 갱신하며 .git/index.lock 을 잡는데,
       네트워크 · FUSE 마운트에서는 그 잠금이 남아 이후 git add 가 막힌다 (2026-08-20 실제 발생) */
    dirty = execFileSync('git', ['--no-optional-locks', '-C', ROOT, 'status', '--porcelain'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { /* noop */ }

  const L = [];
  L.push('# STATUS — 실측 현재 상태');
  L.push('');
  L.push('> **이 문서는 `node tools/check.mjs --status` 가 생성합니다. 손으로 고치지 마세요.**');
  L.push('> 다른 문서는 이 값을 옮겨 적지 않고 이 문서를 참조합니다 — 같은 수치를 여러 곳에 두면 한쪽이 낡습니다.');
  L.push('');
  L.push(`생성 ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  L.push('');
  L.push('## 기준');
  L.push('');
  L.push('| 항목 | 값 |');
  L.push('|---|---|');
  L.push(`| HEAD | \`${head}\` |`);
  L.push(`| 작업 트리 | ${head === '(git 없음)' ? '조회 불가' : (dirty ? '**미커밋 변경 있음** (' + dirty.split('\n').length + '개 파일)' : '깨끗함')} |`);
  L.push(`| \`index.html\` | ${facts.kb}KB · ${(facts.lines || 0).toLocaleString()}줄 |`);
  if (facts.tabLabels) L.push(`| 탭 구성 | ${facts.tabLabels.join(' · ')} |`);
  L.push('');

  /* 브라우저 검사를 못 돌린 실행(--static · playwright 없음)에서는
     지난 전체 검사의 물량·검증 절을 그대로 이어 씁니다 — 지우면 정보가 사라집니다 */
  if (!facts.audit) {
    const prev = path.join(ROOT, 'docs', 'STATUS.md');
    let carried = '';
    if (existsSync(prev)) {
      const old = readFileSync(prev, 'utf8');
      const i = old.indexOf('## 물량');
      if (i >= 0) carried = old.slice(i).replace(/^> \*\*이 절은.*\n/m, '');
    }
    L.push('> **이번 실행은 정적 검사만 수행했습니다** (브라우저 없음). 아래는 지난 전체 검사 결과를 이어 쓴 것입니다 —');
    L.push('> `node tools/check.mjs --full --status` 로 다시 측정하세요.');
    L.push('');
    L.push(carried || '## 물량\n\n*(전체 검사 기록 없음)*');
    return L.join('\n');
  }

  L.push('## 물량');
  L.push('');
  L.push('| 항목 | 수 |');
  L.push('|---|---:|');
  if (a.defC) L.push(`| 확정 사항 \`C-nn\` | **${a.defC}건** (C-01 ~ C-${a.defCMax} · 결번 ${(a.gaps || []).length}) |`);
  if (a.tcTotal) {
    const kinds = Object.entries(a.tcByKind || {}).map(([k, n]) => `${k} ${n}`).join(' · ');
    L.push(`| 테스트 케이스 \`TC-*\` | **${a.tcTotal}건** (${kinds}) |`);
  }
  if (v.frame) {
    L.push(`| 프레임 \`.fs-frame\` | ${v.frame} |`);
    L.push(`| 상태 블록 \`.fs-state\` | ${v.state} |`);
    L.push(`| 요소 명세 행 \`.fs-row\` | ${v.row} (번호 ${v.rowNum} · SYS ${v.sys}) |`);
    L.push(`| 콜아웃 \`.fs-cal\` | ${v.cal} |`);
    L.push(`| 영역 마커 \`.fs-am\` | ${v.am} |`);
    L.push(`| 접이식 \`<details>\` | ${v.details} |`);
  }
  if (a.defAll) L.push(`| 툴팁 정의 전체(코드 · WCAG 포함) | ${a.defAll} |`);
  L.push('');
  L.push('## 최근 검증');
  L.push('');
  const fail = results.filter(r => r.ok === false);
  L.push(`${FULL ? '18조합 포함 ' : ''}자동 검사 **${results.filter(r => r.ok !== null).length}항목** — ` +
    (fail.length ? `**FAIL ${fail.length}건** (${fail.map(f => f.id).join(', ')})` : '전건 PASS'));
  L.push('');
  L.push('```text');
  for (const r of results) {
    const mark = r.ok === null ? '·   ' : (r.ok ? 'PASS' : 'FAIL');
    L.push(`${mark}  ${r.id.padEnd(4)} ${r.name}${r.detail ? '  —  ' + r.detail : ''}`);
  }
  L.push('```');
  L.push('');
  return L.join('\n');
}

function recordBlock() {
  const a = facts.audit || {};
  const fail = results.filter(r => r.ok === false);
  const L = [];
  L.push('```text');
  L.push(`Validation ID: V-${new Date().toISOString().slice(0, 10)}-XX`);
  L.push('Commit:        (커밋 해시 또는 변경 요약)');
  L.push(`Date:          ${new Date().toISOString().slice(0, 10)}`);
  L.push(`Viewport:      ${FULL ? WIDTHS.join(' / ') : '1400 (단일)'}`);
  L.push(`Configuration: ${FULL ? '문서정보 / 화면설계 / 부록 (18조합)' : '화면설계'}`);
  L.push(`Result:        ${fail.length ? 'FAIL' : 'PASS'}`);
  L.push(`Issues:        ${fail.length}`);
  L.push('Scope:         (변경 범위)');
  L.push('Evidence:');
  let i = 1;
  for (const r of results) {
    if (r.ok === null) continue;
    L.push(`  ${String(i++).padStart(2)} ${r.name.padEnd(26)} ${r.ok ? '' : '[FAIL] '}${r.detail}`);
  }
  L.push('```');
  return L.join('\n');
}

function finish() {
  const pad = Math.max(...results.map(r => r.name.length));
  console.log('');
  console.log(`index.html 검증 — ${FULL ? '정적 + DOM + 18조합' : STATIC_ONLY ? '정적' : '정적 + DOM'}`);
  console.log('─'.repeat(72));
  for (const r of results) {
    const mark = r.ok === null ? '  ·  ' : (r.ok ? ' PASS' : ' FAIL');
    console.log(`${mark}  ${r.id.padEnd(4)} ${r.name.padEnd(pad)}  ${r.detail}`);
  }
  console.log('─'.repeat(72));
  const fail = results.filter(r => r.ok === false);
  const judged = results.filter(r => r.ok !== null).length;
  console.log(fail.length
    ? `FAIL ${fail.length} / ${judged}항목 — ${fail.map(f => f.id).join(', ')}`
    : `전건 PASS (${judged}항목)`);
  if (!FULL && !STATIC_ONLY) console.log('레이아웃 18조합은 --full 로 실행합니다.');
  console.log('');

  if (WRITE_STATUS) {
    const p = path.join(ROOT, 'docs', 'STATUS.md');
    writeFileSync(p, statusMd(), 'utf8');
    console.log('→ docs/STATUS.md 갱신');
  }
  if (RECORD) {
    console.log('');
    console.log(recordBlock());
  }
  process.exit(fail.length ? 1 : 0);
}

run().catch(e => { console.error('실행 실패:', e); process.exit(2); });
