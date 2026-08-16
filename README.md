# Zostava

Webová aplikácia pre trénerov mládeže (U6 – U19). Tréner si vyberie kategóriu a tému
a dostane hotovú tréningovú jednotku podľa metodiky, rozdelenú na časti (PČ / HČ / ZČ),
s konkrétnymi tréningami pre každú časť.

Funkčný jednostránkový web (SPA) — všetko sa deje plynulo bez reloadov, s reálnou navigáciou
(hash router), takže klik otvorí stránku a nič neskáče späť na úvod.

## Čo funguje

- **Generátor tréningov** — kategória → téma → jednotka po častiach so zručnosťami, piliermi a princípmi.
- **Tri plány** — Basic (zdarma, 5 tréningov na časť), **Tréner** (9,90 €/mes) a **Klub**
  (39 €/mes, viac trénerov, klubová knižnica, tímy a dochádzka). Zamknuté tréningy vedú na cenník.
- **Vlastné cviky (`/moje-cviky`)** — tréner si uloží cvik súkromne, alebo ho zdieľa s komunitou.
  Pri zdieľaní musí potvrdiť, že je to jeho vlastný cvik (ochrana pred kopírovaným obsahom).
- **Moderácia v admine** — fronta odoslaných cvikov, schválenie/zamietnutie s dôvodom.
  Za schválený cvik dostane autor **mesiac zadarmo** (a cvik sa objaví v generátore).
- **Webshop flow** — cenník (mesačne/ročne) → registrácia → pokladňa → odomknutie Pro.
  Platba je zatiaľ **demo** (bez reálnej brány — napojí sa neskôr, napr. Stripe/GoPay).
- **Účet** — registrácia/prihlásenie, správa plánu (demo, cez `localStorage`).
- **Právne stránky** — Obchodné podmienky, Ochrana osobných údajov (GDPR), Cookies (+ cookie lišta),
  Odstúpenie od zmluvy. So SK vzorovými textami a miestami `[...]` na doplnenie údajov firmy.

> ⚠️ Právne texty sú vzory — pred spustením doplniť reálne údaje a dať skontrolovať právnikovi.

## Dizajn

- Tmavý prémiový „cinematic" vzhľad, akcent zeleno-tyrkysový gradient.
- Fonty **Sora + Manrope** vložené priamo v súbore (latin + latin-ext, bez CDN).
- Canvas pozadie (taktická sieť), parallax, scroll-reveal, hover efekty, cookie lišta, modály.
- Plne responzívne, rešpektuje `prefers-reduced-motion`.

## Architektúra

Celá appka je v `index.html` (HTML + CSS + JS, self-contained). Dáta metodiky
(`CATEGORIES`, `PHASES`, `GROUPS`, ...) sú v `<script>` na začiatku — tam sa dopĺňa
metodika aj neskoršia databáza cvikov. Stav (účet, plán, cookies) je v `localStorage`.

## Spustenie

Statická stránka — stačí otvoriť `index.html` alebo nasadiť na akýkoľvek hosting.

## Cviky (databáza)

**360 cvikov, každý postavený na konkrétnu tému.** Databáza je matica
**15 tém × 3 časti (PČ/HČ/ZČ) × vekové pásma** — každá zo 45 kombinácií
téma×časť má 7–9 cvikov pokrývajúcich celý rozsah U6 – U19.

Každý cvik má kompletnú metodickú štruktúru:

| pole | čo obsahuje |
|---|---|
| `why` | jedna veta — čo sa tým prenáša do zápasu |
| `setup` | rozostavenie hráčov a pomôcok |
| `steps` | priebeh cviku |
| `constraints` | pravidlo, ktoré hráča núti robiť tému (constraints-led approach) |
| `progression` / `regression` | sťaženie pre lepších, zjednodušenie pre slabších |
| `coach` | na čo sa tréner sústredí |
| `load` | dávkovanie — série, opakovania, pauzy |

**Cvik musí sedieť k téme.** Nie je to len štítok — pravidlo cviku (`constraints`)
je vždy postavené tak, aby hráča do danej témy prinútilo. Napr. v téme
*Prienikovou prihrávkou* sa bod počíta len za prihrávku, ktorá prešla **pomedzi
dvoch súperov**; v téme *Rýchlym vedením lopty* len za priestor prekonaný
**vedením**, nie prihrávkou. Kontroluje to skript `scripts/audit_db.py`.

**Veková primeranosť:** cvik pre U6 je iná hra než cvik pre U18, aj keď je téma
rovnaká. Pásma sú U6–U9 (foundation), U9–U13, U12–U16, U13–U17 a U16–U19 (pro).
Generátor ukáže najprv cviky presne pre zvolenú kategóriu, potom cviky z blízkych
kategórií (±2 roky) označené štítkom „blízka kategória“.

**Nákresy:** ku každému cviku sa generuje nákres ihriska (`scripts/diagram.js`).
Šablóna sa vyberá váhovanými pravidlami podľa názvu, témy a popisu, rozostavenie
podľa formátu (4v1, 8v8+3), počtu hráčov, zón a bránok. Každý cvik má vlastný
„seed“ z `id` + názvu — **všetkých 360 nákresov je odlišných** a zároveň stabilných
(pri každom načítaní rovnaký). Rovnaký generátor beží v appke (tmavá paleta)
aj v PDF (svetlá). Kontroluje to `scripts/audit_diagrams.js`.

### Ako sa databáza skladá

Zdroj pravdy sú súbory v `data/`, `exercises.json` je zostavený výstup:

```
data/elite_foundation.json      45 cvikov  (U7–U11)
data/elite_development.json     45 cvikov  (U12–U15)
data/elite_pro.json             45 cvikov  (U16–U19)
data/temy/tema_01..15.json     180 cvikov  (12 na tému: 3 časti × 4 pásma)
data/temy/tema_16..17_u6*.json  45 cvikov  (najmladšia kategória)
```

```bash
python3 scripts/build_db.py     # zloží data/ -> exercises.json + skontroluje polia
python3 scripts/inject.py       # vloží dáta a nákresy do index.html
python3 scripts/audit_db.py     # sedí každý cvik k téme? pokrytie kategórií?
node    scripts/audit_diagrams.js  # sedí nákres k téme? je unikátny?
```

### Vlastné cviky cez Excel

1. Vyplň `cviky-sablona.xlsx` (hárok „Cviky“, 22 stĺpcov s rozbaľovacími zoznamami,
   vzorový riadok ukazuje očakávanú kvalitu).
2. ```bash
   python3 scripts/excel_to_json.py   # -> data/temy/tema_90_excel.json
   python3 scripts/build_db.py && python3 scripts/inject.py
   ```
   Skript upozorní na cviky, ktorým chýbajú povinné polia — tie sa do appky nedostanú.
   Ostatné sady zostávajú nedotknuté.
3. Commitni a pushni — appka má cviky okamžite.

**PDF databáza:** `cviky-databaza.pdf` — všetkých 360 cvikov s nákresmi na tlač.

## Ďalšie kroky

- Reálny backend + platobná brána (predplatné Pro).
- Drag & drop upload Excelu priamo v admine (namiesto skriptu).
- Kombinačný engine (skladanie viacerých cvikov do jednej jednotky).
- Správa klubu (tímy, hráči, dochádzka), ročný plán.
