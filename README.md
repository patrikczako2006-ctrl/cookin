# Zostava

Webová aplikácia pre trénerov mládeže (U8 – U11). Tréner si vyberie kategóriu a tému
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

## Ďalšie kroky

- Reálny backend + platobná brána (predplatné Pro).
- Databáza cvikov priradených k témam a častiam.
- Správa klubu (tímy, hráči, dochádzka), ročný plán.
