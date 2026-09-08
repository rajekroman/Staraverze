# Chlum — zemědělská identita pole

Tento PR mění pouze statickou kresbu terénu Chlumu. Gameplay sběru, souřadnice kamenů, NPC, patrol trasy, collision a questy zůstávají beze změny.

## Tři povinné vizuální znaky

1. **Úvratě**
   - širší udusané plochy u horního a spodního okraje pole;
   - párové stopy kol v místech, kde se technika otáčí;
   - úvratě opticky přerušují rytmus brázd.

2. **Přerušované brázdy a vyjeté koleje**
   - dvě dlouhé párové traktorové trasy procházejí více pásy pole;
   - několik neobdělaných/udusaných plošek rozbíjí pravidelnost;
   - žádná z těchto ploch není hotspot ani diggable hole.

3. **Remízový/mezní okraj**
   - nepravidelný zelený okraj na levé a pravé straně;
   - nízké skupiny keřů čitelné jako remíz, ne dekorativní rám;
   - zachovaný vzdálený stromový horizont.

## Zachované mechaniky

- Chlum zůstává výhradně **povrchový sběr**;
- žádné nové `hotspot`, `pit`, `fieldpit` ani jiné kopací objekty;
- 9 skrytých kamenů, jejich souřadnice a rarity se nemění;
- tractor i farmer patrol mají původní trasu a rychlost;
- statek, NPC Václav a exit zůstávají na původních world souřadnicích;
- `referenceScene` je z nového Chlum overlay výslovně vynechána, takže kalibrační board nemění terénní vzhled.

## Povinná evidence

Candidate musí být skutečně prohlédnut ve třech viewpor­tech:
- `chlum`;
- `chlum-field-identity`;
- `radar`;
- `chlum-tractor-front` / `behind`;
- `chlum-farm-front` / `behind`.

Fingerprinty dotčených Chlum scén se zmrazí až po lidské vizuální kontrole.
