# Lovec vltavínů Reborn 5.4.2

## Další dokončení 5.4.2 — postava, mapy a kopání

- nový třísměrový model hlavní postavy rozlišuje pohled zepředu, zezadu a z boku;
- chůze mění směr okamžitě podle hráče, takže postava při otáčení neopisuje oblouk jako auto;
- kroky, práce nohou a výbava reagují na skutečnou rychlost pohybu;
- povrch jednotlivých map dostal vlastní kameny, rostliny, kořeny, cesty a městské detaily;
- Chlum je čistě sběračská lokalita s viditelnými vltavíny na povrchu a bez minihry kopání;
- kopání v dalších lokalitách je rychlejší časovaná výzva s pohyblivou zónou, zrychlováním a podporou mezerníku.

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
