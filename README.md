# Lovec vltavínů: Na zelené vlně — Reborn 5.4.2

Pokračující vydání vycházející z opraveného balíčku 5.4.1. Na výslovné rozhodnutí vlastníka nahrazuje v repozitáři Staraverze větev vývoje 6.2.0.

## Opraveno
- všechny levely se znovu vykreslí;
- fungují traktory, hlídky, předměty a profily;
- upozornění o krádeži se správně zobrazí a zavře;
- honička v Besednici nezačne pod neprůhledným upozorněním.

## Dokončení ve verzi 5.4.2

- noční Besednice už nevytváří černou vymazanou plochu na neprůhledném canvasu;
- hlavní nabídka je v mobilním landscape režimu celá viditelná a ovladatelná;
- pauza, dialog, minihra a ztráta fokusu bezpečně uvolní dotykový i klávesový pohyb;
- protisměrné klávesy se vyhodnocují správně a mezerník neopakuje akci při podržení;
- staré a poškozené uložené stavy se migrují, omezí na bezpečné hodnoty a neshodí hru;
- Nesměň vynucuje souhlas lesníka před otevřením průzkumného profilu a následné zahrabání řeší samostatnou hold/release minihrou;
- automatické kontroly spouštějí všech pět levelů na desktopu i v obou orientacích iPhonu;
- smoke matrix ověřuje desktop a obě orientace iPhonu v Chromiu i WebKitu jako CI aproximaci Chrome/Safari;
- samostatný offline smoke ověřuje spuštění PWA z cache bez sítě.

## Vývoj a ověření

```sh
npm install
npm test
npm run test:smoke
npm run test:offline
```

Aktuální zjištění, skutečně provedené opravy a neuzavřené release podmínky:
[produkční audit](PRODUCTION_AUDIT.md).

Pro souběžnou práci lze testovacímu serveru zadat vlastní port, například
`PLAYWRIGHT_PORT=4186 npm run test:smoke`. Testy nepřebírají cizí již běžící server.
Při změně distribuovaných souborů je nutné zvýšit revizi `CACHE` v `sw.js`:
základní statické soubory se v rámci jedné revize obsluhují z cache.
