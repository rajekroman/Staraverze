# Besednice — bagr: otočná nástavba a pracovní hydraulika

Tento PR mění pouze vizuální a animační reprezentaci bagru. Souřadnice obou strojů, světla, stopy, profily, questy, průchodnost a gameplay Besednice zůstávají beze změny.

## Stav strojů

- Bagr u hlavní těžební plochy je pracovní: otáčí pouze nástavbou a cykluje výložník, násadu a lžíci.
- Druhý bagr je odstavený: jeho pracovní fáze i natočení zůstávají po zastavení konstantní.
- Pásy se v tomto PR nepohybují. Animace nesmí naznačovat jízdu stroje.

## Mechanická pravidla

- Otočná nástavba používá vlastní `turretAngle` a omezenou rychlost otáčení.
- Výložník, násada a lžíce jsou hierarchické klouby; změna rodičovského úhlu přenáší pozici na další článek.
- Hydraulické válce jsou vizuálně svázané s příslušnými rameny.
- Pracovní fáze se zvyšuje pouze při nenulovém `workSpeed`.
- Po vypnutí práce `workSpeed` plynule klesne na nulu a pracovní fáze se zastaví.
- Zemina se u lžíce zobrazuje pouze v aktivní části pracovního cyklu.
- Pásy, stín a world pozice zůstávají po celou animaci pevné.

## Materiály

Pásy, kovová nástavba, kabina/sklo, hydraulika a lžíce musí zůstat rozlišitelné tvarem, kontrastem a povrchovou kresbou, ne pouze barvou.

## Povinná evidence

- hráč před bagrem: desktop, iPhone portrait, iPhone landscape;
- hráč za bagrem: stejné tři viewporty;
- aktualizovaná společná scale-reference;
- video: odstavený stav → spuštění práce → cyklus lžíce → otočení nástavby → změna směru otočení → zastavení;
- motion test musí potvrdit, že world `x/y` zůstávají stejné a po zastavení se nemění `workPhase` ani `turretAngle`.

Fingerprint baseline se zmrazí až po skutečné lidské kontrole candidate screenshotů.
