# Přístupnost obrazovek a ovládání

Tento dokument popisuje skutečné chování obrazovek runtime `5.4.2`. Dialogová role se používá jen tam, kde se uživatel po zavření vrací k přerušenému podkladu nebo úloze. Povinný krok kampaně, který nahrazuje předchozí stav a nemá návrat zpět, je samostatná obrazovka.

| Obrazovka | Typ | Otevření → návrat | Běh času | Klávesnice | Dotyk |
| --- | --- | --- | --- | --- | --- |
| Hlavní nabídka `titleScreen` | samostatná stránka | start aplikace / odchod z pauzy / nová výprava | neběží | Tab, Shift+Tab, Enter, mezerník na tlačítkách | běžné klepnutí a posun |
| Úvod lokality `briefScreen` | samostatný krok | Nová/Pokračovat nebo po výběru perku → gameplay | neběží | fokus na nadpis, Tab na „JDU NA TO“, Enter/mezerník | klepnutí, posun |
| NPC `dialogScreen` | skutečný modal | akce u NPC → stejný gameplay | neběží | focus trap, Enter/mezerník, Escape zavře | klepnutí |
| Určení vzorku `identifyScreen` | povinný modal | interakce se vzorkem → gameplay | neběží | focus trap, Tab, Enter/mezerník; Escape volbu neobejde | dvě volby klepnutím |
| Kontrola podvodu `fraudScreen` | povinný modal | tři indicie v Malši → návrat do gameplaye po rozhodnutí | neběží | focus trap, Tab, Enter/mezerník; chybná volba vysvětlí nesrovnalosti a Escape kontrolu neobejde | dvě volby klepnutím |
| Kopání `digScreen` | modal/minihra | hotspot → gameplay nebo pauza | běží jen čas minihry | mezerník = úder, Escape = pauza | `digButton`, vlastní pointer |
| Zahrabávání `digScreen` | modal/minihra | otevřená díra → gameplay nebo pauza | čas běží jen při držení; v pauze stojí | držet/pustit mezerník, Escape = pauza | držet/pustit `digButton` |
| Expertiza `expertiseScreen` | samostatný povinný krok | dokončení Besednice → výběr 1 až 5 konkrétních kamenů (0 jen legacy/corrupt fallback) → perk | neběží | fokus na nadpis, Tab mezi kartami a potvrzením, Enter/mezerník; karty ukazují `VYBRÁN K CERTIFIKACI` / `NEVYBRÁN`, počitadlo uvádí aktuální výběr a maximum; Escape krok neobejde; výběr přežije reload | klepnutí na karty a potvrzení |
| Perky `perkScreen` | samostatný povinný krok | běžné dokončení lokality → briefing další lokality; po Expertize za Besednicí → briefing Malše | neběží | fokus na nadpis, Tab a Enter/mezerník; Escape neobejde výběr | klepnutí na perk |
| Porota `juryScreen` | samostatný povinný krok | dokončení Malše → výsledek | neběží | fokus na nadpis, výběr kamenů a potvrzení; Escape neobejde výběr | klepnutí |
| Výsledek `resultScreen` | samostatná stránka | porota → nová výprava nebo Rekordy | neběží | fokus na nadpis, běžná tabulace | klepnutí, posun |
| Pauza `pauseScreen` | skutečný modal | gameplay/minihra → stejný stav nebo nabídka | vše herní i minihra stojí | focus trap; Escape/Pokračovat obnoví; nabídka ukončí rozpracovanou akci | tlačítka |
| Návod `howScreen` | pomocný modal | nabídka → původní prvek nabídky | neběží | focus trap; Escape/Zavřít vrátí fokus | klepnutí, posun |
| Rekordy `recordsScreen` | pomocný modal | nabídka nebo výsledek → přesný rodič/spouštěč | neběží | focus trap; Escape/Zavřít vrátí fokus | klepnutí, posun |
| Krádež `theftAlert` | neinteraktivní alert | vznik události → automaticky zmizí | gameplay pokračuje | bez fokusu | bez ovládání |
| Úvod protivníka `bossIntro` | neinteraktivní status | spuštění protivníka nebo jednorázový příjezdový incident v Malši → automaticky zmizí | u příjezdového incidentu krátce blokuje pohyb, jinak gameplay pokračuje | bez fokusu | bez ovládání |

## Společná pravidla

- Otevření skutečného modalu uvolní joystick, akční pointer, klávesy i pointer minihry.
- Aktivní modal má přístupný název, případný popis, focus trap a zakrytý gameplay je pro klávesnici i čtečku nedostupný.
- `inert` ani `aria-hidden` se nikdy nepřidává na `#app`, protože `#app` obsahuje i aktivní dialog.
- Při zavření se fokus vrací na původní prvek jen pokud je stále připojený, viditelný a není v inertním stromu; jinak se použije smysluplný cíl navazující obrazovky nebo herní canvas.
- Povinné volby Určení vzorku, Kontrola podvodu, Perk, Expertiza a Porota nelze přeskočit klávesou Escape.
- `aria-live` je vyhrazeno pro diskrétní stavové zprávy: toast, krádež, úvod protivníka a zpětnou vazbu minihry. Časovač a pohyb ukazatele nejsou živé regiony.
- `prefers-reduced-motion` vypíná CSS animace/přechody a runtime omezuje dekorativní pohybové efekty.

## Zoom a pointer souřadnice

- Viewport neomezuje `user-scalable` ani `maximum-scale`.
- HTML vrstvy a herní canvas povolují pan/zoom; `touch-action:none` je omezeno na joystick, akční tlačítko a tlačítko minihry.
- Joystick počítá lokální pozici jako `PointerEvent.clientX/clientY - getBoundingClientRect()`. Obě hodnoty používají stejný klientský souřadnicový systém; proto se nepřičítá `visualViewport.offsetLeft/offsetTop`.
- `visualViewport.resize` pouze obnoví rozměry renderu; nemění pointer souřadnice ani world-space pozici hráče.
- Všechny HTML obrazovky jsou scrollovatelné a pannable, včetně hlavní nabídky, aby zůstaly dosažitelné při zvětšeném page scale.

## Hranice automatického ověření

Playwright ověřuje viewport meta, CSS `touch-action`, pointer lifecycle, syntetický souběh pointerů, reflow při malém CSS viewportu a v Chromium také syntetický `pageScaleFactor=2` / `visualViewport.scale`. To **není** důkaz fyzického dvouprstého pinch-to-zoom na iPhonu ani ruční test VoiceOver/TalkBack.
