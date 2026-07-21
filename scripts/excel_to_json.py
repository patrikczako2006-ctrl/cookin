#!/usr/bin/env python3
"""
Prevodník: cviky-sablona.xlsx  ->  exercises.json  (+ vloží dáta do index.html)

Použitie:
    python3 scripts/excel_to_json.py [cesta_k_xlsx] [cesta_k_index.html]

Predvolene číta ./cviky-sablona.xlsx a zapisuje ./exercises.json a vloží
dáta do ./index.html medzi značky __EXERCISES_START__ / __EXERCISES_END__.
Excel je zdroj pravdy — po spustení sa cviky v appke nahradia obsahom z Excelu.
"""
import sys, json, os

def main():
    xlsx = sys.argv[1] if len(sys.argv) > 1 else "cviky-sablona.xlsx"
    index = sys.argv[2] if len(sys.argv) > 2 else "index.html"

    import openpyxl
    wb = openpyxl.load_workbook(xlsx, data_only=True)
    if "Cviky" not in wb.sheetnames:
        print("Chyba: hárok 'Cviky' nenájdený."); sys.exit(1)
    ws = wb["Cviky"]

    def cell(r, c):
        v = ws.cell(row=r, column=c).value
        return "" if v is None else str(v).strip()

    out = []
    n = 0
    for r in range(2, ws.max_row + 1):
        name = cell(r, 2)
        if not name:               # prázdny riadok = koniec / preskoč
            continue
        n += 1
        vek_od, vek_do = cell(r, 7), cell(r, 8)
        age = f"{vek_od}–{vek_do}" if vek_od and vek_do else (vek_od or vek_do)
        mins = cell(r, 12)
        time = (mins + "´") if mins else ""
        extra = [s.strip() for s in cell(r, 5).replace(";", ",").split(",") if s.strip()]
        ex = {
            "id": cell(r, 1) or f"C{n:03d}",
            "name": name,
            "phase": cell(r, 3),                 # PČ / HČ / ZČ
            "skill": cell(r, 4),                 # hlavná zručnosť
            "skills": ([cell(r, 4)] if cell(r, 4) else []) + extra,
            "theme": cell(r, 6),                 # voliteľné
            "age": age,
            "players": cell(r, 9),
            "space": cell(r, 10),
            "intensity": cell(r, 11),
            "mins": mins,
            "time": time,
            "gear": cell(r, 13),
            "steps": cell(r, 14),
            "coach": cell(r, 15),
            "diagram": cell(r, 16),
            "video": cell(r, 17),
        }
        out.append(ex)

    with open("exercises.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    # vlož do index.html medzi značky
    if os.path.exists(index):
        html = open(index, encoding="utf-8").read()
        s, e = "/*__EXERCISES_START__*/", "/*__EXERCISES_END__*/"
        a, b = html.find(s), html.find(e)
        if a >= 0 and b >= 0:
            html = html[:a + len(s)] + json.dumps(out, ensure_ascii=False) + html[b:]
            open(index, "w", encoding="utf-8").write(html)
            print(f"OK: {len(out)} cvikov -> exercises.json + vložené do {index}")
        else:
            print(f"OK: {len(out)} cvikov -> exercises.json (značky v {index} nenájdené)")
    else:
        print(f"OK: {len(out)} cvikov -> exercises.json")

if __name__ == "__main__":
    main()
