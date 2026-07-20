# Zostava — metodika tréningu mládeže

Nástroj pre trénerov mládeže (U8 – U11). Namiesto náhodného hľadania cvikov po
Instagrame a Facebooku si tréner vyberie **kategóriu** a **tému**, a aplikácia mu
podľa metodiky zostaví **kostru tréningovej jednotky** rozdelenú na časti
(**PČ / HČ / ZČ**) — s jasne danými zručnosťami pre každú časť a s miestom, kam sa
neskôr doplnia konkrétne cviky.

Toto je **základ (v0.1)** — princíp z pôvodného generátora ostáva, dizajn je nový.
Databáza cvikov sa dopĺňa v ďalšom kroku.

## Ako to funguje

1. **Kategória** — vek a dĺžka tréningovej jednotky (A8–A10, G8–G9, G10–G11).
2. **Téma** — čo chce tréner rozvíjať; alebo tlačidlo *Náhodný návrh celku* vyberie
   hotový mikrocyklus (2W/3W) z metodiky.
3. **Výstup** — tréningová jednotka po častiach: PČ (technický základ témy),
   HČ (jadro — herné cvičenia a súboje na tému), ZČ (prenos do hry / SSG). Každá
   časť má odporúčané zručnosti + slot *„Odkiaľ čerpať cviky"*. V hlavičke sú
   rozvíjané piliere a herné princípy; dole súvisiace témy na nadviazanie.

## Spustenie

Statická stránka bez závislostí — stačí otvoriť `index.html` v prehliadači
(alebo nasadiť na akýkoľvek web/hosting, prípadne nahradiť pôvodné `generovat.php`).

## Štruktúra a rozšírenie

Celá appka je v jednom súbore `index.html` (HTML + CSS + JS). Dáta metodiky sú v
`index.html` v bloku `DÁTA METODIKY`:

- `CATEGORIES` — kategórie, počet TJ v týždni a dĺžky.
- `PHASES` — časti tréningovej jednotky (kódy PČ/HČ/ZČ, pomer času). **Ak vaša
  metodika používa iné názvy/rozdelenie častí, upravte len tu.**
- `GROUPS` → `themes` → `skills` — témy zoskupené podľa metodiky a zručnosti k nim.
- `COMBOS` — návrhy celkov (mikrocyklus 2W/3W).
- Piliere (`Futbalovosť`, `Rýchla hra`, `Tvrdá práca`, `Správny charakter`) a princípy.

### Doplnenie cvikov (ďalší krok)

Slot *„Odkiaľ čerpať cviky"* v každej fáze je pripravený na napojenie na databázu
cvikov — každej téme/fáze sa priradí zoznam cvikov (názov, popis, video, diagram).
Miesto je v kóde označené (tlačidlo *Pridať cvik* a text *„databáza cvikov sa dopĺňa"*).

## Zdroj metodiky

Témy, zručnosti, piliere a princípy vychádzajú z koncepcie *Koncepcia 2025*
(prekonanie súpera jednotlivcom/spoluprácou, ovládanie lopty pod tlakom, finálna
fáza, herný systém).
