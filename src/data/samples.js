const freezeSample = sample => Object.freeze({ ...sample });

export const SAMPLE_DEFINITIONS = Object.freeze([
  { id: "olive-fragment", real: true, title: "Olivový úlomek", text: "Matný povrch, nepravidelné hrany a drobné podélné bubliny." },
  { id: "bright-green-shard", real: false, title: "Jasně zelený střep", text: "Dokonale hladký povrch, ostrý rovný lom a nepřirozeně sytá barva." },
  { id: "brown-green-splash", real: true, title: "Hnědozelený splash", text: "Proměnlivá barva, zvlněná skulptace a nestejná tloušťka." },
  { id: "glossy-cast", real: false, title: "Lesklý odlitek", text: "Stejnoměrná barva, kulaté hrany a opakující se povrchový vzor." },
  { id: "small-complete-form", real: true, title: "Drobný celotvar", text: "Přirozeně leptaný povrch a jemná průsvitnost proti světlu." },
  { id: "bottle-glass", real: false, title: "Lahvové sklo", text: "Ploché stěny, pravidelná tloušťka a hladké průmyslové plochy." }
].map(freezeSample));

const sampleById = new Map(SAMPLE_DEFINITIONS.map(sample => [sample.id, sample]));

export function getSampleDefinition(id) {
  return sampleById.get(id) ?? null;
}
