# Drobné tvrdé rekvizity — lavička, lampa a cedule

Tento PR opravuje a sjednocuje tři statické props bez zásahu do terrainu, questů, průchodnosti nebo world souřadnic.

## Lavička

- opravuje regresi, kdy `generateScaleReference()` stále přidával `bench`, ale `drawProp()` už pro lavičku neměl renderer;
- oddělená kovová konstrukce a dřevěné lamely;
- kontaktní stín a čitelné nohy/opěradlo;
- sedák v referenční scéně odpovídá přibližně 0,27 výšky dospělé postavy;
- pevná kresba dřeva bez frame-random šumu.

## Lampa

- vyšší silueta odpovídající městské/areálové lampě;
- samostatná patka, kovový stožár, hlavice a světelný zdroj;
- měkká lokální záře nesmí překrývat objekty ani fungovat jako gameplay indikátor;
- pouze rendererová změna, bez nové kolize.

## Cedule

- dřevěný sloupek, tmavý rám a světlá deska jsou materiálově oddělené;
- dlouhé české názvy se automaticky zmenšují podle změřené šířky;
- povinný test používá text „Zátkovo nábřeží“, aby nepřetékal mimo desku.

## Povinná evidence

- `scale-reference` × desktop / iPhone portrait / iPhone landscape — lavička musí být znovu skutečně viditelná;
- `malse-street-props` × stejné 3 viewporty — hráč, dlouhá cedule a lampa v jedné scéně;
- statický PR nemá vlastní motion job; tractor/excavator/car motion joby zůstávají v CI jako regresní pojistka.

Fingerprinty těchto scén se zmrazí až po skutečné vizuální kontrole candidate artifactů.
