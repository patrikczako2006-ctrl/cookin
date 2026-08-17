#!/usr/bin/env python3
"""
Zloží exercises.json z elitných sád (data/elite_*.json) a tematických sád
(data/temy/tema_*.json). Každý cvik dostane skills podľa svojej témy.

    python3 scripts/build_db.py && python3 scripts/inject.py
"""
import json, glob, os, sys

THEME_SKILLS = {
 "Rýchlym vedením lopty":["Vedenie lopty priamym priehlavkom vo voľnom priestore","Zmeny rýchlosti pri vedení lopty","Krytie lopty telom pri vedení"],
 "1v1 KÚ/KO":["Kľučky (zmena smeru na bránku — napr. bicykel)","Vedenie lopty priamym priehlavkom","Zmeny rýchlosti pri vedení"],
 "1v1 SÚ/SSH/KÚ (chrbtom k bránke)":["Vedenie vnútrajškom/vonkajškom na malom priestore","Zasekávačky (napr. Cruyff turn)","Krytie lopty telom"],
 "1v1 SO/SSH/SÚ (v čelnom postavení)":["Kľučky (napr. bicykel)","Vedenie vnútrajškom/vonkajškom na malom priestore"],
 "Prvým dotykom (ofenzívny / otvorený)":["Spracovanie do voľného priestoru vnútrajškom/vonkajškom"],
 "Prienikovou prihrávkou":["Prihrávka po zemi vnútrajškom / priehlavkom","Spracovanie stlmením podrážkou/vnútrajškom","Spracovanie do voľného priestoru"],
 "Prihrávkou do behu (za brániaceho hráča)":["Prihrávka po zemi","Spracovanie do voľného priestoru","Vedenie priamym priehlavkom"],
 "Hrou na jeden dotyk (narážačka / na tretieho)":["Prihrávka z prvého dotyku"],
 "Krytie lopty (jednotlivca)":["Vedenie vnútrajškom/vonkajškom na malom priestore","Zasekávačky (Cruyff turn)","Krytie lopty telom"],
 "Držanie lopty (skupinou hráčov)":["Prihrávka po zemi","Spracovanie stlmením","Spracovanie do voľného priestoru"],
 "Zakončenie po vedení lopty / kľučke":["Zakončenie vnútrajškom (kratšia vzdialenosť)","Zakončenie priamym priehlavkom (dlhšia vzdialenosť)"],
 "Zakončenie po prihrávke / z prvého dotyku":["Zakončenie vnútrajškom/priehlavkom z prvého dotyku"],
 "Zakladanie útoku":[],
 "Základy priestorovej obrany":[],
 "Štandardné situácie (roh, priamy kop, aut)":[],
}
PHASES=("PČ","HČ","ZČ")
TEMPLATES={"slalom","gates","mastery","tag","duel","duelWave","channel","rondo","positional","zones",
 "pass3","wall","pivot","through","offside","shoot","cross","gk1v1","ssg","ssg4","targetZone","block",
 "press","buildup","corner","freekick","throwin","grid"}
REQ=["id","name","theme","phase","age","players","space","time","gear",
     "why","setup","steps","constraints","progression","regression","coach","load","level"]

def load(path):
    with open(path,encoding="utf-8") as f: return json.load(f)

def main():
    root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out=[]
    # elitná sada: id sa prideľuje podľa poradia (foundation E001+, development E046+, pro E091+)
    for base,fname in ((1,"elite_foundation.json"),(46,"elite_development.json"),(91,"elite_pro.json")):
        for i,e in enumerate(load(os.path.join(root,"data",fname))):
            e.setdefault("id",f"E{base+i:03d}")
            out.append(e)
    for p in sorted(glob.glob(os.path.join(root,"data","temy","tema_*.json"))):
        out.extend(load(p))

    errs=[]
    ids=set()
    for e in out:
        for f in REQ:
            if not e.get(f): errs.append(f"{e.get('id','?')}: chýba '{f}'")
        if e.get("theme") not in THEME_SKILLS: errs.append(f"{e.get('id')}: neznáma téma {e.get('theme')!r}")
        if e.get("phase") not in PHASES: errs.append(f"{e.get('id')}: neznáma časť {e.get('phase')!r}")
        if e.get("diagram") and e["diagram"] not in TEMPLATES:
            errs.append(f"{e.get('id')}: neznáma šablóna nákresu {e['diagram']!r}")
        if e.get("id") in ids: errs.append(f"duplicitné id {e['id']}")
        ids.add(e.get("id"))
        if not e.get("skills"): e["skills"]=list(THEME_SKILLS.get(e.get("theme"),[]))
    if errs:
        print("CHYBY:"); [print("  -",x) for x in errs[:40]]
        print(f"  ... spolu {len(errs)}"); sys.exit(1)

    with open(os.path.join(root,"exercises.json"),"w",encoding="utf-8") as f:
        json.dump(out,f,ensure_ascii=False,indent=2)

    from collections import Counter
    c=Counter((e["theme"],e["phase"]) for e in out)
    missing=[(t,p) for t in THEME_SKILLS for p in PHASES if c[(t,p)]==0]
    print(f"OK: {len(out)} cvikov -> exercises.json")
    print(f"   PČ {sum(1 for e in out if e['phase']=='PČ')} · HČ {sum(1 for e in out if e['phase']=='HČ')} · ZČ {sum(1 for e in out if e['phase']=='ZČ')}")
    print(f"   pokrytie tém×častí: {45-len(missing)}/45" + (f"  CHÝBA: {missing}" if missing else ""))
    mn=min(c[(t,p)] for t in THEME_SKILLS for p in PHASES)
    print(f"   najmenej cvikov v jednej bunke: {mn}")

if __name__=="__main__": main()
