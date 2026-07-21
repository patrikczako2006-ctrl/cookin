# Zostava

Webová aplikácia pre trénerov mládeže (U6 – U19). Tréner si vyberie kategóriu a tému
a dostane hotovú tréningovú jednotku podľa metodiky, rozdelenú na časti (PČ / HČ / ZČ),
s konkrétnymi tréningami pre každú časť.

Funkčný jednostránkový web (SPA) — všetko sa deje plynulo bez reloadov, s reálnou navigáciou
(hash router), takže klik otvorí stránku a nič neskáče späť na úvod.

## Čo funguje

- **Generátor tréningov** — kategória → téma → jednotka po častiach so zručnosťami, piliermi a princípmi.
- **Plány Basic a Pro** — Basic ukáže 3 tréningy na každú časť; Pro odomkne všetky (desiatky).
  Zamknuté tréningy vedú na cenník (upsell brána).
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

Cviky sú dáta v `exercises.json` a súčasne vložené v `index.html` medzi značkami
`__EXERCISES_START__/__EXERCISES_END__` (aby fungovali aj v single-file náhľade).
Generátor pre danú tému + časť zobrazí reálne cviky (podľa `theme` alebo `skill`);
ak pre tému/časť ešte žiadne nie sú, použije dočasné placeholder varianty.

**Hromadné nahrávanie:**
1. Vyplň `cviky-sablona.xlsx` (hárok „Cviky“, rozbaľovacie zoznamy).
2. Spusti prevodník:
   ```bash
   python3 scripts/excel_to_json.py
   ```
   Prepíše `exercises.json` a vloží dáta do `index.html`. Excel je zdroj pravdy.
3. Commitni a pushni — appka má cviky okamžite.

Pár cvikov na časť stačí: generátor ich kombinuje (6+6+6 = 216 tréningov na tému).

## Ďalšie kroky

- Reálny backend + platobná brána (predplatné Pro).
- Drag & drop upload Excelu priamo v admine (namiesto skriptu).
- Kombinačný engine (skladanie viacerých cvikov do jednej jednotky).
- Správa klubu (tímy, hráči, dochádzka), ročný plán.
