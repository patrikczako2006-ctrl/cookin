#!/usr/bin/env python3
"""
Hlavná časť tréningu musí mať smer, bránku a prechod — nie držanie lopty
v štvorci. Tento skript prepíše cviky HČ, ktoré boli postavené ako poziční
hra / rondo bez bránok, na smerové hry so zakončením. Body za držanie a
prenosy zostávajú, ale hra vždy končí bránkou.

    python3 scripts/patch_hc.py && python3 scripts/build_db.py \
      && node scripts/build_scenes.js && python3 scripts/inject.py
"""
import json, glob, os, sys

P = {}

def d(idx, **kw):
    P[idx] = kw

# ---------------------------------------------------------------- U6 – U9
d("P113",
  name="Päť prihrávok a hneď na bránku 4v4",
  space="30×24 m",
  gear="4 malé bránky, rozlišováky, lopty",
  why="Dieťa sa má naučiť, že prihrávanie nie je cieľ — je to spôsob, ako sa dostať k bránke. Preto sa každá séria prihrávok končí zakončením, nie tlieskaním.",
  setup="Hra 4v4 na dvoje malé bránky na každej strane. Každý tím útočí na dve bránky súpera.",
  steps="Hrá sa normálna hra. Keď tím dá tri prihrávky v rade, tréner zavolá „TERAZ!“ a tím má osem sekúnd na zakončenie — gól z tejto akcie sa počíta dvojnásobne.",
  constraints="Dve bránky na každej strane nútia deti dvíhať hlavu a prehadzovať hru na voľnú stranu.",
  progression="Po troch prihrávkach musí prísť prihrávka vpred, inak sa počítanie začína od nuly.",
  regression="Zrátaj dve prihrávky namiesto troch a nedávaj časový limit.",
  coach="Po prihrávke sa hneď pozri dopredu. Prihrávaj tam, kde je miesto, nie tam, kde je kamarát.",
  load="4×4 min, medzi hrami 90 s pitný režim a jedna veta spätnej väzby.")

d("M029",
  name="Prenes loptu a zakonči 4v2",
  space="26×20 m",
  gear="2 malé bránky, méty, rozlišováky",
  why="Malé dieťa pochopí prenos hry vtedy, keď za ním hneď nasleduje odmena — voľná bránka na druhej strane.",
  setup="Priestor rozdelený métami na dve polovice, na každom konci jedna malá bránka. Hrá sa 4v2, obrancovia sú vždy len v tej polovici, kde je lopta.",
  steps="Štvorica si prihráva v jednej polovici. Keď obrancovia pritlačia, musí loptu preniesť na druhú polovicu — tam je voľno a hneď sa strieľa na bránku.",
  constraints="Obrancovia smú do druhej polovice až vtedy, keď tam doletí lopta — vzniká prečíslenie, ktoré treba využiť rýchlo.",
  progression="Prenos musí byť prihrávkou po zemi, nie vedením.",
  regression="Zväčši polovice a nechaj brániť len jedného.",
  coach="Keď sa na teba valí súper, pozri na druhú stranu. Po prenose sa strieľa, nie prihráva dokola.",
  load="6×2 min, po každej sérii výmena obrancov.")

d("N113",
  name="Domček s dvoma bránkami 4v2",
  space="24×20 m",
  gear="2 malé bránky, rozlišováky, lopty",
  why="Držanie lopty má pre dieťa zmysel až vtedy, keď vidí, načo mu je. Tu má prihrávanie priamy dôsledok: voľnú bránku.",
  setup="Hra 4v2 v ohraničenom priestore, na oboch koncoch jedna malá bránka. Štvorica útočí na obe.",
  steps="Štvorica si prihráva a hľadá moment, kedy je jedna z bránok voľná. Tri prihrávky v rade otvárajú možnosť streľby. Kto stratí loptu, ide brániť.",
  constraints="Gól platí len po prihrávke — nie po sólovej akcii cez celé ihrisko.",
  progression="Po zisku lopty majú obrancovia päť sekúnd na zakončenie do ktorejkoľvek bránky.",
  regression="Zrátaj dve prihrávky a zväčši bránky.",
  coach="Neutekaj s loptou — pozri, kto je voľný. Po prihrávke sa hneď pohni na nové miesto.",
  load="5×2,5 min, medzi sériami 60 s.")

# ---------------------------------------------------------------- U9 – U12
d("E023",
  name="Štyria proti jednému a hneď na bránku",
  space="26×20 m",
  gear="2 malé bránky, rozlišováky, lopty",
  why="Hra na jeden dotyk má zmysel vtedy, keď otvorí cestu k bránke. Preto sa tu každá narážačka končí zakončením, nie ďalšou prihrávkou dokola.",
  setup="Štyria útočníci proti jednému obrancovi v priestore s dvoma malými bránkami na koncoch.",
  steps="Štvorica hľadá narážačku alebo hru na tretieho, ktorá obranca vyradí z hry, a hneď zakončuje do voľnej bránky. Po góle alebo strate ide strelec brániť.",
  constraints="Gól platí len vtedy, keď poslednej prihrávke predchádzal dotyk tretieho hráča — samotná narážačka vo dvojici nestačí.",
  progression="Maximálne dva dotyky; po strate má obranca tri sekundy na zakončenie.",
  regression="Pridaj druhého útočníka navyše a zruš pravidlo o treťom hráčovi.",
  coach="Narážačka nie je cieľ — je to spôsob, ako obísť obrancu. Po nej hneď hlava hore na bránku.",
  load="6×2 min, po každej sérii výmena obrancu.")

d("N090",
  name="Päť proti dvom s prienikom na bránku",
  space="30×22 m",
  gear="2 bránky + brankári, rozlišováky",
  why="Hra na jeden dotyk pod tlakom dvoch súperov je najbližšie k tomu, čo hráč zažije v zápase pred pokutovým územím.",
  setup="Piati útočníci proti dvom obrancom, na oboch koncoch bránka s brankárom.",
  steps="Päťka hľadá prihrávku cez stred medzi obrancov. Keď ju trafí, má šesť sekúnd na zakončenie do ktorejkoľvek bránky.",
  constraints="Najviac dva dotyky. Prihrávka cez stred medzi obrancami otvára šesťsekundové okno na zakončenie.",
  progression="Jeden dotyk pre všetkých okrem hráča, ktorý strieľa.",
  regression="Tri dotyky a len jeden obranca.",
  coach="Sleduj, kedy sa obrancovia roztiahnu — vtedy ide lopta cez stred. Po prieniku už len rýchlo dokonči.",
  load="6×2 min, obrancovia sa striedajú po každej sérii.")

d("E029",
  name="Prenos a zakončenie 5v3",
  space="36×26 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Zmena strany hry je v modernom futbale hlavný nástroj, ako otvoriť obranu. Tu má okamžitú odmenu — voľný priestor a bránku.",
  setup="Priestor rozdelený na dve polovice, na koncoch bránky s brankármi. V polovici s loptou sa hrá 5v3, v druhej čakajú traja ďalší obrancovia.",
  steps="Päťka drží loptu, kým sa neotvorí prenos na druhú polovicu. Po prenose tam pokračuje hra a tím má osem sekúnd na zakončenie, kým dobehnú obrancovia.",
  constraints="Prenos musí byť prihrávkou, nie vedením — trénuje sa rýchla zmena strany hry.",
  progression="Prenos musí prísť do troch prihrávok od zisku lopty.",
  regression="Predĺž okno na zakončenie na dvanásť sekúnd.",
  coach="Skenuj ešte pred prijatím lopty — vieš, kam pôjde prenos, prv než ju dostaneš.",
  load="5×3 min, medzi sériami 75 s.")

d("N114",
  name="Dve polovice a dve bránky 5v3",
  space="38×26 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Hráč sa učí rozpoznať moment, kedy držanie lopty prestáva mať zmysel a treba ísť dopredu.",
  setup="Dve polovice, v každej bránka s brankárom. Hra 5v3, v druhej polovici čakajú traja obrancovia.",
  steps="Po šiestich prihrávkach musí tím preniesť loptu do druhej polovice a tam do ôsmich sekúnd zakončiť. Ak to nestihne, lopta ide brankárovi súpera.",
  constraints="Nikto nesmie prejsť do druhej polovice skôr než lopta — kto vybehne, jeho tím prichádza o bod.",
  progression="Prenos až po ôsmich prihrávkach, ale okno na zakončenie len šesť sekúnd.",
  regression="Štyri prihrávky a desať sekúnd na zakončenie.",
  coach="Prihrávaj, kým sa neotvorí cesta. Keď sa otvorí, nečakaj — hraj dopredu.",
  load="5×3 min, obrancovia sa striedajú.")

d("P114",
  name="Šírka, prenos a zakončenie 5v5+2",
  space="42×30 m",
  gear="2 bránky + brankári, rozlišováky",
  why="Neutráli na krajoch držia šírku. Hráč sa učí, že šírka nie je ozdoba — je to cesta, ako obranu roztiahnuť a prejsť stredom na bránku.",
  setup="Hra 5v5 s dvoma neutrálmi na postranných čiarach, na koncoch bránky s brankármi.",
  steps="Tím s loptou hrá 7v5. Prenos z jedného neutrála na druhého otvára šesťsekundové okno, v ktorom sa má zakončiť.",
  constraints="Neutrál hrá na dva dotyky a nesmie skórovať — jeho úlohou je otvoriť hru, nie ju dokončiť.",
  progression="Gól po prenose cez oboch neutrálov platí dvojnásobne.",
  regression="Neutrálom povoľ tri dotyky a zruš časové okno.",
  coach="Keď sa hra zasekne v strede, hľadaj kraj. Po prenose sa útočí okamžite, kým je obrana v pohybe.",
  load="5×4 min, neutráli sa striedajú po každej sérii.")

# ---------------------------------------------------------------- U12 – U15
d("E059",
  name="Prvý dotyk vpred 6v6+3 na bránky",
  space="45×34 m",
  gear="2 bránky + brankári, rozlišováky",
  why="Otvorený prvý dotyk sa oplatí len vtedy, keď za ním nasleduje postup dopredu. S bránkami má hráč dôvod otvárať telo, nie sa točiť dozadu.",
  setup="Hra 6v6 s tromi neutrálmi, ktorí hrajú vždy s tímom pri lopte. Na koncoch bránky s brankármi.",
  steps="Tím s loptou hrá 9v6 a hľadá cestu cez strednú zónu k bránke. Gól po prihrávke, ktorú hráč prijal otvoreným telom smerom dopredu, platí dvojnásobne.",
  constraints="Hráč, ktorý prijme loptu chrbtom k bránke súpera, smie zahrať len dozadu — otvorené telo sa mu vyplatí.",
  progression="Neutráli na dva dotyky.",
  regression="Štyria neutráli a zrušené pravidlo o otvorenom tele.",
  coach="Skenuj pred prijatím. Postav sa tak, aby si videl obe bránky, nie len svojho nahrávača.",
  load="4×5 min, medzi hrami 2 min.")

d("P067",
  name="Dva dotyky a prienik 6v6+2",
  space="44×32 m",
  gear="2 bránky + brankári, rozlišováky",
  why="Obmedzenie na dva dotyky núti hráča rozhodnúť sa skôr, než dostane loptu. S bránkami sa z toho stáva zápasová zručnosť, nie cvičenie.",
  setup="Hra 6v6 s dvoma neutrálmi, na koncoch bránky s brankármi.",
  steps="Hrá sa na maximálne dva dotyky. Za osem prihrávok v rade je bod, za gól tri body — tím si musí vybrať, kedy prestane držať a pôjde dopredu.",
  constraints="Hráč, ktorý dá gól z prvého dotyku, pridáva tímu bod navyše.",
  progression="Jeden dotyk v poslednej tretine.",
  regression="Tri dotyky a bez bodovania za prihrávky.",
  coach="Rozhodni sa prv, než ti príde lopta. Prvý dotyk smerom, kam chceš hrať.",
  load="4×5 min, medzi hrami 2 min.")

d("N115",
  name="Tri zóny a zakončenie 6v6+2",
  space="48×34 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Postup po zónach je spôsob, ako hráča naučiť, že sa hrá dopredu vtedy, keď je cesta otvorená — nie vždy a nie nikdy.",
  setup="Priestor rozdelený na tri zóny, na koncoch bránky s brankármi. Hra 6v6 s dvoma neutrálmi.",
  steps="Tím zbiera body: bod za prenos cez všetky tri zóny, tri body za gól. Gól po prenose cez tri zóny bez straty lopty platí za päť bodov.",
  constraints="V strednej zóne smú byť naraz najviac traja hráči jedného tímu — vzniká priestor na prienik.",
  progression="Prechod do útočnej zóny len prihrávkou, nie vedením.",
  regression="Zruš limit hráčov v strednej zóne.",
  coach="Neponáhľaj sa cez zónu, keď je zatvorená. Keď sa otvorí, choď naplno.",
  load="4×5 min, medzi hrami 2 min.")

d("P115",
  name="Istenie a rýchly protiútok 6v6+2",
  space="46×34 m",
  gear="2 bránky + brankári, rozlišováky",
  why="Rest defence — postavenie za loptou v momente útoku — rozhoduje o tom, či po strate dostaneš gól alebo loptu získaš späť. Trénuje sa len tam, kde sa dá skutočne inkasovať.",
  setup="Hra 6v6 s dvoma neutrálmi, na koncoch bránky s brankármi.",
  steps="Tím útočí normálne, ale traja určení hráči musia byť v každom momente za úrovňou lopty. Po strate má súper šesť sekúnd na protiútok — vtedy sa ukáže, či istenie fungovalo.",
  constraints="Ak tím inkasuje gól v šesťsekundovom okne po vlastnej strate, gól platí dvojnásobne.",
  progression="Istiaci hráči len dvaja.",
  regression="Predĺž okno na desať sekúnd a nechaj štyroch istiacich.",
  coach="Keď útočíme, niekto už musí myslieť na to, čo príde po strate. Postav sa tak, aby si vedel spomaliť prvú prihrávku súpera.",
  load="5×4 min, medzi hrami 90 s.")

# ---------------------------------------------------------------- U16 – U19
d("E104",
  name="Tri zóny, prienik a zakončenie 8v8+3",
  space="60×44 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="V mužskom futbale rozhoduje, či hráč vie prijať loptu otvorene medzi líniami. Zóny mu ukážu, kde ten priestor je.",
  setup="Priestor rozdelený na tri zóny, na koncoch bránky s brankármi. Hra 8v8 s tromi neutrálmi, ktorí hrajú vždy s tímom pri lopte.",
  steps="Tím postupuje cez zóny k bránke. Prihrávka do strednej zóny, ktorú hráč prijme otvoreným telom a zahrá vpred, otvára osemsekundové okno na zakončenie.",
  constraints="V strednej zóne sa smie hrať najviac na dva dotyky — tam nie je čas na spracovanie a rozmýšľanie zvlášť.",
  progression="Gól musí prísť do troch prihrávok od prevzatia v strednej zóne.",
  regression="Tri dotyky v strednej zóne a dlhšie okno.",
  coach="Pozri sa cez rameno ešte pred prihrávkou. Prvý dotyk von z tlaku, druhý dopredu.",
  load="4×6 min, medzi hrami 2,5 min.")

d("E119",
  name="Štyri zóny a dlhý prenos 10v10+3",
  space="72×50 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Na veľkom priestore sa ukáže, či tím vie zmeniť stranu hry rýchlo a presne — to je v zápase najspoľahlivejší spôsob, ako rozbiť organizovanú obranu.",
  setup="Štyri pozdĺžne zóny, na koncoch bránky s brankármi. Hra 10v10 s tromi neutrálmi.",
  steps="Tím zbiera body za prenos do najvzdialenejšej zóny a za gól. Gól, ktorému predchádzal prenos cez tri zóny, platí za päť bodov.",
  constraints="Prenos musí prísť do dvoch dotykov — inak sa obrana stihne presunúť.",
  progression="Po prenose má tím len šesť sekúnd na zakončenie.",
  regression="Zruš limit dotykov pri prenose.",
  coach="Hlavu hore ešte pred prijatím lopty. Prenos nie je záchrana — je to zbraň.",
  load="4×7 min, medzi hrami 3 min.")

d("N056",
  name="Prenos a zakončenie 8v8+3",
  space="62×44 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Otvorené telo pri prijatí na opačnej strane ihriska je rozdiel medzi prenosom, ktorý niekam vedie, a prenosom, po ktorom hráme dozadu.",
  setup="Hra 8v8 s tromi neutrálmi, krajné zóny vyznačené métami, na koncoch bránky s brankármi.",
  steps="Tím získa bod za prenos hry z jednej krajnej zóny do druhej. Prijímajúci hráč musí loptu otvoriť prvým dotykom smerom k bránke — vtedy má tím šesť sekúnd na zakončenie.",
  constraints="Prijatie zatvoreným telom ruší bod aj šesťsekundové okno.",
  progression="Prenos musí prísť do dvoch prihrávok.",
  regression="Dlhšie okno na zakončenie a bez podmienky otvoreného tela.",
  coach="Kým letí lopta, už sa otáčaj. Prvý dotyk ťa má postaviť tvárou k bránke.",
  load="4×6 min, medzi hrami 2,5 min.")

d("N092",
  name="Reťaz na jeden dotyk a gól 8v8",
  space="60×42 m",
  gear="2 bránky + brankári, rozlišováky",
  why="Tretí hráč v kombinácii je to, čo obranu skutočne rozbije. Na jeden dotyk sa to dá len vtedy, keď hráči vidia riešenie skôr, než príde lopta.",
  setup="Hra 8v8 na dve bránky s brankármi, maximálne dva dotyky.",
  steps="Tím získa bod za kombináciu troch hráčov na jeden dotyk, ktorá posunie loptu o zónu dopredu. Gól, ktorý z takej kombinácie vzíde, platí dvojnásobne.",
  constraints="V poslednej tretine sa hrá na jeden dotyk — tam už niet času.",
  progression="Kombinácia sa počíta len vtedy, keď jej súčasťou je hra na tretieho.",
  regression="Tri dotyky a bez limitu v poslednej tretine.",
  coach="Skenuj pred prijatím. Prihraj tam, kde spoluhráč bude, nie kde stojí.",
  load="4×6 min, medzi hrami 2,5 min.")

d("N116",
  name="Prenosy a povinná prihrávka vpred 10v10+3",
  space="70×50 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Držanie lopty bez postupu je slepá ulička. Pravidlo o povinnej prihrávke vpred núti tím hľadať cestu, nie pohodlie.",
  setup="Hra 10v10 s tromi neutrálmi, zóny vyznačené métami, na koncoch bránky s brankármi.",
  steps="Tím zbiera body za prenosy medzi zónami a za góly. Po desiatich prihrávkach musí prísť prihrávka vpred alebo streľba, inak lopta prechádza súperovi.",
  constraints="Prihrávka vpred sa počíta len vtedy, keď prekročí aspoň jednu líniu súpera.",
  progression="Limit zníž na sedem prihrávok.",
  regression="Limit zvýš na pätnásť.",
  coach="Drž loptu dovtedy, kým sa neotvorí cesta. Keď sa otvorí, hraj ju — druhýkrát už tam nebude.",
  load="4×7 min, medzi hrami 3 min.")

d("E074",
  name="Prenos hry a rýchle zakončenie 8v8+2",
  space="64×46 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Rýchly prenos z jednej strany na druhú je najspoľahlivejší spôsob, ako dostať obranu z rovnováhy — ale len vtedy, keď po ňom nasleduje útok, nie ďalšia prihrávka dozadu.",
  setup="Krajné zóny vyznačené métami, na koncoch bránky s brankármi. Hra 8v8 s dvoma neutrálmi.",
  steps="Tím zbiera body za prenos z jednej krajnej zóny do druhej. Prenos do troch prihrávok dáva dva body a otvára šesťsekundové okno na zakončenie.",
  constraints="Po prenose sa musí prvá akcia viesť dopredu — prihrávka dozadu ruší okno.",
  progression="Prenos musí prísť do dvoch prihrávok.",
  regression="Štyri prihrávky na prenos a bez okna.",
  coach="Ešte kým je lopta na druhej strane, pozri sa, kde budeš mať priestor. Po prenose sa útočí, nie upratuje.",
  load="4×6 min, medzi hrami 2,5 min.")

d("P104",
  name="Štyri koridory, reťaz a gól",
  space="66×46 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Koridory ukážu hráčovi, čo znamená posunúť loptu o líniu vyššie. Na jeden dotyk je to najrýchlejší spôsob, ako obranu prekonať.",
  setup="Ihrisko rozdelené métami na štyri pozdĺžne koridory, na koncoch bránky s brankármi.",
  steps="Reťaz troch hráčov na jeden dotyk, ktorá posunie loptu o koridor ďalej, dáva dva body. Gól v nasledujúcich ôsmich sekundách platí za päť bodov.",
  constraints="V jednom koridore smú byť naraz najviac traja hráči jedného tímu.",
  progression="Reťaz musí obsahovať hru na tretieho.",
  regression="Dva dotyky namiesto jedného.",
  coach="Telo otvorené tak, aby si videl dva koridory naraz. Prihrávka do koridoru vedľa, nie späť.",
  load="4×6 min, medzi hrami 2,5 min.")

d("P116",
  name="Zákaz dvoch v línii a zakončenie",
  space="64×46 m",
  gear="2 bránky + brankári, méty, rozlišováky",
  why="Dvaja hráči v jednej línii si navzájom berú prihrávku. Keď to hráč raz uvidí na sebe, začne sa pohybovať do iných výšok sám od seba.",
  setup="Hra 9v9 na dve bránky s brankármi, ihrisko rozdelené métami na zóny.",
  steps="Tím zbiera body za prenosy medzi zónami a za góly. Keď stoja dvaja spoluhráči v jednej línii a lopta ide medzi nich, akcia sa ruší a lopta ide súperovi.",
  constraints="Po zisku lopty musí tím do piatich sekúnd zahrať vpred — inak sa vracia k brankárovi.",
  progression="Pravidlo o línii platí aj pre hráčov bez lopty na opačnej strane ihriska.",
  regression="Pravidlo o línii platí len v strednej tretine.",
  coach="Keď je spoluhráč v tvojej línii, jeden z vás sa musí posunúť — vyššie alebo nižšie. Nečakaj, kto to urobí.",
  load="4×6 min, medzi hrami 2,5 min.")

# ---------------------------------------------------------------- honičky v HČ
d("E002",
  name="Chráň loptu a prejdi bránou",
  space="26×20 m",
  gear="8 mét (4 brány), rozlišováky, lopta pre každého",
  why="Krytie lopty samo osebe nič nerieši — má hráčovi kúpiť čas, aby sa dostal tam, kam chce. Preto má tento súboj cieľ, nie len prežitie.",
  setup="Každý hráč má loptu, po obvode sú štyri brány z mét. Dvaja hráči bez lopty sú lovci.",
  steps="Hráč získa bod za každý prechod bránou s loptou pod kontrolou. Lovci sa snažia loptu vyraziť von — komu ju vyrazia, stáva sa lovcom.",
  constraints="Cez tú istú bránu nemožno prejsť dvakrát za sebou — hráč musí loptu preniesť inam.",
  progression="Tri brány namiesto štyroch a traja lovci.",
  regression="Len jeden lovec a päť brán.",
  coach="Telo medzi loptu a súpera, ale oči hore — musíš vidieť, ktorá brána je voľná.",
  load="5×90 s, medzi sériami 45 s voľné žonglovanie.")


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    seen = set()
    # elitné sady nemajú id v súbore — prideľuje sa podľa poradia (ako v build_db.py)
    elite = [(1, "elite_foundation.json"), (46, "elite_development.json"), (91, "elite_pro.json")]
    paths = [(os.path.join(root, "data", f), b) for b, f in elite] + \
            [(p, None) for p in sorted(glob.glob(os.path.join(root, "data", "temy", "tema_*.json")))]
    for path, base in paths:
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
        touched = False
        for i, r in enumerate(rows):
            rid = r.get("id") or (f"E{base + i:03d}" if base else None)
            if rid in P:
                r.update(P[rid]); seen.add(rid); touched = True
        if touched:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(rows, f, ensure_ascii=False, indent=1)
            print("upravené:", os.path.relpath(path, root))
    missing = set(P) - seen
    if missing:
        print("NENÁJDENÉ id:", sorted(missing), file=sys.stderr)
        sys.exit(1)
    print("prepísaných cvikov HČ:", len(seen))


if __name__ == "__main__":
    main()
