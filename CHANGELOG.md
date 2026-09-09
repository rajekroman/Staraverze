# Lovec vltavínů Reborn 5.4.2

## Certifikace, doložený původ a návaznost finále

- datový model kamene nově odděluje `documented` (doložený původ) a `certified` (konkrétní odborně posouzený kus);
- po Besednici následuje nejdřív Expertiza, až potom perk a briefing Malše;
- Expertiza pracuje s konkrétními stone IDs, dovoluje certifikovat jeden až pět kusů a průběžný výběr se ukládá přes `pendingCertification`, takže přežije reload;
- Chlum již netvrdí, že je Franta fyzicky přítomen v mapě; Václav zároveň umožňuje herně doložit původ chlumských nálezů;
- `caught()` neodebere certifikovaný kámen ani povinný Besednický ježek;
- první vstup do Malše odehraje krátký runtime incident s Frantou a skutečným pádem certifikační složky, která se následně hledá radarem;
- certifikační složka hráčovy sbírky nese konkrétní `stoneIds` z Expertizy, její obnovení ukládá `recoveredCertificateStoneIds` a registrace kontroluje shodu se skutečně certifikovanými kameny; složka je oddělená od pozdějšího kontrolního dossieru k Frantovu vzorku;
- vitrína nabízí pouze certifikované kameny; stav `documented` zůstává samostatnou bodovanou vlastností poroty; po přepočtu realistických profilů byly hranice poroty recalibrovány na 15 000 bodů pro výstavní uznání a 21 500 pro hlavní cenu;
- Expertiza a finále mají bezpečný fallback pro 0/1/2 kameny bez softlocku, přičemž nulová vitrína je považována jen za legacy/poškozený-save scénář;
- save schema 2 migruje starý `levelIndex=4` bez přechodu do Expertizy, ale již rozehranou Malši nevrací zpět a deterministicky doplní certifikované kusy;
- smoke sada rozšířena na 74 testovacích definic včetně konkrétních certifikačních ID, reloadu arrival incidentu, filtrování vitríny a exaktní kalibrace poroty; PR workflow spouští browser smoke, visual regression i offline gate ještě před mergem;
- visual regression nově zachycuje samostatnou obrazovku Expertizy ve třech podporovaných viewportových projektech;
- PWA cache zvýšena na `runtime-35`.

## Narativní a UX copy pass

- Chlum už netvrdí, že hráč vlastní certifikáty před začátkem sběru; certifikáty vznikají až po expertize nejlepších kusů před cestou do Slávie.
- briefing finále vysvětluje expertizu a ztrátu složky s certifikáty, ale už neprozrazuje celý pozdější konflikt s Frantou;
- Ločenická určovací minihra používá neutrální popisy znaků a před volbou neprozrazuje správnou odpověď;
- Nesměň správně vede hráče nejdřív k souhlasu lesníka a teprve potom ke kopání a zahrabání profilů;
- Besednice neprozrazuje krádež ježka předem a používá jednotně jméno Karel bez staré přezdívky;
- finále používá „indicie“ místo neurčitých „podkladů“, civilnější dialog pořadatele a jasnější akční texty;
- sjednoceno pojmenování KD Slávie, české UI texty, pluralizace nálezů a rekordů a výsledkové hodnocení;
- dokončeny poslední textové návaznosti: Karel je po krádeži jmenován přímo, vstup do Slávie vede k nalezení složky, generický NPC fallback byl odstraněn a před výsledkem poroty se zobrazí krátký mezikrok s hotovou vitrínou;
- PWA cache zvýšena na `runtime-31`.


## Finální hudební pass

- Aktivní ambientní MP3 doplňuje lehká procedurální hudební vrstva s měkkými pady, basou a melodickým motivem; každá lokalita má vlastní harmonii a menu vlastní klidný motiv.
- Návrat z pauzy do hlavního menu znovu rozběhne audio lifecycle, zatímco skutečná pauza zůstává tichá.
- Návrat z backgroundu obnoví hudbu na briefingu a dalších nepauzovaných obrazovkách.
- Score vzniká za běhu přes Web Audio, nepřidává nový externí asset ani další licenční závislost.
- Přidán regresní test start → pauza → menu a PWA runtime cache zvýšena na revizi 25.


## Finále Slávie — registrace, podvod a výstavní vitrína

- vstup do KD Slávie nyní skutečně obsluhuje registraci sbírky, kontrolu tří podkladů a povinné vyhodnocení Frantova vzorku;
- po potvrzeném odhalení Franta vezme složku a utíká k východu; jedna kontextová akce složku zachrání, při úniku zůstává finále dohratelné díky kopii podkladů;
- finále přechází do výstavního sálu a vitríny pro 0–3 kameny, kde porota hodnotí stav, doložený původ, pestrost lokalit a fair play namísto samotné hmotnosti;
- zachován je společný humanoidní motion-state Franty a Karla z předchozí změny;
- PWA cache byla zvýšena na `runtime-24`, aby se nový gameplay, UI a testované opravy propsaly i do dříve nainstalované hry.

## Společný pohyb pěších postav — základ

- Franta a Karel mají stejný stav směru a chůze jako ostatní pěší postavy: `facing`, `pose`, `moving`, `motionRatio` a `motionPhase`;
- jejich skutečný posun ve světě nyní řídí front/back/side pózu i krokový cyklus přes společný humanoidní motion helper, nikoli časový fallback rendereru;
- při zastavení nebo omráčení se rivalovi okamžitě zastaví kroková animace a `motionRatio` klesne na nulu;
- regresní smoke test hlídá pohyb i úplné zastavení Franty a PWA cache byla zvýšena na `runtime-21`.

## Přístupné modály a mobilní zoom

- skutečné překryvy nad přerušeným stavem — NPC dialog, určení vzorku, kopání/zahrabávání, pauza, návod a rekordy — mají dialogovou sémantiku, přístupný název, focus trap, přesun a návrat fokusu; briefing, perky, porota a finální výsledek jsou samostatné kroky toku bez falešného `aria-modal`;
- otevření modalu nyní samo uvolní držené herní pointery; gameplay a právě probíhající neinteraktivní boss/krádežní oznámení jsou po dobu modalu skrytá před klávesnicí a asistivní technologií bez použití `inert` na rodiči aktivního dialogu;
- Escape bezpečně obsluhuje pauzu, návod, rekordy a NPC dialog bez přeskočení povinného určení, perku nebo poroty;
- globální blokování pinch-to-zoom je odstraněno; HTML obrazovky včetně hlavní nabídky jsou scrollovatelné/pannable a `touch-action:none` zůstává pouze na joysticku a herních tlačítkách, která potřebují kontinuální pointer;
- joystick, akční tlačítko a kopací/zahrabávací tlačítko drží vlastní aktivní pointer; capture/release je odolný vůči zániku pointeru a reset probíhá při `pointercancel`, `lostpointercapture`, pauze, ztrátě fokusu, skrytí stránky a změně orientace;
- testy ověřují souběžný joystick + akci, obě minihry přes pauzu, zmrazení odložené odměny, odchod do menu bez pozdější odměny, 200% reflow/page-scale aproximaci a omezené živé regiony;
- HUD není živý region; stručné stavové zprávy používají cílené `status`/alert regiony a časovač ani pohyb ukazatele se nepředčítají po snímcích;
- PWA cache byla zvýšena na `runtime-20`, aby se změny vstupu, sémantiky a zoomovatelného layoutu propsaly i do dříve nainstalované PWA.

## Příběhové role hráče a Franty

- hlavní postava zůstává záměrně bezejmenná: je to přímo hráč, opravdový sběratel, který vltavíny nehledá kvůli penězům, ale chce sestavit nejlepší sbírku a vystavit ji na Na zelené vlně;
- Franta je jasně odlišený antagonista: vltavíny sbírá kvůli prodeji a penězům na automaty, nikoli kvůli sběratelství nebo výstavě;
- Chlum vysvětluje rozdílnou motivaci obou postav už při prvním briefingu;
- finále u KD Slavie staví proti sobě hráčovu výstavní sbírku a Frantovu snahu nálezy zpeněžit kolem akce;
- odstraněno označení „FETÁK FRANTA“ i zavádějící „SBĚRATEL FRANTA“; v HUD je jednoduše „FRANTA“.

## Hlavní menu — copy a vizuální hierarchie

- úvodní text je přepsaný do přirozenější češtiny: hráč se vydává po stopách vltavínů, skládá sbírku a ve finále dorazí do KD Slavie na akci Na zelené vlně;
- titulní obrazovka má novou hierarchii logo → název hry → smysl výpravy → datum/místo → hlavní CTA → sekundární navigace;
- datum a místo jsou zobrazené jako kompaktní event ticket místo dvojice těžkých reklamních bloků;
- hlavní CTA zní „Vyrazit za vltavíny“, pokračování a odkazy „Jak hrát / Rekordy / O akci“ mají samostatnou klidnější vrstvu;
- desktop, mobilní portrait i nízký landscape používají vlastní kompaktní rozložení;
- PWA cache byla zvýšena na `runtime-3`, aby se nový layout a copy propsaly i do nainstalované hry.

## Na zelené vlně 2026 — propagační integrace

- hra je na titulní obrazovce výslovně označena jako herní pozvánka na akci Na zelené vlně;
- menu uvádí termín **19. 9. 2026**, **České Budějovice** a **KD Slavie** a vysvětluje hlavní příběhový cíl: najít a nasbírat vltavíny a v posledním levelu dorazit na akci;
- do projektu bylo vloženo dodané logo Na zelené vlně a odkazy na `nazelenevlne.cz`;
- briefing každé lokality, průběžný HUD, finální porota a výsledková obrazovka připomínají reálný cíl výpravy;
- UI používá brandovou zelenou `#7CFFC3` a fialovou `#3A006E`; terén zůstává přírodní, aby se nezhoršila čitelnost gameplaye;
- PWA cache byla zvýšena na `runtime-2`, aby se nový branding a logo zobrazily i uživatelům se starší instalací.

## Produkční audit 5.4.2 — runtime a čitelnost

- Chybně určený vzorek v Ločenicích lze znovu dohledat radarem; chyby už nemohou natrvalo zablokovat úkol.
- Kopání lze pozastavit i dotykovým tlačítkem nebo skrytím stránky. Dokončení a opožděný příchod Franty používají čas aktuálního světa, nikoli nezávislé časovače.
- Mezerník funguje na tlačítkách nabídek; vstup z neherních obrazovek nezanechává pohyb.
- Stromy a borovice mají prostorovější stínování a koruny překrývající postavu částečně zprůhlední.
- Chvění a záblesk doznívají i během kopání. Systémové omezení pohybu vypne třes a celoplošné záblesky a stabilizuje déšť, zrno i varovný rám.
- Průběžný HUD omezil nadbytečné DOM aktualizace. Audio nepřenastavuje tentýž zdroj při každém úderu.
- Opožděná odměna za třetí přesný úder má na mobilu bezpečnou rezervu pro gesto pauzy, takže pomalejší landscape viewport nemůže nález dokončit před Escape.
- Popisy určování vltavínů vycházejí z podkladů Muzea vltavínů Český Krumlov a Národního muzea: impaktní sklo, kanálky/jamky, ostré výstupky, uzavřené bublinky, nepravidelná skulptace a varovné znaky sériově odlévaného zeleného skla.
- Radar má základní čekání 2 s; perk Bystrý rozhled ho může zkrátit až na 1,1 s, takže hledání nálezů nezdržuje tempo výpravy.
- PWA cache `runtime-1` chrání cizí cache na stejné doméně a ukládá jen známé úspěšné odpovědi. Základní statické soubory čte z verzované cache.
- Audit, omezení ověření a další priority jsou v `PRODUCTION_AUDIT.md`. Stávající obrazová brána pokrývá Chlum, radar a kopání; starší zmínka o referencích všech pěti map neodpovídá aktuální sadě.

## 5.4.2 — dodaná instrumentální hudba a zvuky

- Nesměň: zahrabávání průzkumných profilů je nově samostatná hold/release minihra — hráč drží tlačítko při přenosu hlíny a pustí ho v cílové zóně; tři správné přenosy uzavřou díru.

- Původní WAV soundtrack byl nahrazen dodanými MP3 ambienty pro Chlum, Nesměň, Besednici a Slávii; hudba se při přechodu lokality plynule zeslabí a znovu spustí.
- Radar, kopání, nálezy, dokumenty, nebezpečí, zásahy a výsledek používají dodané hudební/produkční efekty místo Web Audio 8bitových oscilátorů.
- Kopací minihra rozlišuje úder, přesný zásah, chybu a zahrabání podle dodaných variant dopadu; kroky zůstávají záměrně velmi tiché jako prostorový fallback.
- Service worker dostal novou audio cache a offline smoke ověřuje načtení skutečného ambientu i efektu.
- Přiložené licenční a auditní soubory zachovávají původ dodaných bytes; neregistrované alternativy nejsou aktivní součástí buildu.

## Vizuální iterace 5.4.2 — radar, Chlum a kopání

- PWA offline cache byla po vizuální iteraci revizována, aby nové `game.js`, `style.css` a `index.html` nahradily starou předcache i u dříve nainstalované aplikace;
- radar má nově kruhovou čtecí matici, jemné dosahové prstence, směrový sweep a krátké blipy už odhalených nálezů; dosah ani cooldown se nemění;
- minihra kopání dostala zemní profil, lopatu, materiálový měřák rytmu, čitelnější sweet-zone, časovač a odezvu úderu bez změny obtížnosti;
- Chlum používá nepravidelné brázdy, mokré stopy, hroudy a vzdálenou mez místo pravidelných horizontálních pásů;
- odhalené vltavíny a vzorky mají tlumenější přírodní sklovitý materiál, jemný lesk a stín namísto neonové ikony;
- organické profily mají širší napojení do půdy, vrstvené stěny, drobnou suť a čitelnější hloubku;
- traktor má větší čitelnou siluetu v rámci stávající kolizní stopy, oddělená kola s rotací, kabinu, výfuk, světlo, pružení podvozku a krátké stopy v půdě.

## Další dokončení 5.4.2 — postava, mapy a kopání

- nový třísměrový model hlavní postavy rozlišuje pohled zepředu, zezadu a z boku;
- chůze mění směr okamžitě podle hráče, takže postava při otáčení neopisuje oblouk jako auto;
- kroky, práce nohou a výbava reagují na skutečnou rychlost pohybu;
- povrch jednotlivých map dostal vlastní kameny, rostliny, kořeny, cesty a městské detaily;
- Chlum je čistě sběračská lokalita s vltavíny na povrchu a bez minihry kopání;
- povrchové vltavíny na Chlumu i vzorky v Ločenicích jsou nejdřív skryté a hráč je musí odhalit radarem;
- Chlum už neobsahuje staré obdélníkové výkopy a profily v ostatních mapách mají nepravidelné okraje, vrstvy zeminy a přirozenější hloubku;
- kopání v dalších lokalitách je rychlejší časovaná výzva s pohyblivou zónou, zrychlováním a podporou mezerníku.
- mobilní úder reaguje už při dotyku, má ochranu proti dvojímu spuštění a okamžitou světelnou, textovou i haptickou odezvu.

## Dokončení 5.4.2

- opravené noční osvětlení Besednice bez černého výřezu;
- opravené rozložení titulní obrazovky na telefonu v režimu naležato;
- ovládání se bezpečně uvolní při pauze, modálním okně, ztrátě fokusu a skrytí stránky;
- klávesnice správně zpracuje současně držené protisměrné klávesy;
- přidaná bezpečná migrace a normalizace starších uložených stavů;
- sjednocené číslo runtime, obrazovky, PWA cache a balíčku na 5.4.2;
- přidaná statická validace a Playwright matrix pro desktop a mobilní orientace.

## Kritické opravy

- obnovené chybějící funkce `drawPatrol`, `drawItem` a `drawHotspot`;
- hra už nespadne při prvním vykreslení levelu;
- opravené vykreslení traktoru, hlídek, kamenů, dokumentů, stop a profilů;
- opravené zavírání upozornění o krádeži bez nekonečného vytváření časovačů;
- boss začne honičku až po přečtení upozornění;
- přidaná kontrola, aby se boss nespustil po odchodu z Besednice;
- pohybová stopa bosse se kreslí pouze během sprintu;
- kužel svítilny se nezobrazuje, když je boss omráčený.
## 5.4.2 — hlavní postava

- přepracovaná silueta sběratele vltavínů s kloboukem, šátkem, batohem a detektorem;
- plynulejší idle animace, náklon při pohybu, střídání kroků a jemné vlnění šátku;
- vyšší kontrast postavy vůči poli, lesu i nočnímu prostředí bez změny kolizí nebo ovládání;
- postava zůstává při pohybu vzpřímená a podle směru se přirozeně zrcadlí vlevo nebo vpravo.
- jemné tematické světelné přechody oddělují pole, louku, les, noční Besednici a městskou Malši.
- lesem a noční Besednicí se pohybují tlumené světelné částice; při omezení pohybu systému zůstávají statické.
## 5.4.2 — další polish radaru, terénu a kopání

- Offline cache byla po této iteraci revizována na `visual-2` a test ověřuje odstranění staré cache i dostupnost hlavních assetů bez sítě.
- Přidána deterministická screenshot regresní brána pro všech pět lokalit a mobilní kopací obrazovku v portrétu i krajině.
- Statický terén Chlumu, Ločenic, Nesměně a Besednice se rasterizuje jednou do pomocného canvasu a v dalších snímcích se pouze kopíruje; dynamická voda v Malši zůstává živá.
- Vltavíny a vzorky dostaly čtyři přirozené barevné a tvarové varianty; profily navíc deterministicky střídají kořeny, kamínky a vrstvené světlé žíly.
- Kopací karta se v nízkém landscape režimu zhutní bez nutnosti scrollování, respektuje reduced-motion a doplňuje sémantické role a průběžný stav měřidla.
- Manifest, theme color a PWA zkratky byly sladěny s tmavě zeleným vizuálem; „Vyrazit“ a „Návod“ mají funkční query entrypointy a mobilní viewport už nezakazuje zoom.
## 5.4.2 — vizuální věrnost po auditu

- Radar při odhalení vyšle krátký lokalizovaný ping přímo na nový nález nebo profil.
- Vltavíny používají čtyři skutečně odlišné siluety místo jediné ikony s různou barvou.
- Výkopové profily dostaly materiálové kreslení pro písčitý, tmavý a polní podklad.
- Traktor odvozuje pružení, otáčení kol a drobný rozstřik zeminy od skutečné rychlosti.
- Duplicitní základní definice kopací minihry byly odstraněny; výsledné styly jsou soustředěné ve vizuálním passu.

## 5.4.2 — instrumentální soundtrack

- Nahrazeny ostré syntetické 8bitové hudební smyčky měkkými instrumentálními motivy s pianovým pluckem, dlouhým padem a basovou linkou.
- Každá lokalita má vlastní harmonickou variantu stejného hudebního jazyka, takže přechody zůstávají soudržné a přitom se neopakují identicky.
- Service-worker cache byla povýšena na `music-1`, aby se nová hudba dostala i do offline režimu.
