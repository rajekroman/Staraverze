# Budovy — statek v Chlumu a lesní chata v Nesměni

Tento PR mění pouze kresbu props `farm` a `hut`. World pozice, gameplay, průchodnost, NPC a questy zůstávají beze změny.

## Statek v Chlumu

- světlá omítaná fasáda s odlišitelným kamenným soklem;
- hluboké dveře o výšce 44 lokálních jednotek, aby v referenčním měřítku působily věrohodně vůči dospělé postavě;
- dvě dělená okna se špaletou/parapetem;
- sedlová tašková střecha s čitelnými řadami tašek a boční plochou;
- kontaktní stín, sokl a pravá boční stěna vytvářejí objem;
- jemné pevné opotřebení omítky, bez frame-random šumu.

## Lesní chata v Nesměni

- menší dřevěná konstrukce;
- vodorovné spáry trámů/prken a svislé vazby materiálu;
- nižší asymetrická střecha;
- samostatný komín pro odlišnou siluetu;
- dřevěné dveře a dvě menší dělená okna;
- tvarově i materiálově odlišná od statku, ne pouze jinou barvou.

## Měřítko a gameplay

- původní gameplay `scale` v kampani se nemění: statek Chlum `.82`, chata Nesměň `.9`;
- renderer používá oddělený `visualScale`: statek `2.5`, chata `2.25`, aby budovy nepůsobily jako modely vůči hráči;
- referenční statek zůstává `scale: 3.0` bez dodatečného `visualScale`;
- `visualScale` neovlivňuje world souřadnice ani collision logiku;
- změna rendereru nepřidává ani nemění žádnou collision geometrii;
- world souřadnice budov a hráče v kampani se nemění.

## Povinná evidence

- statek Chlum: hráč před/za, desktop + iPhone portrait + iPhone landscape;
- chata Nesměň: hráč před/za, stejné tři viewporty;
- aktualizovaná společná scale-reference;
- statický PR nemá vlastní motion recording; stávající tractor/excavator/car motion joby zůstávají v CI jako regresní kontrola.

Nové fingerprinty se zmrazí až po skutečné vizuální kontrole candidate artifactů.
