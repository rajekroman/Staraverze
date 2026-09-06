const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const fingerprint = (revision, model) => `${revision}:${JSON.stringify(model ?? {})}`;

export class HudController {
  constructor(options) {
    this.document = options.document;
    this.events = options.events;
    this.revision = -1;
    this.lastFingerprint = "";
    this.elements = {
      app: this.require("app"),
      hud: this.require("hud"),
      missionNumber: this.require("missionNumber"),
      placeLabel: this.require("placeLabel"),
      objectiveLabel: this.require("objectiveLabel"),
      objectiveProgress: this.require("objectiveProgress"),
      bagValue: this.require("bagValue"),
      dangerMeter: this.require("heatPill"),
      dangerMeterText: this.require("dangerMeterText"),
      dangerFill: this.require("heatFill"),
      dangerBanner: this.require("dangerBanner"),
      dangerText: this.require("dangerText"),
      hint: this.require("hint"),
      toast: this.require("toast"),
      action: this.require("actionButton"),
      actionIcon: this.require("actionIcon"),
      actionText: this.require("actionText")
    };
    this.installAccessibilityContracts();
    this.unsubscribe = [
      this.events.on("hud:model:changed", payload => this.render(payload)),
      this.events.on("finding:collected", payload => this.showToast(`NÁLEZ ZAPSÁN · +${Math.round(payload.score)} BODŮ`, "good")),
      this.events.on("objective:complete", () => this.showToast("ÚKOL SPLNĚN", "good"))
    ];
    this.toastTimer = null;
  }

  require(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`Missing HUD element: #${id}`);
    return element;
  }

  installAccessibilityContracts() {
    const elements = this.elements;
    elements.dangerMeter.setAttribute("role", "progressbar");
    elements.dangerBanner.setAttribute("role", "status");
    elements.dangerBanner.setAttribute("aria-live", "polite");
    elements.objectiveProgress.setAttribute("role", "progressbar");
    elements.toast.setAttribute("role", "status");
    elements.toast.setAttribute("aria-live", "polite");
    elements.toast.setAttribute("aria-hidden", "true");
    elements.action.removeAttribute?.("aria-pressed");
  }

  showToast(text, tone = "good") {
    const toast = this.elements.toast;
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    toast.textContent = String(text ?? "");
    toast.classList.remove("good", "bad", "rare");
    toast.classList.add("show", tone);
    toast.setAttribute("aria-hidden", "false");
    this.toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      toast.setAttribute("aria-hidden", "true");
      this.toastTimer = null;
    }, 2200);
  }

  render({ revision, model }) {
    if (!Number.isFinite(revision) || !model || typeof model !== "object") return;
    const nextFingerprint = fingerprint(revision, model);
    if (nextFingerprint === this.lastFingerprint) return;
    this.lastFingerprint = nextFingerprint;
    this.revision = revision;

    const elements = this.elements;
    elements.missionNumber.textContent = String(model.missionNumber ?? 1);
    elements.placeLabel.textContent = String(model.placeLabel ?? "").toUpperCase();
    elements.objectiveLabel.textContent = String(model.objective ?? "");
    const objectiveProgress = clamp01(model.objectiveProgress);
    const objectivePercent = Math.round(objectiveProgress * 100);
    elements.objectiveProgress.textContent = `POSTUP ${objectivePercent} %`;
    elements.objectiveProgress.setAttribute("aria-valuemin", "0");
    elements.objectiveProgress.setAttribute("aria-valuemax", "100");
    elements.objectiveProgress.setAttribute("aria-valuenow", String(objectivePercent));
    elements.objectiveProgress.setAttribute("aria-valuetext", `${objectivePercent} %`);
    elements.bagValue.textContent = String(Math.max(0, Number(model.findings) || 0));

    const danger = clamp01(model.danger);
    const warning = danger >= 0.35;
    const detected = danger >= 0.75;
    const critical = danger >= 0.9;
    const dangerState = critical ? "KRITICKÉ" : detected ? "POPLACH" : warning ? "POZOR" : "KLID";
    elements.dangerFill.style.width = `${Math.round(danger * 1000) / 10}%`;
    elements.dangerMeterText.textContent = dangerState;
    elements.dangerMeter.classList.toggle("warning", warning && !detected);
    elements.dangerMeter.classList.toggle("detected", detected);
    elements.dangerMeter.classList.toggle("critical", critical);
    elements.dangerMeter.setAttribute("aria-valuemin", "0");
    elements.dangerMeter.setAttribute("aria-valuemax", "100");
    elements.dangerMeter.setAttribute("aria-valuenow", String(Math.round(danger * 100)));
    elements.dangerMeter.setAttribute("aria-valuetext", dangerState);

    const dangerMessage = String(model.dangerMessage ?? (detected ? "TRAKTOR JE BLÍZKO" : ""));
    elements.dangerText.textContent = dangerMessage;
    elements.dangerBanner.classList.toggle("hidden", !dangerMessage);
    elements.dangerBanner.setAttribute("aria-hidden", dangerMessage ? "false" : "true");
    elements.app.classList.toggle("danger-state", detected);
    elements.hud.classList.toggle("danger-shake", critical);

    const actionLabel = String(model.actionLabel ?? "AKCE");
    const actionReady = Boolean(model.actionReady);
    const hint = String(model.hint ?? "");
    const interactionPrompt = actionReady
      ? [hint, `AKCE: ${actionLabel}`].filter(Boolean).join(" · ")
      : hint;
    elements.hint.textContent = interactionPrompt;
    elements.hint.classList.toggle("hidden", !interactionPrompt);
    elements.hint.classList.toggle("action-ready", actionReady);

    const visibleActionLabel = actionReady ? actionLabel : "PŘIBLIŽ SE";
    elements.action.classList.toggle("ready", actionReady);
    elements.action.classList.toggle("unavailable", !actionReady);
    elements.action.setAttribute("aria-label", actionReady ? actionLabel : "Akce není dostupná; přibliž se k cíli.");
    elements.action.setAttribute("aria-disabled", actionReady ? "false" : "true");
    elements.action.setAttribute("data-action-ready", actionReady ? "true" : "false");
    elements.actionIcon.textContent = actionReady ? String(model.actionIcon ?? "◉") : "↗";
    elements.actionText.textContent = visibleActionLabel;
  }

  dispose() {
    for (const unsubscribe of this.unsubscribe ?? []) unsubscribe?.();
    this.unsubscribe = null;
    if (this.toastTimer !== null) clearTimeout(this.toastTimer);
    this.toastTimer = null;
    this.lastFingerprint = "";
    this.elements.app.classList.remove("danger-state");
    this.elements.hud.classList.remove("danger-shake");
    this.elements.hint.classList.remove("action-ready");
    this.elements.action.classList.remove("ready");
    this.elements.action.classList.remove("unavailable");
    this.elements.toast.classList.remove("show", "good", "bad", "rare");
    this.elements.toast.setAttribute("aria-hidden", "true");
  }
}
