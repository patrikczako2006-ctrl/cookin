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

**Aktuálne v databáze: 300 cvikov** (PČ 98 · HČ 107 · ZČ 95), z toho **135 elitných**
(Foundation U6–U11 · Development U12–U15 · Pro U16–U19 — každá úroveň pokrýva všetkých 15 tém × 3 časti).

Cviky sú dáta v `exercises.json` a súčasne vložené v `index.html` medzi značkami
`__EXERCISES_START__/__EXERCISES_END__` (aby fungovali aj v single-file náhľade).
Generátor pre danú tému + časť zobrazí reálne cviky (podľa `theme` alebo `skill`);
ak pre tému/časť ešte žiadne nie sú, použije dočasné placeholder varianty.

**Elitná sada (135 cvikov):** postavená podľa metodiky elitných akadémií — každý cvik má
`why` (prenos do zápasu), `setup`, `steps`, `constraints` (podmienky v duchu constraints-led
approach), `progression`/`regression` a `load` (dávkovanie). Zdrojové súbory sú v `data/`.
Pre každú tému existuje iná verzia cviku pre každé vekové pásmo — generátor vyberá tú, ktorá
sedí zvolenej kategórii.

**Filtrovanie podľa veku:** každý cvik má vekový rozsah (napr. `U8–U12`). Generátor ukáže
najprv cviky presne pre zvolenú kategóriu, potom cviky z blízkych kategórií (±2 roky)
označené štítkom „blízka kategória“.

**Nákresy:** ku každému cviku sa automaticky generuje nákres ihriska (`scripts/diagram.js`)
— kužele, hráči, brániaci, prihrávky a pohyb. Z **28 šablón** (slalom, brány, rondo, pozičná hra,
narážačka, kolmica, ofsajd, zakončenie, center, 1v1 s brankárom, malá hra, obranný blok, pressing,
rozohrávka, roh, priamy kop, aut, …) sa vyberá tá, ktorá sedí názvu, téme a popisu cviku
(váhované pravidlá s prioritou — špecifické šablóny prebijú generické).

Každý cvik má vlastný „seed“ odvodený z `id` + názvu, ktorým sa parametrizuje rozostavenie
(počet hráčov a kužeľov, veľkosť zón, strana ihriska, tvar obranného bloku, pozícia lopty…).
Vďaka tomu má **všetkých 300 cvikov vlastný, odlišný nákres** aj keď zdieľajú šablónu, a nákres
je zároveň stabilný — pri každom načítaní vyzerá rovnako. Rovnaký generátor sa používa v appke
(tmavá paleta) aj v PDF (svetlá).

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
