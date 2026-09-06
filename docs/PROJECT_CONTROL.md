# PROJECT_CONTROL.md — terminální post-release řídicí registr

Revize: **2.15.0 · 8. 8. 2026**  
Repozitář: **`rajekroman/lovec-vltavinu`**

Tento dokument je autoritativní stavový registr projektu. Technické invarianty jsou v `docs/ARCHITECTURE_CONTRACT.md`; pracovní pravidla v `AGENTS.md`. Historická release evidence se nesmí zpětně přepisovat novými post-release změnami.

Tato revize je záměrně **terminální stavový snapshot** po dokončení post-release governance sekvence. Nehardcoduje SHA vlastního budoucího merge commitu a neudržuje umělý „aktivní“ koordinační issue. Pokud vznikne nový schválený feature cíl nebo reprodukovatelný incident, další práce začne novým explicitním A0 issue s base SHA, větví, povolenými cestami, acceptance criteria a testy.

## 1. Aktuální stabilní stav

- Vydaná a formálně certifikovaná verze: **6.0.0**.
- Neměnný release baseline a tag target: `v6.0.0@6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`.
- Poslední stabilní `main` před tímto terminálním closeout balíkem: `3874bd56c4f1104a74b5aac5865646bbe7424c71`.
- `v6.0.0 → main` před tímto closeoutem: **ahead 2 / behind 0**.
- Tyto dva post-release commity mění pouze:
  - `docs/ARCHITECTURE_CONTRACT.md` — PR #120;
  - `docs/PROJECT_CONTROL.md` — PR #121.
- Produkční `src/**`, assety, manifest, testy a workflow se po v6.0.0 nezměnily.
- Otevřený produktový backlog po dokončení post-release governance: **žádný**.
- Otevřený blocker nebo critical defect: **žádný doložený**.
- Žádný nový release není aktivní.

Přesný budoucí tip `main` po merge této terminální revize se záměrně nehardcoduje. Autoritou pro aktuální tip je vždy repository branch `main`; tento dokument popisuje stabilní stav a integrační pravidla, nikoli vlastní commit identitu.

## 2. Neměnná release identita v6.0.0

- Finálně certifikovaný SHA: `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`.
- Skutečný git tag: `v6.0.0`, target přesně na certifikovaný SHA.
- GitHub Release: **Lovec vltavínů 6.0.0**.
- Release URL: `https://github.com/rajekroman/lovec-vltavinu/releases/tag/v6.0.0`.
- GitHub Pages: `https://rajekroman.github.io/lovec-vltavinu/`.
- Pages/public mobile smoke: **PASS**.
- Release blocker při uzavření v6.0.0: **žádný**.
- Finální master issue #100: **COMPLETED**.
- Finální certifikační issue #106: **COMPLETED**.
- Release issue #104: **COMPLETED**.
- Umbrella trackery #7 a #8: **COMPLETED**.

Post-release práce nesmí retagovat `v6.0.0`, měnit jeho Release objekt ani vydávat novější `main` za původní certifikovaný release SHA.

## 3. Historická formální certifikace v6.0.0

Certifikace proběhla na jediném nezměněném SHA `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`:

| Fáze | Run ID | Výsledek |
|---|---:|---|
| warm-up | `30601983659` | SUCCESS |
| cert-1 | `30602468712` | SUCCESS |
| cert-2 | `30602880009` | SUCCESS |

V každém běhu byly oba workflow joby SUCCESS. Certifikační kontrakt zahrnoval:

- validátor `0 chyb / 0 varování`;
- unit testy `167/167 PASS`;
- renderer ownership `5/5 PASS`;
- Playwright `6/6 PASS`;
- desktop canonical full-flow + čistý restart;
- audio lifecycle;
- iPhone portrait touch/input + full-flow + lifecycle;
- iPhone landscape full-flow + restart.

### Certifikační artefakty a digesty

- warm-up static `8782231552`, 5831 B, `sha256:7e8d553132bd10300260f67d16e128c9a124f72aa889f3b45f73f83bba50b645`;
- warm-up Playwright `8782350880`, 32112911 B, `sha256:14d1aa9b34cc6bf70a2462a721161cf2b2d9a83cb1ac6e73495bbad741fcd8a3`;
- cert-1 static `8782396987`, 5839 B, `sha256:d30ea6c79d2e5dfd92cc681e7a80c764d5b59e24b55b35e381bd83f157dac8e1`;
- cert-1 Playwright `8782519777`, 32102538 B, `sha256:c479c652cd83cc7d2248677653d42c942e6435aa50c50ce6995753c9cf7e97e2`;
- cert-2 static `8782539257`, 5855 B, `sha256:0775ce902624fcec6a14f05130e9a197ae1aa5ed90bb1a3010510f26210c9076`;
- cert-2 Playwright `8782664148`, 32070860 B, `sha256:421b505091ba0cd0b77d022e1adf75a6acaac8ebe629d104124337f85d110013`.

Nezávislý A6 audit #114 tuto sérii znovu ověřil jako **PASS** bez blocker/critical vady.

## 4. Ověřený produktový kontrakt v6.0.0

- Produkční vstup je pouze `src/bootstrap.js`.
- Runtime používá ES moduly, Three.js, jeden `WebGLRenderer`, jednu ortografickou kameru, jeden fixed-step loop, jeden loader, jeden input systém a jednu in-memory `GameSession`.
- Renderer ownership je staticky vynucen: jediný konstrukční bod `THREE.WebGLRenderer`, žádné produkční `new HybridRenderer`, jediný potomek `ThreeRenderer` a právě jedna instance `ThreeRenderer` v bootstrapu.
- Kanonické kapitoly jsou přesně `chlum → nesmen → besednice → slavia`.
- Průchod končí výsledkem poroty a idempotentním čistým restartem.
- Gameplay stav se neukládá do `localStorage` ani IndexedDB; cílový runtime nemá save systém ani inventářové UI.
- `game.js`, `runtime-stability.js`, Canvas gameplay runtime a legacy save cesta nejsou součástí produkčního stromu.
- Audio se odemyká uživatelským gestem a pokrývá mute/unmute, background/foreground a `pagehide` lifecycle.
- Service worker slouží pouze jako distribuční cache.
- Runtime asset autorita je `assets/manifests/assets.json`; `src/data` nemá paralelní asset registry.

## 5. Finální read-only audity A1–A6

Před release byly proti certifikovanému SHA provedeny samostatné read-only audity:

| Issue | Oblast | Výsledek |
|---|---|---|
| #109 | architektura a runtime invarianty | **PASS** |
| #110 | gameplay/data a průchod kapitolami | **PASS** |
| #111 | assety a manifest | **PASS** |
| #112 | UI a mobilní ovládání | **PASS** |
| #113 | audio, lifecycle a výkon | **PASS** |
| #114 | finální QA a certifikační evidence | **PASS** |

Tyto audity jsou historická release evidence. Post-release dokumentační změny je zpětně nemění ani znovu necertifikují v6.0.0.

## 6. Dokončené post-release změny po v6.0.0

### #115 / PR #120 — ARCHITECTURE_CONTRACT sync

Stav: **COMPLETED / MERGED**.

- base: `main@6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`;
- A1 head: `f0a0c232229ec08edf82327d0c2b7bace3ad9de3`;
- merge / nový main: `97828c3973d5c2166a69b94118421dfe9507c0fc`;
- změněna pouze `docs/ARCHITECTURE_CONTRACT.md` (`+1/-2`);
- odstraněna stale položka `src/data/assets.js`;
- `assets/manifests/assets.json` zapsán jako skutečná manifestová autorita;
- runtime a release baseline beze změny.

Validace PR #120, workflow #1174 / run `31203304631`:

- `Static and unit validation`: SUCCESS;
- validátor `0/0`;
- unit `167/167`;
- renderer ownership `5/5`;
- `Desktop and mobile Playwright matrix`: SUCCESS;
- Playwright `6/6 PASS (8.1m)`;
- static artifact `9003689666`, 5856 B, `sha256:f2b4e81be834ea3652aaa08c088f2909aaace475048cebbb0e162ea0b6dce764`;
- Playwright artifact `9003943435`, 32104424 B, `sha256:29503c73f6122d2b7f6e5ba1fa23a4ca26d97f3979cbad9b825ae9ad893f3e74`.

### #116 / PR #121 — PROJECT_CONTROL post-release sync

Stav: **COMPLETED / MERGED**.

- base: `main@97828c3973d5c2166a69b94118421dfe9507c0fc`;
- A0 head: `4dd5d091ad39bcbca32e5f018c5dbc38de07d0df`;
- merge / nový main: `3874bd56c4f1104a74b5aac5865646bbe7424c71`;
- změněna pouze `docs/PROJECT_CONTROL.md` (`+148/-136`);
- release baseline zůstal nezměněn.

Validace PR #121, workflow #1178 / run `31204456359`:

- `Static and unit validation`: SUCCESS, job `92951985728`;
- validátor `0 chyb / 0 varování`;
- unit `167/167 PASS`;
- renderer ownership PASS;
- `Desktop and mobile Playwright matrix`: SUCCESS, job `92951985660`;
- Playwright `6/6 PASS (7.9m)`;
- static artifact `9004131830`, 5841 B, `sha256:decbc94a3c3488b06b52647b39fb4a9698d5978957605d118fbdc91e813bb4e2`;
- Playwright artifact `9004377649`, 32137614 B, `sha256:e838341e0525dd18a984f9f4099e8ce5187ea0e92f25aabdcd9ad0c3624250fd`.

### #118 — A0 post-release orchestrace

Stav: **COMPLETED**.

Po integraci #115 a #116 byla živá fronta znovu vyhodnocena. Nebyl nalezen žádný otevřený produktový blocker ani schválený nový feature balík. A1–A7 proto nebyli znovu aktivováni bez konkrétního cíle.

## 7. Stav pracovních proudů po v6.0.0

| Role | Stav | Další povolená akce |
|---|---|---|
| A0 koordinace | **#178 ACTIVE** | vede pouze schválený rozsah #178 a jeho integrační evidence |
| A1 architektura | **COMPLETED / STANDBY** | nová změna pouze přes nové A0 issue |
| A2 gameplay/data | **COMPLETED / STANDBY** | #156 je sloučený; žádná další gameplay/data změna bez nového issue |
| A3 grafika/assety | **COMPLETED / STANDBY** | #176 je sloučený; bez další změny assetů |
| A4 UI/mobil | **COMPLETED / STANDBY** | #176 je sloučený; bez další mobilní změny |
| A5 audio/výkon | **STANDBY** | žádná změna bez nového A0 issue |
| A6 QA | **#178 ACTIVE** | finální validace candidate SHA a evidence výsledků |
| A7 release | **#178 ACTIVE** | nový samostatný tag/release `v6.1.0` po QA evidenci |

Mimo výslovně povolený rozsah #178 žádný proud nemá aktivní implementační větev ani pracovní balík.

## 8. Aktuální integrační pravidla

1. `main` zůstává jediná zveřejnitelná větev.
2. Žádný agent nesmí měnit cizí modul bez konkrétního A0 issue.
3. Nový pracovní balík musí uvést base SHA, větev, povolené a zakázané cesty, acceptance criteria a povinné testy.
4. Release `v6.0.0` je historicky uzavřený a nesmí se kvůli post-release práci recertifikovat, retagovat ani přepisovat.
5. Dokumentační post-release commit nevytváří novou vydanou verzi hry.
6. A1–A7 zůstávají STANDBY, dokud není doložen konkrétní nový produktový backlog, schválený feature cíl nebo reprodukovatelný incident.
7. Při produkční vadě A0 vytvoří samostatný issue a přiřadí vlastníka podle hranic v `AGENTS.md`; A0 neopravuje cizí feature modul v governance PR.
8. Nový release musí mít samostatný release issue, explicitní candidate SHA a vlastní QA/release gate. `v6.0.0` není pohyblivý tag.
9. Uzavřené release issue #100/#104 ani dokončené governance issue #115/#116/#118 se nesmějí používat jako nový aktivní pracovní prostor.

## 9. Otevřená fronta

### #154 — Produkční redesign prostředí Nesměň, Besednice a Malše/KD Slavia

Stav: **COMPLETED / MERGED**, issue #154 a PR #155. Tento záznam zůstává jako auditní evidence schváleného feature balíku po `v6.0.0`.

- Base: `main@3c59933`; pracovní větev: `agent/environment-level-redesign`.
- Povolený rozsah: levelové scény, asset manifest, distribuční cache, nové optimalizované textury prostředí, jejich kontraktové testy a tento řídicí záznam.
- Nesměň: zachovat širokou hrací mýtinu a pískové hromady po kopání vltavínů; obvodové smrky jsou výrazně vyšší než hráč/NPC.
- Besednice: samostatný široký písčitý lom s jílovými vrstvami.
- Malše/KD Slavia: velká hratelná plocha u řeky; proporčně vysoká budova KD Slavia je na okraji levelu. Referenční architektonický motiv je neorenesanční fasáda KD Slavia v Českých Budějovicích.
- Kontrakty beze změny: jeden Three.js renderer, ortografická kamera, žádný save systém, inventář ani druhý renderer. Service worker zůstává pouze distribuční cache.
- Assetová povinnost: každý nový PNG má manifestové ID, relativní URL, rozměr, byte budget, SHA-256 a `disposeOwner`; musí být zahrnut v cache pro offline distribuci.
- Povinné gate před sloučením: `tools/validate.mjs`, kompletní unit suite, Playwright desktop/mobile smoke a vizuální kontrola poměru stromů a budovy vůči hráči.
- Aktuální evidence: validátor `0 chyb / 0 varování` a unit suite `167/167 PASS`. Mobile Playwright portrait skončil v headless timeoutu po dosažení Slavia fáze; vlastník dne 9. 8. 2026 výslovně schválil pokračování bez této automatické gate. Tento záznam je **owner-approved výjimka**, nikoli zpětné tvrzení, že selhaný běh byl automatický PASS.

Distribuční připravenost tohoto balíku znamená zelené gate a sloučený PR do `main`; nevytváří ani nepřeznačuje historický tag `v6.0.0`. Vydání nového tagu nebo GitHub Release vyžaduje samostatné release issue, explicitní candidate SHA a vlastní QA/release gate podle §8.8.

### #156 — Jednotná čitelnost postupu úkolem v HUDu

Stav: **COMPLETED / MERGED**, issue #156 a PR #157.

- Base: `main@22d20418c06378228773cc594d2ee0a4773dd18a`; pracovní větev: `agent/final-gameplay-polish`.
- Povolený rozsah: stávající HUD, UI model scén, související markup/CSS, kontraktové testy a tento řídicí záznam.
- Hráč u každé kanonické kapitoly uvidí normalizovaný postup stávajícího objective systému v procentech a jako přístupný `progressbar`.
- Nejsou povoleny nové akce, změna objective pravidel, save systém, inventář, druhý renderer ani změna eventových payloadů.
- Před sloučením: validátor, unit suite a relevantní desktop/mobile smoke; layout nesmí omezit touch targety v portrait ani landscape.

### #158 — Milníková zpětná vazba pro nálezy a splněné cíle

Stav: **COMPLETED / MERGED**, issue #158 a PR #159.

- Base: `main@3afd6484aa5204dd3924ff8a490870ec8e4dd17f`; pracovní větev: `agent/progress-milestone-feedback`.
- Povolený rozsah: existující toast UI, jeho přístupnost, kontraktové testy a tento řídicí záznam.
- Toast naslouchá pouze platným eventům `finding:collected` a `objective:complete`; nepřidává payload ani gameplay pravidla.
- Zobrazení je neinteraktivní, s bezpečným restartem timeoutu a nevytváří persistentní stav.
- Před sloučením: validátor, unit suite a relevantní browser smoke.

### #160 — Kontextový přehled úkolu v pauze

Stav: **COMPLETED / MERGED**, issue #160 a PR #161.

- Base: `main@e3c335a0b039709c4041940899d6202ee5acd7a6`; pracovní větev: `agent/pause-mission-recap`.
- Povolený rozsah: stávající pauzový panel, UI model scén, kontraktové testy a tento řídicí záznam.
- Pauza ukáže lokalitu, aktuální objective a normalizovaný procentní postup z existujícího snapshotu; návrat a menu zůstávají beze změny.
- Nejsou povoleny nové akce, změny objektivů, event payloadů, save systému, inventáře ani rendereru.
- Před sloučením: validátor, unit suite a relevantní desktop/mobile smoke.

### #162 — Čitelný průběh rytmického kopání

Stav: **COMPLETED / MERGED**, issue #162 a PR #163.

- Base: `main@ff83475551a55457fbeb39a0fdf07adda0585a0e`; pracovní větev: `agent/dig-progress-clarity`.
- Povolený rozsah: existující kopací UI, jeho přístupnost, kontraktové testy a tento řídicí záznam.
- Rozhraní ukáže přesný počet zásahů `0/3` až `3/3` vedle dosavadních drahokamových symbolů; živý popis sdělí hráči další krok bez nové interakce.
- Doslovné pravidlo tří úspěšných rytmických zásahů se nemění. Nejsou povoleny nové akce, objective pravidla, event payloady, save systém, inventář ani druhý renderer.
- Před sloučením: validátor, kompletní unit suite a relevantní desktop/mobile smoke; text nesmí zakrývat ovládání v portrait ani landscape.

### #164 — Rozlišit připravenou a nedostupnou kontextovou akci

Stav: **COMPLETED / MERGED**, issue #164 a PR #165.

- Base: `main@6ea1409`; pracovní větev: `agent/contextual-action-clarity`.
- Povolený rozsah: stávající HUD kontextové akce, její přístupnost, kontraktové testy a tento řídicí záznam.
- Mimo dosah ukáže stávající tlačítko ztlumený stav `PŘIBLIŽ SE` se srozumitelným ARIA popisem; po přiblížení se obnoví konkrétní label dosavadní jediné akce.
- Nejsou povoleny nové akce nebo touch targety, změny InteractionSystemu, objective/kopacích pravidel, event payloadů, save systému, inventáře ani rendereru.
- Před sloučením: validátor, kompletní unit suite a relevantní desktop/mobile smoke; rozměr ovládání se nesmí změnit v portrait ani landscape.

### #166 — Aktualizovat onboarding podle kanonického ovládání

Stav: **COMPLETED / MERGED**, issue #166 a PR #167.

- Base: `main@ea7ae63`; pracovní větev: `agent/onboarding-action-clarity`.
- Povolený rozsah: stávající onboarding, jeho kontraktový test a tento řídicí záznam.
- Úvodní karta popisuje pohyb, přiblížení k cíli a jediné kontextové tlačítko, přesně tři rytmické zásahy při kopání a bezpečné vyhnutí se hrozbě.
- Text nesmí odkazovat na legacy běh, kombo ani ztrátu předmětu. Nejsou povoleny změny vstupů, gameplay pravidel, eventů, save systému, inventáře ani rendereru.
- Před sloučením: validátor, kompletní unit suite a relevantní desktop/mobile smoke; karta musí zůstat stručná a použitelná v portrait i landscape.

### #168 — Umožnit zavření nápovědy klávesou Escape

Stav: **COMPLETED / MERGED**, issue #168 a PR #169.

- Base: `main@7ef624a`; pracovní větev: `agent/modal-focus-polish`.
- Povolený rozsah: lifecycle titulní scény, kontraktový test a tento řídicí záznam.
- Klávesa Escape zavře pouze právě otevřenou obrazovku nápovědy a vrátí titulní obrazovku, která už zajišťuje fokus na první akční prvek.
- Nejsou povoleny změny ScreenControlleru, gameplay vstupů, pravidel, eventů, save systému, inventáře ani rendereru.
- Před sloučením: validátor, kompletní unit suite a relevantní browser smoke.

### #170 — Nahradit technický štítek na titulní obrazovce

Stav: **COMPLETED / MERGED**, issue #170 a PR #171.

- Base: `main@1cebeb0`; pracovní větev: `agent/player-facing-title-version`.
- Povolený rozsah: statický a runtime text titulní obrazovky, kontraktový test a tento řídicí záznam.
- Štítek zůstane na verzi `v6.0`, ale interní výraz `Modular Bootstrap` nahradí hráčské označení čtyř kanonických lokalit.
- Nejsou povoleny změny release verze, layoutu, gameplay, dat, eventů, save systému, inventáře, rendereru ani assetů.
- Před sloučením: validátor, kompletní unit suite a relevantní browser smoke.

### #172 — Doplnit situační doporučení do varování hrozeb

Stav: **COMPLETED / MERGED**, issue #172 a PR #173.

- Base: `main@01abfc1`; pracovní větev: `agent/danger-guidance`.
- Povolený rozsah: existující hlášky hrozeb tří scén, kontraktový test a tento řídicí záznam.
- Chlum navede k obejití traktoru; Besednice a Slavia navádějí k zastavení osoby odnášející nález. Prahy a podmínky zobrazení hlášek se nemění.
- Nejsou povoleny změny DangerSystemu, BossSystemu, tras, kolizí, dosahů, objective pravidel, eventů, save systému, inventáře ani rendereru.
- Před sloučením: validátor, kompletní unit suite a relevantní browser smoke; zpráva zůstává čitelná v portrait i landscape.

### #174 — Doplnit dialogovou sémantiku nápovědy

Stav: **COMPLETED / MERGED**, issue #174 a PR #175.

- Base: `main@93b5b3a`; pracovní větev: `agent/help-modal-semantics`.
- Povolený rozsah: stávající markup nápovědy, kontraktový test a tento řídicí záznam.
- Nápověda získá `role="dialog"`, `aria-modal="true"`, vlastní název a popis z existujícího obsahu; vzhled ani ovládání se nemění.
- Nejsou povoleny změny ScreenControlleru, navigace, inputu, gameplay, eventů, save systému, inventáře, rendereru ani assetů.
- Před sloučením: validátor, kompletní unit suite a relevantní browser smoke.

### #176 — Sjednotit detailní grafiku hráče a NPC

Stav: **COMPLETED / MERGED**, issue #176 a PR #177.

- Base: `main@382f887`; pracovní větev: `agent/character-visual-refresh`.
- Povolený rozsah: versionované NPC PNG, jejich manifestové URL a metadata, produkční render postav čtyř scén, kontraktové testy a tento řídicí záznam.
- Nové NPC jsou realistické pre-renderované 3D sprity ve stejném detailním materiálovém stylu jako hlavní postava. Stabilní manifestová ID odkazují na nové `*-v2.png`; původní PNG zůstávají beze změny.
- Ve všech čtyřech scénách jsou hráč a NPC vykresleni rozměrem `82 × 108` se shodným anchorem `0.5 / 0.08`. Kolize, dosahy a pravidla hry se nemění.
- Každý nový PNG má relativní URL, rozměr `256 × 384`, byte budget, SHA-256 a `disposeOwner` v manifestu; pět nových runtime URL je zahrnuto v distribuční cache service workeru.
- Před sloučením: validátor, kompletní unit suite, asset integrity testy a relevantní desktop/mobile vizuální smoke.

### #178 — Finální QA a release kandidát po grafickém sjednocení

Stav: **COMPLETED / RELEASED** jako `v6.1.0` na merge SHA `745109103722646b69ad5b514d66f9882662ecb9`.

- Candidate base: `main@9f880db1e4d2698d6c671238cf6737a48bd6ba31`; pracovní větev: `agent/final-release-validation`.
- Lokálně prošly: validátor `0 chyb / 0 varování`, syntaxe všech modulů, úplná unit sada a Playwright desktop, iPhone portrait i iPhone landscape. GitHub Pages deploy candidate SHA skončil `success`.
- GitHub Actions run `31300903064` skončil `5/6 PASS`; portrait full-flow překročil 480 s při souběžném běhu tří WebGL projektů, bez assetové nebo runtime chyby. Release balík proto stabilizuje pouze počet Playwright workerů na jeden a zachovává plnou matici projektů.
- Historický tag `v6.0.0` zůstává neměnný. Tag `v6.1.0` byl vytvořen na merge SHA release PR spolu s GitHub Release a uvedenou transparentní výjimkou.
- Release metadata pouze mění hráčský štítek na `v6.1`; nevzniká save systém, inventář, nový renderer ani gameplay změna.

### #180 — Integrace redesignu prostředí bez prostoru mimo mapu

Stav: **COMPLETED / MERGED** na `main@ce5a4a95624d21727aae5613dfb3c406681ce760` (PR #181).

- Base: `main@745109103722646b69ad5b514d66f9882662ecb9`; pracovní větev: `agent/environment-runtime-visibility-fix`.
- Reprodukce na desktopu `1280 × 720` ukázala při okrajových spawnech Nesměně a Besednice velkou černou plochu mimo level bounds; nové environment textury byly načtené, ale kamera nebyla omezená podle velikosti viewportu a zoomu.
- Čistý výpočet `CameraBounds` omezuje střed jediné ortografické kamery uvnitř mapy a je zapojen do všech čtyř produkčních scén.
- Nesměň, Besednice a Slavia zachovávají environment assety `*-v1`; odstraněny jsou pouze rušivé dekorativní překryvy, které zakrývaly detailní podklady. Kanonický model KD Slavia zůstává načtený a navázaný na cílovou entitu, ale fasádu vizuálně poskytuje správně škálovaný environment plate.
- Do této větve jsou přeneseny také dosud nesloučené commity Chlum brázd `17d9f14` a `91736be`; při konfliktu byl zachován kompletní novější manifest z `main` a aktualizován jen záznam `terrain-chlum-furrows`.
- Hlavní postava nyní volí skutečnou čtyřsměrovou řadu realistického sprite sheetu (čelo, levý bok, pravý bok, záda) při `6 fps`; při zastavení stojí v posledním směru místo návratu do čelní pózy.
- Každý level definuje vlastní `walkable` zónu. Pohyb se omezuje na pole, lesní mýtinu, dno lomu a dlážděné okolí KD Slavia; spawn Slavie byl přesunut z řeky na nábřežní plochu. Všechny povinné cíle zůstávají validovaně dosažitelné.
- Kontrakty beze změny: jeden `WebGLRenderer`, ortografická kamera, čtyři kapitoly, jedna kontextová akce, přesně tři zásahy, žádný nový save systém ani inventář.
- Povinná gate: validátor, syntaxe modulů, kompletní unit sada, desktop/iPhone portrait/iPhone landscape full-flow smoke a vizuální kontrola všech čtyř map. Nový release vyžaduje samostatné release issue a nový nepohyblivý tag; `v6.0.0` ani `v6.1.0` se nepřepisují.

### #182 — Release v6.2.0 po integraci prostředí

Stav: **ACTIVE**, releasový kandidát bude přesně označen merge SHA releasového PR; tento kandidát je přímým potomkem `v6.0.0`, `v6.1.0` a #180.

- Povolený rozsah: pouze číslo verze v balíčku a titulní obrazovce, verzovaný název distribuční cache, odpovídající kontraktový test a aktualizace tohoto řídicího záznamu.
- Gameplay, data, render kontrakty, assety a ovládání se nemění.
- Před vytvořením tagu je nutný úspěšný validátor, syntaxe, kompletní unit sada, desktop/iPhone portrait/iPhone landscape full-flow smoke a deploy GitHub Pages stejného SHA.
- Nový tag bude `v6.2.0`; historické tagy `v6.0.0` a `v6.1.0` zůstávají neměnné.

Další práce smí vzniknout pouze z jednoho z těchto vstupů:

- explicitní nový produktový/feature požadavek vlastníka;
- konkrétní reprodukovatelný incident nebo defect;
- nový release cíl;
- nutná governance změna vyvolaná skutečnou změnou projektu, nikoli snahou vytížit agenty.

Bez takového vstupu A0 nevytváří umělé issue a A1–A7 zůstávají ve výše uvedeném stabilním stavu.

## 10. Historická Definition of Done terminálního post-release governance stavu

Terminální stav je přijat pouze pokud:

- release v6.0.0 historie zůstává auditovatelná a neměnná;
- tag `v6.0.0` stále míří na `6e2fec8a63928bc182cffcc1a61ad966dc3b9ec9`;
- #100, #106, #104, #7 a #8 jsou completed;
- audity #109–#114 jsou PASS;
- #115 / PR #120 jsou completed/merged;
- #116 / PR #121 jsou completed/merged;
- #118 je completed;
- po post-release governance není otevřený produktový blocker ani schválený feature backlog;
- A0–A7 nejsou bez konkrétního důvodu aktivováni;
- terminální registr nepředstírá znalost SHA vlastního budoucího merge commitu;
- další práce musí začít novým A0 issue podle pravidel výše.
