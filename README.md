# Lovec vltavínů: Na zelené vlně — Reborn 5.4.2

Pokračující vydání vycházející z opraveného balíčku 5.4.1. Na výslovné rozhodnutí vlastníka nahrazuje v repozitáři Staraverze větev vývoje 6.2.0.

## Opraveno
- všechny levely se znovu vykreslí;
- fungují traktory, hlídky, předměty a profily;
- upozornění o krádeži se správně zobrazí a zavře;
- honička v Besednici nezačne pod neprůhledným upozorněním.

## Dokončení ve verzi 5.4.2

- hlavní nabídka funguje jako herní pozvánka na akci Na zelené vlně 2026 a používá její mint/fialový vizuální systém;
- menu jasně vysvětluje cíl: nasbírat nejkrásnější vltavíny a dorazit s nimi do KD Slavie;
- noční Besednice už nevytváří černou vymazanou plochu na neprůhledném canvasu;
- hlavní nabídka je v mobilním landscape režimu celá viditelná a ovladatelná;
- pauza, dialog, minihra a ztráta fokusu bezpečně uvolní dotykový i klávesový pohyb;
- protisměrné klávesy se vyhodnocují správně a mezerník neopakuje akci při podržení;
- staré a poškozené uložené stavy se migrují, omezí na bezpečné hodnoty a neshodí hru;
- Nesměň vynucuje souhlas lesníka před otevřením průzkumného profilu a následné zahrabání řeší samostatnou hold/release minihrou;
- automatické kontroly spouštějí všech pět levelů na desktopu i v obou orientacích iPhonu;
- smoke matrix ověřuje desktop a obě orientace iPhonu v Chromiu i WebKitu jako CI aproximaci Chrome/Safari;
- samostatný offline smoke ověřuje spuštění PWA z cache bez sítě.
- ambientní zvuk lokalit doplňuje lehká procedurální hudební vrstva s odlišným motivem pro každou kapitolu; po návratu do menu pokračuje vlastní menu motiv bez obcházení autoplay omezení prohlížeče;
- save checkpointy chrání dopadení, radarové odhalení, souhlas lesníka, výsledky minihry, Karlův souboj, pending Expertizu/perky/porotu a rozpracovaný výběr kamenů k certifikaci před reload exploity a softlocky;
- kámen rozlišuje `documented` (doložený původ) a `certified` (konkrétní kus odborně certifikovaný); v Chlumu může hráč původ doložit rozhovorem s Václavem;
- po Besednici následuje Expertiza, v níž se vybere jeden až pět konkrétních kamenů, teprve potom perk a cesta do Malše; vitrína nabízí jen certifikované kusy;
- první vstup do Malše skutečně odehraje krátký střet s Frantou a ztrátu certifikační složky; složka nese ID přesně těch kamenů, které byly vybrány při Expertize, a registrace tuto vazbu ověřuje; pozdější honička se týká oddělené kontrolní složky s podklady k Frantovu vzorku;
- certifikované kameny a povinný Besednický ježek jsou chráněné před náhodnou ztrátou při dopadení;
- ze Slávie byli odstraněni cyklisté a policejní patrol; akce ZASTAVIT na Frantu má prioritní dotykově tolerantní dosah a je pokrytá browserovým testem;
- save schema 2 bezpečně převádí starší stavy: flat save na začátku Malše projde Expertizou, zatímco už rozehraná stará Malše zůstane na místě a dostane deterministický certifikační backfill.

## Vývoj a ověření

```sh
npm install
npm test
npm run test:smoke
npm run test:offline
npm run test:visual
```

### Čistý GitHub Pages publish

```sh
npm run build:publish
npm run validate:publish
npm run test:publish
```

`npm run build:publish` vždy znovu vytvoří ignorovaný adresář `dist/` pouze z explicitního seznamu runtime souborů. GitHub Pages nahrává výhradně tento adresář; testy, nástroje a interní dokumentace zůstávají jen ve zdrojovém repozitáři.

Aktuální zjištění, skutečně provedené opravy a neuzavřené release podmínky:
[produkční audit](PRODUCTION_AUDIT.md).

Pro souběžnou práci lze testovacímu serveru zadat vlastní port, například
`PLAYWRIGHT_PORT=4186 npm run test:smoke`. Testy nepřebírají cizí již běžící server.
Při změně distribuovaných souborů je nutné zvýšit revizi `CACHE` v `sw.js`:
základní statické soubory se v rámci jedné revize obsluhují z cache.

Vizuální regression gate pokrývá menu, Expertizu, Chlum, radar, kopání a další referenční scény na desktopu, iPhone portrait a iPhone landscape. Screenshoty se ukládají jako CI artefakty pro kontrolu změn vzhledu.
