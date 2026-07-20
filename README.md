# Zostava — landing

Cinematic landing page pre **Zostavu** — platformu pre trénerov mládeže (U8 – U11).
Namiesto náhodného hľadania cvikov po Instagrame si tréner vyberie kategóriu a tému
a dostane hotovú tréningovú jednotku podľa metodiky.

Aktuálne ide o **dizajnový základ (landing)**, na ktorom staviame ďalej. Funkcionalita
(generátor, správa klubu, dochádzka, databáza cvikov, ročný plán) sa dopĺňa v ďalších krokoch.

## Dizajn

- Tmavý prémiový „cinematic" vzhľad, akcent zeleno-tyrkysový gradient.
- **Fonty vložené priamo v súbore** (Sora + Manrope, latin + latin-ext pre slovenčinu) — bez externých CDN.
- Efekty: animované canvas pozadie (taktická sieť hráčov reagujúca na myš), parallax,
  scroll-reveal animácie, kinetický hero nadpis, count-up štatistiky, tilt karty, marquee tém.
- Rešpektuje `prefers-reduced-motion`, plne responzívne.

## Spustenie

Statická stránka bez závislostí — stačí otvoriť `index.html` v prehliadači, prípadne nasadiť
na akýkoľvek hosting.

## Ďalšie kroky

- Napojiť generátor tréningov (kategória → téma → jednotka po častiach PČ/HČ/ZČ).
- Prevziať a opraviť funkcie zo `sprava_klubu.php` (správa klubu, tímy, hráči, dochádzka).
- Databáza cvikov priradených k témam a častiam.
