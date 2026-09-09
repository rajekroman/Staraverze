# Audio release gate

Hudební vrstva hry nově obsahuje i projektově původní procedurální score generované za běhu přes Web Audio. Nepoužívá externí samply ani nový distribuovaný audio soubor a nevstupuje proto do licenčního gate MP3 assetů.

Automaticky je ověřeno, že aktivní MP3 soubory existují, jsou součástí manifestu service workeru a mají záznam integrity v `assets/audio/v73-audio-build-audit.json`.

Licenční gate pro aktivní produkční MP3 je uzavřený potvrzením vlastníka z 9. 9. 2026: soubory byly vygenerované přímo pro Lovec vltavínů: Na zelené vlně pomocí ElevenLabs, neobsahují úmyslně vložené cizí samply a jsou autorizované k veřejné distribuci se hrou přes GitHub Pages podle podmínek účtu ElevenLabs platných při generování.

Ruční poslechový gate zůstává záměrně otevřený: tento běh nemůže předstírat poslech člověkem. Před vydáním vlastník provede poslech na reproduktoru i sluchátkách:

```sh
open assets/audio/ambient/ambient-chlum.mp3
open assets/audio/ambient/ambient-nesmen.mp3
open assets/audio/ambient/ambient-besednice.mp3
open assets/audio/ambient/ambient-slavia.mp3
open assets/audio/effects/dig-hit.mp3
open assets/audio/effects/dig-perfect.mp3
open assets/audio/effects/dig-miss.mp3
```

Potvrďte v release issue/PR: „Poslech OK pro všechny aktivní soubory.“ Do té doby je stav audio kvality **PENDING MANUAL LISTEN**, přestože licence, technická integrita a offline načtení jsou zelené.
