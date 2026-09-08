# Malše — auto: měřítko, materiál a fyzický pohyb

Tento PR mění pouze vizuální reprezentaci auta a její důkazní testy. Trasa auta v Malši, rychlost 190, collision scale, questy a průchodnost zůstávají beze změny.

## Měřítko a kolize

- `scale: 1.7` zůstává gameplay hodnotou a dál určuje původní collision radius.
- `visualScale: 1.25` zvětšuje pouze kresbu kampaně; collision geometry se nemění.
- Ve společné scale-reference používá auto `scale: 4.0`, aby jeho délka odpovídala přibližně 2,7 výšky dospělé postavy.
- Varianta 0 je sedan, varianta 1 má delší estate/hatch střechu; nejde pouze o změnu barvy.

## Pohyb

- Rotace kol je odvozena z reálně ujeté vzdálenosti a skutečného vykresleného poloměru kola.
- Přední kola vizuálně reagují na `turnAmount`.
- Karoserie má velmi malé odpružení a náklon pouze při skutečném pohybu.
- Po zastavení se `wheelRotation` ani `distanceTravelled` dál nemění a odpružení je nulové.
- Vizuální směr používá plynulý `visualAngle`; gameplay body trasy se nemění.

## Materiál a čitelnost

Pneumatiky, disky, lak, sklo, nárazníky, světla, zrcátka a spáry dveří jsou oddělené tvarem a kontrastem. Předek a zadek musí být rozeznatelné i bez pohybu.

## Povinná evidence

- hráč před autem: desktop, iPhone portrait, iPhone landscape;
- hráč za autem: stejné tři viewporty;
- aktualizovaná společná scale-reference;
- video: stojící auto → rozjezd → jízda s rotací kol → zatočení → zastavení;
- samostatná „work action“ pro osobní auto není relevantní; nic se nesmí uměle animovat jen kvůli videu.

Nové fingerprint baseline se zmrazí až po skutečné lidské kontrole candidate screenshotů.
