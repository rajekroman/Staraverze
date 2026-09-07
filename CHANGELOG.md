# Lovec vltavínů Reborn 5.4.2

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
## 5.4.2 — instrumentální soundtrack

- Nahrazeny ostré syntetické 8bitové hudební smyčky měkkými instrumentálními motivy s pianovým pluckem, dlouhým padem a basovou linkou.
- Každá lokalita má vlastní harmonickou variantu stejného hudebního jazyka, takže přechody zůstávají soudržné a přitom se neopakují identicky.
- Service-worker cache byla povýšena na `music-1`, aby se nová hudba dostala i do offline režimu.
