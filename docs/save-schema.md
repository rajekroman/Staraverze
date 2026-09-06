# Save schema a kompatibilita

## Aktivní produkční klíč

```text
lovecVltavinuRebornSaveV5_1
```

Stabilizační vydání 5.2 nemění datový formát rozehrané výpravy. Runtime verze, service worker cache a save schema jsou oddělené pojmy.

## Normalizovaný stav

```js
{
  version: "5.1.0",
  schemaVersion: "5.1",
  runtimeVersion: "6.0.0",
  levelIndex: 0,
  score: 0,
  stones: [],
  heat: 0,
  combo: 1,
  comboTimer: 0,
  caught: 0,
  perks: { boots: 0, scanner: 0, shovel: 0, quiet: 0, case: 0, eye: 0 },
  stats: { digs: 0, correct: 0, misses: 0, rare: 0 },
  sound: true
}
```

Pole `version: "5.1.0"` zůstává zachováno kvůli kompatibilitě se stávajícím monolitem. `runtimeVersion` označuje modulární kód, který stav normalizoval.

## Podporované starší klíče

Adaptér prohledává aktuální klíč a následně verze 5.0, 4.9, 4.8, 4.7, 4.6 a 4.5. Aktuální klíč má vždy přednost. Neplatný JSON nebo záznam bez pole `stones` je přeskočen a lze jej zaznamenat přes callback `onInvalid`.

## Normalizační pravidla

- `levelIndex` se omezí na existující levely;
- záporné skóre, statistiky a počet dopadení se nastaví na nulu;
- `heat` se omezí na `0–100`;
- `combo` se omezí na `1–6`;
- perky se omezí podle `PERK_DEFINITIONS`;
- neplatné kameny se odstraní;
- číselné vlastnosti kamenů se převedou na bezpečné nezáporné hodnoty;
- chybějící `perks` a `stats` se doplní;
- zvuk je zapnutý, pokud není výslovně `false`.

## Bezpečnost migrace

Výchozí migrace přečte první platný záznam, normalizuje jej, zapíše pod aktuální klíč a ponechá starší klíč jako nouzovou zálohu. Zdroj se odstraní pouze při explicitním `removeSource: true` a až po úspěšném zápisu.

Při budoucí nekompatibilní změně musí vzniknout nový identifikátor schématu, nový cílový klíč, explicitní transformace ze všech podporovaných formátů a unit test každé migrační cesty. Pouhé navýšení verze vydání není důvodem ke smazání rozehrané výpravy.
