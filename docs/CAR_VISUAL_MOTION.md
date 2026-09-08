# Malše — osobní auto: měřítko, zatáčení a kola

Tento PR mění pouze vizuální reprezentaci a motion evidence osobního auta. Trasa, rychlost, gameplay kolize, questy a průchodnost Malše zůstávají beze změny.

## Měřítko

- Gameplay hodnota `scale: 1.7` zůstává kvůli existující kolizi a pravidlům provozu.
- Samostatný `visualScale` zvětšuje pouze kresbu auta, aby silueta vůči dospělé postavě odpovídala společnému cíli přibližně 2,3–2,7 U na délku.
- Referenční scéna používá vlastní `visualScale`, ale nemění gameplay.

## Pohyb

- Karoserie se natáčí přes plynulý `visualAngle`, nikoli skokově podle okamžitého směru.
- Čtyři kola používají už existující `wheelRotation`; přední kola navíc jemně reagují na `turnAmount`.
- Kola se otáčejí jen podle skutečně ujeté vzdálenosti a po zastavení zůstanou stát.
- Velmi malé odpružení karoserie je aktivní jen při jízdě.
- Žádný frame-random šum ani změna trasy.

## Materiály a silueta

- samostatně čitelná karoserie, kapota, kufr a kabina;
- sklo má vlastní materiál a A/B členění;
- čtyři pneumatiky, nárazníky, zrcátka, světla a přední mřížka;
- dvě deterministické barevné varianty pro referenční scénu a Malši.

## Povinná evidence

- hráč před autem: desktop, iPhone portrait, iPhone landscape;
- hráč za autem: stejné tři viewporty;
- aktualizovaná společná scale-reference;
- video: zastavení → rozjezd → jízda → zatáčka → zastavení;
- motion test musí potvrdit, že po zastavení neroste `wheelRotation` ani `distanceTravelled`.

Candidate screenshoty a nový scale-reference se nejprve pořídí bez zmrazeného fingerprintu. Baseline se doplní až po skutečné vizuální kontrole artifactů.
