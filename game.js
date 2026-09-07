(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("game");
  const screenCtx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  let ctx = screenCtx;
  const app = $("app");
  const hud = $("hud");
  const controls = $("controls");

  const screens = {
    title: $("titleScreen"), brief: $("briefScreen"), dig: $("digScreen"), identify: $("identifyScreen"),
    dialog: $("dialogScreen"), perk: $("perkScreen"), jury: $("juryScreen"), result: $("resultScreen"),
    pause: $("pauseScreen"), how: $("howScreen"), records: $("recordsScreen")
  };

  const ui = {
    missionNumber: $("missionNumber"), place: $("placeLabel"), objective: $("objectiveLabel"), bag: $("bagValue"),
    heat: $("heatFill"), heatPill: $("heatPill"), dangerBanner: $("dangerBanner"), dangerText: $("dangerText"), dangerMeterText: $("dangerMeterText"), bossHud: $("bossHud"), bossName: $("bossName"), bossFill: $("bossFill"), bossPhase: $("bossPhase"), bossIntro: $("bossIntro"), theftAlert: $("theftAlert"), bossIntroName: $("bossIntroName"), bossIntroText: $("bossIntroText"), combo: $("combo"), hint: $("hint"), toast: $("toast"),
    actionIcon: $("actionIcon"), actionText: $("actionText")
  };

  const APP_VERSION = "5.4.2";
  const SAVE_KEY = "lovecVltavinuRebornSaveV5_4_2";
  const RECORD_KEY = "lovecVltavinuRebornRecordsV5_2";
  const LEGACY_SAVE_KEYS = ["lovecVltavinuRebornSaveV5_2","lovecVltavinuRebornSaveV5_1","lovecVltavinuRebornSaveV5_0","lovecVltavinuRebornSaveV4_9","lovecVltavinuRebornSaveV4_8","lovecVltavinuRebornSaveV4_7","lovecVltavinuRebornSaveV4_6","lovecVltavinuRebornSaveV4_5"];
  const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window || matchMedia("(pointer: coarse)").matches;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    remove(k) { try { localStorage.removeItem(k); } catch {} }
  };

  function migrateLegacySave(){
    if(storage.get(SAVE_KEY))return;
    for(const key of LEGACY_SAVE_KEYS){const value=storage.get(key);if(value){storage.set(SAVE_KEY,value);break;}}
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const approach = (value, target, amount) => value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[ch]);
  const finiteNumber = (value, fallback, min = -Infinity, max = Infinity) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
  };

  const LEVELS = [
    {
      id: "chlum", name: "Chlum", title: "Chlum po bouřce", theme: "field",
      text: "Projdi čerstvě rozorané pole, radarem odhal vltavíny ukryté v brázdách a seber je dřív, než pole znovu projede technika.",
      why: "Bez silného začátku nebudeš mít co vystavit. Tahle lokalita má odstartovat tvou sbírku pro akci Na zelené vlně.",
      goal: "Radarem najdi a sesbírej 6 vltavínů z povrchu pole.", music: "field"
    },
    {
      id: "locenice", name: "Ločenice", title: "Písčitá hrana", theme: "meadow",
      text: "Projdi borový les na písčitém podloží. Vzorky vypadají podobně, ale jen část z nich jsou skutečné vltavíny.",
      why: "Potřebuješ rozšířit sbírku o ověřené kusy. Ločenice prověří oko sběratele, ne jen rychlost pohybu.",
      goal: "Správně urči 5 vzorků a najdi 3 pravé kusy.", music: "meadow"
    },
    {
      id: "nesmen", name: "Nesměň", title: "Lesní profily", theme: "forest",
      text: "V lese jsou povolené jen malé vyznačené průzkumné profily. Vykopej je, seber nález a po sobě vše zase pečlivě zahrab.",
      why: "Na výstavu nestačí jen nálezy. Musíš ukázat, že umíš kopat rozumně a nenecháváš po sobě rozbité místo.",
      goal: "Vykopej a zasyp 3 profily bez zbytečného hluku.", music: "forest"
    },
    {
      id: "besednice", name: "Besednice", title: "Ježková noc", theme: "night",
      text: "Rozrytá těžební plocha ukrývá slavný ježkový profil. Najdi stopy, odkryj profil a nenech si uniknout vzácný kus.",
      why: "Besednický ježek může rozhodnout celou soutěž. Kdo ho donese do Slávie, má šanci na nejlepší sbírku večera.",
      goal: "Najdi 3 stopy, vykopej ježek a dostaň ho zpět od Karla.", music: "night"
    },
    {
      id: "malse", name: "Malše", title: "Příchod ke Slávii", theme: "city",
      text: "Podél Malše se blížíš ke KD Slávie. Posbírej dokumentaci, dožeň Frantu a doraz na akci Na zelené vlně připravený.",
      why: "Tady končí lov a začíná prezentace. Bez dokumentů a silné sbírky neuspěješ před porotou ani vystavovateli.",
      goal: "Seber 3 složky, dožeň Frantu a vstup do KD Slávie.", music: "city"
    }
  ];

  const PERKS = [
    { id: "boots", icon: "↟", name: "Lehké boty", text: "+12 % rychlost pohybu", max: 3 },
    { id: "scanner", icon: "◉", name: "Bystrý rozhled", text: "větší dosah rozhlédnutí a kratší čekání", max: 3 },
    { id: "shovel", icon: "⛏", name: "Přesná lopatka", text: "širší zelené pole při kopání", max: 3 },
    { id: "quiet", icon: "◌", name: "Tichý postup", text: "méně pozornosti za chyby", max: 3 },
    { id: "case", icon: "▣", name: "Pevné pouzdro", text: "při dopadení neztratíš nejlepší kus", max: 2 },
    { id: "eye", icon: "◉", name: "Zkušené oko", text: "vyšší kvalita správně určených kusů", max: 3 }
  ];

  const SAMPLES = [
    { real: true, title: "Olivový úlomek", text: "Matný povrch, nepravidelné hrany a drobné podélné bubliny." },
    { real: false, title: "Jasně zelený střep", text: "Dokonale hladký povrch, ostrý rovný lom a nepřirozeně sytá barva." },
    { real: true, title: "Hnědozelený splash", text: "Proměnlivá barva, zvlněná skulptace a nestejná tloušťka." },
    { real: false, title: "Lesklý odlitek", text: "Stejnoměrná barva, kulaté hrany a opakující se povrchový vzor." },
    { real: true, title: "Drobný celotvar", text: "Přirozeně leptaný povrch a jemná průsvitnost proti světlu." },
    { real: false, title: "Lahvové sklo", text: "Ploché stěny, pravidelná tloušťka a hladké průmyslové plochy." }
  ];

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.sfxGain = null;
      this.enabled = true;
      this.started = false;
      this.theme = "field";
      this.music = new Audio();
      this.music.loop = true;
      this.music.preload = "auto";
      this.music.playsInline = true;
      this.music.volume = .26;
      this.targetMusicVolume = .26;
      this.fadeTimer = 0;
      this.musicTracks = {
        field: "./assets/audio/music/field.wav",
        meadow: "./assets/audio/music/meadow.wav",
        forest: "./assets/audio/music/forest.wav",
        night: "./assets/audio/music/night.wav",
        city: "./assets/audio/music/city.wav"
      };
    }
    start() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.sfxGain = this.ctx.createGain();
          this.master.gain.value = .42;
          this.sfxGain.gain.value = .6;
          this.sfxGain.connect(this.master);
          this.master.connect(this.ctx.destination);
        }
      }
      if (this.ctx?.state === "suspended") this.ctx.resume().catch(() => {});
      this.started = true;
      this.playMusic();
    }
    setTheme(theme) {
      const changed = this.theme !== theme;
      this.theme = theme;
      if (changed && this.started) this.playMusic(true);
    }
    fadeMusic(target,duration=420,done=null){
      clearInterval(this.fadeTimer);
      const start=this.music.volume;const startAt=performance.now();
      this.fadeTimer=setInterval(()=>{const p=Math.min(1,(performance.now()-startAt)/duration);this.music.volume=start+(target-start)*p;if(p>=1){clearInterval(this.fadeTimer);this.fadeTimer=0;done?.();}},24);
    }
    playMusic(restart = false) {
      const src = this.musicTracks[this.theme] || this.musicTracks.field;
      let absolute=src;try{absolute=new URL(src,location.href).href;}catch{}
      const change=this.music.src!==absolute;
      const switchTrack=()=>{if(change)this.music.src=src;if(restart||change){try{this.music.currentTime=0;}catch{}}this.music.volume=0;if(this.enabled){this.music.play().then(()=>this.fadeMusic(this.targetMusicVolume,650)).catch(()=>{});}};
      if(change&&this.music.src&&this.music.volume>.01)this.fadeMusic(0,180,switchTrack);else switchTrack();
    }
    pauseMusic(){clearInterval(this.fadeTimer);this.fadeTimer=0;this.music.pause();}
    resumeMusic(){if(this.enabled&&this.started)this.playMusic(false);}
    toggle() {
      this.enabled = !this.enabled;
      if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? .42 : 0, this.ctx.currentTime, .03);
      if (this.enabled) this.playMusic();
      else this.fadeMusic(0,160,()=>this.music.pause());
      return this.enabled;
    }
    tone(freq, dur=.1, type="triangle", vol=.16, when=0, slide=0) {
      if (!this.enabled || !this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t+dur);
      gain.gain.setValueAtTime(.0001,t);
      gain.gain.linearRampToValueAtTime(vol,t+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
      osc.connect(gain); gain.connect(this.sfxGain); osc.start(t); osc.stop(t+dur+.03);
    }
    noise(dur=.08, vol=.08, cutoff=1200) {
      if (!this.enabled || !this.ctx || !this.sfxGain) return;
      const n=Math.floor(this.ctx.sampleRate*dur), b=this.ctx.createBuffer(1,n,this.ctx.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
      const src=this.ctx.createBufferSource(), filter=this.ctx.createBiquadFilter(), g=this.ctx.createGain();
      src.buffer=b; filter.type="lowpass"; filter.frequency.value=cutoff; g.gain.value=vol;
      src.connect(filter); filter.connect(g); g.connect(this.sfxGain); src.start();
    }
    sfx(name) {
      const f = {
        scan:()=>{this.tone(260,.18,"sine",.08,0,420);this.tone(520,.22,"sine",.05,.08,260);},
        dig:()=>{this.noise(.11,.13,800);this.tone(82,.12,"triangle",.06);},
        good:()=>{this.tone(620,.12,"triangle",.11);this.tone(930,.15,"sine",.08,.07);},
        rare:()=>[523,659,784,1047].forEach((x,i)=>this.tone(x,.25,"triangle",.08,i*.06)),
        bad:()=>{this.tone(180,.22,"square",.07,0,-70);this.noise(.09,.08,600);},
        catch:()=>{this.tone(95,.28,"sawtooth",.1);this.noise(.16,.13,900);},
        paper:()=>{this.tone(420,.08,"square",.06);this.tone(620,.1,"triangle",.06,.06);},
        win:()=>[392,494,587,784].forEach((x,i)=>this.tone(x,.36,"triangle",.1,i*.1)),
        click:()=>this.tone(360,.05,"square",.04),
        alert:()=>{this.tone(740,.08,"square",.055);this.tone(520,.1,"square",.045,.1);},
        heartbeat:()=>{this.tone(66,.12,"sine",.09);this.tone(58,.11,"sine",.065,.16);},
        boss:()=>{this.tone(98,.42,"sawtooth",.06,0,-22);this.tone(147,.36,"triangle",.055,.13);this.noise(.25,.04,520);},
        step:()=>this.noise(.025,.025,500)
      };
      f[name]?.();
    }
    update() {}
  }
  const audio = new AudioEngine();

  function freshState() {
    return {
      version:APP_VERSION, levelIndex:0, score:0, stones:[], heat:0, combo:1, comboTimer:0, caught:0,
      perks:{boots:0,scanner:0,shovel:0,quiet:0,case:0,eye:0}, stats:{digs:0,correct:0,misses:0,rare:0}, sound:true
    };
  }

  function normalizeStone(stone, index) {
    if (!stone || typeof stone !== "object") return null;
    const rarity = ["common", "good", "rare", "hedgehog"].includes(stone.rarity) ? stone.rarity : "common";
    return {
      id: typeof stone.id === "string" && stone.id ? stone.id : `restored-${index}`,
      locality: typeof stone.locality === "string" ? stone.locality.slice(0, 80) : "Neznámá lokalita",
      rarity,
      weight: finiteNumber(stone.weight, .5, .01, 1000),
      quality: Math.round(finiteNumber(stone.quality, 60, 0, 100)),
      documented: stone.documented !== false,
      name: typeof stone.name === "string" ? stone.name.slice(0, 80) : "Vltavín",
      value: Math.round(finiteNumber(stone.value, 0, 0, 100000000))
    };
  }

  function normalizeState(data) {
    if (!data || typeof data !== "object" || !Array.isArray(data.stones)) return null;
    const clean = freshState();
    clean.levelIndex = Math.round(finiteNumber(data.levelIndex, 0, 0, LEVELS.length - 1));
    clean.score = Math.round(finiteNumber(data.score, 0, 0, 1000000000));
    clean.stones = data.stones.map(normalizeStone).filter(Boolean).slice(0, 250);
    clean.heat = finiteNumber(data.heat, 0, 0, 100);
    clean.combo = Math.round(finiteNumber(data.combo, 1, 1, 6));
    clean.comboTimer = finiteNumber(data.comboTimer, 0, 0, 60);
    clean.caught = Math.round(finiteNumber(data.caught, 0, 0, 100000));
    for (const [key, maximum] of Object.entries({ boots:3, scanner:3, shovel:3, quiet:3, case:2, eye:3 })) {
      clean.perks[key] = Math.round(finiteNumber(data.perks?.[key], 0, 0, maximum));
    }
    for (const key of Object.keys(clean.stats)) {
      clean.stats[key] = Math.round(finiteNumber(data.stats?.[key], 0, 0, 1000000));
    }
    clean.sound = data.sound !== false;
    return clean;
  }

  let state = freshState();
  let mode = "menu";
  let viewport = {w:innerWidth,h:innerHeight,dpr:1};
  let world = null;
  // Static non-city terrain is rasterized once per level and reused by every frame.
  // City water remains dynamic, so Malše continues to render live.
  let terrainCache = {key:"", canvas:null, scale:1, generated:0};
  let player = {x:0,y:0,r:17,angle:0,facing:1,pose:"front",vx:0,vy:0,speedRatio:0,step:0,footstepCycle:-1,animTime:0,moving:false,invuln:0};
  let camera = {x:0,y:0};
  let input = {x:0,y:0,pressed:false};
  let resetControls = () => { input.x=0;input.y=0;input.pressed=false; };
  let nearest = null;
  let last = performance.now();
  let scanCooldown = 0;
  let scanPulse = 0;
  let toastTimer = 0;
  let currentDig = null;
  let currentSample = null;
  let digMarker = 0;
  let digDir = 1;
  let digHits = 0;
  let digSpeed = 1.25;
  let digTimeLeft = 7;
  let digZoneCenter = .5;
  let digInputLockUntil = 0;
  let jurySelection = new Set();
  let dialogueCallback = null;
  let shake = 0;
  let flash = 0;
  let flashColor = "255,255,255";
  let dangerActive = false;
  let dangerSource = "";
  let dangerRate = 0;
  let dangerExposure = 0;
  let dangerCatchAfter = Infinity;
  let dangerWarned = false;
  let dangerBeatTimer = 0;
  let bossIntroTimer = 0;
  let theftAlertUntil = 0;
  let theftAlertShown = false;

  function save() { storage.set(SAVE_KEY, JSON.stringify(state)); refreshContinue(); }
  function load() {
    try {
      const data=JSON.parse(storage.get(SAVE_KEY)||"null");
      const normalized=normalizeState(data);
      if(!normalized) return false;
      state=normalized;
      audio.enabled=state.sound!==false; return true;
    } catch { return false; }
  }
  function refreshContinue(){ $("continueButton").classList.toggle("hidden",!storage.get(SAVE_KEY)); }
  function getRecords(){try{const rows=JSON.parse(storage.get(RECORD_KEY)||"[]");return Array.isArray(rows)?rows.filter(row=>row&&typeof row==="object").slice(0,10):[];}catch{return[];}}
  function addRecord(score,title){const rows=getRecords();rows.push({score,title,stones:state.stones.length,date:new Date().toISOString()});rows.sort((a,b)=>b.score-a.score);storage.set(RECORD_KEY,JSON.stringify(rows.slice(0,10)));}

  function showOnly(screen){Object.values(screens).forEach(s=>s.classList.remove("visible"));if(screen)screen.classList.add("visible");}
  function setPlaying(on){if(!on)resetControls();hud.classList.toggle("hidden",!on);controls.classList.toggle("hidden",!on||!isTouch);app.classList.toggle("playing",on);}
  function haptic(pattern=12){try{navigator.vibrate?.(pattern);}catch{}}
  function toast(text,type="",duration=1500){clearTimeout(toastTimer);ui.toast.textContent=text;ui.toast.className=`toast show ${type}`;toastTimer=setTimeout(()=>ui.toast.className="toast",duration);}
  function showTheftAlert(){
    theftAlertUntil=performance.now()+2150;
    theftAlertShown=true;
    ui.theftAlert?.classList.remove("hidden");
    requestAnimationFrame(()=>{if(theftAlertShown)ui.theftAlert?.classList.add("show");});
    flash=.32;flashColor="255,54,48";shake=Math.max(shake,16);haptic([70,35,90,40,120]);audio.sfx("boss");
  }
  function hideTheftAlert(){
    if(!theftAlertShown)return;
    theftAlertShown=false;
    theftAlertUntil=0;
    ui.theftAlert?.classList.remove("show");
    setTimeout(()=>{if(!theftAlertShown)ui.theftAlert?.classList.add("hidden");},180);
    const pending=world?.runtime?.pendingBoss;
    if(world?.id==="besednice"&&pending&&!world.runtime.bossStarted){
      world.runtime.pendingBoss=null;
      startRival("karel",pending.x,pending.y);
      toast("Dožeň zloděje ve chvíli, kdy se zastaví!","bad",2200);
    }
  }
  function showHint(text){ui.hint.textContent=text;ui.hint.classList.remove("hidden");}
  function hideHint(){ui.hint.classList.add("hidden");}

  function resize(){
    const rect=app.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width||document.documentElement.clientWidth||innerWidth));
    const h=Math.max(1,Math.round(rect.height||innerHeight));
    const native=devicePixelRatio||1;
    const pixelBudget=isTouch?1800000:3000000;
    const budgetDpr=Math.sqrt(pixelBudget/Math.max(1,w*h));
    const dpr=Math.max(1,Math.min(native,2,budgetDpr));
    viewport={w,h,dpr};
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width="100%";canvas.style.height="100%";
    screenCtx.setTransform(dpr,0,0,dpr,0,0);screenCtx.imageSmoothingEnabled=true;
    if(world&&world.theme!=="city")buildTerrainCache(world);
  }

  function addProp(type,x,y,o={}){world.props.push({type,x,y,...o});}
  function addObstacle(x,y,w,h,o={}){world.obstacles.push({x,y,w,h,...o});}
  function addHotspot(x,y,o={}){const profile=Boolean(o.needsFill||o.special==="hedgehog");world.hotspots.push({x,y,r:profile?42:24,w:profile?74:0,h:profile?42:0,angle:profile?rand(-.22,.22):0,revealed:Boolean(o.revealed),active:true,ttl:0,...o});}
  function addItem(type,x,y,o={}){world.items.push({type,x,y,r:20,active:true,visualVariant:Math.abs(Math.round((x*17+y*31)%4)),...o});}
  function addPatrol(type,points,o={}){const p=points[0];world.patrols.push({type,x:p.x,y:p.y,points,index:1,speed:o.speed||80,vision:o.vision||180,angle:0,active:true,...o});}

  function generateLevel(index){
    const level=LEVELS[index];
    world={id:level.id,theme:level.theme,w:1800,h:1200,props:[],obstacles:[],hotspots:[],items:[],patrols:[],hazards:[],particles:[],radarPings:[],exit:null,runtime:{},rain:level.theme==="field"?1:0};
    if(level.id==="chlum") generateChlum();
    if(level.id==="locenice") generateLocenice();
    if(level.id==="nesmen") generateNesmen();
    if(level.id==="besednice") generateBesednice();
    if(level.id==="malse") generateMalse();
    buildTerrainCache(world);
    stopPlayerMotion();player.footstepCycle=-1;
    camera.x=player.x-viewport.w/2;camera.y=player.y-viewport.h/2;nearest=null;scanCooldown=0;scanPulse=0;
    state.heat=0;state.combo=1;state.comboTimer=0;audio.setTheme(level.music);updateHUD(true);
  }

  function buildTerrainCache(nextWorld){
    const previousCount=terrainCache.generated||0;
    if(!nextWorld||nextWorld.theme==="city"){terrainCache={key:"",canvas:null,scale:1,generated:previousCount};return;}
    const scale=Math.max(1,Math.min(viewport.dpr||1,1.5));
    const key=`${nextWorld.id}:${nextWorld.w}x${nextWorld.h}@${scale.toFixed(2)}`;
    if(terrainCache.key===key&&terrainCache.canvas)return;
    const surface=document.createElement("canvas");
    surface.width=Math.max(1,Math.round(nextWorld.w*scale));
    surface.height=Math.max(1,Math.round(nextWorld.h*scale));
    const cacheCtx=surface.getContext("2d",{alpha:false});
    if(!cacheCtx){terrainCache={key:"",canvas:null,scale:1,generated:previousCount};return;}
    const previousCtx=ctx;
    try{
      ctx=cacheCtx;
      ctx.setTransform(scale,0,0,scale,0,0);
      ctx.imageSmoothingEnabled=true;
      drawGround();
      drawGroundDetails();
    }finally{ctx=previousCtx;}
    terrainCache={key,canvas:surface,scale,generated:previousCount+1};
  }

  function generateChlum(){
    world.runtime={permit:true,collected:0}; player.x=360;player.y=1070;
    addProp("farm",135,1080,{scale:.82}); addProp("npc",280,990,{name:"Václav",avatar:"V",role:"farmer"});
    for(let i=0;i<12;i++)addProp("soilheap",rand(260,1600),rand(240,980),{scale:rand(.65,1.2)});
    for(let i=0;i<20;i++)addProp("stubble",rand(120,1720),rand(180,1100),{scale:rand(.7,1.15)});
    for(const [i,p] of [[500,840],[820,910],[1120,760],[1440,900],[620,480],[1040,420],[1500,500],[440,690],[1250,640]].entries())addItem("stone",p[0],p[1],{hidden:true,rarity:i===8?"good":i===6?"rare":"common",documented:true});
    addPatrol("tractor",[{x:350,y:300},{x:1570,y:300},{x:1570,y:470},{x:350,y:470}],{speed:115,vision:0,scale:1.25});
    addPatrol("farmer",[{x:1580,y:920},{x:1480,y:650},{x:1660,y:520}],{speed:65,vision:140,requires:"permit"});
    world.exit={x:1650,y:150,r:54,label:"Odjezd"};
  }

  function generateLocenice(){
    world.runtime={correct:0,real:0,identified:0};player.x=160;player.y=1040;
    for(let i=0;i<58;i++){
      const x=rand(30,1770),y=rand(30,1170);
      if(Math.hypot(x-900,y-650)>170)addProp("realpine",x,y,{scale:rand(1.0,1.7),lean:rand(-.12,.12)});
    }
    for(let i=0;i<18;i++)addProp("sandmound",rand(210,1580),rand(160,1080),{scale:rand(.7,1.35),angle:rand(-.25,.25)});
    for(let i=0;i<11;i++)addProp("sandpit",rand(300,1500),rand(190,1030),{w:rand(70,150),h:rand(36,75),angle:rand(-.25,.25)});
    for(let i=0;i<10;i++)addProp("fallenpine",rand(260,1500),rand(220,980),{scale:rand(.7,1.1),angle:rand(-.65,.65)});
    addProp("sign",220,1010,{text:"Ločenice"});
    const samples=[...SAMPLES,...SAMPLES].sort(()=>Math.random()-.5).slice(0,9);
    const pts=[[420,850],[660,950],[910,820],[1210,950],[1480,820],[520,520],[840,410],[1180,560],[1510,390]];
    samples.forEach((s,i)=>addItem("sample",pts[i][0],pts[i][1],{hidden:true,sample:s}));
    addPatrol("farmer",[{x:400,y:250},{x:1500,y:250},{x:1500,y:690},{x:400,y:690}],{speed:72,vision:150});
    world.exit={x:1650,y:150,r:54,label:"Pokračovat"};
  }

  function generateNesmen(){
    world.runtime={permit:false,dug:0,filled:0,open:0};player.x=360;player.y=1050;
    addProp("npc",290,980,{name:"Lesník",avatar:"L",role:"owner"}); addProp("hut",120,1060,{scale:.9});
    for(let i=0;i<62;i++){const x=rand(30,1770),y=rand(30,1170);if(Math.hypot(x-900,y-650)>180)addProp("tree",x,y,{scale:rand(1.0,1.7)});}
    for(let i=0;i<18;i++)addProp("pine",rand(40,1760),rand(40,1160),{scale:rand(.95,1.45)});
    for(let i=0;i<24;i++)addProp("bush",rand(30,1770),rand(30,1170),{scale:rand(.6,1)});
    for(let i=0;i<22;i++)addProp("fern",rand(80,1720),rand(90,1100),{scale:rand(.7,1.15)});
    for(let i=0;i<30;i++)addProp("grass",rand(90,1710),rand(110,1110),{scale:rand(.7,1.25)});
    for(let i=0;i<10;i++)addProp("stump",rand(160,1650),rand(180,1060),{scale:rand(.8,1.2)});
    for(let i=0;i<6;i++)addProp("log",rand(220,1580),rand(210,990),{scale:rand(.8,1.2),angle:rand(-.6,.6)});
    [[520,880],[930,860],[1290,740],[720,390]].forEach((p,i)=>addHotspot(p[0],p[1],{rarity:i===3?"good":"common",documented:true,needsFill:true,marked:true}));
    addPatrol("ranger",[{x:420,y:560},{x:840,y:300},{x:1420,y:470},{x:1320,y:980},{x:650,y:1030}],{speed:82,vision:190});
    world.exit={x:1650,y:150,r:54,label:"Lesní cesta"};
  }

  function generateBesednice(){
    world.runtime={clues:0,hedgehog:false,bossStarted:false,bossHits:0,bossDefeated:false,chaseStarted:false};player.x=150;player.y=1030;
    for(let i=0;i<28;i++){
      const x=rand(20,1780),y=rand(20,1180);
      const clearStart=Math.hypot(x-150,y-1030)<240;
      const clearArena=x>650&&x<1400&&y>300&&y<900;
      if((x<260||x>1550||y<190)&&!clearStart&&!clearArena)addProp("realpine",x,y,{scale:rand(1.05,1.65),lean:rand(-.08,.08)});
    }
    for(let i=0;i<14;i++)addProp("earthbank",rand(280,1520),rand(190,1010),{scale:rand(.8,1.4),angle:rand(-.22,.22)});
    for(let i=0;i<11;i++)addProp("minepit",rand(310,1480),rand(260,960),{w:rand(82,160),h:rand(44,88),angle:rand(-.25,.25)});
    for(let i=0;i<11;i++)addProp("trackscar",rand(260,1500),rand(220,1020),{scale:rand(.9,1.35),angle:rand(-.35,.35)});
    addProp("excavator",1040,370,{scale:1.28,angle:-.08});
    addProp("excavator",430,690,{scale:.96,angle:.18});
    addProp("lamp",1100,340,{scale:1.25});addProp("lamp",500,660,{scale:1.15});addProp("lamp",1420,520,{scale:1.1});
    addProp("sign",250,980,{text:"Besednice"});
    [[410,850],[900,610],[1390,350]].forEach((p,i)=>addItem("clue",p[0],p[1],{hidden:true,label:["čerstvě odkrytá vrstva","hluboký otisk pásu","úlomek ježkové skulptace"][i]}));
    addPatrol("digger",[{x:520,y:260},{x:1400,y:300},{x:1470,y:870},{x:650,y:930}],{speed:92,vision:190});
    world.exit={x:1650,y:150,r:54,label:"Výjezd k Malši"};
  }

  function generateMalse(){
    world.runtime={papers:0,bossStarted:false,bossHits:0,bossDefeated:false};player.x=720;player.y=1060;
    for(let y=150;y<1100;y+=145){addProp("tree",510,y,{scale:1.38});addProp("lamp",650,y);}
    for(let i=0;i<10;i++)addProp("plazatree",rand(1110,1710),rand(470,1030),{scale:rand(.8,1.15)});
    addProp("bridge",330,520,{scale:1}); addProp("slavie",1460,235,{scale:1.26}); addProp("sign",780,1000,{text:"Zátkovo nábřeží"});
    addProp("plaza",1440,400,{scale:1.0});
    [[760,860],[1040,560],[1280,360]].forEach((p,i)=>addItem("paper",p[0],p[1],{label:["fotografie nálezů","souhlasy vlastníků","vážní protokol"][i]}));
    addPatrol("bike",[{x:620,y:820},{x:620,y:180},{x:620,y:1080}],{speed:155,vision:0});
    addPatrol("car",[{x:970,y:1080},{x:970,y:160}],{speed:190,vision:0});
    addPatrol("police",[{x:1180,y:980},{x:1220,y:260}],{speed:92,vision:190});
    world.exit={x:1450,y:250,r:66,label:"KD Slávie"};
  }

  function startNew(){
    audio.start();audio.sfx("click");state=freshState();storage.remove(SAVE_KEY);showBrief(0);
  }
  function continueGame(){audio.start();if(!load()){startNew();return;}showBrief(state.levelIndex);}
  function showBrief(index){
    state.levelIndex=index;mode="brief";setPlaying(false);const l=LEVELS[index];
    $("briefKicker").textContent=`LOKALITA ${index+1} / ${LEVELS.length}`;$("briefTitle").textContent=l.title;$("briefText").textContent=l.text;$("briefGoal").textContent=l.goal;const whyEl=$("briefWhy"); if(whyEl) whyEl.textContent=l.why||"Posil sbírku a pokračuj směrem do KD Slávie na akci Na zelené vlně.";
    showOnly(screens.brief);
  }
  function enterLevel(){generateLevel(state.levelIndex);mode="playing";showOnly(null);setPlaying(true);audio.start();save();}

  function levelGoal(){
    const r=world.runtime;
    if(world.id==="chlum")return `Sběr z povrchu ${r.collected}/6`;
    if(world.id==="locenice")return `Správně ${r.correct}/5 · pravé ${r.real}/3`;
    if(world.id==="nesmen")return r.permit?`Profily ${r.dug}/3 · zahrabáno ${r.filled}/3`:`Získej souhlas lesníka`;
    if(world.id==="besednice")return r.bossStarted?(r.bossDefeated?"Ježek je v bezpečí":"Dostaň ježek zpět"):r.clues<3?`Stopy ${r.clues}/3`:`Vykopej ježkový profil`;
    if(world.id==="malse")return r.bossStarted?(r.bossDefeated?"Vstup do Slávie":"Dožeň Frantu"): `Dokumenty ${r.papers}/3`;
    return "Výprava";
  }
  function goalComplete(){
    const r=world.runtime;
    if(world.id==="chlum")return r.collected>=6;
    if(world.id==="locenice")return r.correct>=5&&r.real>=3;
    if(world.id==="nesmen")return r.permit&&r.dug>=3&&r.filled>=3;
    if(world.id==="besednice")return r.bossDefeated;
    if(world.id==="malse")return r.papers>=3&&r.bossDefeated;
    return false;
  }

  function updateHUD(force=false){
    if(!world)return;ui.missionNumber.textContent=state.levelIndex+1;ui.place.textContent=LEVELS[state.levelIndex].name.toUpperCase();ui.objective.textContent=levelGoal();
    ui.bag.textContent=state.stones.length;ui.heat.style.width=`${clamp(state.heat,0,100)}%`;
    ui.heatPill?.classList.toggle("detected",dangerActive);
    ui.heatPill?.classList.toggle("warning",state.heat>=35&&state.heat<70&&!dangerActive);
    ui.heatPill?.classList.toggle("critical",state.heat>=70);
    if(ui.heatPill)ui.heatPill.setAttribute("aria-label",dangerActive?`${dangerSource} tě vidí. Pozornost ${Math.round(state.heat)} procent`:`Pozornost hlídky ${Math.round(state.heat)} procent`);
    if(ui.dangerMeterText)ui.dangerMeterText.textContent=dangerActive?"ODHALENÍ":state.heat>=70?"KRITICKÉ":state.heat>=35?"POZOR":"KLID";
    ui.dangerBanner?.classList.toggle("hidden",!dangerActive);
    if(ui.dangerText&&dangerActive)ui.dangerText.textContent=dangerSource.toUpperCase();
    const boss=world.rival;
    const bossVisible=Boolean(boss?.active);
    ui.bossHud?.classList.toggle("hidden",!bossVisible);
    ui.bossHud?.classList.toggle("enraged",bossVisible&&boss.phase>=3);ui.bossHud?.classList.toggle("vulnerable",bossVisible&&boss.stunTimer>0);
    if(bossVisible){const display=boss.name==="karel"?"KRYSTALOVÝ KAREL":"FETÁK FRANTA";if(ui.bossName)ui.bossName.textContent=display;if(ui.bossFill)ui.bossFill.style.width=`${clamp((boss.maxHits-boss.hits)/boss.maxHits*100,0,100)}%`;if(ui.bossPhase)ui.bossPhase.textContent=boss.graceTimer>0?"PŘIPRAV SE":boss.stunTimer>0?"ZRANITELNÝ · CHYŤ HO":boss.dashTime>0?"SPRINTUJE":boss.phase>=3?"ZUŘIVÁ FÁZE":boss.phase===2?"ZRYCHLUJE":"VYČKEJ NA PAUZU";}
    hud.classList.toggle("danger-shake",dangerActive&&state.heat>=60);app.classList.toggle("danger-state",dangerActive);
    ui.combo.textContent=`KOMBO ×${state.combo}`;ui.combo.classList.toggle("hidden",state.combo<=1);
  }

  function playerSpeed(){return 185*(1+state.perks.boots*.12);}
  function blocked(x,y){
    if(x<24||y<24||x>world.w-24||y>world.h-24)return true;
    for(const o of world.obstacles){if(x+player.r>o.x-o.w/2&&x-player.r<o.x+o.w/2&&y+player.r>o.y-o.h/2&&y-player.r<o.y+o.h/2)return true;}
    return false;
  }
  function stopPlayerMotion(){player.vx=0;player.vy=0;player.speedRatio=0;player.moving=false;}
  function updatePlayerMovement(dt){
    player.animTime+=dt;
    const inputLength=Math.hypot(input.x,input.y);
    const inputStrength=clamp(inputLength,0,1);
    const hasInput=inputStrength>.04;
    const maxSpeed=playerSpeed()*(inputStrength>.78?1.18:1);
    const nx=hasInput?input.x/inputLength:0,ny=hasInput?input.y/inputLength:0;
    const currentSpeed=Math.hypot(player.vx,player.vy);
    const speed=approach(currentSpeed,hasInput?maxSpeed*inputStrength:0,(hasInput?940:1180)*dt);
    if(hasInput){
      player.angle=Math.atan2(ny,nx);
      player.vx=nx*speed;player.vy=ny*speed;
      if(Math.abs(nx)>.18)player.facing=nx<0?-1:1;
      player.pose=Math.abs(ny)>.66?(ny<0?"back":"front"):"side";
    }else if(speed>0){
      player.vx=Math.cos(player.angle)*speed;player.vy=Math.sin(player.angle)*speed;
    }else{player.vx=0;player.vy=0;}
    player.speedRatio=clamp(speed/Math.max(1,playerSpeed()*1.18),0,1);
    player.moving=speed>7;
    const nextX=player.x+player.vx*dt,nextY=player.y+player.vy*dt;
    let moved=false;
    if(!blocked(nextX,player.y)){player.x=nextX;moved=moved||Math.abs(player.vx)>.1;}else player.vx=0;
    if(!blocked(player.x,nextY)){player.y=nextY;moved=moved||Math.abs(player.vy)>.1;}else player.vy=0;
    if(!moved)return;
    player.step+=dt*(5.5+player.speedRatio*8.5);
    const footstepCycle=Math.floor(player.step/Math.PI);
    if(footstepCycle!==player.footstepCycle){player.footstepCycle=footstepCycle;emitFootstep();audio.sfx("step");}
  }

  function lookAround(){
    if(scanCooldown>0){toast(`Znovu se můžeš rozhlédnout za ${scanCooldown.toFixed(1)} s`,"",700);return;}
    const radius=260+state.perks.scanner*55;scanPulse=.01;scanCooldown=Math.max(2.1,5-state.perks.scanner*.7);audio.sfx("scan");state.heat=clamp(state.heat+1.5,0,100);
    let count=0;
    for(const h of world.hotspots){if(h.active&&dist(player,h)<=radius){h.revealed=true;h.ttl=9;world.radarPings.push({x:h.x,y:h.y,life:.62,maxLife:.62,kind:"profile"});count++;}}
    for(const item of world.items){if(item.active&&item.hidden&&dist(player,item)<=radius){item.hidden=false;world.radarPings.push({x:item.x,y:item.y,life:.62,maxLife:.62,kind:"stone"});count++;}}
    toast(count?`Radar odhalil ${count} ${count===1?"nález":"nálezy"}`:"Radar tady nic nezachytil",count?"good":"",900);
  }

  function performAction(){
    if(mode!=="playing"||theftAlertShown)return;
    findNearest();
    if(nearest){
      if(nearest.kind==="npc")talkNpc(nearest.ref);
      else if(nearest.kind==="hotspot")startDig(nearest.ref);
      else if(nearest.kind==="item")interactItem(nearest.ref);
      else if(nearest.kind==="hole")fillHole(nearest.ref);
      else if(nearest.kind==="rival")hitRival();
      else if(nearest.kind==="exit")tryExit();
    }else lookAround();
  }

  function talkNpc(npc){
    if(world.id==="chlum"){showDialog("Václav","V","Vltavíny leží po bouřce v brázdách, ale splývají s hlínou. Projdi pole s radarem a odhalené kameny seber z povrchu.");return;}
    if(world.id==="nesmen"&&!world.runtime.permit){showDialog("Lesník","L","Tři vyznačené průzkumné profily jsou povolené. Každý po prohlédnutí hned zahrab.",()=>{world.runtime.permit=true;npc.used=true;toast("Profily jsou povolené","good");});return;}
    showDialog(npc.name,npc.avatar,"Drž se úkolu a sleduj okolí.");
  }
  function showDialog(name,avatar,text,callback=null){mode="dialog";setPlaying(false);$("dialogName").textContent=name.toUpperCase();$("dialogAvatar").textContent=avatar;$("dialogText").textContent=text;dialogueCallback=callback;showOnly(screens.dialog);}
  function closeDialog(){screens.dialog.classList.remove("visible");dialogueCallback?.();dialogueCallback=null;mode="playing";setPlaying(true);updateHUD(true);}

  function startDig(h){
    if(!h.active||world.id==="chlum")return;
    if(world.id==="nesmen"&&!world.runtime.permit){toast("Nejdřív získej souhlas lesníka","bad",1200);return;}
    currentDig=h;digMarker=rand(.08,.92);digDir=Math.random()<.5?-1:1;digHits=0;digSpeed=1.25;digTimeLeft=7;digZoneCenter=.5;digInputLockUntil=0;mode="dig";setPlaying(false);$("digHits").textContent="◇ ◇ ◇";$("digTitle").textContent=h.special==="hedgehog"?"Ježkový profil":"Rychlé kopání";
    setDigFeedback("Čekám na první úder");
    updateDigZone();$("digTimerFill").style.transform="scaleX(1)";showOnly(screens.dig);
  }
  function setDigFeedback(text,tone=""){$("digFeedback").textContent=text;$("digFeedback").className=`dig-feedback ${tone}`.trim();}
  function updateDigZone(){const width=.26+state.perks.shovel*.055;digZoneCenter=clamp(digZoneCenter,width/2+.04,1-width/2-.04);$("sweetZone").style.left=`${(digZoneCenter-width/2)*100}%`;$("sweetZone").style.width=`${width*100}%`;}
  function digAttempt(){
    const now=performance.now();if(mode!=="dig"||now<digInputLockUntil)return;digInputLockUntil=now+110;audio.sfx("dig");const width=.26+state.perks.shovel*.055;const good=Math.abs(digMarker-digZoneCenter)<=width/2;
    if(good){
      shake=Math.max(shake,3);digHits++;digTimeLeft=Math.min(7,digTimeLeft+.5);digSpeed+=.28;digDir*=-1;audio.sfx("good");haptic([12,28,16]);$("digHits").textContent=[0,1,2].map(i=>i<digHits?"◆":"◇").join(" ");setDigFeedback(`Přesně · tempo ${digHits}/3 · +0,5 s`,"good");
      const card=$("digScreen").querySelector(".dig-card");card.classList.remove("hit");void card.offsetWidth;card.classList.add("hit");
      digZoneCenter=rand(.28,.72);updateDigZone();if(digHits>=3)setTimeout(finishDig,150);
    }else{
      shake=Math.max(shake,6);flash=.1;flashColor="255,105,96";digTimeLeft=Math.max(.3,digTimeLeft-.6);state.stats.misses++;state.heat=clamp(state.heat+Math.max(3,7-state.perks.quiet*1.5),0,100);audio.sfx("bad");haptic([28,35,28]);setDigFeedback("Vedle · −0,6 s · sleduj zelené pole","bad");toast("Vedle – drž rytmus!","bad",520);
    }
  }
  function failDig(){if(mode!=="dig")return;currentDig=null;screens.dig.classList.remove("visible");mode="playing";setPlaying(true);state.heat=clamp(state.heat+4,0,100);audio.sfx("bad");toast("Rytmus se rozpadl – zkus profil znovu","bad",1100);}
  function finishDig(){
    if(!currentDig)return;const h=currentDig;h.active=false;state.stats.digs++;screens.dig.classList.remove("visible");mode="playing";setPlaying(true);
    if(h.needsFill){
      world.runtime.dug++;
      world.runtime.open=(world.runtime.open||0)+1;
      const hole={type:"hole",x:h.x,y:h.y,r:46,w:h.w||74,h:h.h||42,angle:h.angle||0,active:true};
      world.items.push(hole);
      nearest={kind:"hole",ref:hole,x:hole.x,y:hole.y};
      toast("Profil je otevřený – klepni ZAHRABAT","bad",1700);
    }
    if(h.special==="hedgehog"){
      world.runtime.hedgehog=true;world.runtime.chaseStarted=true;showTheftAlert();
      world.runtime.pendingBoss={x:h.x+150,y:h.y-90};
      audio.sfx("rare");
    }else{
      const stone=makeStone(LEVELS[state.levelIndex].name,h.rarity||"common",h.documented!==false);addStone(stone,h.x,h.y);
      if(world.id==="chlum")world.runtime.collected++;
    }
    currentDig=null;findNearest();updateHUD(true);
  }

  function makeStone(locality,rarity="common",documented=true,qualityBonus=0){
    const bases={common:[.5,1.8],good:[1.5,3.8],rare:[3.2,7.2],hedgehog:[5.5,10.5]};const b=bases[rarity]||bases.common;
    const weight=+rand(b[0],b[1]).toFixed(2);const quality=clamp(Math.round(rand(58,92)+qualityBonus+state.perks.eye*2),45,100);
    const names={common:"Drobný vltavín",good:"Olivový splash",rare:"Výstavní celotvar",hedgehog:"Besednický ježek"};
    return{id:`s${Date.now()}${Math.random()}`,locality,rarity,weight,quality,documented,name:names[rarity],value:Math.round(weight*(rarity==="hedgehog"?4200:rarity==="rare"?1900:rarity==="good"?900:420)*(quality/75))};
  }
  function addStone(stone,x=player.x,y=player.y){
    state.stones.push(stone);state.stats.rare+=stone.rarity==="rare"||stone.rarity==="hedgehog"?1:0;
    const mult=stone.rarity==="hedgehog"?6:stone.rarity==="rare"?3:stone.rarity==="good"?1.6:1;state.score+=Math.round(stone.value*.18*state.combo*mult);
    boostCombo(stone.rarity==="rare"||stone.rarity==="hedgehog"?2:1);burst(x,y,stone.rarity==="rare"||stone.rarity==="hedgehog"?"#f2cb72":"#63e49b",stone.rarity==="hedgehog"?28:15);
    if(stone.rarity==="rare"||stone.rarity==="hedgehog"){shake=Math.max(shake,6);flash=.16;flashColor="242,203,114";haptic([20,35,30]);}audio.sfx(stone.rarity==="rare"||stone.rarity==="hedgehog"?"rare":"good");toast(`${stone.name} · ${stone.weight.toFixed(2)} g`,stone.rarity==="rare"||stone.rarity==="hedgehog"?"rare":"good",1300);
  }
  function boostCombo(amount=1){state.combo=clamp(state.combo+amount,1,6);state.comboTimer=12;}
  function breakCombo(){state.combo=1;state.comboTimer=0;}

  function interactItem(item){
    if(!item.active)return;
    if(item.type==="stone"){
      item.active=false;const stone=makeStone(LEVELS[state.levelIndex].name,item.rarity||"common",item.documented!==false);addStone(stone,item.x,item.y);if(world.id==="chlum")world.runtime.collected++;return;
    }
    if(item.type==="sample"){currentSample=item;mode="identify";setPlaying(false);$("sampleTitle").textContent=item.sample.title;$("sampleDescription").textContent=item.sample.text;$("sampleGem").style.color=item.sample.real?"#70d999":"#33f48b";showOnly(screens.identify);return;}
    if(item.type==="clue"){
      item.active=false;world.runtime.clues++;audio.sfx("paper");boostCombo();
      const clueText=["První stopa: směr k hlavní těžební ploše","Druhá stopa: ježková vrstva je blízko","Třetí stopa: přesné místo profilu nalezeno"][world.runtime.clues-1]||`Stopa: ${item.label}`;
      toast(clueText,"good",1500);
      if(world.runtime.clues>=3){addHotspot(980,520,{rarity:"hedgehog",documented:true,special:"hedgehog",revealed:true,marked:true});toast("JEŽKOVÝ PROFIL ODKRYT · DOJDI DOPROSTŘED", "rare",2200);}return;
    }
    if(item.type==="paper"){
      item.active=false;world.runtime.papers++;audio.sfx("paper");toast(`Nalezena: ${item.label}`,"good");boostCombo();if(world.runtime.papers>=3&&!world.runtime.bossStarted){setTimeout(()=>startRival("franta",1120,300),450);}return;
    }
  }
  function resolveSample(choice){
    if(!currentSample)return;const correct=choice===currentSample.sample.real;currentSample.active=false;world.runtime.identified++;screens.identify.classList.remove("visible");mode="playing";setPlaying(true);
    if(correct){world.runtime.correct++;state.stats.correct++;boostCombo();state.score+=220*state.combo;audio.sfx("good");toast("Správně","good");if(currentSample.sample.real){world.runtime.real++;addStone(makeStone("Ločenice",Math.random()<.2?"good":"common",true,state.perks.eye*3),currentSample.x,currentSample.y);}}
    else{state.heat=clamp(state.heat+12-state.perks.quiet*2,0,100);breakCombo();audio.sfx("bad");toast("Špatné určení","bad");}
    currentSample=null;updateHUD(true);
  }

  function fillHole(hole){
    if(!hole||!hole.active)return;
    hole.active=false;
    world.runtime.filled++;
    world.runtime.open=Math.max(0,(world.runtime.open||0)-1);
    state.score+=160*state.combo;
    boostCombo();
    audio.sfx("dig");
    burst(hole.x,hole.y,"#9a744c",12);
    toast("Profil zahrabán","good");
    nearest=null;
    findNearest();
    updateHUD(true);
    save();
  }

  function startRival(name,x,y){
    world.runtime.bossStarted=true;
    world.rival={name,displayName:name==="karel"?"KRYSTALOVÝ KAREL":"FETÁK FRANTA",x,y,r:30,hits:0,maxHits:name==="karel"?3:2,speed:name==="karel"?150:166,baseSpeed:name==="karel"?150:166,angle:0,target:{x:rand(250,1550),y:rand(220,950)},throwTimer:1.15,active:true,flashlight:name==="karel",vision:name==="karel"?245:0,baseVision:name==="karel"?245:0,halfAngle:name==="karel"?.5:0,seesPlayer:false,phase:1,hitFlash:0,dashTimer:1.8,dashTime:0,stunTimer:0,graceTimer:1.15,trail:[]};
    bossIntroTimer=2.35;
    const isKarel=name==="karel";
    if(ui.bossIntroName)ui.bossIntroName.textContent=isKarel?"KRYSTALOVÝ KAREL":"FETÁK FRANTA";
    if(ui.bossIntroText)ui.bossIntroText.textContent=isKarel?"Ukradl ti Besednický ježek. Po sprintu se na chvíli zastaví — tehdy zaútoč.":"Má poslední certifikát a míří ke Slávii.";
    ui.bossIntro?.classList.remove("hidden");ui.bossIntro?.classList.add("show");
    audio.sfx("boss");haptic([35,40,35]);shake=Math.max(shake,7);flash=.1;flashColor="190,100,75";
    toast(isKarel?"Krystalový Karel utíká s ježkem!":"Franta bere poslední certifikát!","bad",1900);
  }
  function hitRival(){
    const r=world.rival;if(!r||!r.active)return;
    if(r.name==="karel"&&r.stunTimer<=0){toast("Je příliš rychlý · počkej na jeho zastavení","bad",850);return;}
    r.hits++;r.stunTimer=0;r.hitFlash=.28;r.phase=Math.min(3,r.hits+1);audio.sfx("catch");burst(r.x,r.y,"#ff8a72",22);shake=Math.max(shake,7);
    r.speed=r.baseSpeed*(1+r.hits*.16);if(r.flashlight){r.vision=r.baseVision+r.hits*34;r.halfAngle=.5+r.hits*.08;}
    r.throwTimer=Math.max(.55,1.12-r.hits*.17);r.target={x:rand(180,1620),y:rand(160,1020)};
    if(r.hits>=r.maxHits){r.active=false;world.runtime.bossDefeated=true;state.stats.rare++;ui.bossHud?.classList.add("hidden");if(r.name==="karel")addStone(makeStone("Besednice","hedgehog",true,8),r.x,r.y);else{state.score+=1800;toast("Certifikát je zpět","rare");audio.sfx("win");}}
    else toast(`Zásah ${r.hits}/${r.maxHits} · boss zrychluje`,"good",900);
  }

  function tryExit(){if(!goalComplete()){toast(levelGoal(),"bad");return;}finishLevel();}
  function finishLevel(){
    mode="transition";setPlaying(false);state.score+=700+state.combo*120;save();
    if(state.levelIndex>=LEVELS.length-1){showJury();return;}
    showPerks();
  }
  function showPerks(){
    const candidates=PERKS.filter(p=>(state.perks[p.id]||0)<p.max).sort(()=>Math.random()-.5).slice(0,3);const list=$("perkList");list.innerHTML="";
    candidates.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="perk-option";b.innerHTML=`<b>${p.icon}</b><span><strong>${p.name}</strong><small>${p.text}</small></span>`;b.addEventListener("click",()=>{audio.sfx("click");state.perks[p.id]++;state.levelIndex++;save();showBrief(state.levelIndex);});list.append(b);});
    showOnly(screens.perk);
  }

  function showJury(){mode="jury";jurySelection.clear();setPlaying(false);const list=$("juryList");list.innerHTML="";
    [...state.stones].sort((a,b)=>b.value-a.value).forEach(s=>{const b=document.createElement("button");b.type="button";b.className="stone-card";b.innerHTML=`<span>◆</span><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.locality)} · ${s.weight.toFixed(2)} g · stav ${s.quality}%${s.documented?" · doložený":""}</small></div>`;b.addEventListener("click",()=>{if(jurySelection.has(s.id)){jurySelection.delete(s.id);b.classList.remove("selected");}else if(jurySelection.size<3){jurySelection.add(s.id);b.classList.add("selected");}$("juryCount").textContent=`${jurySelection.size} / 3`;$("juryButton").disabled=jurySelection.size!==3;});list.append(b);});
    $("juryCount").textContent="0 / 3";$("juryButton").disabled=true;showOnly(screens.jury);
  }
  function judge(){
    const chosen=state.stones.filter(s=>jurySelection.has(s.id));let jury=0;for(const s of chosen){jury+=s.value*.45+s.quality*18+(s.documented?700:0)+(s.rarity==="hedgehog"?3800:s.rarity==="rare"?1700:s.rarity==="good"?500:100);}jury=Math.round(jury+state.score+Math.max(0,100-state.caught*12)*18);
    let title="Sbírka byla přijata",text="Výprava dorazila do Slávie a našla své místo mezi vystavovateli.";
    if(jury>=25000){title="Hlavní cena Zelené vlny";text="Pestrá, doložená a dobře zvolená kolekce získala hlavní ocenění večera.";}
    else if(jury>=17500){title="Výstavní uznání";text="Porota ocenila kvalitu kamenů i cestu napříč jihočeskými lokalitami.";}
    state.score=jury;addRecord(jury,title);storage.remove(SAVE_KEY);audio.sfx("win");
    $("resultTitle").textContent=title;$("resultScore").textContent=jury.toLocaleString("cs-CZ");$("resultText").textContent=text;
    $("resultStats").innerHTML=`<div><span>KAMENY</span><strong>${state.stones.length}</strong></div><div><span>VZÁCNÉ</span><strong>${state.stats.rare}</strong></div><div><span>DOPADENÍ</span><strong>${state.caught}</strong></div>`;showOnly(screens.result);mode="result";
  }

  function caught(reason){
    if(player.invuln>0)return;dangerActive=false;dangerExposure=0;dangerWarned=false;player.invuln=2;shake=12;flash=.22;flashColor="255,90,80";state.caught++;state.heat=20;breakCombo();audio.sfx("catch");
    let lost=null;if(state.stones.length){const sorted=[...state.stones].sort((a,b)=>a.value-b.value);lost=state.perks.case>0&&sorted.length>1?sorted[0]:pick(sorted.slice(0,Math.min(2,sorted.length)));state.stones=state.stones.filter(s=>s.id!==lost.id);}
    player.x=world.id==="malse"?720:world.id==="chlum"?360:world.id==="nesmen"?360:170;player.y=world.id==="malse"?1060:world.id==="chlum"?1070:world.id==="nesmen"?1050:1030;stopPlayerMotion();toast(`${reason}${lost?` · ztracen ${lost.name}`:""}`,"bad",1800);updateHUD(true);
  }

  function angleDistance(a,b){return Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));}
  function insideVisionCone(observer,vision,halfAngle=.57){
    if(!observer||!vision)return false;
    const vx=player.x-observer.x,vy=player.y-observer.y;
    const distance=Math.hypot(vx,vy);
    if(distance>vision+player.r)return false;
    if(distance<1)return true;
    return angleDistance(Math.atan2(vy,vx),observer.angle)<=halfAngle;
  }
  function markDanger(source,rate=42,catchAfter=2.25){
    dangerActive=true;
    dangerSource=source;
    dangerRate=Math.max(dangerRate,rate);
    dangerCatchAfter=Math.min(dangerCatchAfter,catchAfter);
  }
  function resolveDanger(dt){
    if(dangerActive){
      dangerExposure+=dt;
      state.heat=clamp(state.heat+dangerRate*dt,0,100);
      if(!dangerWarned){dangerWarned=true;audio.sfx("alert");haptic(22);toast(`${dangerSource}: jsi ve světle!`,"bad",900);}
      if(dangerExposure>=dangerCatchAfter){caught(`${dangerSource} tě odhalil`);}
    }else{
      dangerExposure=Math.max(0,dangerExposure-dt*2.8);
      state.heat=Math.max(0,state.heat-dt*4.2);
      if(dangerExposure<=.05)dangerWarned=false;
    }
  }

  function update(dt){
    audio.update(dt,mode==="playing");
    if(mode==="dig"){
      digMarker+=digDir*dt*digSpeed;digTimeLeft=Math.max(0,digTimeLeft-dt);
      if(digMarker>=1){digMarker=1;digDir=-1;}if(digMarker<=0){digMarker=0;digDir=1;}
      const width=.26+state.perks.shovel*.055,inZone=Math.abs(digMarker-digZoneCenter)<=width/2,meter=$("digMeter");meter.classList.toggle("in-zone",inZone);meter.setAttribute("aria-valuemin","0");meter.setAttribute("aria-valuemax","100");meter.setAttribute("aria-valuenow",String(Math.round(digMarker*100)));meter.setAttribute("aria-valuetext",inZone?"V zeleném poli":"Mimo zelené pole");$("digMarker").style.left=`calc(${digMarker*100}% - 5px)`;$("digTimerFill").style.transform=`scaleX(${digTimeLeft/7})`;
      if(digTimeLeft<=0)failDig();return;
    }
    if(mode!=="playing"||!world)return;
    scanCooldown=Math.max(0,scanCooldown-dt);player.invuln=Math.max(0,player.invuln-dt);shake=Math.max(0,shake-dt*24);flash=Math.max(0,flash-dt*.9);dangerActive=false;dangerSource="";dangerRate=0;dangerCatchAfter=Infinity;bossIntroTimer=Math.max(0,bossIntroTimer-dt);if(bossIntroTimer<=0){ui.bossIntro?.classList.remove("show");ui.bossIntro?.classList.add("hidden");}
    if(theftAlertShown&&performance.now()>=theftAlertUntil)hideTheftAlert();dangerBeatTimer=Math.max(0,dangerBeatTimer-dt);state.comboTimer=Math.max(0,state.comboTimer-dt);if(state.comboTimer<=0&&state.combo>1){state.combo--;state.comboTimer=5;}
    if(theftAlertShown){
      input.x=input.y=0;stopPlayerMotion();updateParticles(dt);
      camera.x=lerp(camera.x,clamp(player.x-viewport.w/2,0,Math.max(0,world.w-viewport.w)),1-Math.exp(-5*dt));camera.y=lerp(camera.y,clamp(player.y-viewport.h/2,0,Math.max(0,world.h-viewport.h)),1-Math.exp(-5*dt));
      updateHUD();return;
    }
    updatePlayerMovement(dt);
    updateHotspots(dt);updatePatrols(dt);updateRival(dt);resolveDanger(dt);if((dangerActive||state.heat>=68)&&dangerBeatTimer<=0){audio.sfx("heartbeat");dangerBeatTimer=state.heat>=88?.42:.68;}for(const ping of world.radarPings)ping.life-=dt;world.radarPings=world.radarPings.filter(ping=>ping.life>0);updateParticles(dt);findNearest();
    camera.x=lerp(camera.x,clamp(player.x-viewport.w/2,0,Math.max(0,world.w-viewport.w)),1-Math.exp(-5*dt));camera.y=lerp(camera.y,clamp(player.y-viewport.h/2,0,Math.max(0,world.h-viewport.h)),1-Math.exp(-5*dt));
    if(scanPulse>0){scanPulse+=dt*1.4;if(scanPulse>1)scanPulse=0;}
    if(state.heat>=100)caught("Hlídka tě zastavila");updateHUD();
  }

  function updateHotspots(dt){for(const h of world.hotspots){if(!h.active)continue;if(h.revealed){h.ttl-=dt;if(h.ttl<=0&&!h.marked)h.revealed=false;}}}
  function updatePatrols(dt){
    for(const p of world.patrols){if(!p.active)continue;const target=p.points[p.index],dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;p.x+=dx/d*p.speed*dt;p.y+=dy/d*p.speed*dt;p.angle=Math.atan2(dy,dx);p.motionRatio=clamp(p.speed/160,0,1);p.motionPhase=(p.motionPhase||0)+dt*(2.8+p.motionRatio*8);p.wheelRotation=(p.wheelRotation||0)+dt*p.speed*.018;if(d<12)p.index=(p.index+1)%p.points.length;
      if(p.type==="tractor"||p.type==="bike"||p.type==="car"){const rr=p.type==="tractor"?48*(p.scale||1):25;if(Math.hypot(p.x-player.x,p.y-player.y)<rr+player.r)caught(p.type==="tractor"?"Traktor tě srazil":"Pozor na provoz");continue;}
      let suspicious=true;if(p.requires==="permit"&&world.runtime.permit)suspicious=false;if(p.type==="ranger"&&world.runtime.open<=0)suspicious=false;if(p.type==="police"&&world.runtime.papers>=3&&!world.rival?.active)suspicious=false;
      p.seesPlayer=false;
      if(!suspicious||!p.vision)continue;
      if(insideVisionCone(p,p.vision,p.halfAngle||.57)){
        p.seesPlayer=true;
        const source=p.type==="digger"?"Svítilna kopáče":p.type==="ranger"?"Lesní hlídka":p.type==="police"?"Policejní hlídka":"Majitel pozemku";
        markDanger(source,p.type==="digger"?48:38,p.type==="digger"?1.85:2.35);
      }
    }
  }
  function updateRival(dt){
    const r=world.rival;
    if(r&&r.active){
      r.hitFlash=Math.max(0,(r.hitFlash||0)-dt);
      r.stunTimer=Math.max(0,(r.stunTimer||0)-dt);
      r.graceTimer=Math.max(0,(r.graceTimer||0)-dt);
      if(r.graceTimer<=0)r.dashTimer-=dt;
      if(r.trail){if(r.dashTime>0)r.trail.unshift({x:r.x,y:r.y,life:.34});for(const t of r.trail)t.life-=dt;r.trail=r.trail.filter(t=>t.life>0).slice(0,8);}
      if(r.dashTime>0){
        r.dashTime-=dt;
        r.x+=Math.cos(r.angle)*r.speed*2.25*dt;r.y+=Math.sin(r.angle)*r.speed*2.25*dt;
        if(r.dashTime<=0){r.stunTimer=.9;r.target={x:rand(240,1560),y:rand(180,980)};toast("ZLODĚJ JE VYČERPANÝ · TEĎ!","good",850);}
      }else if(r.stunTimer<=0){
        const dx=r.target.x-r.x,dy=r.target.y-r.y,d=Math.hypot(dx,dy)||1;
        const weave=r.phase>=2?Math.sin(performance.now()*.004+r.x)*18:0;
        r.x+=(dx/d*r.speed+Math.cos(r.angle+Math.PI/2)*weave)*dt;r.y+=(dy/d*r.speed+Math.sin(r.angle+Math.PI/2)*weave)*dt;r.angle=Math.atan2(dy,dx);
        if(d<28)r.target={x:rand(170,1630),y:rand(150,1040)};
        if(r.graceTimer<=0&&r.name==="karel"&&r.dashTimer<=0){r.dashTimer=Math.max(1.25,2.5-r.phase*.35)+Math.random()*.55;r.dashTime=.42+.06*r.phase;r.angle=Math.atan2(player.y-r.y,player.x-r.x)+pick([-.72,.72]);audio.sfx("alert");}
      }
      r.x=clamp(r.x,80,1720);r.y=clamp(r.y,100,1120);
      r.seesPlayer=false;
      if(r.graceTimer<=0&&r.flashlight&&r.stunTimer<=0&&insideVisionCone(r,r.vision,r.halfAngle)){
        r.seesPlayer=true;markDanger("Karlova svítilna",r.phase>=3?72:r.phase===2?64:58,r.phase>=3?1.15:r.phase===2?1.35:1.55);
      }
      r.throwTimer-=dt;
      if(r.graceTimer<=0&&r.throwTimer<=0&&r.stunTimer<=0&&r.dashTime<=0){r.throwTimer=Math.max(.48,1.15-r.phase*.18)+Math.random()*.42;const aim=Math.atan2(player.y-r.y,player.x-r.x);world.hazards.push({type:"clod",x:r.x,y:r.y,vx:Math.cos(aim)*150*(1+r.phase*.08),vy:Math.sin(aim)*150*(1+r.phase*.08),life:2.2,r:10+r.phase});}
    }
    for(const h of world.hazards){if(h.type!=="clod")continue;h.x+=h.vx*dt;h.y+=h.vy*dt;h.life-=dt;if(h.life>0&&Math.hypot(h.x-player.x,h.y-player.y)<h.r+player.r){h.life=0;state.heat=clamp(state.heat+15,0,100);shake=Math.max(shake,5);toast("Zásah hroudou","bad",650);}}
    world.hazards=world.hazards.filter(h=>h.life>0);
  }
  function updateParticles(dt){for(const p of world.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=20*dt;}world.particles=world.particles.filter(p=>p.life>0);}

  function findNearest(){
    nearest=null;let best=100;const check=(kind,ref,x,y,range=68)=>{const d=Math.hypot(x-player.x,y-player.y);if(d<range&&d<best){best=d;nearest={kind,ref,x,y};}};
    for(const p of world.props)if(p.type==="npc"&&!p.used)check("npc",p,p.x,p.y);
    for(const h of world.hotspots)if(h.active&&h.revealed)check("hotspot",h,h.x,h.y);
    for(const i of world.items)if(i.active&&!i.hidden)check(i.type==="hole"?"hole":"item",i,i.x,i.y,i.type==="hole"?98:68);
    if(world.rival?.active)check("rival",world.rival,world.rival.x,world.rival.y,world.rival.stunTimer>0?92:66);
    if(world.exit)check("exit",world.exit,world.exit.x,world.exit.y,88);
    const actionButton=$("actionButton");
    if(nearest){const map={npc:["!","MLUVIT"],hotspot:["⛏","KOPAT"],item:["◆","SEBRAT"],hole:["▨","ZAHRABAT"],rival:["✋","CHYTIT"],exit:["→","ODEJÍT"]};const m=map[nearest.kind]||["◎","AKCE"];ui.actionIcon.textContent=m[0];ui.actionText.textContent=m[1];actionButton.classList.add("ready");actionButton.classList.toggle("boss-ready",nearest.kind==="rival"&&nearest.ref.stunTimer>0);actionButton.setAttribute("aria-label",nearest.kind==="exit"?nearest.ref.label:m[1]);showHint(nearest.kind==="exit"?nearest.ref.label:m[1]);}
    else{ui.actionIcon.textContent="◉";ui.actionText.textContent=scanCooldown>0?`${Math.ceil(scanCooldown)}`:"RADAR";actionButton.classList.remove("ready","boss-ready");actionButton.setAttribute("aria-label",scanCooldown>0?`Radar připraven za ${Math.ceil(scanCooldown)} s`:"Spustit radar");hideHint();}
  }

  function burst(x,y,color,count=14){for(let i=0;i<count;i++)world.particles.push({x,y,vx:rand(-90,90),vy:rand(-120,-30),life:rand(.45,.9),color,r:rand(2,5)});}
  function emitFootstep(){
    if(!world)return;
    const colors={field:"rgba(225,198,151,.42)",meadow:"rgba(211,195,153,.38)",forest:"rgba(128,105,73,.42)",night:"rgba(169,203,178,.28)",city:"rgba(214,220,212,.34)"};
    const backX=player.x-Math.cos(player.angle)*5,backY=player.y-Math.sin(player.angle)*5;
    for(let i=0;i<2;i++)world.particles.push({x:backX+rand(-6,6),y:backY+rand(-3,3),vx:rand(-13,13),vy:rand(-23,-8),life:rand(.2,.34),color:colors[world.theme]||colors.field,r:rand(1.6,3.2)});
  }

  function render(){
    ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);ctx.clearRect(0,0,viewport.w,viewport.h);
    if(!world){drawMenuBackdrop();return;}
    ctx.save();const sx=shake?(Math.random()-.5)*shake:0,sy=shake?(Math.random()-.5)*shake:0;ctx.translate(sx-camera.x,sy-camera.y);if(terrainCache.canvas){ctx.drawImage(terrainCache.canvas,0,0,terrainCache.canvas.width,terrainCache.canvas.height,0,0,world.w,world.h);}else{drawGround();drawGroundDetails();}drawWorldObjects();drawEffects();ctx.restore();drawScreenVignette();drawAtmosphereOverlay();drawObjectiveArrow();
  }

  function drawMenuBackdrop(){const g=ctx.createLinearGradient(0,0,0,viewport.h);g.addColorStop(0,"#142a35");g.addColorStop(.52,"#2b4633");g.addColorStop(1,"#3b2d22");ctx.fillStyle=g;ctx.fillRect(0,0,viewport.w,viewport.h);}

  function drawGround(){
    if(world.theme==="field")drawField();
    else if(world.theme==="meadow")drawMeadow();
    else if(world.theme==="forest"||world.theme==="night")drawForest();
    else drawCity();
  }
  function drawGroundDetails(){
    ctx.save();ctx.lineCap="round";
    if(world.theme==="field"){
      for(let i=0;i<74;i++){const x=28+(i*137)%1740,y=210+(i*89)%970;ctx.fillStyle=i%4?"rgba(78,55,37,.32)":"rgba(198,165,111,.32)";ctx.beginPath();ctx.ellipse(x,y,2+i%3,1.4+(i%2),i*.11,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle="rgba(232,201,146,.18)";ctx.lineWidth=2;for(let i=0;i<18;i++){const x=50+i*103,y=260+(i%7)*128;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+13,y-8);ctx.stroke();}
    }else if(world.theme==="meadow"){
      for(let i=0;i<95;i++){const x=24+(i*149)%1750,y=40+(i*103)%1120;ctx.strokeStyle="rgba(69,91,55,.42)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y+5);ctx.lineTo(x+((i%3)-1)*3,y-4);ctx.stroke();ctx.fillStyle=i%5===0?"#e8d77a":i%3===0?"#d4e4c0":"rgba(225,236,202,.72)";ctx.beginPath();ctx.arc(x+((i%3)-1)*3,y-5,1.5+(i%2)*.5,0,Math.PI*2);ctx.fill();}
    }else if(world.theme==="forest"){
      for(let i=0;i<86;i++){const x=30+(i*157)%1730,y=30+(i*109)%1130;ctx.fillStyle=i%3?"rgba(151,116,70,.34)":"rgba(89,120,70,.34)";ctx.beginPath();ctx.ellipse(x,y,4+(i%3),2.2,(i%7)*.38,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle="rgba(55,43,30,.28)";ctx.lineWidth=3;for(let i=0;i<12;i++){const x=90+i*151,y=110+(i*173)%980;ctx.beginPath();ctx.moveTo(x-16,y);ctx.quadraticCurveTo(x,y-8,x+22,y+3);ctx.stroke();}
    }else if(world.theme==="night"){
      for(let i=0;i<72;i++){const x=32+(i*163)%1725,y=34+(i*113)%1125;ctx.fillStyle=i%4?"rgba(62,48,37,.42)":"rgba(182,153,105,.22)";ctx.beginPath();ctx.ellipse(x,y,3+i%4,2+(i%2),i*.2,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle="rgba(226,195,142,.12)";ctx.lineWidth=2;for(let i=0;i<16;i++){const x=130+i*101,y=180+(i*149)%880;ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+12,y-3);ctx.stroke();}
    }else{
      ctx.strokeStyle="rgba(216,232,226,.38)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(430,0);ctx.lineTo(430,world.h);ctx.stroke();
      for(let y=36;y<world.h;y+=92){ctx.fillStyle="#526366";roundRect(ctx,423,y,14,8,3);ctx.fill();ctx.strokeStyle="rgba(211,231,225,.45)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(430,y+7);ctx.lineTo(430,y+45);ctx.stroke();}
      ctx.strokeStyle="rgba(255,255,255,.1)";ctx.lineWidth=1;for(let x=1110;x<1800;x+=58){ctx.beginPath();ctx.moveTo(x,420);ctx.lineTo(x,1200);ctx.stroke();}
    }
    ctx.restore();
  }
  function drawField(){
    const g=ctx.createLinearGradient(0,0,0,world.h);
    g.addColorStop(0,"#829a63");g.addColorStop(.1,"#6e8355");g.addColorStop(.2,"#917b59");g.addColorStop(.58,"#71563f");g.addColorStop(1,"#5d4434");ctx.fillStyle=g;ctx.fillRect(0,0,world.w,world.h);

    // Distant tree line and wet headland create depth before the worked soil begins.
    ctx.fillStyle="#293b2c";ctx.fillRect(0,0,world.w,104);
    for(let i=0;i<30;i++){const x=i*68+(i%3)*11,h=54+(i*17)%42;ctx.fillStyle=i%3?"#304730":"#263b2b";ctx.beginPath();ctx.moveTo(x,108);ctx.lineTo(x+33,108-h);ctx.lineTo(x+71,108);ctx.closePath();ctx.fill();}
    const headland=ctx.createLinearGradient(0,104,0,224);headland.addColorStop(0,"#60794e");headland.addColorStop(1,"#8d805e");ctx.fillStyle=headland;ctx.fillRect(0,104,world.w,120);
    ctx.strokeStyle="rgba(214,226,190,.13)";ctx.lineWidth=2;for(let x=18;x<world.w;x+=43){ctx.beginPath();ctx.moveTo(x,135);ctx.lineTo(x+7,184);ctx.stroke();}

    // Irregular furrows replace the former horizontal stripes; deterministic curves avoid visual flicker.
    for(let row=0;row<12;row++){
      const y=238+row*82+(row%3)*7;
      const band=ctx.createLinearGradient(0,y-10,0,y+62);band.addColorStop(0,row%2?"#806248":"#76583f");band.addColorStop(.48,row%2?"#664a37":"#604431");band.addColorStop(1,row%2?"#826449":"#795a42");
      ctx.fillStyle=band;ctx.beginPath();ctx.moveTo(0,y-15);ctx.bezierCurveTo(420,y-28+(row%2)*8,920,y+10,world.w,y-10);ctx.lineTo(world.w,y+58);ctx.bezierCurveTo(1230,y+42,620,y+78,0,y+55);ctx.closePath();ctx.fill();

      ctx.strokeStyle="rgba(42,28,20,.32)";ctx.lineWidth=3.2;
      for(let lane=0;lane<7;lane++){const x=-90+lane*315+(row%2)*38;ctx.beginPath();ctx.moveTo(x,y-8);ctx.bezierCurveTo(x+90,y+12,x+175,y+28,x+285,y+51);ctx.stroke();}
      ctx.strokeStyle="rgba(211,177,123,.12)";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,y+10);ctx.bezierCurveTo(520,y-2,1120,y+28,world.w,y+8);ctx.stroke();
    }

    // Mud clods, stones, stubble and shallow rain sheen break up the broad field shapes.
    for(let i=0;i<210;i++){const x=(i*127+37)%world.w,y=226+((i*83+i*i*3)%950),r=1.5+(i%4)*.8;ctx.fillStyle=i%5===0?"rgba(196,160,108,.27)":i%3===0?"rgba(45,31,24,.32)":"rgba(92,68,49,.36)";ctx.beginPath();ctx.ellipse(x,y,r*1.5,r,(i%7)*.31,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<22;i++){const x=70+(i*179)%1660,y=260+(i*137)%870;ctx.strokeStyle="rgba(182,159,112,.34)";ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y+5);ctx.lineTo(x-2,y-10);ctx.moveTo(x+4,y+5);ctx.lineTo(x+7,y-8);ctx.stroke();}
    ctx.strokeStyle="rgba(58,43,31,.42)";ctx.lineWidth=7;ctx.lineCap="round";
    for(const off of [-12,12]){ctx.beginPath();ctx.moveTo(290,320+off);ctx.bezierCurveTo(650,350+off,1020,430+off,1570,455+off);ctx.stroke();}
    ctx.strokeStyle="rgba(215,202,169,.08)";ctx.lineWidth=2;for(let i=0;i<7;i++){const x=180+i*245,y=320+(i%3)*190;ctx.beginPath();ctx.ellipse(x,y,65,12,(i%4)*.12,0,Math.PI*2);ctx.stroke();}
  }
  function drawMeadow(){
    const g=ctx.createLinearGradient(0,0,0,world.h);g.addColorStop(0,"#5d6f54");g.addColorStop(.25,"#74806a");g.addColorStop(1,"#b8a782");ctx.fillStyle=g;ctx.fillRect(0,0,world.w,world.h);
    for(let i=0;i<26;i++){const x=70+i*75;ctx.fillStyle=i%2?"rgba(42,69,48,.5)":"rgba(60,87,59,.42)";ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+35,120);ctx.lineTo(x-20,120);ctx.closePath();ctx.fill();}
    for(let i=0;i<18;i++){const x=80+(i*137)%1650,y=120+(i*193)%1030,w=150+(i%4)*45,h=62+(i%3)*24;ctx.fillStyle=i%2?"rgba(216,199,158,.62)":"rgba(195,174,129,.6)";ctx.beginPath();ctx.ellipse(x,y,w,h,(i%5)*.17,0,Math.PI*2);ctx.fill();}
    for(let i=0;i<320;i++){const x=(i*97)%world.w,y=(i*61)%world.h;ctx.fillStyle=i%3?"rgba(106,91,65,.25)":"rgba(235,219,178,.28)";ctx.fillRect(x,y,2+(i%3),2+(i%2));}
    ctx.strokeStyle="rgba(126,106,76,.28)";ctx.lineWidth=44;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(180,1100);ctx.bezierCurveTo(520,870,730,760,900,560);ctx.bezierCurveTo(1180,260,1430,310,1640,120);ctx.stroke();
    ctx.strokeStyle="rgba(232,218,184,.5)";ctx.lineWidth=24;ctx.stroke();
  }
  function drawForest(){
    if(world.id==="besednice"){
      const g=ctx.createLinearGradient(0,0,0,world.h);g.addColorStop(0,"#53614f");g.addColorStop(.12,"#59634f");g.addColorStop(.18,"#8b7b61");g.addColorStop(1,"#8c7155");ctx.fillStyle=g;ctx.fillRect(0,0,world.w,world.h);
      ctx.fillStyle="#24382a";ctx.fillRect(0,0,world.w,118);
      for(let i=0;i<24;i++){const x=i*85;ctx.fillStyle=i%2?"#29452f":"#36553a";ctx.beginPath();ctx.moveTo(x,118);ctx.lineTo(x+38,32);ctx.lineTo(x+78,118);ctx.closePath();ctx.fill();}
      for(let i=0;i<32;i++){const x=80+(i*157)%1650,y=145+(i*107)%980,w=110+(i%5)*33,h=44+(i%3)*18;ctx.fillStyle=i%2?"rgba(180,151,107,.32)":"rgba(117,91,65,.32)";ctx.beginPath();ctx.ellipse(x,y,w,h,(i%7)*.13,0,Math.PI*2);ctx.fill();}
      for(let i=0;i<22;i++){const y=180+i*48;ctx.strokeStyle=i%2?"rgba(91,69,50,.28)":"rgba(218,191,145,.18)";ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(120+(i%4)*35,y);ctx.bezierCurveTo(600,y-30,1100,y+35,1680,y-10);ctx.stroke();}
      return;
    }
    const sandy = world.id === "nesmen";const g=ctx.createLinearGradient(0,0,0,world.h);g.addColorStop(0,sandy?"#60724a":"#4a5a3d");g.addColorStop(1,sandy?"#455636":"#33412b");ctx.fillStyle=g;ctx.fillRect(0,0,world.w,world.h);
    for(let i=0;i<220;i++){const x=(i*113)%world.w,y=(i*71)%world.h;ctx.fillStyle=sandy?(i%2?"rgba(202,182,138,.07)":"rgba(30,56,35,.12)"):(i%2?"rgba(76,98,60,.12)":"rgba(29,49,35,.14)");ctx.beginPath();ctx.arc(x,y,2+(i%7),0,Math.PI*2);ctx.fill();}
    if(sandy){for(let i=0;i<18;i++){const x=130+(i*147)%1550,y=100+(i*193)%960,w=150+(i%4)*30,h=82+(i%3)*18;ctx.fillStyle=i%2?"rgba(210,184,132,.16)":"rgba(235,213,170,.10)";ctx.beginPath();ctx.ellipse(x,y,w,h,(i%5)*.22,0,Math.PI*2);ctx.fill();}}
    ctx.strokeStyle=sandy?"#8f7650":"#6d563a";ctx.lineWidth=112;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(150,1100);ctx.bezierCurveTo(500,900,520,580,890,620);ctx.bezierCurveTo(1250,660,1330,330,1660,130);ctx.stroke();ctx.strokeStyle=sandy?"rgba(227,209,170,.72)":"rgba(177,157,118,.36)";ctx.lineWidth=sandy?66:58;ctx.stroke();
  }
  function drawCity(){
    const g=ctx.createLinearGradient(0,0,0,world.h);g.addColorStop(0,"#9cb2bb");g.addColorStop(.2,"#7c8f8d");g.addColorStop(1,"#59605b");ctx.fillStyle=g;ctx.fillRect(0,0,world.w,world.h);
    const river=ctx.createLinearGradient(0,0,420,0);river.addColorStop(0,"#245a68");river.addColorStop(1,"#4e9db0");ctx.fillStyle=river;ctx.fillRect(0,0,420,world.h);
    for(let y=0;y<world.h;y+=32){ctx.fillStyle=y%64?"rgba(255,255,255,.08)":"rgba(184,230,234,.11)";ctx.fillRect(0,y,420,11);}
    const waterTick=performance.now()*.032;
    ctx.lineCap="round";ctx.lineWidth=2;
    for(let i=0;i<24;i++){
      const y=18+(i*53)%world.h;
      const x=(i*97+waterTick*(1+(i%3)*.22))%470-42;
      const width=18+(i%4)*11;
      ctx.strokeStyle=i%3?"rgba(203,244,239,.2)":"rgba(116,215,222,.28)";
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke();
    }
    ctx.fillStyle="#787a72";ctx.fillRect(420,0,120,world.h);ctx.fillStyle="#b6b2a7";ctx.fillRect(540,0,340,world.h);for(let y=0;y<world.h;y+=78){ctx.fillStyle="rgba(255,255,255,.1)";ctx.fillRect(540,y+18,340,6);}
    ctx.fillStyle="#42464a";ctx.fillRect(880,0,210,world.h);ctx.fillStyle="#8c8e87";ctx.fillRect(1090,0,710,world.h);ctx.strokeStyle="#eadfb8";ctx.setLineDash([28,25]);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(985,0);ctx.lineTo(985,world.h);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#a3a69e";ctx.fillRect(1090,0,710,420);for(let y=40;y<400;y+=60){ctx.strokeStyle="rgba(255,255,255,.15)";ctx.beginPath();ctx.moveTo(1090,y);ctx.lineTo(1800,y);ctx.stroke();}
  }

  function drawWorldObjects(){
    const drawables=[];world.props.forEach(o=>drawables.push({y:o.y,kind:"prop",o}));world.items.filter(o=>o.active&&!o.hidden).forEach(o=>drawables.push({y:o.y,kind:"item",o}));world.hotspots.filter(o=>o.active&&o.revealed).forEach(o=>drawables.push({y:o.y,kind:"hotspot",o}));world.patrols.filter(o=>o.active).forEach(o=>drawables.push({y:o.y,kind:"patrol",o}));if(world.rival?.active)drawables.push({y:world.rival.y,kind:"rival",o:world.rival});drawables.push({y:player.y,kind:"player",o:player});drawables.sort((a,b)=>a.y-b.y);
    for(const d of drawables){if(d.kind==="prop")drawProp(d.o);else if(d.kind==="item")drawItem(d.o);else if(d.kind==="hotspot")drawHotspot(d.o);else if(d.kind==="patrol")drawPatrol(d.o);else if(d.kind==="rival")drawRival(d.o);else drawPlayer();}
    if(world.exit)drawExit(world.exit);
  }

  function drawProp(p){ctx.save();ctx.translate(p.x,p.y);const s=p.scale||1;ctx.scale(s,s);
    if(p.type==="tree"||p.type==="pine"){ctx.fillStyle="rgba(0,0,0,.25)";ellipse(0,17,35,13);ctx.fillStyle="#5b4029";roundRect(ctx,-8,-12,16,48,7);ctx.fill();const col=p.type==="pine"?(world.theme==="night"?"#173527":"#285c39"):"#3e713d";ctx.fillStyle=col;for(const q of p.type==="pine"?[[0,-55,32],[0,-30,38],[0,-5,42]]:[[-16,-35,28],[14,-38,30],[0,-58,34],[0,-18,38]]){ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,Math.PI*2);ctx.fill();}}
    else if(p.type==="bush"){ctx.fillStyle="rgba(0,0,0,.2)";ellipse(0,12,28,10);ctx.fillStyle="#3c743c";for(const q of [[-14,-2,17],[10,-8,20],[0,-20,19]]){ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,Math.PI*2);ctx.fill();}}
    else if(p.type==="fern"){ctx.strokeStyle="#2b6a3f";ctx.lineWidth=3;for(const a of [-.85,-.45,-.1,.2,.55,.9]){ctx.beginPath();ctx.moveTo(0,16);ctx.quadraticCurveTo(a*10,-2,a*16,-24);ctx.stroke();}}
    else if(p.type==="grass"){ctx.strokeStyle="#88a864";ctx.lineWidth=2;for(const a of [-7,-3,0,4,8]){ctx.beginPath();ctx.moveTo(a,14);ctx.quadraticCurveTo(a*.4,-2,a*1.2,-18-(Math.abs(a)%3));ctx.stroke();}}
    else if(p.type==="stump"){ctx.fillStyle="rgba(0,0,0,.2)";ellipse(0,12,18,7);ctx.fill();ctx.fillStyle="#6d4d32";roundRect(ctx,-14,-8,28,24,6);ctx.fill();ctx.fillStyle="#c7a06a";ctx.beginPath();ctx.ellipse(0,-8,14,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#8f6d45";ctx.lineWidth=2;ctx.stroke();}
    else if(p.type==="log"){ctx.rotate(p.angle||0);ctx.fillStyle="#6a4b31";roundRect(ctx,-30,-8,60,16,7);ctx.fill();ctx.fillStyle="#5a3f2b";ctx.beginPath();ctx.arc(-24,0,7,0,Math.PI*2);ctx.arc(24,0,7,0,Math.PI*2);ctx.fill();}
    else if(p.type==="puddle"){ctx.fillStyle="rgba(99,151,153,.46)";ellipse(0,0,p.r||28,(p.r||28)*.45);ctx.strokeStyle="rgba(214,242,238,.25)";ctx.stroke();}
    else if(p.type==="rock"){ctx.fillStyle="rgba(0,0,0,.22)";ellipse(0,12,20,8);ctx.fillStyle="#767465";ctx.beginPath();ctx.moveTo(-18,10);ctx.lineTo(-12,-11);ctx.lineTo(5,-18);ctx.lineTo(21,1);ctx.lineTo(12,16);ctx.closePath();ctx.fill();}
    else if(p.type==="farm"||p.type==="hut"){ctx.fillStyle="rgba(0,0,0,.25)";ellipse(0,22,58,15);ctx.fillStyle=p.type==="farm"?"#d7c7a7":"#74543a";roundRect(ctx,-47,-38,94,60,5);ctx.fill();ctx.fillStyle="#7c392f";ctx.beginPath();ctx.moveTo(-57,-38);ctx.lineTo(0,-78);ctx.lineTo(57,-38);ctx.closePath();ctx.fill();ctx.fillStyle="#49342a";ctx.fillRect(-12,-12,24,34);}
    else if(p.type==="fieldpit"||p.type==="sandpit"||p.type==="minepit"){ctx.rotate(p.angle||0);const w=p.w||110,h=p.h||58;const palette=p.type==="sandpit"?{lip:"#d8c39a",wall:"#9d8861",deep:"#574d40",line:"#f2debb",material:"sand"}:p.type==="minepit"?{lip:"#956c4a",wall:"#694a33",deep:"#241a13",line:"#c7986a",material:"dark"}:{lip:"#b48858",wall:"#805a3a",deep:"#2a1d14",line:"#d9ad76",material:"field"};drawExcavationProfile(w,h,p.x+p.y,palette);}
    else if(p.type==="soilheap"){ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(0,12,35,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#886747";ctx.beginPath();ctx.moveTo(-36,12);ctx.quadraticCurveTo(-12,-22,0,-12);ctx.quadraticCurveTo(18,-28,39,12);ctx.closePath();ctx.fill();ctx.fillStyle="rgba(188,151,100,.26)";ctx.beginPath();ctx.arc(-8,-4,5,0,Math.PI*2);ctx.arc(12,-7,4,0,Math.PI*2);ctx.fill();}
    else if(p.type==="stubble"){ctx.strokeStyle="#b7a271";ctx.lineWidth=2;for(let i=-4;i<=4;i+=2){ctx.beginPath();ctx.moveTo(i,9);ctx.lineTo(i-2,-9-(i%3));ctx.stroke();}}
    else if(p.type==="realpine"){ctx.rotate(p.lean||0);ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(0,16,18,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#8a5738";roundRect(ctx,-4,-58,8,78,3);ctx.fill();ctx.fillStyle="#b36d42";ctx.fillRect(-3,-54,2,60);ctx.fillStyle=world.id==="locenice"?"#49634a":"#2d5236";for(const q of [[0,-72,20],[0,-55,24],[0,-38,21]]){ctx.beginPath();ctx.moveTo(0,q[1]-q[2]);ctx.lineTo(-q[2],q[1]+q[2]);ctx.lineTo(q[2],q[1]+q[2]);ctx.closePath();ctx.fill();}}
    else if(p.type==="sandmound"||p.type==="earthbank"){ctx.rotate(p.angle||0);ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(0,15,52,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.type==="sandmound"?"#c7b38a":"#9b7858";ctx.beginPath();ctx.moveTo(-55,15);ctx.quadraticCurveTo(-20,-25,0,-15);ctx.quadraticCurveTo(30,-32,58,15);ctx.closePath();ctx.fill();ctx.strokeStyle=p.type==="sandmound"?"rgba(238,220,177,.45)":"rgba(190,148,102,.35)";ctx.lineWidth=3;ctx.stroke();}
    else if(p.type==="fallenpine"){ctx.rotate(p.angle||0);ctx.fillStyle="#8b5737";roundRect(ctx,-50,-5,100,10,5);ctx.fill();ctx.strokeStyle="#385b3f";ctx.lineWidth=3;for(let x=-35;x<45;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-8,-15);ctx.moveTo(x+5,0);ctx.lineTo(x+12,13);ctx.stroke();}}
    else if(p.type==="trackscar"){ctx.rotate(p.angle||0);ctx.strokeStyle="rgba(68,48,34,.55)";ctx.lineWidth=5;for(const y of [-10,10]){ctx.beginPath();ctx.moveTo(-55,y);ctx.lineTo(55,y);ctx.stroke();for(let x=-48;x<50;x+=14){ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+7,y+4);ctx.stroke();}}}
    else if(p.type==="excavator"){ctx.rotate(p.angle||0);ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(0,22,58,16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#36322d";roundRect(ctx,-42,8,74,18,8);ctx.fill();ctx.strokeStyle="#5a554d";ctx.lineWidth=4;for(let x=-34;x<28;x+=14){ctx.beginPath();ctx.moveTo(x,10);ctx.lineTo(x+8,24);ctx.stroke();}ctx.fillStyle="#d6a52e";roundRect(ctx,-26,-18,48,32,7);ctx.fill();ctx.fillStyle="#35434a";roundRect(ctx,-14,-34,28,22,4);ctx.fill();ctx.fillStyle="rgba(194,225,235,.35)";ctx.fillRect(-10,-31,11,12);ctx.strokeStyle="#d6a52e";ctx.lineWidth=10;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(20,-12);ctx.lineTo(50,-40);ctx.lineTo(78,-18);ctx.stroke();ctx.fillStyle="#6e5432";ctx.beginPath();ctx.moveTo(70,-25);ctx.lineTo(91,-16);ctx.lineTo(75,-3);ctx.closePath();ctx.fill();}
    else if(p.type==="plazatree"){ctx.fillStyle="rgba(0,0,0,.16)";ctx.beginPath();ctx.ellipse(0,15,24,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#6a5140";ctx.fillRect(-4,-32,8,50);ctx.fillStyle="#507044";for(const q of [[-12,-35,18],[12,-38,20],[0,-55,22]]){ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,Math.PI*2);ctx.fill();}}
    else if(p.type==="plaza"){ctx.fillStyle="rgba(232,233,228,.5)";roundRect(ctx,-190,-70,380,140,16);ctx.fill();for(let i=-160;i<=160;i+=40){ctx.strokeStyle="rgba(110,115,112,.18)";ctx.beginPath();ctx.moveTo(i,-70);ctx.lineTo(i,70);ctx.stroke();}for(let i=0;i<8;i++){const x=-140+i*40;ctx.fillStyle=i%2?"#48535c":"#7a6a5d";ctx.beginPath();ctx.arc(x,5+(i%3)*10,5,0,Math.PI*2);ctx.fill();}}
    else if(p.type==="npc")drawActor(0,0,p.role==="owner"?"ranger":"farmer",0,p.name,true);
    else if(p.type==="pit"){const r=p.r||28;drawExcavationProfile(r*2,r*1.1,p.x+p.y,{lip:"#a27a4f",wall:"#775035",deep:"#251b14",line:"#d0ad7d"});}
    else if(p.type==="sign"){ctx.fillStyle="#744e2f";ctx.fillRect(-4,-30,8,50);ctx.fillStyle="#d5c49d";roundRect(ctx,-42,-52,84,28,5);ctx.fill();ctx.fillStyle="#3f3427";ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.fillText(p.text||"",0,-34);}
    else if(p.type==="lamp"){ctx.fillStyle="#3c4344";ctx.fillRect(-3,-55,6,70);ctx.fillStyle="#ffe6a0";ctx.beginPath();ctx.arc(0,-57,8,0,Math.PI*2);ctx.fill();}
    else if(p.type==="bridge"){ctx.fillStyle="#4f6f78";roundRect(ctx,-115,-28,230,56,16);ctx.fill();ctx.strokeStyle="#a8cad0";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,25,105,Math.PI,0);ctx.stroke();}
    else if(p.type==="slavie"){
      ctx.fillStyle="rgba(0,0,0,.24)";ctx.beginPath();ctx.ellipse(0,68,220,28,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#e9ebe6";ctx.beginPath();ctx.moveTo(-215,-110);ctx.lineTo(-78,-110);ctx.lineTo(-78,52);ctx.lineTo(-215,52);ctx.closePath();ctx.fill();
      ctx.fillStyle="#ffffff";ctx.beginPath();ctx.moveTo(-215,-110);ctx.lineTo(-50,-110);ctx.lineTo(-20,-88);ctx.lineTo(-20,52);ctx.lineTo(-215,52);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(168,215,220,.58)";ctx.beginPath();ctx.moveTo(-205,-4);ctx.lineTo(-40,-4);ctx.lineTo(-40,46);ctx.lineTo(-205,46);ctx.closePath();ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.65)";ctx.lineWidth=2;for(let x=-190;x<-45;x+=22){ctx.beginPath();ctx.moveTo(x,-4);ctx.lineTo(x,46);ctx.stroke();}
      ctx.fillStyle="#d8d6cf";ctx.beginPath();ctx.moveTo(-10,-82);ctx.lineTo(178,-82);ctx.lineTo(178,52);ctx.lineTo(-10,52);ctx.closePath();ctx.fill();
      ctx.fillStyle="#c6c4bd";ctx.beginPath();ctx.moveTo(178,-82);ctx.lineTo(198,-70);ctx.lineTo(198,52);ctx.lineTo(178,52);ctx.closePath();ctx.fill();
      ctx.strokeStyle="#9b9b98";ctx.lineWidth=3;ctx.strokeRect(-10,-82,188,134);
      ctx.fillStyle="#ece7df";ctx.beginPath();ctx.moveTo(-16,-82);ctx.lineTo(84,-138);ctx.lineTo(188,-82);ctx.closePath();ctx.fill();ctx.strokeStyle="#a5a5a2";ctx.stroke();
      ctx.strokeStyle="#9d9d9a";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-4,-56);ctx.lineTo(172,-56);ctx.moveTo(-4,-18);ctx.lineTo(172,-18);ctx.stroke();
      ctx.fillStyle="#4a5962";for(let yy=-70;yy<26;yy+=38)for(let xx=12;xx<=150;xx+=34){roundRect(ctx,xx-8,yy,16,24,3);ctx.fill();}
      ctx.fillStyle="#43382f";roundRect(ctx,72,8,30,44,3);ctx.fill();
      ctx.fillStyle="#f5f5f2";ctx.beginPath();ctx.moveTo(-65,-104);ctx.lineTo(-35,-104);ctx.lineTo(-35,-138);ctx.lineTo(-65,-138);ctx.closePath();ctx.fill();
      ctx.fillStyle="#2d6b4b";roundRect(ctx,-55,-127,104,18,5);ctx.fill();ctx.fillStyle="#edf7f0";ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.fillText("NA ZELENÉ VLNĚ",-3,-114);
      ctx.fillStyle="#ecebe7";ctx.beginPath();ctx.moveTo(-8,52);ctx.lineTo(182,52);ctx.lineTo(198,64);ctx.lineTo(8,64);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  function drawActor(x,y,type,angle=0,name="",local=false){
    ctx.save(); if(!local)ctx.translate(x,y); ctx.rotate(angle||0);
    const styles = {
      farmer:{coat:"#8a6a48",trim:"#be9864",pants:"#314049",skin:"#cb946e",hair:"#6d5232",hat:"#8d7449",accent:"#d5c29e"},
      ranger:{coat:"#446749",trim:"#78a06e",pants:"#2a3940",skin:"#c9936d",hair:"#33412f",hat:"#223628",accent:"#dbe7cf"},
      police:{coat:"#355f88",trim:"#5e8fbe",pants:"#273742",skin:"#cb9470",hair:"#24394d",hat:"#21384b",accent:"#d7e9f8"},
      digger:{coat:"#6e3a35",trim:"#ad6659",pants:"#352a30",skin:"#bb815e",hair:"#302624",hat:"#2b2524",accent:"#efd1b8"},
      rival:{coat:"#764840",trim:"#bf8374",pants:"#38292b",skin:"#c28964",hair:"#302624",hat:"#2b2524",accent:"#ffd7c9"},
      player:{coat:"#55966a",trim:"#a5ddb8",pants:"#30434c",skin:"#d49d78",hair:"#183526",hat:"#215239",accent:"#f5fff8"}
    };
    const s = styles[type] || styles.farmer;
    const t = performance.now()*0.008 + (x+y)*0.002;
    const walk = type==="player" ? Math.sin(player.step*1.1) : (local?Math.sin(t)*.15:Math.sin(t)*.65);
    const bob = Math.abs(walk)*1.5;
    const arm = walk*5.2, leg = walk*4.6;
    ctx.translate(0,-bob);
    ctx.fillStyle="rgba(0,0,0,.24)"; ctx.beginPath(); ctx.ellipse(0,16,20,8,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=s.pants; ctx.lineWidth=8; ctx.lineCap="round"; ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(-8+leg,21); ctx.moveTo(5,0); ctx.lineTo(8-leg,21); ctx.stroke();
    ctx.strokeStyle="#1f2529"; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-8+leg,21); ctx.lineTo(-10+leg,24); ctx.moveTo(8-leg,21); ctx.lineTo(10-leg,24); ctx.stroke();
    ctx.fillStyle=s.coat; roundRect(ctx,-16,-28,32,34,10); ctx.fill(); ctx.fillStyle=s.trim; roundRect(ctx,-12,-24,24,20,8); ctx.fill(); ctx.fillStyle=s.accent; roundRect(ctx,-4,-24,8,30,4); ctx.fill();
    ctx.strokeStyle=s.coat; ctx.lineWidth=4.5; ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(0,4); ctx.stroke();
    ctx.strokeStyle=s.trim; ctx.lineWidth=5.5; ctx.beginPath(); ctx.moveTo(-13,-18); ctx.lineTo(-18-arm,-2); ctx.moveTo(13,-18); ctx.lineTo(18+arm,-2); ctx.stroke();
    ctx.fillStyle=s.skin; ctx.beginPath(); ctx.arc(-18-arm,-2,3.2,0,Math.PI*2); ctx.arc(18+arm,-2,3.2,0,Math.PI*2); ctx.fill();
    if(type==="player"||type==="rival"||type==="digger"){ctx.fillStyle="#6e4e32"; roundRect(ctx,-10,-23,20,20,5); ctx.fill();}
    ctx.fillStyle=s.skin; ctx.fillRect(-3,-31,6,5); ctx.beginPath(); ctx.arc(0,-41,11.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=s.hair; ctx.beginPath(); ctx.arc(0,-45,11.5,Math.PI,0); ctx.fill();
    ctx.fillStyle=s.hat; roundRect(ctx,-13,-52,26,8,4); ctx.fill(); if(type!=="player"){ctx.fillRect(-8,-55,16,4);} else {ctx.fillRect(-7,-54,14,4);}
    ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(-4.2,-41,1.8,0,Math.PI*2); ctx.arc(4.2,-41,1.8,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#1a1a1a"; ctx.beginPath(); ctx.arc(-4.2,-41,0.8,0,Math.PI*2); ctx.arc(4.2,-41,0.8,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="rgba(83,53,35,.75)"; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-4,-35); ctx.quadraticCurveTo(0,-32,4,-35); ctx.stroke();
    if(type==="rival"||type==="digger"||type==="player"){ctx.strokeStyle="#8a623a"; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(14,-18); ctx.lineTo(23,18); ctx.stroke();}
    ctx.restore();
  }
  function drawPlayer(){
    ctx.save();ctx.translate(player.x,player.y);const blink=player.invuln>0&&Math.floor(player.invuln*10)%2===0;ctx.globalAlpha=blink?.4:1;
    if(world?.theme==="night"){const glow=ctx.createRadialGradient(0,-18,7,0,-18,70);glow.addColorStop(0,"rgba(210,255,228,.42)");glow.addColorStop(1,"rgba(210,255,228,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,-18,70,0,Math.PI*2);ctx.fill();}
    ctx.scale(player.facing,1);
    drawHeroVisual();
    ctx.restore();
  }

  // A three-direction articulated character: the body changes pose instead of rotating like a vehicle.
  function drawHeroVisual(){
    const pose=player.pose||"front",back=pose==="back",side=pose==="side";
    const phase=player.moving?player.step*1.08:player.animTime*1.8;
    const stride=player.moving?Math.sin(phase)*player.speedRatio:Math.sin(phase)*.04;
    const breathe=Math.sin(player.animTime*2.1),bob=player.moving?Math.abs(Math.cos(phase))*1.8*player.speedRatio:breathe*.45;
    const leftLift=player.moving?Math.max(0,Math.cos(phase))*2.5*player.speedRatio:0;
    const rightLift=player.moving?Math.max(0,-Math.cos(phase))*2.5*player.speedRatio:0;
    ctx.fillStyle="rgba(0,0,0,.3)";ctx.beginPath();ctx.ellipse(0,18,24-player.speedRatio*2,9-player.speedRatio,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(0,-bob);

    // A compact field shovel and bedroll create a recognisable collector silhouette
    // without adding a handheld detector to the character.
    ctx.strokeStyle="#81603d";ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-16,-31);ctx.lineTo(-23,16);ctx.stroke();
    ctx.fillStyle="#9da9a0";ctx.beginPath();ctx.moveTo(-28,14);ctx.lineTo(-18,14);ctx.lineTo(-20,24);ctx.lineTo(-27,22);ctx.closePath();ctx.fill();
    if(!back){ctx.fillStyle="#244d40";roundRect(ctx,-21,-31,14,32,6);ctx.fill();ctx.fillStyle="#d0ad68";roundRect(ctx,-22,-32,16,7,3);ctx.fill();}

    // Two-segment legs lift and plant independently, giving a real walking cadence.
    const hipSpread=side?3:6,leftFootX=-hipSpread+stride*7,rightFootX=hipSpread-stride*7;
    const leftKneeX=-hipSpread+stride*3,rightKneeX=hipSpread-stride*3;
    ctx.lineCap="round";ctx.strokeStyle="#34484d";ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(-hipSpread,1);ctx.lineTo(leftKneeX,11-leftLift*.35);ctx.lineTo(leftFootX,22-leftLift);ctx.moveTo(hipSpread,1);ctx.lineTo(rightKneeX,11-rightLift*.35);ctx.lineTo(rightFootX,22-rightLift);ctx.stroke();
    ctx.strokeStyle="#17252a";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(leftFootX-2,22-leftLift);ctx.lineTo(leftFootX+5,23-leftLift);ctx.moveTo(rightFootX-2,22-rightLift);ctx.lineTo(rightFootX+5,23-rightLift);ctx.stroke();
    ctx.strokeStyle="#80a993";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(leftFootX-2,19-leftLift);ctx.lineTo(leftFootX+3,19-leftLift);ctx.moveTo(rightFootX-2,19-rightLift);ctx.lineTo(rightFootX+3,19-rightLift);ctx.stroke();

    const jacket=ctx.createLinearGradient(-18,-24,18,4);jacket.addColorStop(0,"#4d9a78");jacket.addColorStop(.55,"#32745e");jacket.addColorStop(1,"#1f5749");
    ctx.fillStyle=jacket;roundRect(ctx,side?-14:-18,-31+breathe*.25,side?28:36,37,11);ctx.fill();
    ctx.strokeStyle="rgba(201,239,202,.3)";ctx.lineWidth=1.4;ctx.stroke();
    ctx.fillStyle="#173f36";roundRect(ctx,side?-10:-14,-25,side?20:28,26,8);ctx.fill();

    if(back){
      ctx.fillStyle="#2a5a49";roundRect(ctx,-14,-27,28,28,7);ctx.fill();ctx.strokeStyle="#91b99a";ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle="#3e7659";roundRect(ctx,-10,-13,20,11,4);ctx.fill();ctx.fillStyle="#d0ad68";roundRect(ctx,-15,-31,30,7,3);ctx.fill();
      ctx.strokeStyle="#b8d5b9";ctx.beginPath();ctx.moveTo(-10,-25);ctx.lineTo(10,-4);ctx.moveTo(10,-25);ctx.lineTo(-10,-4);ctx.stroke();
    }else{
      ctx.fillStyle="#b9e5b8";roundRect(ctx,-3,-25,6,29,3);ctx.fill();
      ctx.strokeStyle="#d8efcb";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-25);ctx.lineTo(13,5);ctx.stroke();
      ctx.fillStyle="#d9efca";roundRect(ctx,7,-10,8,9,2);ctx.fill();ctx.fillStyle="#1c4439";ctx.fillRect(10,-8,2,5);
    }

    // Tailored fieldwear details keep the enlarged silhouette readable at game zoom.
    ctx.strokeStyle="rgba(221,244,213,.55)";ctx.lineWidth=1.2;ctx.beginPath();
    ctx.moveTo(side?-9:-13,-23);ctx.lineTo(side?-9:-13,1);
    if(!side){ctx.moveTo(13,-23);ctx.lineTo(13,2);}
    ctx.stroke();
    if(!back){
      ctx.fillStyle="#d3e8bd";roundRect(ctx,side?5:-13,-8,side?7:9,8,2);ctx.fill();
      ctx.fillStyle="#264f42";roundRect(ctx,side?7:-11,-6,side?3:5,4,1);ctx.fill();
      ctx.fillStyle="#d8b65e";ctx.beginPath();ctx.arc(0,0,2.1,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#d0b66b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-15,2);ctx.lineTo(15,2);ctx.stroke();
      ctx.fillStyle="#f1d381";roundRect(ctx,-3,-1,6,5,1.5);ctx.fill();
    }

    const armSwing=stride*7;
    ctx.strokeStyle="#43896d";ctx.lineWidth=6;
    ctx.beginPath();ctx.moveTo(-13,-20);ctx.lineTo(-18-armSwing*.55,-10);ctx.lineTo(-20-armSwing,-1);ctx.moveTo(13,-20);ctx.lineTo(18+armSwing*.45,-11);ctx.lineTo(20+armSwing,-4);ctx.stroke();
    ctx.fillStyle="#d6a17d";ctx.beginPath();ctx.arc(-20-armSwing,-1,3.6,0,Math.PI*2);ctx.arc(20+armSwing,-4,3.6,0,Math.PI*2);ctx.fill();

    const scarfWave=Math.sin(player.animTime*3.2)*1.7+stride*3;
    ctx.fillStyle="#e7bb5f";roundRect(ctx,side?-10:-13,-32,side?20:26,7,3);ctx.fill();
    if(!back){ctx.beginPath();ctx.moveTo(7,-29);ctx.quadraticCurveTo(16+scarfWave,-23,12+scarfWave,-11);ctx.lineTo(7,-15);ctx.closePath();ctx.fill();}

    ctx.fillStyle="#d6a17d";ctx.fillRect(-3,-36,6,7);ctx.beginPath();ctx.arc(0,-45,12.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#17372b";ctx.beginPath();ctx.arc(0,-49,12.5,Math.PI,0);ctx.fill();ctx.fillRect(-12,-48,5,9);ctx.fillRect(7,-48,5,9);
    if(back){
      ctx.fillStyle="#17372b";ctx.beginPath();ctx.arc(0,-44,11.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#335b43";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-44,7,.15,Math.PI-.15);ctx.stroke();
    }else if(side){
      const blinking=player.animTime%4.6>4.45;ctx.strokeStyle="#1b2822";ctx.lineWidth=blinking?1.8:0;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(5,-44,blinking?2.2:2.4,blinking?.35:1.8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#17221d";ctx.beginPath();ctx.arc(5.7,-44,.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#865a40";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(10,-42);ctx.lineTo(13,-40);ctx.lineTo(9,-39);ctx.stroke();
    }else{
      const blinking=player.animTime%4.6>4.45;ctx.fillStyle="#fff";ctx.beginPath();ctx.ellipse(-4.5,-44,2.1,blinking?.35:1.8,0,0,Math.PI*2);ctx.ellipse(4.5,-44,2.1,blinking?.35:1.8,0,0,Math.PI*2);ctx.fill();if(!blinking){ctx.fillStyle="#17221d";ctx.beginPath();ctx.arc(-4.5,-44,.85,0,Math.PI*2);ctx.arc(4.5,-44,.85,0,Math.PI*2);ctx.fill();}ctx.strokeStyle="#7b4f39";ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-4,-37);ctx.quadraticCurveTo(0,-34,4,-37);ctx.stroke();
    }

    // Small face and hat accents make the hero feel authored rather than icon-like.
    if(!back){
      ctx.strokeStyle="rgba(117,72,50,.65)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-8,-40);ctx.lineTo(-6,-39);ctx.moveTo(6,-39);ctx.lineTo(8,-40);ctx.stroke();
      ctx.fillStyle="#f1c7a0";ctx.beginPath();ctx.arc(-12,-43,1.8,0,Math.PI*2);ctx.arc(12,-43,1.8,0,Math.PI*2);ctx.fill();
    }

    ctx.fillStyle="#e7c374";ctx.beginPath();ctx.ellipse(0,-56,19,5.3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#2e684e";roundRect(ctx,-12,-65,24,10,5);ctx.fill();ctx.fillStyle="#173f34";ctx.fillRect(-11,-58,22,3);
    ctx.strokeStyle="rgba(230,255,236,.42)";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-9,-63);ctx.lineTo(8,-63);ctx.stroke();
    ctx.restore();
    ctx.strokeStyle=world?.theme==="night"?"rgba(229,255,239,.7)":"rgba(255,255,255,.14)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-15,30,0,Math.PI*2);ctx.stroke();
  }
  function drawVisionCone(observer,vision,halfAngle=.57,active=false,boss=false){
    if(!vision)return; ctx.save();ctx.translate(observer.x,observer.y);ctx.rotate(observer.angle); const gradient=ctx.createRadialGradient(0,0,8,0,0,vision);
    if(active){gradient.addColorStop(0,boss?"rgba(255,242,173,.62)":"rgba(255,205,100,.46)");gradient.addColorStop(.72,"rgba(255,128,76,.12)");gradient.addColorStop(1,"rgba(255,72,61,.03)");}
    else{gradient.addColorStop(0,boss?"rgba(255,236,157,.28)":"rgba(255,213,104,.14)");gradient.addColorStop(1,"rgba(255,213,104,0)");}
    ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,vision,-halfAngle,halfAngle);ctx.closePath();ctx.fill(); ctx.strokeStyle=active?"rgba(255,93,76,.9)":boss?"rgba(255,232,151,.38)":"rgba(255,213,104,.22)";ctx.lineWidth=active?3:1.5;ctx.stroke();ctx.restore();
  }
  function drawRival(r){
    if(r.flashlight&&r.stunTimer<=0)drawVisionCone(r,r.vision,r.halfAngle,r.seesPlayer,true);
    if(r.trail)for(const t of r.trail){ctx.save();ctx.globalAlpha=clamp(t.life*1.3,0,.32);ctx.translate(t.x,t.y);ctx.scale(1.15,1.15);drawActor(0,0,"rival",r.angle,"",true);ctx.restore();}
    ctx.save();ctx.translate(r.x,r.y);const pulse=1+Math.sin(performance.now()*.012)*.06;ctx.fillStyle=r.stunTimer>0?"rgba(102,235,158,.34)":r.name==="karel"?"rgba(242,203,114,.28)":"rgba(205,91,126,.26)";ctx.beginPath();ctx.arc(0,-18,(r.stunTimer>0?44:34)*pulse,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.save();ctx.translate(r.x,r.y);const bob=r.dashTime>0?Math.sin(performance.now()*.05)*4:0;ctx.translate(0,bob);ctx.scale(r.stunTimer>0?1.16:1.28, r.stunTimer>0?1.1:1.28);drawActor(0,0,"rival",r.angle,"",true);ctx.restore();
    if(r.stunTimer>0){ctx.save();ctx.translate(r.x,r.y-62);ctx.fillStyle="#9ff3bc";ctx.font="bold 22px sans-serif";ctx.textAlign="center";ctx.fillText("✦  ✦  ✦",0,0);ctx.restore();}
    if(r.hitFlash>0){ctx.save();ctx.translate(r.x,r.y);ctx.strokeStyle=`rgba(255,138,114,${r.hitFlash*2.4})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,-8,31+r.hitFlash*14,0,Math.PI*2);ctx.stroke();ctx.restore();}
    const label=r.displayName||(r.name==="karel"?"KRYSTALOVÝ KAREL":"FETÁK FRANTA");ctx.save();ctx.translate(r.x,r.y-92);const w=Math.max(164,label.length*8.7);ctx.fillStyle="rgba(25,12,12,.9)";roundRect(ctx,-w/2,-19,w,30,10);ctx.fill();ctx.strokeStyle=r.stunTimer>0?"#89efad":r.name==="karel"?"#f2cb72":"#ff7c8a";ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle=r.stunTimer>0?"#d9ffe6":r.name==="karel"?"#ffe8b4":"#ffd4dc";ctx.textAlign="center";ctx.font="bold 17px Inter, sans-serif";ctx.fillText(label,0,2);ctx.restore();
  }

  function drawPatrol(p){
    if(p.vision)drawVisionCone(p,p.vision,p.halfAngle||.57,p.seesPlayer,false);
    if(p.type==="tractor"){
      const now=performance.now(),spin=p.wheelRotation||0,sc=p.scale||1.25,motion=p.motionRatio||0,bounce=Math.sin(p.motionPhase||0)*(.18+motion*1.05);
      ctx.save();ctx.translate(p.x,p.y+bounce);ctx.rotate(p.angle);ctx.scale(sc,sc);

      // Short dark ruts keep the machine visually tied to the Chlum soil without changing collision geometry.
      ctx.save();ctx.translate(-39,29);ctx.strokeStyle="rgba(49,34,24,.3)";ctx.lineWidth=3.2;ctx.lineCap="round";
      for(const y of [-10,10]){ctx.beginPath();ctx.moveTo(-34,y);ctx.lineTo(22,y);ctx.stroke();for(let x=-28;x<20;x+=12){ctx.beginPath();ctx.moveTo(x-4,y-3);ctx.lineTo(x+4,y+3);ctx.stroke();}}
      ctx.restore();

      ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(-2,27,54,18,0,0,Math.PI*2);ctx.fill();

      // Rear wheel is deliberately dominant, matching the readable silhouette of a compact Czech field tractor.
      const wheel=(x,y,r,hub,phase)=>{
        ctx.fillStyle="#181b19";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="#343834";ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r-3,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle="#a85736";ctx.beginPath();ctx.arc(x,y,hub+3,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#c58a61";ctx.beginPath();ctx.arc(x,y,hub,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle="rgba(36,35,31,.76)";ctx.lineWidth=2;
        for(let n=0;n<6;n++){const a=phase+n*Math.PI/3;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*hub,y+Math.sin(a)*hub);ctx.lineTo(x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5));ctx.stroke();}
      };
      wheel(-31,22,20,6,spin);wheel(29,23,14,5,-spin*1.28);

      ctx.fillStyle="#983c28";roundRect(ctx,-49,-19,79,34,8);ctx.fill();
      const hood=ctx.createLinearGradient(-48,-16,17,8);hood.addColorStop(0,"#c45a35");hood.addColorStop(.55,"#a9442d");hood.addColorStop(1,"#7f3024");
      ctx.fillStyle=hood;roundRect(ctx,-48,-17,43,18,5);ctx.fill();
      ctx.strokeStyle="rgba(247,186,130,.35)";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-42,-12);ctx.lineTo(-10,-12);ctx.stroke();
      ctx.fillStyle="#6d2b22";for(let x=-40;x<-12;x+=7)ctx.fillRect(x,-6,4,2);

      ctx.fillStyle="#743124";roundRect(ctx,-12,-27,38,38,7);ctx.fill();
      ctx.fillStyle="#263f48";roundRect(ctx,-8,-43,32,29,5);ctx.fill();
      const glass=ctx.createLinearGradient(-7,-41,20,-18);glass.addColorStop(0,"rgba(224,241,239,.5)");glass.addColorStop(1,"rgba(93,132,141,.35)");
      ctx.fillStyle=glass;roundRect(ctx,-5,-39,12,18,2);ctx.fill();roundRect(ctx,10,-39,10,18,2);ctx.fill();
      ctx.strokeStyle="rgba(12,28,31,.7)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(8,-40);ctx.lineTo(8,-19);ctx.stroke();

      ctx.fillStyle="#2a2b28";roundRect(ctx,24,-38,5,31,2);ctx.fill();
      ctx.fillStyle="#343530";ctx.beginPath();ctx.ellipse(26,-40,5,2.4,0,0,Math.PI*2);ctx.fill();
      const smoke=Math.max(0,Math.sin(now*.004+p.x*.02));
      ctx.fillStyle=`rgba(82,82,76,${.05+smoke*.07})`;ctx.beginPath();ctx.arc(29,-49-smoke*4,5+smoke*2,0,Math.PI*2);ctx.fill();

      ctx.fillStyle="#ead595";ctx.beginPath();ctx.arc(34,-4,5.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(255,239,174,.18)";ctx.beginPath();ctx.arc(37,-4,12,0,Math.PI*2);ctx.fill();

      if(motion>.05){const spray=.45+.55*Math.sin((p.motionPhase||0)*1.7);ctx.fillStyle=`rgba(174,126,77,${.12+spray*.1})`;for(const x of [-42,-28,38]){ctx.beginPath();ctx.ellipse(x,30+Math.sin((p.motionPhase||0)+x)*2,2+spray*2,1.2,0,0,Math.PI*2);ctx.fill();}}

      ctx.strokeStyle="#6f2a20";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-5,11);ctx.lineTo(20,11);ctx.stroke();
      ctx.fillStyle="#d8c09a";roundRect(ctx,-1,-4,11,8,2);ctx.fill();
      ctx.restore();return;
    }
    if(p.type==="car"||p.type==="bike"){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
      if(p.type==="car"){
        ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.ellipse(0,11,28,12,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#87443f";roundRect(ctx,-26,-14,52,28,9);ctx.fill();
        ctx.fillStyle="#293f48";roundRect(ctx,-10,-18,24,13,5);ctx.fill();
        ctx.fillStyle="#f2d58e";ctx.fillRect(20,-6,5,5);
      }else{
        ctx.strokeStyle="#25383e";ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(-11,9,9,0,Math.PI*2);ctx.arc(11,9,9,0,Math.PI*2);ctx.stroke();
        ctx.strokeStyle="#607a83";ctx.beginPath();ctx.moveTo(-11,9);ctx.lineTo(0,-4);ctx.lineTo(11,9);ctx.moveTo(0,-4);ctx.lineTo(0,-15);ctx.stroke();
        ctx.fillStyle="#d4a578";ctx.beginPath();ctx.arc(0,-11,7,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();return;
    }
    drawActor(p.x,p.y,p.type,p.angle,p.type);
  }

  function drawItem(i){
    ctx.save();ctx.translate(i.x,i.y);const bob=Math.sin(performance.now()*.005+i.x)*4;
    if(i.type==="stone"||i.type==="sample"){
      ctx.translate(0,bob*.45);
      const isSample=i.type==="sample",pulse=.5+.5*Math.sin(performance.now()*.004+i.x*.013);
      ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(1,10,17,6,0,0,Math.PI*2);ctx.fill();
      const aura=ctx.createRadialGradient(0,0,3,0,0,25);aura.addColorStop(0,isSample?"rgba(132,188,137,.18)":"rgba(114,180,133,.22)");aura.addColorStop(1,"rgba(74,142,97,0)");ctx.fillStyle=aura;ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();
      const variant=i.visualVariant||0;
      const samplePalettes=[["#b5c98e","#6f9568","#41644e"],["#c6b681","#8a8652","#4a5c3d"],["#9bb7a0","#5f8d78","#315646"],["#a8bf78","#688554","#344f3e"]];
      const stonePalettes=[["#8fb56e","#4e8458","#316244"],["#b7a56e","#7c8150","#42583c"],["#7fb39b","#4a836a","#285844"],["#9aaa61","#5f7847","#304f39"]];
      const palette=(isSample?samplePalettes:stonePalettes)[variant];
      const gem=ctx.createLinearGradient(-10,-12,11,12);gem.addColorStop(0,palette[0]);gem.addColorStop(.28,palette[1]);gem.addColorStop(.68,palette[2]);gem.addColorStop(1,"#193c2f");
      const shapeScale=[[1,.92],[.84,1.08],[1.12,.82],[.94,1.02]][variant],shapeAngle=[-.12,.08,.18,-.04][variant];
      ctx.save();ctx.rotate(shapeAngle);ctx.scale(shapeScale[0],shapeScale[1]);
      ctx.fillStyle=gem;gemPathVariant(variant,0,0,14);ctx.fill();
      ctx.strokeStyle=isSample?"rgba(211,224,170,.7)":"rgba(189,222,170,.7)";ctx.lineWidth=1.4;gemPathVariant(variant,0,0,14);ctx.stroke();ctx.restore();
      ctx.fillStyle=`rgba(235,248,206,${.28+pulse*.24})`;ctx.beginPath();ctx.moveTo(-5+variant,-9);ctx.lineTo(2,-11+variant*.5);ctx.lineTo(-1,-3);ctx.closePath();ctx.fill();
      ctx.strokeStyle=`rgba(164,215,155,${.25+pulse*.25})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,19+pulse*3,0,Math.PI*2);ctx.stroke();
    }else if(i.type==="clue"){
      ctx.fillStyle="#74adff";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d6e7ff";ctx.lineWidth=3;ctx.stroke();
    }else if(i.type==="paper"){
      ctx.fillStyle="#e7dfbd";ctx.rotate(-.12);ctx.fillRect(-14,-18,28,36);ctx.strokeStyle="#607b8f";ctx.strokeRect(-14,-18,28,36);ctx.fillStyle="#6f8798";ctx.fillRect(-8,-8,16,3);ctx.fillRect(-8,0,14,3);
    }else if(i.type==="hole"){
      ctx.rotate(i.angle||0);const w=i.w||82,h=i.h||44;
      drawExcavationProfile(w,h,i.x+i.y,{lip:"#a97b4d",wall:"#704a31",deep:"#17120e",line:"#dab17b",material:"dark"},true);
    }
    ctx.restore();
  }

  function drawHotspot(h){
    ctx.save();ctx.translate(h.x,h.y);const pulse=1+Math.sin(performance.now()*.006+h.x)*.08;ctx.scale(pulse,pulse);ctx.rotate(h.angle||0);
    ctx.strokeStyle=h.special?"#f2cb72":"#72e5a1";ctx.lineWidth=3;ctx.setLineDash([7,6]);
    if(h.needsFill||h.special==="hedgehog"){
      const w=h.w||82,hh=h.h||44;
      ctx.fillStyle=h.special?"rgba(242,203,114,.15)":"rgba(114,229,161,.11)";organicPitPath(ctx,w+16,hh+13,h.x+h.y,.1);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle=h.special?"rgba(255,231,164,.72)":"rgba(177,245,205,.72)";ctx.lineWidth=1.7;organicPitPath(ctx,w*.72,hh*.58,h.x-h.y,.08);ctx.stroke();
      ctx.fillStyle=h.special?"rgba(255,222,132,.32)":"rgba(151,228,177,.25)";for(let n=0;n<6;n++){const a=n/6*Math.PI*2+(h.x%19)*.03;ctx.beginPath();ctx.arc(Math.cos(a)*w*.42,Math.sin(a)*hh*.4,1.7+n%2,0,Math.PI*2);ctx.fill();}
      if(h.special){ctx.fillStyle="#f4d37f";ctx.font="bold 15px sans-serif";ctx.textAlign="center";ctx.fillText("JEŽKOVÝ PROFIL",0,-hh/2-12);}
    }else{
      ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=h.special?"rgba(242,203,114,.12)":"rgba(114,229,161,.1)";ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  function drawExit(e){ctx.save();ctx.translate(e.x,e.y);const pulse=1+Math.sin(performance.now()*.004)*.08;ctx.scale(pulse,pulse);ctx.fillStyle=goalComplete()?"rgba(99,228,155,.19)":"rgba(255,255,255,.05)";ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=goalComplete()?"#63e49b":"rgba(255,255,255,.25)";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText(e.label,0,4);ctx.restore();}
  function drawEffects(){
    if(scanPulse>0){
      const radius=260+state.perks.scanner*55,fade=clamp(1-scanPulse,0,1),ang=player.angle-Math.PI+scanPulse*Math.PI*2;
      ctx.save();ctx.translate(player.x,player.y);

      // Full circular range rings establish the detector as a radar; the gameplay radius is unchanged.
      ctx.setLineDash([5,8]);ctx.lineWidth=1.2;
      for(const [ratio,alpha] of [[.34,.2],[.62,.16],[.9,.12]]){ctx.strokeStyle=`rgba(157,231,179,${fade*alpha})`;ctx.beginPath();ctx.arc(0,0,radius*ratio,0,Math.PI*2);ctx.stroke();}
      ctx.setLineDash([]);

      const center=ctx.createRadialGradient(0,0,2,0,0,34);center.addColorStop(0,`rgba(218,255,221,${fade*.42})`);center.addColorStop(1,"rgba(109,217,145,0)");ctx.fillStyle=center;ctx.beginPath();ctx.arc(0,0,34,0,Math.PI*2);ctx.fill();

      ctx.save();ctx.rotate(ang);
      const sweep=ctx.createRadialGradient(0,0,18,0,0,radius);sweep.addColorStop(0,`rgba(124,228,158,${fade*.08})`);sweep.addColorStop(.55,`rgba(105,219,145,${fade*.14})`);sweep.addColorStop(1,"rgba(87,197,126,0)");
      ctx.fillStyle=sweep;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,-.42,.42);ctx.closePath();ctx.fill();
      ctx.strokeStyle=`rgba(188,246,199,${fade*.72})`;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(radius*.94,0);ctx.stroke();
      ctx.strokeStyle=`rgba(143,234,169,${fade*.68})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,radius*.78,-.42,.42);ctx.stroke();
      ctx.restore();

      // Revealed targets briefly read as subdued radar blips, without exposing still-hidden items.
      for(const item of world.items){if(!item.active||item.hidden||dist(player,item)>radius)continue;const dx=item.x-player.x,dy=item.y-player.y,r=6+Math.sin(performance.now()*.008+item.x)*1.5;ctx.strokeStyle=`rgba(207,246,190,${fade*.65})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(117,202,133,${fade*.22})`;ctx.beginPath();ctx.arc(dx,dy,2.2,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
    // A short, localized ping makes the reveal readable without exposing hidden targets early.
    for(const ping of world.radarPings||[]){const progress=1-ping.life/ping.maxLife,alpha=clamp(ping.life/ping.maxLife,0,1),radius=8+progress*34;ctx.save();ctx.translate(ping.x,ping.y);ctx.strokeStyle=ping.kind==="profile"?`rgba(242,203,114,${alpha*.78})`:`rgba(168,239,176,${alpha*.82})`;ctx.lineWidth=ping.kind==="profile"?2.4:1.8;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();ctx.fillStyle=ping.kind==="profile"?`rgba(242,203,114,${alpha*.2})`:`rgba(129,225,151,${alpha*.24})`;ctx.beginPath();ctx.arc(0,0,4+progress*2,0,Math.PI*2);ctx.fill();ctx.restore();}
    for(const h of world.hazards){ctx.fillStyle="#7b5635";ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();}for(const p of world.particles){ctx.globalAlpha=clamp(p.life*1.4,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}if(world.theme==="night"){ctx.save();const g=ctx.createRadialGradient(player.x,player.y,72,player.x,player.y,430);g.addColorStop(0,"rgba(2,7,6,0)");g.addColorStop(.58,"rgba(2,7,6,.18)");g.addColorStop(1,"rgba(2,7,6,.68)");ctx.fillStyle=g;ctx.fillRect(camera.x,camera.y,viewport.w,viewport.h);ctx.restore();
      for(const p of world.patrols)if(p.active&&p.vision)drawVisionCone(p,p.vision,p.halfAngle||.57,p.seesPlayer,false);
      if(world.rival?.active&&world.rival.flashlight&&world.rival.stunTimer<=0)drawVisionCone(world.rival,world.rival.vision,world.rival.halfAngle,world.rival.seesPlayer,true);
    }}

  function drawScreenVignette(){const g=ctx.createRadialGradient(viewport.w/2,viewport.h/2,Math.min(viewport.w,viewport.h)*.25,viewport.w/2,viewport.h/2,Math.max(viewport.w,viewport.h)*.72);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.26)");ctx.fillStyle=g;ctx.fillRect(0,0,viewport.w,viewport.h);if(world?.theme==="field"){ctx.strokeStyle="rgba(190,225,229,.15)";ctx.lineWidth=1;const t=performance.now()*.18;for(let i=0;i<28;i++){const x=(i*83+t)% (viewport.w+80)-40;const y=(i*47+t*.7)% (viewport.h+60)-30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+18);ctx.stroke();}}if(flash>0){ctx.fillStyle=`rgba(${flashColor},${flash})`;ctx.fillRect(0,0,viewport.w,viewport.h);}if(state.heat>65){const beat=.55+.45*Math.sin(performance.now()*.012);ctx.strokeStyle=`rgba(208,62,54,${(state.heat-65)/72*(.45+beat*.2)})`;ctx.lineWidth=12+beat*8;ctx.strokeRect(0,0,viewport.w,viewport.h);}}
  function drawAtmosphereOverlay(){
    if(!world)return;
    const palette={
      field:"126,104,78",meadow:"106,126,82",forest:"91,106,73",night:"30,48,43",city:"92,106,106"
    };
    const alpha=world.theme==="night"?.13:.045;
    ctx.fillStyle=`rgba(${palette[world.theme]||palette.field},${alpha})`;
    ctx.fillRect(0,0,viewport.w,viewport.h);
    const glow={
      field:{x:viewport.w*.18,y:viewport.h*.08,color:"255,224,164",strength:.16},
      meadow:{x:viewport.w*.24,y:viewport.h*.12,color:"242,232,184",strength:.12},
      forest:{x:viewport.w*.72,y:viewport.h*.1,color:"190,224,177",strength:.08},
      night:{x:viewport.w*.82,y:viewport.h*.12,color:"174,215,226",strength:.16},
      city:{x:viewport.w*.78,y:viewport.h*.18,color:"206,235,229",strength:.1}
    }[world.theme]||null;
    if(glow){
      const radius=Math.max(viewport.w,viewport.h)*.82;
      const light=ctx.createRadialGradient(glow.x,glow.y,0,glow.x,glow.y,radius);
      light.addColorStop(0,`rgba(${glow.color},${glow.strength})`);
      light.addColorStop(.36,`rgba(${glow.color},${glow.strength*.34})`);
      light.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=light;ctx.fillRect(0,0,viewport.w,viewport.h);
    }
    if(world.theme==="forest"||world.theme==="night"){
      const moteTime=reducedMotion?0:performance.now()*.00036;
      const core=world.theme==="night"?"221,246,158":"244,221,154";
      const count=Math.max(8,Math.min(14,Math.round(viewport.w/92)));
      for(let i=0;i<count;i++){
        const x=(i*173+Math.sin(moteTime*(1+i%3)+i*1.7)*44+viewport.w)%viewport.w;
        const y=(i*97+Math.cos(moteTime*(.72+i%2)+i)*28+viewport.h)%viewport.h;
        const pulse=.35+.65*(.5+.5*Math.sin(moteTime*4+i*2.2));
        ctx.fillStyle=`rgba(${core},${.035+pulse*.055})`;ctx.beginPath();ctx.arc(x,y,4+pulse*3,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=`rgba(${core},${.18+pulse*.26})`;ctx.beginPath();ctx.arc(x,y,1+pulse*.65,0,Math.PI*2);ctx.fill();
      }
    }
    const edge=ctx.createRadialGradient(viewport.w/2,viewport.h/2,Math.min(viewport.w,viewport.h)*.18,viewport.w/2,viewport.h/2,Math.max(viewport.w,viewport.h)*.74);
    edge.addColorStop(0,"rgba(0,0,0,0)"); edge.addColorStop(.72,"rgba(0,0,0,.06)"); edge.addColorStop(1,"rgba(0,0,0,.42)");
    ctx.fillStyle=edge;ctx.fillRect(0,0,viewport.w,viewport.h);
    ctx.globalAlpha=.035;
    const tick=Math.floor(performance.now()/80);
    for(let i=0;i<54;i++){const x=(i*89+tick*17)%viewport.w,y=(i*47+tick*11)%viewport.h;ctx.fillStyle=i%2?"#fff":"#000";ctx.fillRect(x,y,1,1);}
    ctx.globalAlpha=1;
  }
  function drawObjectiveArrow(){if(!world||!world.exit)return;let target=world.exit;if(!goalComplete()){const candidates=[];for(const h of world.hotspots)if(h.active&&h.revealed)candidates.push(h);for(const i of world.items)if(i.active&&!i.hidden)candidates.push(i);if(candidates.length)target=candidates.sort((a,b)=>dist(player,a)-dist(player,b))[0];}const sx=target.x-camera.x,sy=target.y-camera.y;if(sx>40&&sy>70&&sx<viewport.w-40&&sy<viewport.h-100)return;const cx=viewport.w/2,cy=viewport.h/2,ang=Math.atan2(sy-cy,sx-cx),rad=Math.min(viewport.w,viewport.h)*.38;ctx.save();ctx.translate(cx+Math.cos(ang)*rad,cy+Math.sin(ang)*rad);ctx.rotate(ang);ctx.fillStyle=goalComplete()?"#63e49b":"#f2cb72";ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-10,-9);ctx.lineTo(-10,9);ctx.closePath();ctx.fill();ctx.restore();}

  function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
  function organicPitPath(c,w,h,seed=0,roughness=.12){
    const points=[];const count=14;
    for(let n=0;n<count;n++){const angle=n/count*Math.PI*2;const wobble=1+Math.sin(seed*.017+n*2.37)*roughness+Math.cos(seed*.011+n*1.41)*roughness*.45;points.push({x:Math.cos(angle)*w*.5*wobble,y:Math.sin(angle)*h*.5*wobble});}
    const first=points[0],last=points[points.length-1];c.beginPath();c.moveTo((last.x+first.x)/2,(last.y+first.y)/2);
    for(let n=0;n<points.length;n++){const point=points[n],next=points[(n+1)%points.length];c.quadraticCurveTo(point.x,point.y,(point.x+next.x)/2,(point.y+next.y)/2);}c.closePath();
  }
  function drawExcavationProfile(w,h,seed,palette,showFill=false){
    const ground=ctx.createRadialGradient(0,h*.08,w*.18,0,h*.08,w*.75);ground.addColorStop(0,"rgba(38,25,18,.22)");ground.addColorStop(.72,"rgba(77,55,37,.12)");ground.addColorStop(1,"rgba(77,55,37,0)");ctx.fillStyle=ground;ctx.beginPath();ctx.ellipse(0,h*.08,w*.72,h*.7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(4,h*.24,w*.59,h*.5,0,0,Math.PI*2);ctx.fill();

    ctx.fillStyle=palette.lip;organicPitPath(ctx,w+28,h+21,seed,.17);ctx.fill();
    ctx.strokeStyle="rgba(235,206,164,.11)";ctx.lineWidth=2;organicPitPath(ctx,w+21,h+15,seed+13,.14);ctx.stroke();

    ctx.fillStyle=palette.wall;organicPitPath(ctx,w,h,seed+31,.12);ctx.fill();
    ctx.strokeStyle=palette.line;ctx.lineWidth=2.2;organicPitPath(ctx,w*.9,h*.8,seed+67,.1);ctx.stroke();

    // Layered wall bands read as a real soil profile rather than a flat icon.
    ctx.save();organicPitPath(ctx,w*.83,h*.7,seed+79,.09);ctx.clip();
    ctx.strokeStyle="rgba(233,202,155,.2)";ctx.lineWidth=2;
    for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(-w*.42,n*h*.12);ctx.quadraticCurveTo(0,n*h*.12+Math.sin(seed*.02+n)*4,w*.42,n*h*.1);ctx.stroke();}
    ctx.restore();

    ctx.fillStyle=palette.deep;organicPitPath(ctx,w*.68,h*.52,seed+103,.14);ctx.fill();
    const depth=ctx.createRadialGradient(-w*.12,-h*.08,1,0,0,w*.36);depth.addColorStop(0,"rgba(255,236,191,.08)");depth.addColorStop(1,"rgba(0,0,0,.28)");ctx.fillStyle=depth;organicPitPath(ctx,w*.61,h*.44,seed+127,.1);ctx.fill();
    ctx.strokeStyle="rgba(255,235,198,.14)";ctx.lineWidth=1.2;organicPitPath(ctx,w*.54,h*.36,seed+149,.08);ctx.stroke();

    for(let n=0;n<12;n++){const angle=n/12*Math.PI*2+seed*.013,spread=.5+(n%3)*.05,x=Math.cos(angle)*w*spread,y=Math.sin(angle)*h*(.43+(n%2)*.04);ctx.fillStyle=n%3?palette.wall:palette.lip;ctx.beginPath();ctx.ellipse(x,y,2.5+n%4,1.6+n%3,angle,0,Math.PI*2);ctx.fill();}
    const material=palette.material||"field";
    if(material==="sand"){ctx.strokeStyle="rgba(247,226,177,.38)";ctx.lineWidth=1.2;for(let n=-2;n<=2;n++){ctx.beginPath();ctx.moveTo(-w*.36,n*h*.13);ctx.quadraticCurveTo(0,n*h*.13+2,w*.36,n*h*.11);ctx.stroke();}}
    else if(material==="dark"){ctx.fillStyle="rgba(40,26,19,.34)";for(let n=0;n<5;n++){const x=-w*.34+n*w*.17;ctx.beginPath();ctx.ellipse(x,h*.2+(n%2)*4,5+(n%3)*2,2,0,0,Math.PI*2);ctx.fill();}}
    else{ctx.strokeStyle="rgba(92,63,39,.4)";ctx.lineWidth=1.4;for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(-w*.28+n*w*.2,-h*.24);ctx.quadraticCurveTo(-w*.1+n*w*.2,h*.02,w*.02+n*w*.2,h*.24);ctx.stroke();}}
    const profileVariant=Math.abs(Math.floor(seed))%3;
    if(profileVariant===0){ctx.strokeStyle="rgba(79,55,35,.42)";ctx.lineWidth=1.6;for(let n=0;n<4;n++){const x=-w*.34+n*w*.22;ctx.beginPath();ctx.moveTo(x,-h*.28);ctx.quadraticCurveTo(x+8,h*.02,x-3,h*.27);ctx.stroke();}}
    else if(profileVariant===1){ctx.fillStyle="rgba(214,190,145,.42)";for(let n=0;n<7;n++){const a=n/7*Math.PI*2+.35;ctx.beginPath();ctx.ellipse(Math.cos(a)*w*.36,Math.sin(a)*h*.31,2+n%3,1.4+n%2,a,0,Math.PI*2);ctx.fill();}}
    else{ctx.strokeStyle="rgba(241,216,164,.18)";ctx.lineWidth=2;for(let n=-1;n<=1;n++){ctx.beginPath();ctx.moveTo(-w*.34,n*h*.09);ctx.quadraticCurveTo(0,n*h*.09+3,w*.34,n*h*.06);ctx.stroke();}}
    if(showFill){ctx.fillStyle=palette.line;ctx.font="bold 17px sans-serif";ctx.textAlign="center";ctx.fillText("↶",0,6);}
  }
  function ellipse(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  function gemPath(x,y,r){gemPathVariant(0,x,y,r);}
  function gemPathVariant(variant,x,y,r){
    ctx.beginPath();
    if(variant===1){ctx.moveTo(x,y-r*1.15);ctx.bezierCurveTo(x+r*.82,y-r*.45,x+r*.72,y+r*.48,x,y+r*1.08);ctx.bezierCurveTo(x-r*.7,y+r*.5,x-r*.55,y-r*.35,x,y-r*1.15);}
    else if(variant===2){ctx.moveTo(x-r*.1,y-r*1.12);ctx.lineTo(x+r*.86,y-r*.25);ctx.lineTo(x+r*.38,y+r*1.02);ctx.lineTo(x-r*.62,y+r*.62);ctx.lineTo(x-r*.9,y-r*.3);}
    else if(variant===3){ctx.moveTo(x-r*.2,y-r);ctx.quadraticCurveTo(x+r*.75,y-r*.88,x+r*.92,y-r*.1);ctx.quadraticCurveTo(x+r*.72,y+r*.78,x+r*.05,y+r*1.05);ctx.quadraticCurveTo(x-r*.8,y+r*.85,x-r*.86,y);ctx.quadraticCurveTo(x-r*.72,y-r*.72,x-r*.2,y-r);}
    else{ctx.moveTo(x,y-r);ctx.lineTo(x+r*.8,y-r*.35);ctx.lineTo(x+r*.65,y+r*.7);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.75,y+r*.35);ctx.lineTo(x-r*.8,y-r*.4);}
    ctx.closePath();
  }

  function loop(now){const dt=Math.min(.035,(now-last)/1000||.016);last=now;update(dt);render();requestAnimationFrame(loop);}

  function setupControls(){
    const zone=$("moveZone"),stick=$("stick"),action=$("actionButton");let pid=null;const keys=new Set();
    const syncKeyboard=()=>{input.x=(keys.has("KeyD")||keys.has("ArrowRight")?1:0)-(keys.has("KeyA")||keys.has("ArrowLeft")?1:0);input.y=(keys.has("KeyS")||keys.has("ArrowDown")?1:0)-(keys.has("KeyW")||keys.has("ArrowUp")?1:0);};
    resetControls=()=>{if(pid!==null&&zone.hasPointerCapture?.(pid)){try{zone.releasePointerCapture(pid);}catch{}}pid=null;keys.clear();input.x=input.y=0;input.pressed=false;stopPlayerMotion();stick.style.transform="translate(-50%,-50%)";action.classList.remove("active");};
    const move=e=>{const r=zone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.33,len=Math.hypot(dx,dy)||1,s=Math.min(1,max/len),x=dx*s,y=dy*s;input.x=x/max;input.y=y/max;stick.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;};
    zone.addEventListener("pointerdown",e=>{pid=e.pointerId;zone.setPointerCapture(pid);move(e);});zone.addEventListener("pointermove",e=>{if(e.pointerId===pid)move(e);});
    const end=e=>{if(e.pointerId!==pid)return;pid=null;input.x=input.y=0;stick.style.transform="translate(-50%,-50%)";};zone.addEventListener("pointerup",end);zone.addEventListener("pointercancel",end);
    action.addEventListener("pointerdown",e=>{e.preventDefault();input.pressed=true;action.classList.add("active");haptic(8);performAction();});const stop=()=>{input.pressed=false;action.classList.remove("active");};action.addEventListener("pointerup",stop);action.addEventListener("pointercancel",stop);
    addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="Space"&&!e.repeat){if(mode==="dig")digAttempt();else performAction();}if(e.code==="Escape"&&mode==="playing"&&!e.repeat)pause();if(["KeyA","KeyD","KeyW","KeyS","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.code)){keys.add(e.code);syncKeyboard();}});
    addEventListener("keyup",e=>{keys.delete(e.code);syncKeyboard();});
    addEventListener("blur",resetControls);
  }

  function pause(){if(mode!=="playing"||theftAlertShown)return;mode="pause";audio.pauseMusic();setPlaying(false);showOnly(screens.pause);}
  function resume(){screens.pause.classList.remove("visible");mode="playing";audio.resumeMusic();setPlaying(true);last=performance.now();}
  function toMenu(){save();audio.pauseMusic();mode="menu";world=null;setPlaying(false);showOnly(screens.title);refreshContinue();}
  function showRecords(){const list=$("recordsList"),rows=getRecords();list.innerHTML="";if(!rows.length){list.innerHTML="<li><span>–</span><div>Zatím žádná dokončená výprava</div></li>";}else rows.forEach((r,i)=>{const li=document.createElement("li");li.innerHTML=`<b>${i+1}.</b><div><strong>${escapeHtml(r.title)}</strong><small>${r.stones} kamenů · ${new Date(r.date).toLocaleDateString("cs-CZ")}</small></div><strong>${Number(r.score).toLocaleString("cs-CZ")}</strong>`;list.append(li);});showOnly(screens.records);}

  function bindUI(){
    $("playButton").addEventListener("click",startNew);$("continueButton").addEventListener("click",continueGame);$("briefButton").addEventListener("click",enterLevel);
    const digButton=$("digButton");digButton.addEventListener("pointerdown",event=>{event.preventDefault();digButton.classList.add("pressed");digAttempt();});const releaseDigButton=()=>digButton.classList.remove("pressed");digButton.addEventListener("pointerup",releaseDigButton);digButton.addEventListener("pointercancel",releaseDigButton);digButton.addEventListener("pointerleave",releaseDigButton);digButton.addEventListener("click",event=>{if(event.detail===0)digAttempt();});$("realButton").addEventListener("click",()=>resolveSample(true));$("glassButton").addEventListener("click",()=>resolveSample(false));$("dialogButton").addEventListener("click",closeDialog);
    $("juryButton").addEventListener("click",judge);$("againButton").addEventListener("click",()=>{state=freshState();world=null;mode="menu";showOnly(screens.title);refreshContinue();});
    $("pauseButton").addEventListener("click",pause);$("resumeButton").addEventListener("click",resume);$("menuButton").addEventListener("click",toMenu);
    $("soundButton").addEventListener("click",()=>{state.sound=audio.toggle();$("soundButton").textContent=state.sound?"♫":"×";save();});
    $("howButton").addEventListener("click",()=>showOnly(screens.how));$("closeHowButton").addEventListener("click",()=>showOnly(screens.title));
    $("recordsButton").addEventListener("click",showRecords);$("resultRecordsButton").addEventListener("click",showRecords);$("closeRecordsButton").addEventListener("click",()=>showOnly(mode==="result"?screens.result:screens.title));
  }

  function lockPageGestures(){
    const prevent=e=>e.preventDefault();
    document.addEventListener("gesturestart",prevent,{passive:false});
    document.addEventListener("gesturechange",prevent,{passive:false});
    document.addEventListener("gestureend",prevent,{passive:false});
    document.addEventListener("touchmove",e=>{if(e.touches&&e.touches.length>1)e.preventDefault();},{passive:false});
  }

  function boot(){
    resize();lockPageGestures();setupControls();bindUI();migrateLegacySave();refreshContinue();
    const params=new URLSearchParams(location.search);
    if(params.has("new"))startNew();
    else if(params.has("help"))showOnly(screens.how);
    if(params.has("debug")){
      window.__lovecDebug={
        startLevel(index=0){state=freshState();state.levelIndex=clamp(index,0,LEVELS.length-1);generateLevel(state.levelIndex);mode="playing";showOnly(null);setPlaying(true);return {level:world.id,player:{x:player.x,y:player.y}};},
        spawnBoss(name="karel"){if(!world)return null;startRival(name,player.x+240,player.y-120);return world.rival;},
        hitBoss(){hitRival();return world?.rival?{active:world.rival.active,hits:world.rival.hits,maxHits:world.rival.maxHits,phase:world.rival.phase}:null;},
        setPlayer(x,y){player.x=x;player.y=y;return {x:player.x,y:player.y};},
        setScanCooldown(value=0){scanCooldown=Math.max(0,Number(value)||0);return scanCooldown;},
        setScanPulse(value=.45){scanPulse=clamp(Number(value)||0,0,1);return scanPulse;},
        setBossPose(x,y,angle=0){if(!world?.rival)return null;world.rival.x=x;world.rival.y=y;world.rival.angle=angle;world.rival.speed=0;world.rival.target={x,y};return {x,y,angle};},
        setHeat(value){state.heat=clamp(value,0,100);return state.heat;},
        setBossStun(value=1){if(!world?.rival)return null;world.rival.stunTimer=value;return world.rival.stunTimer;},
        triggerTheft(){if(!world)return null;showTheftAlert();startRival("karel",player.x+180,player.y-100);return {shown:theftAlertShown,boss:world.rival?.name};},
        startDigChallenge(index=2){state=freshState();state.levelIndex=clamp(index,0,LEVELS.length-1);generateLevel(state.levelIndex);mode="playing";showOnly(null);setPlaying(true);if(world.id==="nesmen")world.runtime.permit=true;const hotspot=world.hotspots.find(item=>item.active);if(!hotspot)return null;hotspot.revealed=true;startDig(hotspot);return {mode,level:world.id};},
        setDigMarker(value=digZoneCenter){digMarker=clamp(value,0,1);return digMarker;},
        setDigSpeed(value=0){digSpeed=Math.max(0,Number(value)||0);return digSpeed;},
        setDigTime(value=4){digTimeLeft=clamp(value,0,7);return digTimeLeft;},
        completeGoal(){
          if(!world)return null;
          const r=world.runtime;
          if(world.id==="chlum"){
            r.collected=6;
            while(state.stones.length<6)state.stones.push(makeStone("Chlum",state.stones.length===5?"good":"common",true));
          }else if(world.id==="locenice"){
            r.correct=5;r.real=3;r.identified=Math.max(r.identified||0,5);
          }else if(world.id==="nesmen"){
            r.permit=true;r.dug=3;r.filled=3;r.open=0;
          }else if(world.id==="besednice"){
            r.clues=3;r.hedgehog=true;r.bossStarted=true;r.bossDefeated=true;
            if(!state.stones.some(stone=>stone.rarity==="hedgehog"))state.stones.push(makeStone("Besednice","hedgehog",true,8));
          }else if(world.id==="malse"){
            r.papers=3;r.bossStarted=true;r.bossDefeated=true;
          }
          updateHUD(true);save();
          return {level:world.id,complete:goalComplete(),stones:state.stones.length};
        },
        exitCurrentLevel(){if(!world)return null;tryExit();return {mode,levelIndex:state.levelIndex};},
        digSnapshot(){return {mode,hits:digHits,speed:digSpeed,timeLeft:digTimeLeft,zoneCenter:digZoneCenter,inputLocked:performance.now()<digInputLockUntil};},
        snapshot(){return {version:APP_VERSION,mode,level:world?.id,heat:state.heat,dangerActive,theftAlertShown,input:{x:input.x,y:input.y,pressed:input.pressed},player:{x:player.x,y:player.y,angle:player.angle,facing:player.facing,pose:player.pose,vx:player.vx,vy:player.vy,speedRatio:player.speedRatio},terrainCache:{key:terrainCache.key,generated:terrainCache.generated,cached:Boolean(terrainCache.canvas),scale:terrainCache.scale},world:world?{hotspots:world.hotspots.filter(h=>h.active).length,stones:world.items.filter(i=>i.active&&i.type==="stone").length,surfaceHidden:world.items.filter(i=>i.active&&i.hidden&&(i.type==="stone"||i.type==="sample")).length,surfaceVisible:world.items.filter(i=>i.active&&!i.hidden&&(i.type==="stone"||i.type==="sample")).length}:null,state:{levelIndex:state.levelIndex,stones:state.stones.length,score:state.score},boss:world?.rival?{name:world.rival.name,active:world.rival.active,hits:world.rival.hits,maxHits:world.rival.maxHits,phase:world.rival.phase,stunTimer:world.rival.stunTimer,dashTime:world.rival.dashTime,graceTimer:world.rival.graceTimer}:null};}
      };
    }
    addEventListener("resize",()=>requestAnimationFrame(resize));
    addEventListener("orientationchange",()=>setTimeout(resize,120));
    visualViewport?.addEventListener("resize",()=>requestAnimationFrame(resize));
    document.addEventListener("visibilitychange",()=>{if(document.hidden){resetControls();if(mode==="playing")pause();}});
    if("serviceWorker" in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
    requestAnimationFrame(loop);
  }
  try{boot();}catch(error){console.error(error);$("playButton").disabled=true;$("playButton").innerHTML="<span>CHYBA SPUŠTĚNÍ</span><small>obnov stránku</small>";}
})();
