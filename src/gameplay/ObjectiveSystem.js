import { getLevelDefinition } from "../data/levels.js";
import { evaluateObjective } from "./Objectives.js";

const roundProgress = value => Math.round(value * 10000) / 10000;
const PERMISSION_FLAGS = Object.freeze({ chlum: "chlumPermission", nesmen: "nesmenPermission" });

export class ObjectiveSystem {
  constructor(options = {}) {
    this.events = options.events ?? null;
    this.session = options.session;
    this.levelId = options.levelId ?? "chlum";
    this.level = getLevelDefinition(this.levelId);
    this.permissionFlag = options.permissionFlag ?? PERMISSION_FLAGS[this.levelId] ?? null;
    if (!this.session?.state || !this.session?.setFlag || !this.session?.recordFinding) throw new TypeError("ObjectiveSystem requires a GameSession.");
    if (!this.level) throw new Error(`Unknown level: ${this.levelId}`);
    this.lastProgress = null;
    this.completed = this.session.state.objective.complete === true;
  }

  grantPermission() {
    if (!this.permissionFlag) return false;
    if (this.session.state.flags[this.permissionFlag] === true) return false;
    this.session.setFlag(this.permissionFlag, true);
    return true;
  }

  recordFinding(input) {
    this.session.recordFinding(input);
    const findingId = String(input?.findingId ?? "").trim();
    const finding = this.session.state.findings.find(entry => entry.findingId === findingId);
    this.events?.emit("finding:collected", { ...finding });
    return finding;
  }

  snapshot(runtime = {}) {
    return evaluateObjective(this.levelId, {
      ...runtime,
      ...(this.permissionFlag ? { permit: this.session.state.flags[this.permissionFlag] === true } : {}),
      findings: this.session.state.findings.filter(entry => entry.locality === this.levelId).length
    });
  }

  update(runtime = {}) {
    const snapshot = this.snapshot(runtime);
    const required = this.level.objective.required;
    const current = roundProgress(snapshot.progress * required);
    if (current !== this.lastProgress) {
      this.lastProgress = current;
      this.events?.emit("objective:progress", { id: this.level.objective.id, current, required });
    }
    if (snapshot.complete && !this.completed) {
      this.completed = true;
      this.session.setObjectiveProgress(required, true);
      this.events?.emit("objective:complete", { id: this.level.objective.id, levelId: this.levelId });
      this.events?.emit("level:complete", { levelId: this.levelId, nextLevelId: this.level.next ?? null, score: this.session.state.score });
    }
    return snapshot;
  }

  reset() {
    this.lastProgress = null;
    this.completed = false;
  }
}
