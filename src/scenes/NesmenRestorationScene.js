import { NesmenScene } from "./NesmenScene.js";

export class NesmenRestorationScene extends NesmenScene {
  openProfileEntity() {
    return this.profileEntities.find(entity => {
      const spot = this.app.world.get(entity, "digSpot");
      return spot?.dug === true && spot.filled !== true;
    }) ?? null;
  }

  syncProfileInteractions() {
    const openEntity = this.openProfileEntity();
    const permitted = this.session.state.flags.nesmenPermission === true;

    for (const entity of this.profileEntities) {
      const spot = this.app.world.get(entity, "digSpot");
      const interaction = this.app.world.get(entity, "interaction");
      if (!spot || !interaction) continue;

      const visual = this.profileVisuals.get(entity);
      if (spot.filled) {
        interaction.enabled = false;
        if (visual) {
          visual.marker.visible = false;
          visual.hole.visible = false;
        }
        continue;
      }

      if (entity === openEntity) {
        interaction.kind = "fill";
        interaction.label = "ZAHRNOUT";
        interaction.enabled = true;
        if (visual) {
          visual.marker.visible = false;
          visual.hole.visible = true;
        }
        continue;
      }

      interaction.kind = "dig";
      interaction.label = "KOPAT";
      interaction.enabled = permitted && openEntity === null && spot.dug !== true;
      if (visual) {
        visual.marker.visible = interaction.enabled;
        visual.hole.visible = spot.dug === true;
      }
    }
  }

  startDig(entity) {
    if (this.openProfileEntity() !== null) return false;
    return super.startDig(entity);
  }

  strikeDig() {
    const dugBefore = this.dugCount();
    super.strikeDig();
    if (this.dugCount() === dugBefore) return;

    this.syncProfileInteractions();
    this.availableInteraction = null;
    this.interactions.clear();
    this.emitHud(true);
  }

  fillProfile(entity) {
    const openEntity = this.openProfileEntity();
    if (openEntity !== null && openEntity !== entity) return false;

    const filledBefore = this.filledCount();
    super.fillProfile(entity);
    if (this.filledCount() === filledBefore) return false;

    this.syncProfileInteractions();
    this.availableInteraction = null;
    this.interactions.clear();
    this.emitHud(true);
    return true;
  }
}
