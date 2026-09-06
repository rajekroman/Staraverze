# AGENTS.md — závazné řízení projektu

Platí pro celý repozitář. Cílem je zabránit tomu, aby paralelní AI chaty vytvářely další neslučitelné „finální“ verze.

## Pořadí autority

1. Aktuální výslovné zadání Romana.
2. Tento soubor.
3. `docs/ARCHITECTURE_CONTRACT.md`.
4. `docs/PROJECT_CONTROL.md` a příslušný GitHub issue.
5. Starší README, roadmapy, build reporty a ZIP balíčky.

Při rozporu se zastav a uveď rozpor v PR. Nevytvářej třetí variantu.

## Jediný zdroj pravdy

- `main` je jediná zveřejnitelná větev a musí zůstat hratelná.
- Každý chat pracuje z aktuálního `main` ve větvi `agent/<jedno-tema>`.
- Žádné přímé commity do `main`; změna končí draft PR s odkazem na issue.
- ZIP, sandboxový odkaz ani tvrzení „hotovo“ nejsou předáním práce. Rozhodují soubory, commit, PR a testy v tomto repozitáři.
- Staré větve a balíčky jsou pouze zdroj jednotlivých částí. Nesmějí se použít jako nový základ celého projektu.

## Závazný produktový rozsah

- Browser hra pro desktop i mobil, nasaditelná jako statické soubory na GitHub Pages.
- Cílový renderer: jeden Three.js `WebGLRenderer` s ortografickou kamerou.
- 2D postavy a efekty: transparentní PNG nebo sprite sheets.
- 3D rekvizity: optimalizované low-poly GLB.
- HUD a obrazovky: HTML/CSS nad canvasem.
- Moduly: `GameApp`, fixed-step `GameLoop`, `SceneManager`, `AssetLoader`, `InputManager`, ECS-lite, `CollisionSystem`, `AnimationSystem` a samostatné UI adaptéry.
- Čtyři kanonické kapitoly: Chlum, Nesměň, Besednice a Malše/KD Slavia. Ločenice není samostatný pátý level v cílové verzi.
- Pohyb plus jedno kontextové akční tlačítko. Dialog: přiblížit se a stisknout akci. Kopání: tři úspěšné zásahy do rytmu.
- Bez inventářové obrazovky a bez správy předmětů. Nálezy se pouze započítají do session výsledku a finálního hodnocení.
- Save systém se v cílové architektuře nevyvíjí. Nepřidávej localStorage, migrace save ani pokračování. Existující legacy save kód z verze 5.2 je zmrazený, nesmí být importován do nového bootstrapu a odstraní se spolu s legacy runtime.
- Service worker může zůstat pouze jako distribuční cache; nesmí uchovávat gameplay stav.

## Hranice pracovních proudů

| Proud | Vlastní | Nesmí bez dohody měnit |
|---|---|---|
| Platforma/architektura | `src/core`, `src/ecs`, obecné systémy, bootstrap | obsah levelů, texty, assety |
| Gameplay/data | `src/data`, `src/gameplay`, `src/scenes` | renderer, input internals, workflow |
| Grafika/asset pipeline | `assets`, asset manifest, sprite/model factory | pravidla questů a stav hry |
| UI/mobil | `src/ui`, `src/input`, CSS, safe-area | levelová data a renderer kontrakt |
| Audio/výkon | `src/audio`, komprese, rozpočty, měření | cíle levelů |
| QA/release | `tests`, `tools`, `.github`, release dokumentace | produkční logiku mimo diagnostický fix |

Změna přes dvě hranice musí být rozdělena, nebo v PR vysvětlit proč ji nelze bezpečně oddělit.

## Integrační pořadí

1. Zelená validace a mobilní stabilita veřejného buildu.
2. Závazné datové a eventové kontrakty.
3. Modulární bootstrap bez změny vzhledu hry.
4. Jeden kompletní Three.js vertical slice: Chlum.
5. Převod Nesměně, Besednice a Malše/KD Slavia.
6. Odstranění nepoužívaného Canvas monolitu, runtime opravné vrstvy a legacy save kódu.
7. Finální mobilní QA a release.

Nezačínej další stupeň, pokud jeho přímá závislost nemá sloučený PR a zelené testy.

## Povinné předání každého chatu

PR musí obsahovat:

- cíl a navázaný issue;
- přesný seznam změněných kontraktů a souborů;
- testovací příkazy a jejich výsledek;
- dopad na iPhone portrait/landscape;
- výkonový dopad a nové assety v manifestu;
- známá omezení;
- potvrzení, že nevznikl save systém, inventář ani druhý renderer;
- screenshot nebo video pouze tam, kde se mění vizuál či ovládání.

## Definition of Done

Práce není hotová, dokud:

- syntaxe, unit testy, validátor a relevantní browser smoke testy neprojdou;
- hra je dosažitelná z titulní obrazovky bez ručního zásahu do URL nebo konzole;
- změna neblokuje ovládání po dialogu, pauze, otočení telefonu ani návratu z pozadí;
- všechny nové assety mají ID, typ, relativní URL, rozměr/rozpočet a vlastníka dispose;
- event payloady odpovídají `docs/ARCHITECTURE_CONTRACT.md`;
- PR je malý, kontrolovatelný a neobsahuje cizí či vygenerované náhradní soubory bez vazby na runtime.
