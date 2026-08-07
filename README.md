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

> ⚠️ Cviky (drilly) sú zatiaľ placeholdery — štruktúra a rozdelenie tréningov funguje,
> konkrétne cviky (popis/video/diagram) sa doplnia do databázy neskôr.
> Právne texty sú vzory — pred spustením doplniť reálne údaje a dať skontrolovať právnikovi.

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

**Aktuálne v databáze: 139 cvikov** (PČ 45 · HČ 49 · ZČ 45) — každá z 15 tém má aspoň
3 cviky v každej časti. Prehľad v `cviky-databaza.pdf`.

Cviky sú dáta v `exercises.json` a súčasne vložené v `index.html` medzi značkami
`__EXERCISES_START__/__EXERCISES_END__` (aby fungovali aj v single-file náhľade).
Generátor pre danú tému + časť zobrazí reálne cviky (podľa `theme` alebo `skill`);
ak pre tému/časť ešte žiadne nie sú, použije dočasné placeholder varianty.

**Nákresy:** ku každému cviku sa automaticky generuje nákres ihriska (`scripts/diagram.js`)
— kužele, hráči, brániaci, prihrávky a pohyb. Šablóna sa vyberá podľa názvu, témy a popisu
cviku. Rovnaký generátor sa používa v appke (tmavá paleta) aj v PDF (svetlá).

**Hromadné nahrávanie:**
1. Vyplň `cviky-sablona.xlsx` (hárok „Cviky“, rozbaľovacie zoznamy).
2. Spusti prevodník a vlož dáta do appky:
   ```bash
   python3 scripts/excel_to_json.py
   python3 scripts/inject.py
   ```
   Prepíše `exercises.json` a vloží dáta do `index.html`. Excel je zdroj pravdy.
3. Commitni a pushni — appka má cviky okamžite.

Pár cvikov na časť stačí: generátor ich kombinuje (6+6+6 = 216 tréningov na tému).

## Ďalšie kroky

- Reálny backend + platobná brána (predplatné Pro).
- Drag & drop upload Excelu priamo v admine (namiesto skriptu).
- Kombinačný engine (skladanie viacerých cvikov do jednej jednotky).
- Správa klubu (tímy, hráči, dochádzka), ročný plán.
