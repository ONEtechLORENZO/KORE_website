# -*- coding: utf-8 -*-
"""Converte un documento legale in Markdown nel frammento HTML usato da build.py.

Uso:  python trust-src/md2html.py <file.md> <uscita.html>

Riconosce: '## N. Titolo' (articolo numerato), '## Altro' (sezione non numerata, es. Parti,
Allegato A), '### N.N Titolo', paragrafi '1.1 testo' (comma numerato), elenchi '- ' e '1. ',
tabelle Markdown, paragrafi interamente in grassetto (sottotitolo), righe finali '*Fine ...*'.
"""
import html, re, sys


def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', t)
    t = re.sub(r'\b([\w.+-]+@[\w-]+\.[\w.]+)\b', r'<a href="mailto:\1">\1</a>', t)
    t = re.sub(r'(https?://[\w./?=&%-]+[\w/])', r'<a href="\1" target="_blank" rel="noopener">\1</a>', t)
    return t


def blocks(lines):
    out, cur = [], []

    def kind(l):
        if l.startswith('|'): return 'table'
        if l.startswith('- '): return 'ul'
        if re.match(r'\d+\. ', l): return 'ol'
        return 'p'
    for l in lines:
        if not l.strip():
            if cur: out.append(cur); cur = []
            continue
        if l.startswith('#') or l.strip() == '---':
            if cur: out.append(cur); cur = []
            out.append([l]); continue
        if cur and kind(cur[0]) != kind(l):
            out.append(cur); cur = []
        cur.append(l)
    if cur: out.append(cur)
    return out


def table(rows):
    cells = [[c.strip() for c in r.strip().strip('|').split('|')] for r in rows if not re.match(r'^\|[\s:|-]+\|$', r.strip())]
    head, body = cells[0], cells[1:]
    h = ''.join('<th>%s</th>' % inline(c) for c in head)
    b = ''.join('<tr>%s</tr>' % ''.join('<td data-label="%s">%s</td>' % (html.escape(head[i], quote=True), inline(c))
                                        for i, c in enumerate(r)) for r in body)
    return '   <div class="tc-tabwrap"><table class="tc-table"><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>\n' % (h, b)


def convert(src, skip_pre=()):
    res, open_sec, pre = [], False, True

    def close():
        nonlocal open_sec
        if open_sec: res.append('  </section>\n'); open_sec = False
    for b in blocks(src.splitlines()):
        h = b[0]
        if h.startswith('# ') or h.strip() == '---':
            continue
        if h.startswith('## '):
            close(); pre = False
            t = h[3:].strip()
            m = re.match(r'(\d+)\.\s*(.+)', t)
            if m:
                res.append('  <section class="tc-sec" id="art-%s"><h2><i>%02d</i>%s</h2><i class="tc-rule" aria-hidden="true"></i>\n'
                           % (m.group(1), int(m.group(1)), inline(m.group(2))))
            else:
                a = re.match(r'Allegato ([A-Z][\w-]*)', t)
                lab = a.group(1) if a else '&middot;'
                sid = ('allegato-' + a.group(1).lower()) if a else re.sub(r'\W+', '-', t.lower()).strip('-')
                res.append('  <section class="tc-sec tc-sec-x" id="%s"><h2><i>%s</i>%s</h2><i class="tc-rule" aria-hidden="true"></i>\n'
                           % (sid, lab, inline(t)))
            open_sec = True
            continue
        if h.startswith('### '):
            m = re.match(r'### ([\w.]+)\s+(.+)', h)
            res.append('   <h3 class="tc-h3"><i>%s</i>%s</h3>\n' % (m.group(1), inline(m.group(2))))
            continue
        if h.startswith('|'):
            res.append(table(b)); continue
        if h.startswith('- '):
            res.append('   <ul class="tc-list">\n' + ''.join('    <li><span>%s</span></li>\n' % inline(x[2:]) for x in b) + '   </ul>\n')
            continue
        if re.match(r'\d+\. ', h):
            res.append('   <ol class="tc-olist">\n' + ''.join('    <li>%s</li>\n' % inline(re.sub(r'^\d+\.\s*', '', x)) for x in b) + '   </ol>\n')
            continue
        if pre and any(h.startswith(s) for s in skip_pre):
            continue
        if h.startswith('*Fine') or re.match(r'\*(ONE / KORE|KORE) - ', h):
            close(); res.append('  <p class="tc-end">%s</p>\n' % '<br>'.join(inline(x) for x in b)); continue
        if pre and not open_sec:
            res.append('  <section class="tc-sec tc-pre">\n'); open_sec = True
        m = re.match(r'^\*\*([A-Z]\.\d+)\s+(.+)\*\*$', h)
        if m and len(b) == 1:
            res.append('   <h3 class="tc-h3"><i>%s</i>%s</h3>\n' % (m.group(1), inline(m.group(2)))); continue
        m = re.match(r'^(\d+\.\d+)\s+(.*)', h)
        if m:
            res.append('   <p><b class="tc-n">%s</b> %s</p>\n' % (m.group(1), '<br>'.join([inline(m.group(2))] + [inline(x) for x in b[1:]])))
            continue
        res.append('   <p>%s</p>\n' % '<br>'.join(inline(x) for x in b))
    close()
    return ''.join(res)


if __name__ == '__main__':
    src = open(sys.argv[1], encoding='utf-8').read()
    out = convert(src, skip_pre=('**Versione', '*'))
    open(sys.argv[2], 'w', encoding='utf-8', newline='\n').write(out)
    print(sys.argv[2], len(out), 'articoli:', out.count('<h2><i>0') + out.count('<h2><i>1'))
