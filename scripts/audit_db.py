#!/usr/bin/env python3
"""
Kontrola databázy cvikov: sedí cvik k svojej téme? Je pokrytá každá kategória?

    python3 scripts/audit_db.py
"""
import json, re, os, sys
from collections import Counter, defaultdict

# každá téma má jadro, ktoré sa MUSÍ objaviť v texte cviku
CORE = {
 "Rýchlym vedením lopty": r"vedeni|vedení|vedie|vedú|viesť|vedením|zrýchl|rýchlos|prienik",
 "1v1 KÚ/KO": r"krídl|krídel|koridor|postrann|center|1v1|súboj|dver",
 "1v1 SÚ/SSH/KÚ (chrbtom k bránke)": r"chrbtom|otočk|otoč|pivot|hrot|cieľov\w* hráč|medzi líniami",
 "1v1 SO/SSH/SÚ (v čelnom postavení)": r"súboj|1v1|duel|kľučk|zmen\w* smeru|prekona|čeln|zrkadl",
 "Prvým dotykom (ofenzívny / otvorený)": r"prv\w* dotyk|spracov|otvor|sken|dotyk",
 "Prienikovou prihrávkou": r"prienik|cez líniu|cez brániacu|medzi dvoma|okno|prihrávk|prihráv",
 "Prihrávkou do behu (za brániaceho hráča)": r"do behu|za obran|za líniu|za chrbát|hĺbk|nábeh|nabieh|ofsajd|kolmic",
 "Hrou na jeden dotyk (narážačka / na tretieho)": r"narážačk|jeden dotyk|jedného dotyku|jednom dotyku|na tretieho|kombinác|rondo|dva dotyky|dvoch dotyk",
 "Krytie lopty (jednotlivca)": r"kryti|krytie|kryť|chráni|chráň|chrán|telom|udrž|súboj o loptu|kontakt",
 "Držanie lopty (skupinou hráčov)": r"držan|držať|udrž|rondo|prihrávok|prihráv|poziční|pozičn|séri|prenos",
 "Zakončenie po vedení lopty / kľučke": r"zakonč|strel|strieľ|gól|kľučk|prienik do vápna|sól",
 "Zakončenie po prihrávke / z prvého dotyku": r"zakonč|strel|strieľ|gól|prvého dotyku|prvej|center|dorážk|spätn",
 "Zakladanie útoku": r"rozohráv|rozohrá|rozohr|zaklada|zakladan|brankár|pressing|napádan|postup|domček",
 "Základy priestorovej obrany": r"obran|bráni|brániť|bráň|blok|pressing|tlak na loptu|zisk lopty|kompakt|isten|tieni|tieň|návrat",
 "Štandardné situácie (roh, priamy kop, aut)": r"roh|priamy kop|\baut\b|autov|vhadzov|štandard|múr",
}
# čo v téme NESMIE byť hlavnou náplňou (typické zámeny)
ANTI = {
 "Rýchlym vedením lopty": [(r"roh(ov)?\s*kop|priamy kop|vhadzov", "štandardka v téme o vedení lopty")],
 "Držanie lopty (skupinou hráčov)": [(r"zakonč\w+ na bránku s brankárom", "zakončenie v téme o držaní lopty")],
 "Základy priestorovej obrany": [(r"^Zakonč", "zakončenie v obrannej téme")],
}
PH=("PČ","HČ","ZČ")

def parse_age(s):
    m=re.match(r"U\s*(\d+)\s*[–—-]\s*U?\s*(\d+)", str(s))
    if m: return int(m.group(1)), int(m.group(2))
    m=re.match(r"U\s*(\d+)", str(s))
    if m: return int(m.group(1)), int(m.group(1))
    return None

def main():
    root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ex=json.load(open(os.path.join(root,"exercises.json"),encoding="utf-8"))
    problems=[]

    # 1) sedí cvik k téme?
    for e in ex:
        t=e.get("theme")
        blob=" ".join(str(e.get(k,"")) for k in ("name","why","setup","steps","constraints","coach"))
        pat=CORE.get(t)
        if not pat:
            problems.append(f"{e['id']}: neznáma téma {t!r}"); continue
        if not re.search(pat, blob, re.I):
            problems.append(f"{e['id']} „{e['name']}“ — text nesedí k téme „{t}“")
        for anti,desc in ANTI.get(t,[]):
            if re.search(anti, e.get("name",""), re.I):
                problems.append(f"{e['id']} „{e['name']}“ — {desc}")

    # 2) duplicitné názvy v celej databáze — tréner nesmie vidieť dva cviky s rovnakým menom
    seen=defaultdict(list)
    for e in ex: seen[e["name"]].append(f'{e["id"]} ({e["theme"]} / {e["phase"]})')
    for k,v in seen.items():
        if len(v)>1: problems.append(f"duplicitný názov {k!r}: {', '.join(v)}")

    # 3) pokrytie vekových kategórií
    print("Pokrytie: koľko cvikov presne sedí danej kategórii (najhoršia téma×časť)")
    print(f"{'kat.':5} {'min':>4} {'priem':>6}   {'bez cviku (téma×časť)':<22}")
    worst=[]
    for age in range(6,20):
        counts=[]
        for t in CORE:
            for p in PH:
                n=sum(1 for e in ex if e["theme"]==t and e["phase"]==p
                      and (r:=parse_age(e.get("age"))) and r[0]<=age<=r[1])
                counts.append(n)
        mn=min(counts); avg=sum(counts)/len(counts); zero=counts.count(0)
        print(f"U{age:<4} {mn:>4} {avg:>6.1f}   {zero:<22}")
        if mn==0: worst.append(age)

    print()
    c=Counter((e["theme"],e["phase"]) for e in ex)
    print(f"Cvikov spolu: {len(ex)} | najmenej v bunke téma×časť: {min(c.values())} | najviac: {max(c.values())}")
    print(f"Elitných (s poľom 'why'): {sum(1 for e in ex if e.get('why'))}/{len(ex)}")

    if problems:
        print(f"\n❌ PROBLÉMY ({len(problems)}):")
        for p in problems[:60]: print("  -",p)
        sys.exit(1)
    print("\n✅ Každý cvik sedí k svojej téme, žiadne duplicity.")
    if worst: print(f"⚠ Kategórie bez presného cviku v niektorej bunke: {worst}")

if __name__=="__main__": main()
