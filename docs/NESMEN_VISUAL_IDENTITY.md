# Nesměň — vlhký les a malé povolené profily

Tento PR mění vizuální identitu Nesměně bez změny questů, hotspot souřadnic, patrol, průchodnosti nebo logiky kopání/zasypání.

## Tři povinné vizuální znaky

1. **Tmavá vlhká půda**
   - podklad je tmavší hnědozelený a chladnější než Ločenice;
   - jemné krátké odlesky naznačují vlhkost, ne velké louže;
   - lesní cesta je užší a utlumená, aby nepůsobila jako hlavní vizuální objekt.

2. **Mech a kapradí**
   - nepravidelné mechové ostrůvky jsou kreslené přímo v terrain cache;
   - Nesměň kapradí mají hustší listovou kresbu a tmavší mokrou zelenou;
   - mech ani kapradí nepřidávají collision.

3. **Malé povolené profily**
   - stávající `needsFill` hotspot se nemění rozměrem ani gameplay dosahem;
   - v Nesměni dostává čtyři nízké dřevěné kolíky a tlumený provázek;
   - jde stále o stejný profil, který hráč po získání souhlasu odhalí, vykope a následně zasype.

## Zachovaný gameplay

- 4 hotspoty zůstávají na původních souřadnicích;
- permit/dug/filled/open logika beze změny;
- ranger patrol má stejnou trasu, rychlost a vision;
- lesník, chata a exit zůstávají na původních world pozicích;
- běžné náhodné rozmístění stromů, borovic, keřů, kapradí, trávy, pařezů a klád se nemění.

## Stabilní QA

Běžný layout Nesměně je náhodný. Debug-only `startNesmenReference()` proto skládá deterministickou scénu ze stejných rendererů:
- mokrý tmavý terrain;
- mechové ostrůvky;
- chata;
- stromy a borovice;
- čtyři kapradiny;
- kláda + pařez;
- jeden skutečný `needsFill` profil s pevně nastaveným úhlem a `revealed:true`;
- hráč pro kontrolu měřítka.

V debug reference je pouze vypnuté pulzování hotspotu, aby fingerprint zůstal stabilní. Běžný gameplay hotspot dál pulzuje jako předtím.

Povinná evidence: `nesmen-identity` na desktopu, iPhone portrait a iPhone landscape. Fingerprinty se zmrazí až po skutečné ruční kontrole candidate artifactů.
