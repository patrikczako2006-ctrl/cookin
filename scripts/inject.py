#!/usr/bin/env python3
"""Vloží scripts/diagram.js a exercises.json do index.html (medzi značky)."""
import json,sys,os
def inject(html,start,end,payload):
    a,b=html.find(start),html.find(end)
    assert a>=0 and b>=0, "markers missing: "+start
    return html[:a+len(start)]+payload+html[b:]
h=open('index.html',encoding='utf-8').read()
h=inject(h,'/*__DIAGRAM_START__*/','/*__DIAGRAM_END__*/',open('scripts/diagram.js',encoding='utf-8').read())
h=inject(h,'/*__EXERCISES_START__*/','/*__EXERCISES_END__*/',json.dumps(json.load(open('exercises.json',encoding='utf-8')),ensure_ascii=False))
open('index.html','w',encoding='utf-8').write(h)
print("injected diagram.js + exercises")
