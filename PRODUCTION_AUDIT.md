# Produkční audit v5.4.2 — 8. 9. 2026

## Rozsah a základ

Základ: `main@629c1d3b6a43c3429d4293373276b340916e3ea2`, repozitář `rajekroman/Staraverze`.
Audit vznikl v samostatné kopii a větvi `agent/runtime-audit`; původní rozpracovaný checkout nebyl upraven.
Předmětem je současná Canvas 2D verze, nikoli historický Three.js projekt ani v7.3, ze které pochází část zvukových metadat.
Při vstupní kontrole nebyly otevřené issues ani PR. Byly přečteny runtime, UI/CSS, ukládání, PWA, manifest, testy, oba workflow, validační a audio generovací nástroj i dokumentace assetů.

## Opraveno

| Problém | Impact / effort | Změna a důkaz |
|---|---|---|
| Ločenice lze chybami učinit nedokončitelnými | High / Small | Chybně určený vzorek zůstává na místě, znovu skrytý pro radar. Trest zůstává, skóre a nález se připisují pouze při správném určení. Nový test ověřuje chybu → radar → opravu. |
| Kopání nebývalo pozastavitelné; odměna byla naplánovaná i po odchodu | High / Small | Dokončení používá herní čas, nikoli volný časovač. Pauza si pamatuje minihru, odchod ruší rozpracovaný profil a třetí úder uzamkne další zásahy. Test ověřuje zmrazení a právě jednu odměnu. |
| Kopání běží na skryté stránce | High / Small | Skrytí stránky pozastaví i kopání a update nepokračuje na pozadí. |
| Odložený Franta mohl vzniknout v jiném levelu | High / Small | Prodleva patří konkrétnímu světu a odpočítává se pouze během hraní. |
| Mezerník neaktivoval nabídku | Medium / Small | Globální zachytávání vstupu se omezuje na hraní/kopání. V nabídce funguje nativní aktivace tlačítek. Původní stav selhal v novém testu. |
| Postava mizí pod stromy | High / Small | Koruna překrývající postavu zeslábne, kmen, stín a kolize se nemění. Přidáno objemové stínování běžných stromů a borovic. Porovnání před/po na třech rozlišeních. |
| Chvění a záblesk přetrvávaly po celou minihru | Medium / Small | Efekty doznívají i v režimu kopání. Omezení pohybu vypíná kamerový třes a celoplošné záblesky, stabilizuje déšť, zrno a varovný rám. Neodstraňuje funkční pohyb ukazatele rytmu. |
| Šipka ukazovala k východu před splněním cíle | Medium / Small | Pokud nejsou odhalené cíle, neukazuje k uzamčenému východu ani neprozrazuje skryté nálezy. Radar a text úkolu zůstávají vedením hráče. |
| Opětovné nastavování stejného audio `src` | Medium / Small | Zvuk se nepřenačítá při každém zásahu; přerušení předchozího přehrání nespouští duplicitní syntetický fallback. Doplněny fallbacky přesného úderu a dopadů. |
| Zbytečné zápisy HUD každý snímek | Medium / Small | Průběžný HUD se aktualizuje nejvýše po 100 ms, vynucené změny okamžitě. Měřený text cíle: 62–64 → 9–11 zápisů v sekundovém okně; není to měření FPS. |
| Aktivace PWA mazala cizí cache na stejné doméně | High / Small | Mažou se jen staré cache této hry; test předem zakládá cizí i starou herní cache. Převzetí klientů je součástí dokončení aktivace. |
| PWA ukládala libovolné GET odpovědi | Medium / Small | Cache je omezena na známé základní soubory a odpovědi 200; chyby a částečné odpovědi nepřepisují validní data. Statické soubory používají verzovanou cache bez síťového požadavku při každém čtení. |

## Nalezené problémy — neuzavřené

- **Vyřešeno v této etapě — pokračování rozehrané lokality.** Uložený stav nyní obsahuje verzovaný snapshot `state`, aktuální svět, runtime hodnoty, aktivitu nálezů a pozici postavy. Staré ploché save formáty zůstávají migrovatelné a při jejich načtení se svět bezpečně vygeneruje nově. Regresní test ověřuje Chlum: sebraný kámen, `runtime.collected`, pozici a obnovení po reloadu.
- **High / Small–Medium — nasazení není závislé na výsledku testů.** `pages.yml` běží nezávisle na `validate.yml` při push na main. Navíc publikuje celý kořen, tedy i testy, nástroje a vývojovou dokumentaci. Změnu publikační politiky je vhodné oddělit od runtime opravy a ověřit na konkrétním SHA.
- **High / Small + součinnost vlastníka — audio práva a poslech.** Část dodaných zvuků má `NOASSERTION`; technická integrita nenahrazuje právo distribuce. Nutný poslech na reproduktoru/sluchátkách a potvrzení vlastníka. Původní dokumentace popisuje 21 položek v7.3, aktuální offline seznam obsahuje i další sdílené zvuky.
- **Medium / Medium — přístupnost.** Dialogy mají role a popisky, ale chybí důsledný focus management/focus trap a vracení fokusu. Celostránkové blokování vícedotykových gest brání přiblížení textu. Canvas neposkytuje ekvivalent prostorové navigace pro nevidomého hráče. Omezení pohybu se čte při startu a neomezuje všechny lokální pulsy.
- **Medium / Small–Medium — audio lifecycle.** Pokračování spouští audio před načtením uloženého nastavení zvuku; nové hry mohou nesjednotit `state.sound` a audio přepínač. Pauza zastavuje hudbu, nikoli všechny už běžící efekty. Asynchronní přepínání hudby si zaslouží test rychlých přechodů/mute/background.
- **Medium / Medium — vizuální testy.** Současná automatická brána obsahuje hlavní campaign menu, Chlum, radar a kopání ve třech viewportových variantách, nikoli obrazové reference všech pěti map. Otisk 8×6 průměrných barev s tolerancí 1,25 může přehlédnout malý lokální detail; screenshot artefakty proto zůstávají důležitou ruční kontrolou.
- **Medium / Medium — výkon.** Terén čtyř map již má cache; drawable seznam se stále znovu alokuje a třídí, Malše překresluje celý povrch. Bez měření na slabším telefonu není odůvodněné zavádět pooling nebo nový renderer. Nové stínování korun přidává gradienty; je kandidátem na sprite cache až po profilu.
- **Low / Small — údržba.** Jednosouborový runtime odpovídá cílové architektuře, ale dlouhé jednořádkové funkce komplikují review. Původní generátor WAV není současný MP3 build pipeline. Neexistují samostatné unit/lint/typecheck/build kroky; jde o statickou aplikaci s vlastní validací a Playwrightem, ne o rozbitý bundler.

## Grafika

Nová úprava řeší konkrétní čitelnost postavy a ploché koruny, nikoli celkový redesign. Styl zůstává kreslený 2D. Největší další přínos mají rozmanitější siluety korun, přirozenější přechody vegetace do terénu, kontakt postav se zemí a méně pravidelné městské plochy. Chlum již má členitější brázdy a organické profily jsou přítomné; nepřepisovat tyto hotové části bez referenčního porovnání. Zachovat radar jako podmínku odhalení.

## Gameplay

Pět kapitol má odlišné úkoly: povrchový sběr, určování vzorků, povolené profily se zasypáním, hledání stop s Karlem, dokumenty s Frantou a porota. Tato smyčka má funkční základ. Největší problém pro důvěru hráče je nyní skutečné pokračování rozpracovaného levelu. Další malá iterace má zlepšit navigaci k povolení v Nesměni, vysvětlení prázdného radarového skenu a čitelnost zranitelného okamžiku bossů. Pro pacing a obtížnost je potřeba průchod bez teleportů/testovacích zkratek; automatický přechod k porotě není uživatelský playtest.

## Technologie a ověření

Zachován Canvas 2D, bez nových runtime závislostí, asset balíčku nebo enginu. Playwright server odmítá převzít cizí už běžící server; alternativní port lze zadat `PLAYWRIGHT_PORT`.

Reprodukce vizuálního porovnání a omezeného měření zápisů HUD:

```sh
node tools/capture-runtime-audit.mjs 629c1d3b6a43c3429d4293373276b340916e3ea2
```

Výstup: `test-results/audit/`, páry snímků pro 1280×720, 390×844, 844×390 a `capture.json`. Porovnání načítá původní `game.js` přímo z daného commitu; ostatní soubory pocházejí z pracovní větve. Scéna, seed a délka řízeného postupu jsou stejné. Jde o prohlížečovou diagnostiku, nikoli GPU benchmark nebo fyzický iPhone/Safari PASS.

Konkrétní finální výsledky testů jsou doplněny po dokončení běhů. Automatická úspěšnost sama neuzavírá release: zbývají skutečná zařízení, manuální audio a práva k dodaným assetům.

## Další priority

| Pořadí | Krok | Přínos / náročnost / riziko |
|---|---|---|
| 1 | Závislost Pages nasazení na úspěšném exact-SHA QA; explicitní distribuční seznam | High / Small–Medium / Medium |
| 2 | Uzavřít práva k audio souborům a skutečný mobilní poslech | High / Small + vlastník / Low |
| 3 | Sjednotit mute, pokračování a background audio lifecycle | Medium / Small–Medium / Low |
| 4 | Detailní obrazové reference postavy, vegetace a všech pěti levelů | High / Medium / Low |
| 5 | Focus management, přiblížení textu a test klávesnice/čtečky | Medium / Medium / Medium |
| 6 | Reálný průchod všech kapitol na iOS/Android bez debug zkratek | High / Medium / Low |
| 7 | Změřit frame-time, paměť a loading na slabším telefonu; optimalizovat prokázanou příčinu | Medium / Medium / Low |
| 8 | Přirozenější koruny a městské povrchy se srovnáním před/po | Medium / Medium / Low |
| 9 | Zpřesnit dokumentaci aktivního audia, testovacího pokrytí a odstranit prokazatelně mrtvé artefakty | Low / Small / Low |
