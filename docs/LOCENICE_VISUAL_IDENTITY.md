# Ločenice — písčitý borový les

Tento PR mění pouze vizuální identitu Ločenic a přidává deterministickou screenshot evidence scénu. Cíl levelu, vzorky, farmer patrol, exit a gameplay logika zůstávají beze změny.

## Tři povinné vizuální znaky

1. **Světlý písek**
   - základ terénu je světle béžový až pískový, ne zelenošedá louka;
   - široké světlé písečné police rozbíjejí povrch;
   - původní široká cesta je zúžená na mělkou vyšlapanou písečnou stopu.

2. **Řídké borovice**
   - kampaň stále používá stejné náhodné pozice a stejný počet borovic;
   - koruny jsou užší a kmen je čitelnější, takže mezi stromy zůstává více vizuálně otevřeného písku;
   - tři pevné tvarové varianty mění siluetu bez dalšího náhodného volání.

3. **Jehličí a odkryté kořeny**
   - pískový podklad má deterministické krátké tahy jehličí;
   - každá třetí campaign borovice má vizuálně odkryté kořeny;
   - kořeny, jehličí ani travní ostrůvky nemají collision ani gameplay funkci.

## Zachovaný gameplay

- `generateLocenice()` dál vytváří stejné množství borovic, písečných valů, pískových profilů a padlých kmenů;
- souřadnice 9 identifikačních vzorků jsou beze změny;
- farmer patrol: stejná trasa, rychlost i vision;
- exit zůstává na původní world pozici;
- nové `rooted` / `variant` atributy nepřidávají žádné další `Math.random()` volání, takže pořadí random generování se nemění.

## Stabilní QA

Běžný Ločenice layout používá `Math.random()`, proto není vhodný jako pevná fingerprint baseline. Debug-only `startLoceniceReference()` vytvoří deterministickou referenční scénu ze stejných rendererů a stejného `drawMeadow()`:
- světlý písek;
- čtyři pevně umístěné borovice;
- dva explicitně odkryté kořenové systémy;
- pískový val;
- padlý kmen;
- cedule Ločenice;
- hráč pro kontrolu měřítka.

Povinná evidence: `locenice-identity` na desktopu, iPhone portrait a iPhone landscape. Fingerprinty se zmrazí až po skutečné vizuální kontrole candidate artifactů.
