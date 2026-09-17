#!/usr/bin/env python3
"""
Nákresy k prepísaným cvikom HČ. Pôvodné boli štvorce na držanie lopty —
nové musia ukázať to, čo sa naozaj hrá: bránky, smer a zakončenie.

    python3 scripts/patch_hc_scenes.py && node scripts/build_scenes.js
"""
import json, glob, os, sys


def mini(w, h, gw=3.0):
    """dve malé bránky na každej strane — pre najmladších, bez brankára"""
    return [{"x": 0, "y": round(h * 0.30, 1), "w": gw, "side": "l"},
            {"x": 0, "y": round(h * 0.70, 1), "w": gw, "side": "l"},
            {"x": w, "y": round(h * 0.30, 1), "w": gw, "side": "r"},
            {"x": w, "y": round(h * 0.70, 1), "w": gw, "side": "r"}]


def halves(w, h, a="polovica A", b="polovica B"):
    return [{"x": 0, "y": 0, "w": w / 2, "h": h, "label": a},
            {"x": w / 2, "y": 0, "w": w / 2, "h": h, "label": b}]


def bands(w, h, labels):
    """pozdĺžne zóny po celej šírke ihriska"""
    n = len(labels)
    return [{"x": round(i * w / n, 1), "y": 0, "w": round(w / n, 1), "h": h, "label": l}
            for i, l in enumerate(labels)]


S = {
    # ---- U6–U9: malé bránky, bez brankárov
    "P113": {"shape": "ssg", "w": 30, "h": 24, "att": 4, "def": 4, "gk": False,
             "goals": mini(30, 24), "shot": False},
    "M029": {"shape": "ssg", "w": 26, "h": 20, "att": 4, "def": 2, "gk": False, "goalW": 3,
             "zones": halves(26, 20)},
    "N113": {"shape": "ssg", "w": 24, "h": 20, "att": 4, "def": 2, "gk": False, "goalW": 3},

    # ---- U9–U12
    "E023": {"shape": "ssg", "w": 26, "h": 20, "att": 4, "def": 1, "gk": False, "goalW": 3},
    "N090": {"shape": "ssg", "w": 30, "h": 22, "att": 5, "def": 2, "goalW": 5},
    "E029": {"shape": "ssg", "w": 36, "h": 26, "att": 5, "def": 3, "goalW": 5,
             "zones": halves(36, 26)},
    "N114": {"shape": "ssg", "w": 38, "h": 26, "att": 5, "def": 3, "goalW": 5,
             "zones": halves(38, 26)},
    "P114": {"shape": "ssg", "w": 42, "h": 30, "att": 5, "def": 5, "neu": 2, "goalW": 6,
             "zones": [{"x": 0, "y": 0, "w": 42, "h": 4.5, "label": "šírka"},
                       {"x": 0, "y": 25.5, "w": 42, "h": 4.5, "label": "šírka"}]},

    # ---- U12–U15
    "E059": {"shape": "ssg", "w": 45, "h": 34, "att": 6, "def": 6, "neu": 3, "goalW": 6,
             "zones": bands(45, 34, ["vlastná tretina", "stredná zóna", "útočná tretina"])},
    "P067": {"shape": "ssg", "w": 44, "h": 32, "att": 6, "def": 6, "neu": 2, "goalW": 6},
    "N115": {"shape": "ssg", "w": 48, "h": 34, "att": 6, "def": 6, "neu": 2, "goalW": 6,
             "zones": bands(48, 34, ["zóna 1", "zóna 2", "zóna 3"])},
    "P115": {"shape": "ssg", "w": 46, "h": 34, "att": 6, "def": 6, "neu": 2, "goalW": 6},

    # ---- U16–U19
    "E104": {"shape": "ssg", "w": 60, "h": 44, "att": 8, "def": 8, "neu": 3, "goalW": 7,
             "zones": bands(60, 44, ["zóna 1", "stredná zóna", "zóna 3"])},
    "E119": {"shape": "ssg", "w": 72, "h": 50, "att": 10, "def": 10, "neu": 3, "goalW": 7,
             "zones": bands(72, 50, ["zóna 1", "zóna 2", "zóna 3", "zóna 4"])},
    "N056": {"shape": "ssg", "w": 62, "h": 44, "att": 8, "def": 8, "neu": 3, "goalW": 7,
             "zones": [{"x": 0, "y": 0, "w": 18, "h": 44, "label": "krajná zóna"},
                       {"x": 44, "y": 0, "w": 18, "h": 44, "label": "krajná zóna"}]},
    "N092": {"shape": "ssg", "w": 60, "h": 42, "att": 8, "def": 8, "goalW": 7,
             "zones": bands(60, 42, ["zóna 1", "zóna 2", "posledná tretina"])},
    "N116": {"shape": "ssg", "w": 70, "h": 50, "att": 10, "def": 10, "neu": 3, "goalW": 7,
             "zones": bands(70, 50, ["zóna 1", "zóna 2", "zóna 3", "zóna 4"])},
    "E074": {"shape": "ssg", "w": 64, "h": 46, "att": 8, "def": 8, "neu": 2, "goalW": 7,
             "zones": [{"x": 0, "y": 0, "w": 19, "h": 46, "label": "krajná zóna"},
                       {"x": 45, "y": 0, "w": 19, "h": 46, "label": "krajná zóna"}]},
    "P104": {"shape": "ssg", "w": 66, "h": 46, "att": 8, "def": 8, "goalW": 7,
             "zones": [{"x": 0, "y": 0, "w": 66, "h": 11.5, "label": "koridor 1"},
                       {"x": 0, "y": 11.5, "w": 66, "h": 11.5, "label": "koridor 2"},
                       {"x": 0, "y": 23, "w": 66, "h": 11.5, "label": "koridor 3"},
                       {"x": 0, "y": 34.5, "w": 66, "h": 11.5, "label": "koridor 4"}]},
    "P116": {"shape": "ssg", "w": 64, "h": 46, "att": 9, "def": 9, "goalW": 7,
             "zones": bands(64, 46, ["zóna 1", "zóna 2", "zóna 3"])},

    # ---- honička s bránami z mét
    "E002": {"shape": "gates", "w": 26, "h": 20, "gates": 4, "att": 6, "via": "drib"},
}


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    left = set(S)
    for path in sorted(glob.glob(os.path.join(root, "data", "scenes", "*.json"))):
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        hit = [k for k in d if k in S]
        if not hit:
            continue
        for k in hit:
            d[k] = S[k]; left.discard(k)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=1)
        print("upravené:", os.path.relpath(path, root), "—", len(hit), "nákresov")
    if left:
        print("NENÁJDENÉ nákresy:", sorted(left), file=sys.stderr); sys.exit(1)
    print("prekreslených:", len(S))


if __name__ == "__main__":
    main()
