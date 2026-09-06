import { NesmenRestorationScene } from "./NesmenRestorationScene.js";

export class NesmenBesedniceBridgeScene extends NesmenRestorationScene {
  showResult() {
    this.resultShown = true;
    this.session.setPhase("complete");
    this.levelComplete = Object.freeze({ levelId: "nesmen", nextLevelId: "besednice", score: this.session.state.score });
    this.app.input.reset("nesmen-complete");
    this.screens.showLevelResult({
      kicker: "NESMĚŇ DOKONČENA",
      title: "V lese nezůstala jediná díra",
      text: "Tři profily jsou prohlédnuté, nález je zaznamenaný a les je vrácený do původního stavu.",
      score: this.session.state.score,
      stats: [
        { label: "POVOLENÍ", value: "ANO" },
        { label: "PROFILY", value: `${this.dugCount()}/3` },
        { label: "ZASYPÁNO", value: `${this.filledCount()}/3` },
        { label: "NÁLEZY", value: this.session.state.findings.filter(entry => entry.locality === "nesmen").length }
      ],
      buttonLabel: "POKRAČOVAT DO BESEDNICE",
      onContinue: () => this.app.changeScene("besednice").catch(error => console.error("Scene transition:", error))
    });
  }
}
