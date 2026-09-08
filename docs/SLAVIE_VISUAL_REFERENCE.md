# KD Slávie — vizuální reference a mapová adaptace

Tento dokument řídí samostatný vizuální PR pro Malši / KD Slávii. Nemění gameplay, souřadnice ani průchodnost.

## Ověřené zdroje

- Oficiální turistický portál České Budějovice: https://www.budejce.cz/aktivity/146-dum-kultury-slavie
- Encyklopedie Českých Budějovic: https://encyklopedie.c-budejovice.cz/clanek/dum-kultury-slavie
- Wikimedia Commons — kategorie KD Slávie: https://commons.wikimedia.org/wiki/Category:D%C5%AFm_kultury_Sl%C3%A1vie

Budova byla vystavěna v letech 1871–1872 podle návrhu Ignáce Ullmanna a patří mezi rané novorenesanční stavby města.

## Závazné rozpoznávací znaky

1. Symetrické hlavní průčelí s vysokým středovým trojúhelným tympanonem.
2. Kruhové okno v ose tympanonu.
3. Bosáž přízemí, výrazné římsy, pilastry a pravidelný rytmus oken.
4. Oblouková okna a tři výrazné centrální vstupy.
5. Teplá světlá omítka, tmavší střešní partie a kamenný nábřežní kontext.

## Herní zjednodušení

Mapa Malše je stylizovaná top-down kompozice, nikoli geometricky přesná rekonstrukce Jirsíkovy ulice. Proto:

- zachováváme existující world pozici `slavie`, plaza, silnici, exit a všechny quest souřadnice;
- skutečnou architekturu převádíme do čitelné frontální siluety, aby byla rozpoznatelná i na telefonu;
- boční křídla jsou zkrácena a perspektiva je zploštěna;
- banner „Na zelené vlně“ je sekundární vrstva a nesmí nahradit architektonickou identitu;
- Malše dostává čitelnější kamenné nábřeží a jemné odlesky, ale bez změny kolizí.

## Povinná vizuální evidence

- Slávie — hráč před budovou: desktop, iPhone portrait, iPhone landscape.
- Slávie — hráč za budovou: stejné 3 viewporty, pro kontrolu depth sort / occlusion.
- Malše — nábřeží: stejné 3 viewporty.
- Porovnání s předchozím `malse-slavie` baseline z PR #75.
- Fingerprint baseline se aktualizuje až po skutečné lidské kontrole candidate screenshotů.
