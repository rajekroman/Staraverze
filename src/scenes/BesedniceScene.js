import { DIG_REQUIRED_HITS, LEVEL_ORDER, getLevelDefinition } from "../data/levels.js";
import { BESEDNICE_ENTITY_DEFINITIONS, BESEDNICE_TRACE_IDS, createBesedniceFinding } from "../data/besednice.js";
import { InteractionSystem } from "../gameplay/InteractionSystem.js";
import { DigSystem } from "../gameplay/DigSystem.js";
import { ObjectiveSystem } from "../gameplay/ObjectiveSystem.js";
import { BossSystem } from "../gameplay/BossSystem.js";
import { ModelFactory } from "../render/ModelFactory.js";
import { setBoundedCameraCenter } from "../render/CameraBounds.js";

const MANIFEST_ENTRY = Object.freeze({ id: "besednice-runtime-assets", type: "json", url: "./assets/manifests/assets.json" });
const cloneData = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class BesedniceScene {
  constructor(options) {
    this.app = options.app;
    this.events = options.events;
    this.renderer = options.renderer;
    this.THREE = options.three;
    this.screens = options.screens;
    this.session = options.session;
    this.level = getLevelDefinition("besednice");
    this.modelFactory = new ModelFactory({ renderer: this.renderer });
    this.interactions = new InteractionSystem({ events: this.events });
    this.dig = new DigSystem({ events: this.events });
    this.objectives = new ObjectiveSystem({ events: this.events, session: this.session, levelId: "besednice" });
    this.boss = new BossSystem();
    this.resetRuntime();
  }

  async enter() {
    this.resetRuntime();
    this.session.enterLevel(this.level.id);
    await this.loadAssets();
    this.instantiateWorld();
    await this.createVisualWorld();
    this.syncLocks();
    this.setCameraToPlayer();
    this.screens.showBrief(this.level, LEVEL_ORDER.length, () => this.beginPlaying());
    this.emitHud(true);
  }

  resetRuntime() {
    this.destroyVisualWorld?.();
    this.app?.world?.clear?.();
    this.app?.collisions?.reset?.();
    this.interactions?.clear?.();
    this.dig?.cancel?.();
    this.objectives?.reset?.();
    this.assetEntries = new Map();
    this.loadedModels = new Map();
    this.entityByExternalId = new Map();
    this.externalIdByEntity = new Map();
    this.traceVisuals = new Map();
    this.visualRoot = null;
    this.playerEntity = null;
    this.traceEntities = [];
    this.hedgehogEntity = null;
    this.karelEntity = null;
    this.findingEntity = null;
    this.availableInteraction = null;
    this.modal = null;
    this.totalDigHits = 0;
    this.resultShown = false;
    this.levelComplete = null;
    this.hudRevision = this.hudRevision ?? 0;
    this.hudSignature = "";
  }

  async loadAssets() {
    const manifest = await this.app.assets.load(MANIFEST_ENTRY);
    if (!Array.isArray(manifest)) throw new Error("Besednice asset manifest must be an array.");
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
    if (!entry) throw new Error(`Missing Besednice asset entry: ${id}`);
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

  async texture(id) {
    const entry = this.requireAsset(id);
    if (entry.type !== "texture" && entry.type !== "spritesheet") throw new Error(`Asset ${id} is not a texture.`);
    const texture = await this.app.assets.get(id, entry.type);
    if (!texture) throw new Error(`Texture is not loaded: ${id}`);
    return texture;
  }

  model(id) {
    const model = this.loadedModels.get(id);
    if (!model) throw new Error(`Model is not loaded: ${id}`);
    return model;
  }

  instantiateWorld() {
    for (const definition of BESEDNICE_ENTITY_DEFINITIONS) {
      const components = cloneData(definition.components);
      components.previousTransform = { ...components.transform };
      const entity = this.app.world.createEntity(components);
      this.entityByExternalId.set(definition.id, entity);
      this.externalIdByEntity.set(entity, definition.id);
    }
    this.playerEntity = this.entityByExternalId.get("player");
    this.traceEntities = BESEDNICE_TRACE_IDS.map(id => this.entityByExternalId.get(id));
    this.hedgehogEntity = this.entityByExternalId.get("besednice-hedgehog");
    this.karelEntity = this.entityByExternalId.get("crystal-karel");
    if (![this.playerEntity, this.hedgehogEntity, this.karelEntity, ...this.traceEntities].every(Number.isInteger)) {
      throw new Error("Besednice entities are incomplete.");
    }
  }

  async createVisualWorld() {
    const THREE = this.THREE;
    const root = new THREE.Group();
    root.name = "besednice-vertical-slice";
    const [environmentTexture, playerTexture, karelTexture] = await Promise.all([
      this.texture("terrain-besednice-clay-quarry-v1"),
      this.texture("player-hunter-walk"),
      this.texture("npc-rival-karel")
    ]);
    environmentTexture.repeat.set(0.874, 1);
    environmentTexture.offset.set(0.063, 0);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(this.level.bounds.width, this.level.bounds.height),
      new THREE.MeshBasicMaterial({ map: environmentTexture })
    );
    ground.position.set(this.level.bounds.x + this.level.bounds.width / 2, this.level.bounds.y + this.level.bounds.height / 2, -5);
    root.add(ground);
    const ambient = new THREE.HemisphereLight(0xf0d7af, 0x241d19, 1.65);
    const sun = new THREE.DirectionalLight(0xffefcf, 1.85);
    sun.position.set(-180, 420, 580);
    root.add(ambient, sun);
    this.visualRoot = root;
    this.renderer.add(root, "ground");
    playerTexture.repeat.set(0.25, 0.25);
    playerTexture.offset.set(0, 0.75);
    const player = this.renderer.createSprite(playerTexture, {
      width: 82, height: 108, z: 12, anchorX: 0.5, anchorY: 0.08, assetId: "player-hunter-walk"
    });
    const karel = this.renderer.createSprite(karelTexture, {
      width: 82, height: 108, z: 12, anchorX: 0.5, anchorY: 0.08, color: 0xff8f72, assetId: "npc-rival-karel"
    });
    this.renderer.bindEntity(this.playerEntity, player, "actors");
    this.renderer.bindEntity(this.karelEntity, karel, "actors");
    for (const entity of this.traceEntities) {
      const marker = this.modelFactory.clone(this.model("model-besednice-trace-marker"), {
        assetId: "model-besednice-trace-marker", rotationX: Math.PI / 2, scale: 38, z: 4
      });
      this.renderer.bindEntity(entity, marker, "props");
      this.traceVisuals.set(entity, marker);
    }
    const hedgehogMarker = this.modelFactory.clone(this.model("model-besednice-hedgehog-marker"), {
      assetId: "model-besednice-hedgehog-marker", rotationX: Math.PI / 2, scale: 64, z: 5
    });
    hedgehogMarker.visible = false;
    this.renderer.bindEntity(this.hedgehogEntity, hedgehogMarker, "props");
  }

  beginPlaying() {
    this.session.setPhase("playing");
    this.screens.play();
    this.app.input.reset("besednice-start");
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
    const bossState = this.app.world.get(this.karelEntity, "boss");
    if (bossState?.started === true && bossState.defeated !== true) this.boss.update(this.app.world, this.karelEntity, this.playerEntity, dt);
    const available = this.interactions.update(this.app.world, this.playerEntity, input.actions.action?.pressed === true);
    this.availableInteraction = available;
    if (available?.performed) this.performInteraction(available);
  }

  updateObjectives() {
    const objective = this.objectives.update(this.objectiveRuntime());
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
    if (kind === "discover") this.discoverTrace(available.entity);
    else if (kind === "dig") this.startDig(available.entity);
    else if (kind === "collect") this.collectHedgehog();
    else if (kind === "recover") this.recoverHedgehog();
  }

  discoverTrace(entity) {
    const clue = this.app.world.get(entity, "clue");
    const interaction = this.app.world.get(entity, "interaction");
    if (!clue || clue.discovered === true) return false;
    clue.discovered = true;
    interaction.enabled = false;
    const visual = this.traceVisuals.get(entity);
    if (visual) visual.visible = false;
    this.availableInteraction = null;
    this.interactions.clear();
    this.syncLocks();
    this.app.input.reset("besednice-trace-discovered");
    this.emitHud(true);
    return true;
  }

  syncLocks() {
    if (this.hedgehogEntity === null) return;
    const interaction = this.app.world.get(this.hedgehogEntity, "interaction");
    const spot = this.app.world.get(this.hedgehogEntity, "digSpot");
    if (interaction) interaction.enabled = this.clueCount() >= 3 && spot?.dug !== true;
    const visual = this.renderer.objectByEntity.get(this.hedgehogEntity);
    if (visual) visual.visible = this.clueCount() >= 3 && spot?.dug !== true;
  }

  startDig(entity) {
    if (entity !== this.hedgehogEntity || this.clueCount() < 3) return false;
    const spot = this.app.world.get(entity, "digSpot");
    if (!spot || spot.dug || this.dig.start(this.externalIdByEntity.get(entity)) !== true) return false;
    this.modal = "dig";
    this.session.setPhase("digging");
    this.app.input.reset("besednice-dig-open");
    this.screens.showDig({
      title: "Ježkový profil: tři zásahy",
      buttonLabel: "AKCE",
      hits: 0,
      marker: 0,
      requiredHits: DIG_REQUIRED_HITS,
      sweetMin: this.dig.sweetMin,
      sweetMax: this.dig.sweetMax,
      onAction: () => this.strikeDig()
    });
    return true;
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
    if (!result.complete) return;
    const spot = this.app.world.get(this.hedgehogEntity, "digSpot");
    const interaction = this.app.world.get(this.hedgehogEntity, "interaction");
    this.dig.finish();
    spot.dug = true;
    interaction.enabled = false;
    const marker = this.renderer.objectByEntity.get(this.hedgehogEntity);
    if (marker) marker.visible = false;
    void this.spawnFinding(spot.findingId);
    this.modal = null;
    this.session.setPhase("playing");
    this.availableInteraction = null;
    this.interactions.clear();
    this.screens.play();
    this.app.input.reset("besednice-dig-complete");
    this.emitHud(true);
  }

  async spawnFinding(findingId) {
    if (this.findingEntity !== null) return;
    const profile = this.app.world.get(this.hedgehogEntity, "transform");
    this.findingEntity = this.app.world.createEntity({
      transform: { x: profile.x + 34, y: profile.y + 18, rotation: 0, scale: 1 },
      previousTransform: { x: profile.x + 34, y: profile.y + 18, rotation: 0, scale: 1 },
      interaction: { kind: "collect", label: "SEBRAT JEŽEK", action: "action", range: 76, priority: 95, enabled: true }
    });
    this.externalIdByEntity.set(this.findingEntity, findingId);
    const sprite = this.renderer.createSprite(await this.texture("finding-vltavin-besednice-hedgehog"), {
      width: 58, height: 58, z: 15, anchorX: 0.5, anchorY: 0.2, color: 0xb6ff8b,
      assetId: "finding-vltavin-besednice-hedgehog"
    });
    this.renderer.bindEntity(this.findingEntity, sprite, "effects");
  }

  collectHedgehog() {
    if (this.findingEntity === null) return false;
    this.objectives.recordFinding(createBesedniceFinding("besednice-hedgehog", "besednice-hedgehog-1"));
    const entity = this.findingEntity;
    this.renderer.unbindEntity(entity);
    this.app.world.destroyEntity(entity);
    this.externalIdByEntity.delete(entity);
    this.findingEntity = null;
    this.boss.start(this.app.world, this.karelEntity);
    this.availableInteraction = null;
    this.interactions.clear();
    this.app.input.reset("besednice-boss-start");
    this.emitHud(true);
    return true;
  }

  recoverHedgehog() {
    const interaction = this.app.world.get(this.karelEntity, "interaction");
    if (interaction?.enabled !== true) return false;
    if (!this.boss.defeat(this.app.world, this.karelEntity)) return false;
    this.availableInteraction = null;
    this.interactions.clear();
    this.app.input.reset("besednice-boss-defeated");
    this.emitHud(true);
    return true;
  }

  clueCount() {
    return this.traceEntities.filter(entity => this.app.world.get(entity, "clue")?.discovered === true).length;
  }

  hasHedgehog() {
    return this.session.state.findings.some(entry => entry.findingId === "besednice-hedgehog-1");
  }

  objectiveRuntime() {
    const boss = this.app.world.get(this.karelEntity, "boss") ?? {};
    return {
      clues: this.clueCount(),
      hedgehog: this.hasHedgehog(),
      bossStarted: boss.started === true,
      bossDefeated: boss.defeated === true
    };
  }

  objectiveSnapshot() {
    return this.objectives.snapshot(this.objectiveRuntime());
  }

  showResult() {
    this.resultShown = true;
    this.session.setPhase("complete");
    this.levelComplete = Object.freeze({ levelId: "besednice", nextLevelId: "slavia", score: this.session.state.score });
    this.app.input.reset("besednice-complete");
    this.screens.showLevelResult({
      kicker: "BESEDNICE DOKONČENA",
      title: "Ježek je zpět ve sbírce",
      text: "Tři stopy odkryly ježkovou vrstvu a Karel odchází bez cizího nálezu.",
      score: this.session.state.score,
      stats: [
        { label: "STOPY", value: `${this.clueCount()}/3` },
        { label: "KOPÁNÍ", value: `${this.totalDigHits}/${DIG_REQUIRED_HITS}` },
        { label: "JEŽEK", value: this.hasHedgehog() ? "ANO" : "NE" },
        { label: "KAREL", value: this.app.world.get(this.karelEntity, "boss")?.defeated ? "PORAŽEN" : "AKTIVNÍ" }
      ],
      buttonLabel: "POKRAČOVAT DO SLAVIE",
      onContinue: () => this.app.changeScene("slavia").catch(error => console.error("Scene transition:", error))
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
    setBoundedCameraCenter(this.renderer, this.level.bounds, transform.x, transform.y, 0.9);
  }

  hudModel() {
    const objective = this.objectiveSnapshot();
    const available = this.availableInteraction;
    let hint = objective.text;
    if (this.session.state.phase === "paused") hint = "Výprava čeká.";
    else if (available) {
      if (available.interaction.kind === "discover") hint = "Prozkoumej stopu v odkryté vrstvě.";
      else if (available.interaction.kind === "dig") hint = "Ježkový profil vyžaduje přesně tři zásahy.";
      else if (available.interaction.kind === "collect") hint = "Vyzvedni kvalitní ježkový vltavín.";
      else if (available.interaction.kind === "recover") hint = "Karel je na dosah — vezmi ježek zpět.";
    }
    const bossState = this.app.world.get(this.karelEntity, "boss") ?? {};
    const bossActive = bossState.started === true && bossState.defeated !== true;
    return {
      missionNumber: this.level.order + 1,
      placeLabel: this.level.name,
      objective: objective.text,
      objectiveProgress: objective.progress,
      findings: this.session.state.findings.length,
      danger: bossActive ? 0.65 : 0,
      dangerMessage: bossActive ? "KAREL MÁ JEŽEK · ZASTAV HO" : "",
      hint,
      actionReady: Boolean(available && !this.modal && this.session.state.phase === "playing"),
      actionLabel: available?.interaction.label ?? "AKCE",
      actionIcon: available?.interaction.kind === "discover" ? "⌕"
        : available?.interaction.kind === "dig" ? "⛏"
          : available?.interaction.kind === "collect" ? "◆"
            : available?.interaction.kind === "recover" ? "✦" : "◉"
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
    const boss = this.karelEntity === null ? null : this.boss.snapshot(this.app.world, this.karelEntity);
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
        clues: this.clueCount(),
        traces: this.traceEntities.map(entity => {
          const clue = this.app.world.get(entity, "clue");
          const transform = this.app.world.get(entity, "transform");
          return { id: this.externalIdByEntity.get(entity), x: transform.x, y: transform.y, discovered: clue?.discovered === true };
        }),
        hedgehog: {
          dug: this.app.world.get(this.hedgehogEntity, "digSpot")?.dug === true,
          collected: this.hasHedgehog()
        },
        boss,
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
    if (!this.renderer?.objectByEntity) return;
    for (const entity of [...this.renderer.objectByEntity.keys()]) this.renderer.unbindEntity(entity);
    if (this.visualRoot) {
      this.renderer.remove(this.visualRoot);
      this.renderer.disposeObject(this.visualRoot);
      this.visualRoot = null;
    }
  }

  unloadAssets() {
    this.app.assets.unloadOwned(this.assetEntries.values(), "LevelScene:besednice");
    this.loadedModels.clear();
    this.app.assets.unload(MANIFEST_ENTRY.id, MANIFEST_ENTRY.type);
  }

  async exit() {
    this.modal = null;
    this.interactions.clear();
    this.dig.cancel();
    this.app.input.reset("besednice-exit");
    this.destroyVisualWorld();
    this.unloadAssets();
    this.app.world.clear();
    this.app.collisions.reset();
    this.assetEntries.clear();
    this.entityByExternalId.clear();
    this.externalIdByEntity.clear();
    this.traceVisuals.clear();
    this.hudSignature = "";
  }

  async dispose() {
    await this.exit();
  }
}
