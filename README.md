# Zostava

Webová aplikácia pre trénerov mládeže (U6 – U19). Tréner si vyberie kategóriu a tému
a dostane hotovú tréningovú jednotku podľa metodiky, rozdelenú na časti (PČ / HČ / ZČ),
s konkrétnymi tréningami pre každú časť.

Funkčný jednostránkový web (SPA) — všetko sa deje plynulo bez reloadov, s reálnou navigáciou
(hash router), takže klik otvorí stránku a nič neskáče späť na úvod.

## Čo funguje

- **Generátor tréningov** — kategória → téma → jednotka po častiach so zručnosťami, piliermi a princípmi.
  547 cvikov, na každú kombináciu kategória × téma × časť najmenej dva a spravidla tri rôzne tréningy.
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

**547 cvikov, každý postavený na konkrétnu tému.** Databáza je matica
**15 tém × 3 časti (PČ/HČ/ZČ) × vekové pásma** — každá zo 45 kombinácií
téma×časť má 12–13 cvikov pokrývajúcich celý rozsah U6 – U19.
Žiadna kombinácia kategória × téma × časť nemá menej než dva cviky,
drvivá väčšina má tri.

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

**Moderná metodika.** Novšia časť databázy (180 cvikov, `data/temy/tema_2*_pro_*.json`
a `tema_3*_pro_*.json`) je postavená na tom, ako sa trénuje dnes:

- **prechodová fáza** — šesťsekundové okno po zisku aj po strate lopty,
  counter-pressing a istenie za loptou (rest defence);
- **spúšťače pressingu** — spätná prihrávka, zlý dotyk, lopta na krídlo;
  blok vyráža naraz a na dohodnutý signál, nie náhodne;
- **pozičná hra** — šírka a hĺbka, polopriestory, pravidlo troch možností
  prihrávky, zákaz dvoch hráčov v jednej línii, prenos hry ako spúšťač prieniku;
- **hra na tretieho** — dopredu, späť, cez líniu ako hlavný mechanizmus prieniku;
- **skenovanie** — počítané obzretia pred prijatím lopty;
- **brankár ako hráč v poli** pri zakladaní útoku;
- **scenáre zápasu** — udrž vedenie, doháňaš gól, hra v oslabení, rozhodovanie
  v únave na konci tréningu;
- **rozmery podľa výskumu** — plocha na hráča 60–150 m² podľa toho, či ide
  o techniku, hru alebo prechodovú fázu.

**Veková primeranosť:** cvik pre U6 je iná hra než cvik pre U18, aj keď je téma
rovnaká. Pásma sú U6–U8, U7–U9, U10–U12, U13–U15 a U16–U19.
Generátor ukáže najprv cviky presne pre zvolenú kategóriu, potom cviky z blízkych
kategórií (±2 roky) označené štítkom „blízka kategória“.

**Nákresy:** ku každému cviku patrí nákres v mierke — súradnice sú v metroch,
takže ihrisko 40×30 m vyzerá inak než rondo 12×12 m. Nákres obsahuje čiary ihriska
(pokutové územie, stredová čiara), bránky za bránkovou čiarou aj s brankárom,
zóny s popisom, kužele, figuríny a **číslované poradie akcií**. Štyri typy akcií
sa nedajú zameniť: prihrávka (plná čiara), vedenie lopty (vlnovka), beh bez lopty
(čiarkovaná) a streľba (hrubá).

Nákres sa **nehádа z textu cviku**. Každý cvik má v `data/scenes/*.json` vlastný
predpis — tvar, rozmery, počty hráčov, zóny:

```json
"E017": {"shape":"zones","w":28,"h":22,"att":4,"def":4,"zoneW":3,"into":"pass"}
```

Rozostavenie z predpisu dopočíta `scripts/scenes.js`. Družstvo nestojí náhodne —
má tvar, ktorý dáva vo futbale zmysel (trojuholník, kosoštvorec, 2-3-1), súper
oproti nemu. Šípky sa vedú len tam, kde je čisto: prihrávka pomedzi hráčov (nie
cez nich), dve šípky sa neprekrížia a prihrávka sa nevracia tam, odkiaľ prišla.
Ak zostavený nákres neprejde kontrolou, skúsi sa iné rozloženie.

Tvary: `rondo`, `grid`, `zones`, `ssg`, `finish`, `cross`, `duel`, `gates`,
`pattern`, `press`, `build`, `thru`, `combo`, `back`, `free`, `wave`, `multi`,
`setpiece`. Rovnaký vykresľovač (`scripts/render.js`) beží v appke (tmavá paleta)
aj v PDF (svetlá). Kontroluje to `scripts/audit_diagrams.js` — prvok mimo ihriska,
hráči na sebe, nečitateľne krátka šípka, čiara vedená cez hráča, rozmer nesediaci
s textom cviku a dva rovnaké nákresy.

### Ako sa databáza skladá

Zdroj pravdy sú súbory v `data/`, `exercises.json` je zostavený výstup:

```
data/elite_foundation.json      45 cvikov  (U7–U11)
data/elite_development.json     45 cvikov  (U12–U15)
data/elite_pro.json             45 cvikov  (U16–U19)
data/temy/tema_01..15.json     180 cvikov  (12 na tému: 3 časti × 4 pásma)
data/temy/tema_16..17_u6*.json  45 cvikov  (najmladšia kategória)
data/temy/tema_20..34_pro_*.json 180 cvikov (moderná metodika, 4 vekové pásma)
data/temy/tema_35_u6.json        7 cvikov  (najmladší — doplnenie U6)
data/scenes/*.json             547 predpisov nákresov (jeden na cvik)
```

```bash
python3 scripts/build_db.py        # zloží data/ -> exercises.json + skontroluje polia
node    scripts/build_scenes.js   # zloží data/scenes/ -> scenes.json (nákresy)
python3 scripts/inject.py         # vloží cviky aj nákresy do index.html
python3 scripts/audit_db.py       # sedí každý cvik k téme? pokrytie kategórií?
node    scripts/audit_diagrams.js # je nákres čitateľný a sedí k cviku?
node    scripts/build_pdf.js      # -> cviky-databaza.pdf (svetlá paleta, na tlač)
```

### Vlastné cviky cez Excel

1. Vyplň `cviky-sablona.xlsx` (hárok „Cviky“, 22 stĺpcov s rozbaľovacími zoznamami,
   vzorový riadok ukazuje očakávanú kvalitu).
2. ```bash
   python3 scripts/excel_to_json.py   # -> data/temy/tema_90_excel.json
   python3 scripts/build_db.py && node scripts/build_scenes.js && python3 scripts/inject.py
   ```
   Skript upozorní na cviky, ktorým chýbajú povinné polia — tie sa do appky nedostanú.
   Ostatné sady zostávajú nedotknuté.
3. Commitni a pushni — appka má cviky okamžite.

**PDF databáza:** `cviky-databaza.pdf` — všetkých 547 cvikov s nákresmi na tlač
(zostaví `node scripts/build_pdf.js`).

## Ďalšie kroky

- Reálny backend + platobná brána (predplatné Pro).
- Drag & drop upload Excelu priamo v admine (namiesto skriptu).
- Kombinačný engine (skladanie viacerých cvikov do jednej jednotky).
- Správa klubu (tímy, hráči, dochádzka), ročný plán.
