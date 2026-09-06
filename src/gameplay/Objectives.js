import { DIG_REQUIRED_HITS, getLevelDefinition } from "../data/levels.js";

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const count = value => Math.max(0, Math.floor(Number(value) || 0));

function chlum(runtime) {
  const permit = runtime.permit === true;
  const digHits = count(runtime.digHits);
  const findings = count(runtime.findings);
  return {
    text: !permit
      ? "Promluv s Václavem"
      : digHits < DIG_REQUIRED_HITS
        ? `Kopání ${digHits}/${DIG_REQUIRED_HITS}`
        : findings < 1 ? "Vyzvedni nalezený vltavín" : "Vltavín je v bezpečí",
    complete: permit && digHits >= DIG_REQUIRED_HITS && findings >= 1,
    progress: clamp01((permit ? 0.2 : 0) + clamp01(digHits / DIG_REQUIRED_HITS) * 0.4 + clamp01(findings) * 0.4),
    current: { permit, digHits, findings },
    target: { permit: true, digHits: DIG_REQUIRED_HITS, findings: 1 }
  };
}

function nesmen(runtime) {
  const permit = runtime.permit === true;
  const dug = count(runtime.dug);
  const filled = count(runtime.filled);
  const findings = count(runtime.findings);
  return {
    text: !permit
      ? "Získej souhlas lesníka"
      : filled < dug
        ? "Zasyp otevřenou díru"
        : dug < 3
          ? `Profily ${dug}/3`
          : filled < 3
            ? `Zasypáno ${filled}/3`
            : findings < 1 ? "Vyzvedni nalezený vltavín" : "Les je uklizený",
    complete: permit && dug >= 3 && filled >= 3 && findings >= 1,
    progress: clamp01(
      (permit ? 0.1 : 0) +
      clamp01(dug / 3) * 0.35 +
      clamp01(filled / 3) * 0.35 +
      clamp01(findings) * 0.2
    ),
    current: { permit, dug, filled, findings },
    target: { permit: true, dug: 3, filled: 3, findings: 1 }
  };
}

function besednice(runtime) {
  const clues = count(runtime.clues);
  const hedgehog = runtime.hedgehog === true;
  const bossStarted = runtime.bossStarted === true;
  const bossDefeated = runtime.bossDefeated === true;
  const complete = clues >= 3 && hedgehog && bossStarted && bossDefeated;
  return {
    text: clues < 3
      ? `Stopy ${clues}/3`
      : !hedgehog
        ? "Vykopej ježkový profil"
        : !bossStarted || !bossDefeated ? "Dostaň ježek zpět" : "Ježek je v bezpečí",
    complete,
    progress: clamp01(clamp01(clues / 3) * 0.45 + (hedgehog ? 0.2 : 0) + (bossStarted ? 0.05 : 0) + (bossDefeated ? 0.3 : 0)),
    current: { clues, hedgehog, bossStarted, bossDefeated },
    target: { clues: 3, hedgehog: true, bossStarted: true, bossDefeated: true }
  };
}

function slavia(runtime) {
  const papers = count(runtime.papers);
  const expertConsulted = runtime.expertConsulted === true;
  const bossStarted = runtime.bossStarted === true;
  const bossDefeated = runtime.bossDefeated === true;
  const certified = runtime.certified === true;
  const entered = runtime.entered === true;
  const complete = papers >= 3 && expertConsulted && bossStarted && bossDefeated && certified && entered;

  let text = `Dokumenty ${papers}/3`;
  if (papers >= 3) text = !expertConsulted
    ? "Promluv se znalkyní"
    : !bossStarted || !bossDefeated
      ? "Získej kámen zpět od Franty"
      : !certified ? "Vrať se pro certifikát" : !entered ? "Vstup na akci" : "Sbírka je vystavena";

  return {
    text,
    complete,
    progress: clamp01(
      clamp01(papers / 3) * 0.3 +
      (expertConsulted ? 0.15 : 0) +
      (bossStarted ? 0.05 : 0) +
      (bossDefeated ? 0.2 : 0) +
      (certified ? 0.2 : 0) +
      (entered ? 0.1 : 0)
    ),
    current: { papers, expertConsulted, bossStarted, bossDefeated, certified, entered },
    target: { papers: 3, expertConsulted: true, bossStarted: true, bossDefeated: true, certified: true, entered: true }
  };
}

const evaluators = Object.freeze({ chlum, nesmen, besednice, slavia });

export function evaluateObjective(levelId, runtime = {}) {
  const level = getLevelDefinition(levelId);
  if (!level) throw new Error(`Unknown level: ${levelId}`);
  const evaluator = evaluators[level.id];
  if (!evaluator) throw new Error(`No objective evaluator for level: ${level.id}`);
  return { levelId: level.id, levelName: level.name, ...evaluator(runtime ?? {}) };
}

export function isObjectiveComplete(levelId, runtime = {}) {
  return evaluateObjective(levelId, runtime).complete;
}
