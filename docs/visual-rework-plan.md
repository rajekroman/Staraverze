# Vizuální přepracování celé hry — zadání vlastníka 8. 9. 2026

Rozsah tvoří všech sedm bodů: (1) dospělejší postavy a pohyb, (2) objekty a měřítko, (3) identita pěti lokalit, (4) vrstvený terén a organické výkopy, (5) světlo a materiály, (6) radar a nálezy, (7) UI a katalog sbírky. Slávie je pouze část bodu 3.

## Kontrolovatelné fáze

0. Rozpracovaná Malše / skutečný KD Slávie: fotografické reference, historická fasáda, nábřeží a park; samostatný PR.
1. Referenční Chlum a společné postavy: dospělé proporce, čitelné klouby, vrstvené oblečení a odlišné NPC; kontakt chodidel, přenos váhy, rozběh/zastavení, otočení na místě, idle a pracovní gesta. Zachovat jeden společný pohybový systém.
2. Objekty a měřítko: tříčtvrteční perspektiva, kontaktní i vržené stíny, materiály a překrývání; traktor, bagr, auta, domy a nářadí. Samostatné pohyblivé díly strojů a varianty přírodních rekvizit.
3. Lokality a terén: Chlum bez děr s brázdami a souvratěmi; písčité borové Ločenice; vlhká Nesměň s kořeny, mechem a kapradím; geologická Besednice s hlubšími profily; návazná kontrola Malše. Velké barevné přechody, materiálové skvrny, jemná struktura, reliéf a nepravidelné vrstevnaté výkopy.
4. Světlo a materiály: společný směr světla, měkké stíny, přizpůsobení postav prostředí, atmosférická hloubka a rozlišení kovu, skla, látky, půdy a vegetace.
5. Radar a nálezy: cívka, tyč, kabel a jednotka, návaznost na pohyb, střídmý pulz a kontrolka se zvukem; postupné odhalení a začlenění vltavínů do půdy, nepravidelný lom a průsvitné hrany.
6. UI a sbírka: tlumená přírodní paleta, menší rádiusy a ikony, jemné obrysy, typografie terénního deníku a kvalitnější karty s hmotností, velikostí, lokalitou, barvou a kvalitou; bez vymýšlení chybějících měření.

## Ověření a publikace

Každá fáze: aktuální main a AGENTS.md; nejmenší potřebný zásah do herní logiky; `validate`, smoke ve všech šesti projektech Chromium/WebKit, offline Chromium, vizuální desktop/portrait/landscape a skutečné prohlédnutí snímků. Samostatné kontrolovatelné PR. Sloučení pouze po novém výslovném souhlasu vlastníka. Testy v emulaci nejsou důkazem ověření na fyzickém iPhonu.
