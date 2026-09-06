import { DIG_REQUIRED_HITS, LEVEL_ORDER, getLevelDefinition } from "../data/levels.js";
import { NESMEN_ENTITY_DEFINITIONS, NESMEN_PROFILE_IDS, createNesmenFinding } from "../data/nesmen.js";
import { getDialogueDefinition } from "../data/dialogues.js";
import { InteractionSystem } from "../gameplay/InteractionSystem.js";
import { DigSystem } from "../gameplay/DigSystem.js";
import { ObjectiveSystem } from "../gameplay/ObjectiveSystem.js";
import { ModelFactory } from "../render/ModelFactory.js";
import { setBoundedCameraCenter } from "../render/CameraBounds.js";

const MANIFEST_ENTRY = Object.freeze({ id: "nesmen-runtime-assets", type: "json", url: "./assets/manifests/assets.json" });
const cloneData = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class NesmenScene {
  constructor(options) {
    this.app = options.app;
    this.events = options.events;
    this.renderer = options.renderer;
    this.THREE = options.three;
    this.screens = options.screens;
    this.session = options.session;
    this.level = getLevelDefinition("nesmen");
    this.modelFactory = new ModelFactory({ renderer: this.renderer });
    this.visualRoot = null;
    this.assetEntries = new Map();
    this.loadedModels = new Map();
    this.entityByExternalId = new Map();
    this.externalIdByEntity = new Map();
    this.profileVisuals = new Map();
    this.playerEntity = null;
    this.foresterEntity = null;
    this.profileEntities = [];
    this.findingEntity = null;
    this.activeProfileEntity = null;
    this.availableInteraction = null;
    this.modal = null;
    this.totalDigHits = 0;
    this.resultShown = false;
    this.levelComplete = null;
    this.hudRevision = 0;
    this.hudSignature = "";
    this.interactions = new InteractionSystem({ events: this.events });
    this.dig = new DigSystem({ events: this.events });
    this.objectives = new ObjectiveSystem({ events: this.events, session: this.session, levelId: "nesmen" });
  }

  async enter() {
    this.resetRuntime();
    this.session.enterLevel(this.level.id);
    await this.loadAssets();
    this.instantiateWorld();
    await this.createVisualWorld();
    this.setCameraToPlayer();
    this.screens.showBrief(this.level, LEVEL_ORDER.length, () => this.beginPlaying());
    this.emitHud(true);
  }

  resetRuntime() {
    this.destroyVisualWorld();
    this.app.world.clear();
    this.app.collisions.reset();
    this.interactions.clear();
    this.dig.cancel();
    this.objectives.reset();
    this.assetEntries.clear();
    this.loadedModels.clear();
    this.entityByExternalId.clear();
    this.externalIdByEntity.clear();
    this.profileVisuals.clear();
    this.playerEntity = null;
    this.foresterEntity = null;
    this.profileEntities = [];
    this.findingEntity = null;
    this.activeProfileEntity = null;
    this.availableInteraction = null;
    this.modal = null;
    this.totalDigHits = 0;
    this.resultShown = false;
    this.levelComplete = null;
    this.hudSignature = "";
  }

  async loadAssets() {
    const manifest = await this.app.assets.load(MANIFEST_ENTRY);
    if (!Array.isArray(manifest)) throw new Error("Nesměň asset manifest must be an array.");
    this.app.assets.setManifest(manifest);
    const selected = this.app.assets.selectPreload(this.level.assetGroups);
    this.assetEntries = new Map(selected.map(entry => [entry.id, entry]));
    const loaded = await this.app.assets.loadAll(selected);
    for (const [id, asset] of loaded) {
      const entry = this.requireAsset(id);
      if (entry.type === "texture" || entry.type === "spritesheet") this.configureTexture(entry, asset);
      else if (entry.type === "gltf") {
        asset.userData.assetId = id;
        this.loadedModels.set(id, asset);
      }
    }
  }

  requireAsset(id) {
    const entry = this.assetEntries.get(id);
    if (!entry) throw new Error(`Missing Nesměň asset entry: ${id}`);
    return entry;
  }

  configureTexture(entry, texture) {
    texture.colorSpace = this.THREE.SRGBColorSpace;
    if (entry.wrap === "repeat") {
      texture.wrapS = this.THREE.RepeatWrapping;
      texture.wrapT = this.THREE.RepeatWrapping;
    }
    texture.needsUpdate = true;
    return texture;
  }

  texture(id) {
    const entry = this.requireAsset(id);
    if (entry.type !== "texture" && entry.type !== "spritesheet") throw new Error(`Asset ${id} is not a texture.`);
    const texture = this.app.assets.get(id, entry.type);
    if (!texture) throw new Error(`Texture is not loaded: ${id}`);
    return texture;
  }

  model(id) {
    const model = this.loadedModels.get(id);
    if (!model) throw new Error(`Model is not loaded: ${id}`);
    return model;
  }

  instantiateWorld() {
    for (const definition of NESMEN_ENTITY_DEFINITIONS) {
      const components = cloneData(definition.components);
      components.previousTransform = { ...components.transform };
      const entity = this.app.world.createEntity(components);
      this.entityByExternalId.set(definition.id, entity);
      this.externalIdByEntity.set(entity, definition.id);
    }
    this.playerEntity = this.entityByExternalId.get("player");
    this.foresterEntity = this.entityByExternalId.get("forester");
    this.profileEntities = NESMEN_PROFILE_IDS.map(id => this.entityByExternalId.get(id));
    if (this.profileEntities.some(entity => !Number.isInteger(entity))) throw new Error("Nesměň profile entities are incomplete.");
  }

  async createVisualWorld() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = "nesmen-vertical-slice";
    const [environmentTexture, sandTexture, playerTexture, foresterTexture] = await Promise.all([
      this.texture("terrain-nesmen-excavated-sand-v1"),
      this.texture("terrain-nesmen-sand-profile"),
      this.texture("player-hunter-walk"),
      this.texture("npc-forester-jan")
    ]);
    environmentTexture.repeat.set(0.832, 1);
    environmentTexture.offset.set(0.084, 0);
    sandTexture.repeat.set(2.2, 1.2);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.level.bounds.width, this.level.bounds.height),
      new THREE.MeshBasicMaterial({ map: environmentTexture })
    );
    ground.position.set(this.level.bounds.x + this.level.bounds.width / 2, this.level.bounds.y + this.level.bounds.height / 2, -4);
    root.add(ground);

    const ambient = new THREE.HemisphereLight(0xc9e6bb, 0x17251c, 1.8);
    const sun = new THREE.DirectionalLight(0xffefc5, 1.9);
    sun.position.set(-220, 340, 520);
    root.add(ambient, sun);

    this.visualRoot = root;
    this.renderer.add(root, "ground");

    playerTexture.repeat.set(0.25, 0.25);
    playerTexture.offset.set(0, 0.75);
    const player = this.renderer.createSprite(playerTexture, {
      width: 82,
      height: 108,
      z: 12,
      anchorX: 0.5,
      anchorY: 0.08,
      assetId: "player-hunter-walk"
    });
    const forester = this.renderer.createSprite(foresterTexture, {
      width: 82,
      height: 108,
      z: 12,
      anchorX: 0.5,
      anchorY: 0.08,
      assetId: "npc-forester-jan"
    });
    this.renderer.bindEntity(this.playerEntity, player, "actors");
    this.renderer.bindEntity(this.foresterEntity, forester, "actors");

    for (const entity of this.profileEntities) {
      const group = new THREE.Group();
      group.name = `profile-${this.externalIdByEntity.get(entity)}`;
      const marker = this.modelFactory.clone(this.model("model-nesmen-profile-marker"), {
        assetId: "model-nesmen-profile-marker",
        rotationX: Math.PI / 2,
        scale: 44,
        z: 4
      });
      marker.visible = false;
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(42, 20),
        new THREE.MeshBasicMaterial({ map: sandTexture, color: 0x6f4b2d, transparent: true, opacity: 0.94 })
      );
      hole.position.z = 2;
      hole.scale.y = 0.62;
      hole.visible = false;
      group.add(hole, marker);
      this.renderer.bindEntity(entity, group, "props");
      this.profileVisuals.set(entity, { group, marker, hole });
    }
  }

  beginPlaying() {
    this.session.setPhase("playing");
    this.screens.play();
    this.app.input.reset("nesmen-start");
    this.emitHud(true);
  }

  beginFixed() {
    for (const [, transform, previous] of this.app.world.query("transform", "previousTransform")) Object.assign(previous, transform);
  }

  updateControl(_dt, _time, input) {
    if (!input.actions.pause?.pressed || this.modal) return;
    if (this.session.state.phase === "playing") this.pause();
    else if (this.session.state.phase === "paused") this.resume();
  }

  updateMovement(dt, _time, input) {
    if (this.session.state.phase !== "playing" || this.modal || this.resultShown) return;
    const player = this.app.world.get(this.playerEntity, "transform");
    const playerData = this.app.world.get(this.playerEntity, "player");
    const move = input.axes.move ?? { x: 0, y: 0 };
    const speed = playerData?.speed ?? 220;
    const walkable = this.level.walkable ?? this.level.bounds;
    player.x = clamp(player.x + (move.x ?? 0) * speed * dt, walkable.x + 28, walkable.x + walkable.width - 28);
    player.y = clamp(player.y + (move.y ?? 0) * speed * dt, walkable.y + 28, walkable.y + walkable.height - 28);
    this.setCameraToPlayer();
  }

  updateCollisions() {
    if (this.session.state.phase === "playing" && !this.modal) this.app.collisions.update(this.app.world);
  }

  updateGameplay(dt, _time, input) {
    if (this.session.state.phase === "digging" && this.modal === "dig") {
      const state = this.dig.update(dt);
      if (state) this.screens.updateDig({
        ...state,
        marker: state.position,
        requiredHits: DIG_REQUIRED_HITS,
        sweetMin: this.dig.sweetMin,
        sweetMax: this.dig.sweetMax
      });
      return;
    }
    if (this.session.state.phase !== "playing" || this.modal || this.resultShown) return;
    const available = this.interactions.update(this.app.world, this.playerEntity, input.actions.action?.pressed === true);
    this.availableInteraction = available;
    if (available?.performed) this.performInteraction(available);
  }

  updateObjectives() {
    const objective = this.objectives.update({ dug: this.dugCount(), filled: this.filledCount() });
    if (objective.complete && !this.resultShown) this.showResult();
  }

  updateAnimations(dt) {
    if (this.session.state.phase === "playing" && !this.modal) this.app.animations.update(this.app.world, dt);
  }

  updateHud() {
    this.emitHud(false);
  }

  performInteraction(available) {
    const kind = available.interaction.kind;
    if (kind === "permission") this.showPermissionDialog();
    else if (kind === "dig") this.startDig(available.entity);
    else if (kind === "fill") this.fillProfile(available.entity);
    else if (kind === "collect") this.collectFinding();
  }

  showPermissionDialog() {
    const dialogue = getDialogueDefinition("nesmen-permission");
    this.modal = "dialog";
    this.app.input.reset("dialog-open");
    this.screens.showDialog({
      name: dialogue.speaker.name,
      avatar: "J",
      text: dialogue.lines.join(" "),
      buttonLabel: dialogue.actionLabel,
      onConfirm: () => {
        this.objectives.grantPermission();
        this.app.world.get(this.foresterEntity, "interaction").enabled = false;
        for (const entity of this.profileEntities) {
          this.app.world.get(entity, "interaction").enabled = true;
          const visual = this.profileVisuals.get(entity);
          if (visual) visual.marker.visible = true;
        }
        this.modal = null;
        this.screens.play();
        this.app.input.reset("dialog-confirm");
        this.emitHud(true);
      }
    });
  }

  startDig(entity) {
    const spot = this.app.world.get(entity, "digSpot");
    if (!spot || spot.dug || this.dig.start(this.externalIdByEntity.get(entity)) !== true) return;
    this.activeProfileEntity = entity;
    this.modal = "dig";
    this.session.setPhase("digging");
    this.app.input.reset("dig-open");
    this.screens.showDig({
      title: `Profil ${spot.profileIndex + 1}: tři zásahy`,
      buttonLabel: "AKCE",
      hits: 0,
      marker: 0,
      requiredHits: DIG_REQUIRED_HITS,
      sweetMin: this.dig.sweetMin,
      sweetMax: this.dig.sweetMax,
      onAction: () => this.strikeDig()
    });
  }

  strikeDig() {
    const result = this.dig.strike();
    if (!result) return;
    if (result.hit) this.totalDigHits += 1;
    this.screens.updateDig({
      ...result,
      marker: result.position,
      requiredHits: DIG_REQUIRED_HITS,
      sweetMin: this.dig.sweetMin,
      sweetMax: this.dig.sweetMax,
      info: result.hit ? `Zásah ${result.hits}/${DIG_REQUIRED_HITS}` : "Mimo rytmus — zkus to znovu."
    });
    if (!result.complete || this.activeProfileEntity === null) return;

    const entity = this.activeProfileEntity;
    const spot = this.app.world.get(entity, "digSpot");
    const interaction = this.app.world.get(entity, "interaction");
    this.dig.finish();
    spot.dug = true;
    interaction.kind = "fill";
    interaction.label = "ZAHRABAT";
    interaction.enabled = true;
    const visual = this.profileVisuals.get(entity);
    if (visual) {
      visual.marker.visible = false;
      visual.hole.visible = true;
    }
    if (spot.findingId) this.spawnFinding(entity, spot.findingId);

    this.activeProfileEntity = null;
    this.modal = null;
    this.session.setPhase("playing");
    this.availableInteraction = null;
    this.interactions.clear();
    this.screens.play();
    this.app.input.reset("dig-complete");
    this.emitHud(true);
  }

  fillProfile(entity) {
    const spot = this.app.world.get(entity, "digSpot");
    const interaction = this.app.world.get(entity, "interaction");
    if (!spot?.dug || spot.filled) return;
    spot.filled = true;
    interaction.enabled = false;
    const visual = this.profileVisuals.get(entity);
    if (visual) visual.hole.visible = false;
    this.availableInteraction = null;
    this.interactions.clear();
    this.app.input.reset("profile-filled");
    this.emitHud(true);
  }

  spawnFinding(profileEntity, findingId) {
    if (this.findingEntity !== null) return;
    const profile = this.app.world.get(profileEntity, "transform");
    this.findingEntity = this.app.world.createEntity({
      transform: { x: profile.x + 30, y: profile.y + 18, rotation: 0, scale: 1 },
      previousTransform: { x: profile.x + 30, y: profile.y + 18, rotation: 0, scale: 1 },
      interaction: { kind: "collect", label: "SEBRAT", action: "action", range: 72, priority: 90, enabled: true }
    });
    this.externalIdByEntity.set(this.findingEntity, findingId);
    this.texture("finding-vltavin-nesmen").then(texture => {
      if (this.findingEntity === null) return;
      const sprite = this.renderer.createSprite(texture, {
        width: 50,
        height: 50,
        z: 14,
        anchorX: 0.5,
        anchorY: 0.2,
        assetId: "finding-vltavin-nesmen"
      });
      this.renderer.bindEntity(this.findingEntity, sprite, "effects");
    });
  }

  collectFinding() {
    if (this.findingEntity === null) return;
    const entity = this.findingEntity;
    this.objectives.recordFinding(createNesmenFinding("nesmen-standard", "nesmen-finding-1"));
    this.renderer.unbindEntity(entity);
    this.app.world.destroyEntity(entity);
    this.externalIdByEntity.delete(entity);
    this.findingEntity = null;
    this.availableInteraction = null;
    this.interactions.clear();
    this.app.input.reset("finding-collected");
    this.emitHud(true);
  }

  dugCount() {
    return this.profileEntities.filter(entity => this.app.world.get(entity, "digSpot")?.dug === true).length;
  }

  filledCount() {
    return this.profileEntities.filter(entity => this.app.world.get(entity, "digSpot")?.filled === true).length;
  }

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
      buttonLabel: "ZPĚT DO MENU",
      onContinue: () => this.app.changeScene("title").catch(error => console.error("Scene transition:", error))
    });
  }

  pause() {
    this.session.setPhase("paused");
    this.app.input.reset("pause-overlay");
    this.screens.showPause({
      onResume: () => this.resume(),
      onMenu: () => this.app.changeScene("title").catch(error => console.error("Scene transition:", error)),
      placeLabel: this.level.name,
      objective: this.objectiveSnapshot().text,
      progress: this.objectiveSnapshot().progress
    });
    this.emitHud(true);
  }

  resume() {
    this.session.setPhase("playing");
    this.app.input.reset("resume-overlay");
    this.screens.play();
    this.emitHud(true);
  }

  setCameraToPlayer() {
    if (this.playerEntity === null) return;
    const transform = this.app.world.get(this.playerEntity, "transform");
    setBoundedCameraCenter(this.renderer, this.level.bounds, transform.x, transform.y, 0.92);
  }

  objectiveSnapshot() {
    return this.objectives.snapshot({ dug: this.dugCount(), filled: this.filledCount() });
  }

  hudModel() {
    const objective = this.objectiveSnapshot();
    const available = this.availableInteraction;
    let hint = objective.text;
    if (this.session.state.phase === "paused") hint = "Výprava čeká.";
    else if (available) {
      if (available.interaction.kind === "permission") hint = "Lesník Jan vysvětlí pravidla průzkumu.";
      else if (available.interaction.kind === "dig") hint = "Odkryj vyznačený profil třemi zásahy.";
      else if (available.interaction.kind === "fill") hint = "Zasyp odkrytou díru.";
      else if (available.interaction.kind === "collect") hint = "Vltavín leží vedle profilu.";
    }
    return {
      missionNumber: this.level.order + 1,
      placeLabel: this.level.name,
      objective: objective.text,
      objectiveProgress: objective.progress,
      findings: this.session.state.findings.length,
      danger: 0,
      dangerMessage: "",
      hint,
      actionReady: Boolean(available && !this.modal && this.session.state.phase === "playing"),
      actionLabel: available?.interaction.label ?? "AKCE",
      actionIcon: available?.interaction.kind === "permission"
        ? "…"
        : available?.interaction.kind === "dig"
          ? "⛏"
          : available?.interaction.kind === "fill"
            ? "●"
            : available?.interaction.kind === "collect" ? "◆" : "◉"
    };
  }

  emitHud(force) {
    const model = this.hudModel();
    const signature = JSON.stringify(model);
    if (!force && signature === this.hudSignature) return;
    this.hudSignature = signature;
    this.events.emit("hud:model:changed", { revision: ++this.hudRevision, model });
  }

  render(alpha) {
    this.renderer.syncWorld(this.app.world, alpha);
  }

  snapshot() {
    const player = this.playerEntity === null ? null : this.app.world.get(this.playerEntity, "transform");
    return {
      level: this.level.id,
      session: this.session.state,
      objective: this.objectiveSnapshot(),
      runtime: {
        modal: this.modal,
        totalDigHits: this.totalDigHits,
        dig: this.dig.snapshot(),
        resultShown: this.resultShown,
        player: player ? { x: player.x, y: player.y } : null,
        profiles: this.profileEntities.map(entity => {
          const spot = this.app.world.get(entity, "digSpot");
          const transform = this.app.world.get(entity, "transform");
          return {
            id: this.externalIdByEntity.get(entity),
            x: transform.x,
            y: transform.y,
            dug: spot.dug === true,
            filled: spot.filled === true
          };
        }),
        available: this.availableInteraction ? {
          entity: this.externalIdByEntity.get(this.availableInteraction.entity) ?? this.availableInteraction.entity,
          kind: this.availableInteraction.interaction.kind,
          label: this.availableInteraction.interaction.label
        } : null,
        loadedAssets: [...this.assetEntries.keys()].sort()
      },
      levelComplete: this.levelComplete
    };
  }

  destroyVisualWorld() {
    for (const entity of [...this.renderer.objectByEntity.keys()]) this.renderer.unbindEntity(entity);
    if (this.visualRoot) {
      this.renderer.remove(this.visualRoot);
      this.renderer.disposeObject(this.visualRoot);
      this.visualRoot = null;
    }
  }

  unloadAssets() {
    this.app.assets.unloadOwned(this.assetEntries.values(), "LevelScene:nesmen");
    this.loadedModels.clear();
    this.app.assets.unload(MANIFEST_ENTRY.id, MANIFEST_ENTRY.type);
  }

  async exit() {
    this.modal = null;
    this.interactions.clear();
    this.dig.cancel();
    this.app.input.reset("nesmen-exit");
    this.destroyVisualWorld();
    this.unloadAssets();
    this.app.world.clear();
    this.app.collisions.reset();
    this.assetEntries.clear();
    this.entityByExternalId.clear();
    this.externalIdByEntity.clear();
    this.profileVisuals.clear();
    this.hudSignature = "";
  }

  async dispose() {
    await this.exit();
  }
}
