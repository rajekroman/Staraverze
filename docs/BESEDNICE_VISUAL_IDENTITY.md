# Besednice — skalnaté svahy a geologické vrstvy

Tento PR mění vizuální identitu Besednice bez změny questů, clue souřadnic, boss logiky, bagrů, patrol nebo průchodnosti.

## Tři povinné vizuální znaky

1. **Terasovité skalnaté svahy**
   - pět širokých nepravidelných teras rozděluje plochu lomu;
   - hrany nejsou rovné paralelní čáry, ale zvlněné řezy;
   - kamenné úlomky jsou pouze terrain detail bez collision.

2. **Geologická vrstevnatost**
   - každá terasa má tenké světlé/tmavé seam linie;
   - lokální nepravidelné vrstvené plochy rozbíjejí velké jednolité plochy;
   - `earthbank` má tři samostatné materiálové pásy a kamenné inkluze.

3. **Hlubší narušené profily**
   - `minepit` zachovává původní `w`/`h` gameplay data;
   - renderer používá větší vertikální projekci, tmavší jádro a kamenné úlomky na okraji;
   - nejde o změnu dosahu, collision ani logiky kopání.

## Zachovaný gameplay

- 3 clue items a jejich souřadnice beze změny;
- oba bagry: stejné world pozice, scale, pracovní stav i animace;
- digger patrol, exit a boss/chase logika beze změny;
- počet a random generování `earthbank`, `minepit` a `trackscar` beze změny.

## Stabilní QA

Debug-only `startBesedniceReference()` skládá deterministickou geologickou scénu ze stejných rendererů: vrstevnatý terrain, jeden `earthbank`, jeden hlubší `minepit`, stopy auta, tři kameny, lampa, cedule a hráč.

Protože změna terénu mění i pozadí již existujících bagr screenshotů, povinně se znovu kontrolují:
- `besednice-identity`;
- `besednice-excavator-front`;
- `besednice-excavator-behind`;
ve všech třech viewpor­tech.

Celkem 9 fingerprintů se zmrazí až po skutečné vizuální kontrole candidate artifactů.
