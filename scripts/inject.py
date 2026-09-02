#!/usr/bin/env python3
"""Vloží vykresľovač nákresov, hotové nákresy a cviky do index.html."""
import json

def inject(html, start, end, payload):
    a, b = html.find(start), html.find(end)
    assert a >= 0 and b >= 0, "chýba značka: " + start
    return html[:a + len(start)] + payload + html[b:]

render = open('scripts/render.js', encoding='utf-8').read()
scenes = json.load(open('scenes.json', encoding='utf-8'))
ex     = json.load(open('exercises.json', encoding='utf-8'))

# vykresľovač + hotové nákresy + tenká vrstva, ktorú volá appka
block = render + "\n(function(root){\n" \
    "  const SCENES=" + json.dumps(scenes, ensure_ascii=False, separators=(',', ':')) + ";\n" \
    "  const D=root.Diagram2;\n" \
    "  function drillSVG(ex,opts){\n" \
    "    const sc=ex&&SCENES[ex.id];\n" \
    "    if(!sc) return '';\n" \
    "    return D.render(sc,Object.assign({alt:'Nákres cviku '+(ex.name||'')},opts||{}));\n" \
    "  }\n" \
    "  /* v legende ukáž len to, čo na nákrese naozaj je */\n" \
    "  function legendFor(ex){\n" \
    "    const sc=ex&&SCENES[ex.id]; if(!sc) return [];\n" \
    "    const has={};\n" \
    "    (sc.players||[]).forEach(p=>has[{a:'att',d:'def',n:'neu',gk:'gk'}[p.t]||'att']=1);\n" \
    "    (sc.goals||[]).forEach(g=>{ if(g.gk) has.gk=1; });\n" \
    "    if((sc.cones||[]).length||(sc.gates||[]).length) has.cone=1;\n" \
    "    if((sc.mann||[]).length) has.mann=1;\n" \
    "    if((sc.balls||[]).length) has.ball=1;\n" \
    "    (sc.acts||[]).forEach(a=>has[a.k]=1);\n" \
    "    return D.legendItems.filter(([k])=>has[k]);\n" \
    "  }\n" \
    "  root.Diagram={drillSVG,legendFor,SCENES,PAL:D.PAL,legendItems:D.legendItems};\n" \
    "})(typeof window!=='undefined'?window:globalThis);\n"

h = open('index.html', encoding='utf-8').read()
h = inject(h, '/*__DIAGRAM_START__*/', '/*__DIAGRAM_END__*/', block)
h = inject(h, '/*__EXERCISES_START__*/', '/*__EXERCISES_END__*/',
           json.dumps(ex, ensure_ascii=False))
open('index.html', 'w', encoding='utf-8').write(h)
print(f"vložené: vykresľovač + {len(scenes)} nákresov + {len(ex)} cvikov")
