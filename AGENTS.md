# AGENTS.md — závazné řízení pokračující v5.4

Platí pro celý repozitář po výslovném rozhodnutí vlastníka ze 7. 9. 2026.

## Autorita a produktový směr

1. Aktuální výslovné zadání Romana.
2. Tento soubor a aktivní GitHub issue.
3. README, CHANGELOG a ověřené testy této větve.
4. Starší dokumentace, větve a ZIP balíčky.

Vlastník výslovně rozhodl nahradit v6.2.0 opravenou v5.4.1 a pokračovat v jejím dokončení. Modulární Three.js v6.2.0 je od tohoto rozhodnutí historická verze, nikoli cílová architektura.

## Jediný zdroj pravdy

- `main` je jediná zveřejnitelná větev.
- Každá změna vzniká z aktuálního `main` ve větvi `agent/<jedno-tema>` a končí kontrolovatelným PR.
- Žádné přímé commity do `main` a žádné sloučení bez výslovného souhlasu vlastníka pro konkrétní PR a aktuální head SHA.
- ZIP je vstup nebo archiv; po importu rozhodují soubory, commity, testy a PR v tomto repozitáři.

## Cílový rozsah v5.4

- Statická browser hra pro GitHub Pages, desktop i mobil.
- Jeden Canvas 2D runtime v `game.js` a HTML/CSS UI nad canvasem.
- Pět kapitol: Chlum, Ločenice, Nesměň, Besednice a Malše/KD Slávie.
- Pohyb a jedno kontextové akční tlačítko.
- Ukládání rozehrané výpravy a lokálních rekordů v `localStorage` s bezpečnou migrací starších save klíčů.
- PWA/offline distribuční cache v `sw.js`; gameplay stav zůstává pouze v `localStorage`.

## Povinné ověření změny

- `npm run validate`;
- `npm run test:browser` pro desktop, iPhone portrait a iPhone landscape;
- všech pět levelů se spustí bez runtime chyby;
- pauza, ztráta fokusu a změna obrazovky uvolní ovládání;
- starý nebo poškozený save nesmí shodit hru;
- vizuální změna vyžaduje porovnání výsledku v dotčeném viewportu.
