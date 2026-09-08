# Chlum — traktor: vizuál a fyzická animace

Tento PR mění pouze obrazovou a animační reprezentaci traktoru. Trasa, rychlost kampaně, kolize, questy a průchodnost zůstávají beze změny.

## Pohybová pravidla

- Rotace kol vzniká z reálně ujeté vzdálenosti dělené vizuálním poloměrem kola, ne z času.
- Přední menší kolo se otáčí rychleji v poměru poloměrů.
- Odpružení a lehký náklon karoserie existují pouze při skutečném pohybu.
- Zastavený traktor nesmí dál houpat karoserií, otáčet koly, prášit ani pohybovat pracovním nářadím.
- Vizuální natočení traktoru se v zatáčce přibližuje směru jízdy plynule; gameplay trajektorie se nemění.
- Zadní kultivátor je čistě vizuální. Nemá vlastní kolizi ani nový herní účinek.

## Materiál a objem

- Pneumatiky, disky, blatníky, plechy, sklo a pracovní nářadí musí být rozlišitelné i bez spoléhání pouze na barvu.
- Kontakt se zemí drží pevný stín; kola zůstávají na povrchu a pohybuje se odpružená část karoserie.
- Dvě tvarové varianty používají rozdílný detail kapoty/mřížky, nikoli pouze jinou barvu.

## Evidence

Povinné screenshoty:
- hráč před traktorem: desktop, iPhone portrait, iPhone landscape;
- hráč za traktorem: stejné tři viewporty;
- aktualizovaná společná scale-reference.

Povinný video artifact:
- stop před rozjezdem;
- rozjezd;
- pracovní jízda se spuštěným kultivátorem;
- zatočení;
- zastavení bez pokračující rotace kol nebo odpružení.

Fingerprinty nových screenshotů se zmrazí až po skutečné lidské kontrole candidate artifactů.
