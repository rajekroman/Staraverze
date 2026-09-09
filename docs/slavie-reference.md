# Malše / Kulturní dům Slávie

Vizuální podklad ověřen 8. 9. 2026. Jde o kulturní dům v centru Českých Budějovic, nikoli průmyslový areál.

## Zdroje a pozorování

- [Město: rekonstrukce KD Slavie](https://www.c-budejovice.cz/rekonstrukce-kd-slavie): reprezentativní vstup a obnovené schodiště od Malše, severovýchodní přístavba, restaurace k parku, kavárna v severním rohu, dlážděné předprostory, cyklotrasa a zachované vzrostlé stromy.
- [StavbaWeb: dokončený kulturní dům](https://www.stavbaweb.cz/zpravy/kulturni-dum-slavie-v-ceskych-budejovicich/): novorenesanční budova z roku 1872; fotografie Pavel Balek / podklady Jan Proksa.
- Prohlédnutá [fotografie od řeky](https://www.stavbaweb.cz/wp-content/uploads/2026/01/KD_Slavie_CB_06-1024x683.jpg): světlé symetrické průčelí, vysoká okna s obloukovým zakončením, římsy, pilastry, nízká střecha a centrální trojúhelníkový štít s oválným detailem. V popředí kamenné nábřeží a voda.
- Prohlédnutá [fotografie přístavby a parku](https://www.stavbaweb.cz/wp-content/uploads/2026/01/KD_Slavie_CB_01-1024x768.jpg): moderní světlý objem se sklem za historickou částí, velký strom, kamenná dlažba a schody.

Fotografie slouží jako reference. Nejsou kopírovány do distribuovaných herních assetů. Kresba v Canvasu je vlastní stylizace; barva fasády je teplejší krémová / světlá okrová.

## Vědomé herní zjednodušení

Mapa není geodetická rekonstrukce. Zachovává dosavadní svislý tok, silnici, most, souřadnice dokumentů, trasu Franty i vstup (1450, 250). Průčelí a schody jsou natočeny k hráči kvůli čitelnosti; skutečný vstup míří k Malši. Parkové rekvizity nepřidávají kolize. Moderní část je vizuálně podřízena historickému domu.

## Regression

`npm run test:visual` obsahuje dva pevné záběry (průčelí, nábřeží), každý na desktopu, iPhone portrait a landscape. Seed 1872, pozastavený čas a přesně 3000 ms simulace fixují vodu, pohyb a kameru. PNG snapshoty porovnávají celé obrazovky včetně HUD; změny fasády se neskrývají v hrubém barevném průměru.
