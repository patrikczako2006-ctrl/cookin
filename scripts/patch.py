#!/usr/bin/env python3
"""Opraví polia cvikov podľa id — nájde správny súbor v data/ sám.

    from patch import apply
    apply({"N002": {"diagram": "gates"}, ...})
"""
import json, glob, os, sys

def files():
    root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return sorted(glob.glob(os.path.join(root,"data","*.json")))+ \
           sorted(glob.glob(os.path.join(root,"data","temy","*.json")))

def apply(patches, quiet=False):
    # elitné súbory nemajú id — dopočítaj ho z poradia, rovnako ako build_db.py
    base={"elite_foundation.json":1,"elite_development.json":46,"elite_pro.json":91}
    done=set()
    for p in files():
        d=json.load(open(p,encoding="utf-8")); ch=False
        bn=os.path.basename(p)
        for idx,e in enumerate(d):
            eid=e.get("id") or (f"E{base[bn]+idx:03d}" if bn in base else None)
            if eid in patches:
                for k,v in patches[eid].items():
                    if v is None: e.pop(k,None)
                    else: e[k]=v
                done.add(eid); ch=True
        if ch: json.dump(d,open(p,"w",encoding="utf-8"),ensure_ascii=False,indent=2)
    missing=set(patches)-done
    if not quiet:
        print(f"opravených cvikov: {len(done)}" + (f"  ❌ nenájdené: {sorted(missing)}" if missing else ""))
    return done
