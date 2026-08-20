#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tagcheck.py — 태그 정합성 (VALIDATION.md 2절 항목 5)

html.parser 로 여는 태그 · 닫는 태그를 스택 대조합니다.
브라우저는 어긋난 태그를 자동 교정하므로 DOM 검사로는 잡히지 않습니다.
2026-08-19 에 실제로 발생한 두 결함이 이 검사의 대상입니다.
  · F 영역 선택 상태의 여분 </div> → G 프레임이 fs-sub-design 밖으로 빠짐
  · SYS 행이 직전 명세 행 안에 중첩 → 좁은 폭에서 명세 붕괴

사용: python3 tools/tagcheck.py index.html
출력: JSON { "stray": [...], "unclosed": [...], "mismatch": [...], "ok": bool }
"""
import sys, json
from html.parser import HTMLParser

VOID = {'area','base','br','col','embed','hr','img','input','link',
        'meta','param','source','track','wbr'}
# 종료 태그가 선택적인 요소 — 생략을 오류로 보지 않는다
OPTIONAL_END = {'p','li','td','th','tr','tbody','thead','tfoot','option','dt','dd'}
# 내용이 원시 텍스트라 안쪽 태그를 세지 않는 요소
RAW = {'script','style'}


class TagCheck(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, line)
        self.stray = []
        self.mismatch = []
        self.raw_depth = 0

    def handle_starttag(self, tag, attrs):
        if self.raw_depth:
            return
        if tag in RAW:
            self.raw_depth = 1
            return
        if tag in VOID:
            return
        self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):
        pass  # <br/> 형태 — 자기 완결

    def handle_endtag(self, tag):
        if tag in RAW:
            self.raw_depth = 0
            return
        if self.raw_depth or tag in VOID:
            return
        line = self.getpos()[0]
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                # i 위에 남은 것들 — 종료 태그가 선택적이면 정상, 아니면 어긋남
                for t, ln in self.stack[i + 1:]:
                    if t not in OPTIONAL_END:
                        self.mismatch.append(
                            {'tag': t, 'openedAt': ln,
                             'closedBy': tag, 'closedAt': line})
                del self.stack[i:]
                return
        self.stray.append({'tag': tag, 'line': line})


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
    with open(path, encoding='utf-8') as f:
        src = f.read()
    p = TagCheck()
    p.feed(src)
    unclosed = [{'tag': t, 'line': ln} for t, ln in p.stack
                if t not in OPTIONAL_END]
    out = {
        'stray': p.stray,
        'unclosed': unclosed,
        'mismatch': p.mismatch,
    }
    out['ok'] = not (out['stray'] or out['unclosed'] or out['mismatch'])
    print(json.dumps(out, ensure_ascii=False))
    sys.exit(0 if out['ok'] else 1)


if __name__ == '__main__':
    main()
