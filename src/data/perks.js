const freezePerk = perk => Object.freeze({ ...perk });

export const PERK_DEFINITIONS = Object.freeze([
  { id: "boots", icon: "↟", name: "Lehké boty", text: "+12 % rychlost pohybu", max: 3 },
  { id: "scanner", icon: "◉", name: "Bystrý rozhled", text: "větší dosah rozhlédnutí a kratší čekání", max: 3 },
  { id: "shovel", icon: "⛏", name: "Přesná lopatka", text: "širší zelené pole při kopání", max: 3 },
  { id: "quiet", icon: "◌", name: "Tichý postup", text: "méně pozornosti za chyby", max: 3 },
  { id: "case", icon: "▣", name: "Pevné pouzdro", text: "při dopadení neztratíš nejlepší kus", max: 2 },
  { id: "eye", icon: "◉", name: "Zkušené oko", text: "vyšší kvalita správně určených kusů", max: 3 }
].map(freezePerk));

const perkById = new Map(PERK_DEFINITIONS.map(perk => [perk.id, perk]));

export function getPerkDefinition(id) {
  return perkById.get(id) ?? null;
}
