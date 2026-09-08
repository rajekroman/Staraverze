# Vizuální referenční pravidla v5.4.2

Tento dokument zavádí první společný referenční rámec pro další vizuální úpravy. Nemění gameplay souřadnice, kolize ani průchodnost. Referenční scéna je dostupná pouze přes debug API a používá stejné Canvas 2D kreslicí primitivy jako hra.

## Jednotka měřítka

Základní jednotka **1 U** je vizuální výška dospělé hráčské postavy od chodidel po vršek hlavy/klobouku. Další objekty se posuzují relativně k ní, ne podle samostatně zvolených pixelových rozměrů.

- dveřní otvor: nejméně **1,10 U** vysoký; postava musí působit, že jím může projít;
- sedací plocha lavičky: přibližně **0,24–0,30 U** nad terénem;
- osobní auto: přibližně **2,3–2,7 U** na délku;
- zemědělský traktor: přibližně **2,4–3,0 U** na délku a **1,25–1,60 U** na výšku kabiny;
- běžný strom: podle druhu zhruba **2,5–4,5 U** viditelné výšky;
- pásový bagr: tělo nejméně **2,2 U** na délku; pracovní rameno může přesahovat na **3–4 U**.

Tyto poměry jsou výtvarný cíl pro herní perspektivu, nikoli technický převod metrů na pixely.

## Perspektiva a kontakt se zemí

- Kotvou objektu je jeho kontakt s terénem na souřadnici `y`; pořadí kreslení před/za hráčem se dál řídí touto kotvou.
- Horní a boční plocha se ukazuje střídmě, aby objekt působil prostorově, ale nezměnil se top-down charakter hry.
- Kontaktní stín zůstává těsně pod chodidly, koly, pásy nebo podstavou objektu.
- Objekt za hráčem se smí částečně překrýt s postavou; objekt před hráčem ji může zakrýt pouze v rozsahu odpovídajícím své fyzické výšce.
- Vizuální zvětšení nesmí samo měnit hitbox ani průchodnost. Změna kolize je samostatné gameplay rozhodnutí a patří do jiného PR.

## Referenční scéna

Debug metoda `window.__lovecDebug.startScaleReference()` vytvoří deterministickou scénu v Chlumu s těmito prvky:

1. dospělá hráčská postava;
2. dům s dveřmi;
3. lavička;
4. osobní auto;
5. traktor;
6. strom;
7. bagr.

Scéna slouží jako společné měřítko pro další PR v pořadí traktor → bagr → auto → domy → drobné rekvizity. Není součástí kampaně a neobsahuje nálezy ani úkolové objekty.

## Slávie

Vizuální test navíc pořizuje deterministický snímek Malše / KD Slávie ve všech třech Chromium viewpor­tech. V tomto PR jde o výchozí obrazovou evidenci. Samotné přepracování historického průčelí bude samostatný PR, aby šlo porovnat změnu bez přimíchání úprav ostatních lokalit.

## Povinné ověření dalších vizuálních PR

- `npm run validate`;
- `npm run test:smoke` ve všech Chromium i WebKit projektech uvedených v `AGENTS.md`;
- `npm run test:offline`;
- `npm run test:visual`;
- kontrola screenshot artefaktů desktop / iPhone portrait / iPhone landscape;
- u pohyblivých objektů navíc krátká evidence rozjezdu, zastavení, otočení a pracovní akce;
- žádné sloučení bez výslovného souhlasu vlastníka.
