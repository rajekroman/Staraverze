(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
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

  const SAVE_KEY = "lovecVltavinuRebornSaveV5_2";
  const RECORD_KEY = "lovecVltavinuRebornRecordsV5_2";
  const LEGACY_SAVE_KEYS = ["lovecVltavinuRebornSaveV5_1","lovecVltavinuRebornSaveV5_0","lovecVltavinuRebornSaveV4_9","lovecVltavinuRebornSaveV4_8","lovecVltavinuRebornSaveV4_7","lovecVltavinuRebornSaveV4_6","lovecVltavinuRebornSaveV4_5"];
  const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window || matchMedia("(pointer: coarse)").matches;
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
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[ch]);

  const LEVELS = [
    {
      id: "chlum", name: "Chlum", title: "Chlum po bouřce", theme: "field",
      text: "Promluv s Václavem, získej souhlas a projdi čerstvě rozorané pole. Najdi první pravé vltavíny, než pole znovu projede technika.",
      why: "Bez silného začátku nebudeš mít co vystavit. Tahle lokalita má odstartovat tvou sbírku pro akci Na zelené vlně.",
      goal: "Promluv s Václavem a odnes 4 pravé kameny.", music: "field"
    },
    {
      id: "locenice", name: "Ločenice", title: "Písčitá hrana", theme: "meadow",
      text: "Projdi borový les na písčitém podloží. Vzorky vypadají podobně, ale jen část z nich jsou skutečné vltavíny.",
      why: "Potřebuješ rozšířit sbírku o ověřené kusy. Ločenice prověří oko sběratele, ne jen rychlost pohybu.",
      goal: "Správně urči 5 vzorků a najdi 3 pravé kusy.", music: "meadow"
    },
    {
      id: "nesmen", name: "Nesměň", title: "Lesní profily", theme: "forest",
      text: "V lese jsou povolené jen čisté obdélníkové profily. Vykopej je, seber nález a po sobě vše zase pečlivě zahrab.",
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
      version:"5.1.0", levelIndex:0, score:0, stones:[], heat:0, combo:1, comboTimer:0, caught:0,
      perks:{boots:0,scanner:0,shovel:0,quiet:0,case:0,eye:0}, stats:{digs:0,correct:0,misses:0,rare:0}, sound:true
    };
  }

  let state = freshState();
  let mode = "menu";
  let viewport = {w:innerWidth,h:innerHeight,dpr:1};
  let world = null;
  let player = {x:0,y:0,r:17,angle:0,step:0,invuln:0};
  let camera = {x:0,y:0};
  let input = {x:0,y:0,pressed:false};
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
  let theftAlertTimer = 0;
  let theftAlertShown = false;

  function save() { storage.set(SAVE_KEY, JSON.stringify(state)); refreshContinue(); }
  function load() {
    try {
      const data=JSON.parse(storage.get(SAVE_KEY)||"null");
      if(!data || !Array.isArray(data.stones)) return false;
      state={...freshState(),...data,perks:{...freshState().perks,...(data.perks||{})},stats:{...freshState().stats,...(data.stats||{})}};
      audio.enabled=state.sound!==false; return true;
    } catch { return false; }
  }
  function refreshContinue(){ $("continueButton").classList.toggle("hidden",!storage.get(SAVE_KEY)); }
  function getRecords(){try{return JSON.parse(storage.get(RECORD_KEY)||"[]");}catch{return[];}}
  function addRecord(score,title){const rows=getRecords();rows.push({score,title,stones:state.stones.length,date:new Date().toISOString()});rows.sort((a,b)=>b.score-a.score);storage.set(RECORD_KEY,JSON.stringify(rows.slice(0,10)));}

  function showOnly(screen){Object.values(screens).forEach(s=>s.classList.remove("visible"));if(screen)screen.classList.add("visible");}
  function setPlaying(on){hud.classList.toggle("hidden",!on);controls.classList.toggle("hidden",!on||!isTouch);app.classList.toggle("playing",on);}
  function haptic(pattern=12){try{navigator.vibrate?.(pattern);}catch{}}
  function toast(text,type="",duration=1500){clearTimeout(toastTimer);ui.toast.textContent=text;ui.toast.className=`toast show ${type}`;toastTimer=setTimeout(()=>ui.toast.className="toast",duration);}
  function showTheftAlert(){
    theftAlertTimer=2.15;
    theftAlertShown=true;
    ui.theftAlert?.classList.remove("hidden");
    requestAnimationFrame(()=>{if(theftAlertShown)ui.theftAlert?.classList.add("show");});
    flash=.32;flashColor="255,54,48";shake=Math.max(shake,16);haptic([70,35,90,40,120]);audio.sfx("boss");
  }
  function hideTheftAlert(){
    if(!theftAlertShown)return;
    theftAlertShown=false;
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
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;
  }

  function addProp(type,x,y,o={}){world.props.push({type,x,y,...o});}
  function addObstacle(x,y,w,h,o={}){world.obstacles.push({x,y,w,h,...o});}
  function addHotspot(x,y,o={}){const profile=Boolean(o.needsFill||o.special==="hedgehog");world.hotspots.push({x,y,r:profile?42:24,w:profile?74:0,h:profile?42:0,angle:profile?rand(-.22,.22):0,revealed:Boolean(o.revealed),active:true,ttl:0,...o});}
  function addItem(type,x,y,o={}){world.items.push({type,x,y,r:20,active:true,...o});}
  function addPatrol(type,points,o={}){const p=points[0];world.patrols.push({type,x:p.x,y:p.y,points,index:1,speed:o.speed||80,vision:o.vision||180,angle:0,active:true,...o});}

  function generateLevel(index){
    const level=LEVELS[index];
    world={id:level.id,theme:level.theme,w:1800,h:1200,props:[],obstacles:[],hotspots:[],items:[],patrols:[],hazards:[],particles:[],exit:null,runtime:{},rain:level.theme==="field"?1:0};
    if(level.id==="chlum") generateChlum();
    if(level.id==="locenice") generateLocenice();
    if(level.id==="nesmen") generateNesmen();
    if(level.id==="besednice") generateBesednice();
    if(level.id==="malse") generateMalse();
    camera.x=player.x-viewport.w/2;camera.y=player.y-viewport.h/2;nearest=null;scanCooldown=0;scanPulse=0;
    state.heat=0;state.combo=1;state.comboTimer=0;audio.setTheme(level.music);updateHUD(true);
  }

  function generateChlum(){
    world.runtime={permit:false,collected:0}; player.x=360;player.y=1070;
    addProp("farm",135,1080,{scale:.82}); addProp("npc",280,990,{name:"Václav",avatar:"V",role:"farmer"});
    addProp("fieldpit",520,900,{w:190,h:72,angle:-.08});
    addProp("fieldpit",930,760,{w:245,h:88,angle:.06});
    addProp("fieldpit",1310,610,{w:210,h:76,angle:-.12});
    addProp("fieldpit",770,420,{w:170,h:64,angle:.1});
    for(let i=0;i<12;i++)addProp("soilheap",rand(260,1600),rand(240,980),{scale:rand(.65,1.2)});
    for(let i=0;i<20;i++)addProp("stubble",rand(120,1720),rand(180,1100),{scale:rand(.7,1.15)});
    for(const p of [[500,840],[820,910],[1120,760],[1440,900],[620,480],[1040,420],[1500,500]]) addHotspot(p[0],p[1],{rarity:Math.random()<.18?"rare":"common",documented:true});
    addItem("stone",440,690,{rarity:"common",documented:true}); addItem("stone",1250,640,{rarity:"good",documented:true});
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
    samples.forEach((s,i)=>addItem("sample",pts[i][0],pts[i][1],{sample:s}));
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
    if(world.id==="chlum")return r.permit?`Kameny ${r.collected}/4`:`Promluv s Václavem`;
    if(world.id==="locenice")return `Správně ${r.correct}/5 · pravé ${r.real}/3`;
    if(world.id==="nesmen")return r.permit?`Profily ${r.dug}/3 · zahrabáno ${r.filled}/3`:`Získej souhlas lesníka`;
    if(world.id==="besednice")return r.bossStarted?(r.bossDefeated?"Ježek je v bezpečí":"Dostaň ježek zpět"):r.clues<3?`Stopy ${r.clues}/3`:`Vykopej ježkový profil`;
    if(world.id==="malse")return r.bossStarted?(r.bossDefeated?"Vstup do Slávie":"Dožeň Frantu"): `Dokumenty ${r.papers}/3`;
    return "Výprava";
  }
  function goalComplete(){
    const r=world.runtime;
    if(world.id==="chlum")return r.permit&&r.collected>=4;
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

  function lookAround(){
    if(scanCooldown>0){toast(`Znovu se můžeš rozhlédnout za ${scanCooldown.toFixed(1)} s`,"",700);return;}
    const radius=260+state.perks.scanner*55;scanPulse=.01;scanCooldown=Math.max(2.1,5-state.perks.scanner*.7);audio.sfx("scan");state.heat=clamp(state.heat+1.5,0,100);
    let count=0;
    for(const h of world.hotspots){if(h.active&&dist(player,h)<=radius){h.revealed=true;h.ttl=9;count++;}}
    for(const item of world.items){if(item.active&&item.hidden&&dist(player,item)<=radius){item.hidden=false;count++;}}
    toast(count?`Rozhlédnutí odhalilo ${count} stop${count===1?"u":"y"}`:"Tady nic není",count?"good":"",900);
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
    if(world.id==="chlum"&&!world.runtime.permit){showDialog("Václav","V","Sbírej jen v holých brázdách a před odjezdem nic nerozjeď. Pak jsme domluvení.",()=>{world.runtime.permit=true;npc.used=true;toast("Souhlas získán","good");});return;}
    if(world.id==="nesmen"&&!world.runtime.permit){showDialog("Lesník","L","Tři obdélníkové profily jsou povolené. Každý po prohlédnutí hned zahrab.",()=>{world.runtime.permit=true;npc.used=true;toast("Profily jsou povolené","good");});return;}
    showDialog(npc.name,npc.avatar,"Drž se úkolu a sleduj okolí.");
  }
  function showDialog(name,avatar,text,callback=null){mode="dialog";setPlaying(false);$("dialogName").textContent=name.toUpperCase();$("dialogAvatar").textContent=avatar;$("dialogText").textContent=text;dialogueCallback=callback;showOnly(screens.dialog);}
  function closeDialog(){screens.dialog.classList.remove("visible");dialogueCallback?.();dialogueCallback=null;mode="playing";setPlaying(true);updateHUD(true);}

  function startDig(h){
    if(!h.active)return;if(world.id==="chlum"&&!world.runtime.permit){state.heat=clamp(state.heat+15,0,100);toast("Nejdřív získej souhlas","bad");return;}
    currentDig=h;digMarker=Math.random();digDir=Math.random()<.5?-1:1;digHits=0;mode="dig";setPlaying(false);$("digHits").textContent="◇ ◇ ◇";$("digTitle").textContent=h.special==="hedgehog"?"Ježkový profil":"Drž rytmus lopaty";
    const width=18+state.perks.shovel*6;$("sweetZone").style.left=`${50-width/2}%`;$("sweetZone").style.width=`${width}%`;showOnly(screens.dig);
  }
  function digAttempt(){
    if(mode!=="dig")return;audio.sfx("dig");const width=.18+state.perks.shovel*.06;const good=Math.abs(digMarker-.5)<=width/2;
    if(good){shake=Math.max(shake,2.5);digHits++;audio.sfx("good");$("digHits").textContent=[0,1,2].map(i=>i<digHits?"◆":"◇").join(" ");if(digHits>=3)setTimeout(finishDig,160);}
    else{shake=Math.max(shake,7);flash=.12;flashColor="255,105,96";state.stats.misses++;state.heat=clamp(state.heat+Math.max(4,10-state.perks.quiet*2),0,100);audio.sfx("bad");toast("Hlučný úder","bad",650);}
  }
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
    player.x=world.id==="malse"?720:world.id==="chlum"?360:world.id==="nesmen"?360:170;player.y=world.id==="malse"?1060:world.id==="chlum"?1070:world.id==="nesmen"?1050:1030;toast(`${reason}${lost?` · ztracen ${lost.name}`:""}`,"bad",1800);updateHUD(true);
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
    if(mode==="dig"){digMarker+=digDir*dt*1.4;if(digMarker>=1){digMarker=1;digDir=-1;}if(digMarker<=0){digMarker=0;digDir=1;}$("digMarker").style.left=`calc(${digMarker*100}% - 5px)`;return;}
    if(mode!=="playing"||!world)return;
    scanCooldown=Math.max(0,scanCooldown-dt);player.invuln=Math.max(0,player.invuln-dt);shake=Math.max(0,shake-dt*24);flash=Math.max(0,flash-dt*.9);dangerActive=false;dangerSource="";dangerRate=0;dangerCatchAfter=Infinity;bossIntroTimer=Math.max(0,bossIntroTimer-dt);if(bossIntroTimer<=0){ui.bossIntro?.classList.remove("show");ui.bossIntro?.classList.add("hidden");}
    if(theftAlertTimer>0){theftAlertTimer=Math.max(0,theftAlertTimer-dt);if(theftAlertTimer<=0)hideTheftAlert();}dangerBeatTimer=Math.max(0,dangerBeatTimer-dt);state.comboTimer=Math.max(0,state.comboTimer-dt);if(state.comboTimer<=0&&state.combo>1){state.combo--;state.comboTimer=5;}
    if(theftAlertShown){
      input.x=input.y=0;updateParticles(dt);
      camera.x=lerp(camera.x,clamp(player.x-viewport.w/2,0,Math.max(0,world.w-viewport.w)),1-Math.exp(-5*dt));camera.y=lerp(camera.y,clamp(player.y-viewport.h/2,0,Math.max(0,world.h-viewport.h)),1-Math.exp(-5*dt));
      updateHUD();return;
    }
    const len=Math.hypot(input.x,input.y);if(len>.04){const nx=input.x/Math.max(1,len),ny=input.y/Math.max(1,len);const speed=playerSpeed()*(len>.78?1.28:1);const x=player.x+nx*speed*dt,y=player.y+ny*speed*dt;if(!blocked(x,player.y))player.x=x;if(!blocked(player.x,y))player.y=y;player.angle=Math.atan2(ny,nx);player.step+=dt*(len>.78?13:9);if(Math.floor(player.step*2)%4===0&&Math.random()<.08)audio.sfx("step");}
    updateHotspots(dt);updatePatrols(dt);updateRival(dt);resolveDanger(dt);if((dangerActive||state.heat>=68)&&dangerBeatTimer<=0){audio.sfx("heartbeat");dangerBeatTimer=state.heat>=88?.42:.68;}updateParticles(dt);findNearest();
    camera.x=lerp(camera.x,clamp(player.x-viewport.w/2,0,Math.max(0,world.w-viewport.w)),1-Math.exp(-5*dt));camera.y=lerp(camera.y,clamp(player.y-viewport.h/2,0,Math.max(0,world.h-viewport.h)),1-Math.exp(-5*dt));
    if(scanPulse>0){scanPulse+=dt*1.4;if(scanPulse>1)scanPulse=0;}
    if(state.heat>=100)caught("Hlídka tě zastavila");updateHUD();
  }

  function updateHotspots(dt){for(const h of world.hotspots){if(!h.active)continue;if(h.revealed){h.ttl-=dt;if(h.ttl<=0&&!h.marked)h.revealed=false;}}}
  function updatePatrols(dt){
    for(const p of world.patrols){if(!p.active)continue;const target=p.points[p.index],dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;p.x+=dx/d*p.speed*dt;p.y+=dy/d*p.speed*dt;p.angle=Math.atan2(dy,dx);if(d<12)p.index=(p.index+1)%p.points.length;
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
    if(nearest){const map={npc:["!","MLUVIT"],hotspot:["⛏","KOPAT"],item:["◆","SEBRAT"],hole:["▨","ZAHRABAT"],rival:["✋","CHYTIT"],exit:["→","ODEJÍT"]};const m=map[nearest.kind]||["◎","AKCE"];ui.actionIcon.textContent=m[0];ui.actionText.textContent=m[1];$("actionButton").classList.add("ready");$("actionButton").classList.toggle("boss-ready",nearest.kind==="rival"&&nearest.ref.stunTimer>0);showHint(nearest.kind==="exit"?nearest.ref.label:m[1]);}
    else{ui.actionIcon.textContent="◉";ui.actionText.textContent=scanCooldown>0?`${Math.ceil(scanCooldown)}`:"ROZHLÉDNOUT";$("actionButton").classList.remove("ready","boss-ready");hideHint();}
  }

  function burst(x,y,color,count=14){for(let i=0;i<count;i++)world.particles.push({x,y,vx:rand(-90,90),vy:rand(-120,-30),life:rand(.45,.9),color,r:rand(2,5)});}

  function render(){
    ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);ctx.clearRect(0,0,viewport.w,viewport.h);
    if(!world){drawMenuBackdrop();return;}
    ctx.save();const sx=shake?(Math.random()-.5)*shake:0,sy=shake?(Math.random()-.5)*shake:0;ctx.translate(sx-camera.x,sy-camera.y);drawGround();drawWorldObjects();drawEffects();ctx.restore();drawScreenVignette();drawAtmosphereOverlay();drawObjectiveArrow();
  }

  function drawMenuBackdrop(){const g=ctx.createLinearGradient(0,0,0,viewport.h);g.addColorStop(0,"#142a35");g.addColorStop(.52,"#2b4633");g.addColorStop(1,"#3b2d22");ctx.fillStyle=g;ctx.fillRect(0,0,viewport.w,viewport.h);}

  function drawGround(){
    if(world.theme==="field")drawField();
    else if(world.theme==="meadow")drawMeadow();
    else if(world.theme==="forest"||world.theme==="night")drawForest();
    else drawCity();
  }
  function drawField(){
    const g=ctx.createLinearGradient(0,0,0,world.h);
    g.addColorStop(0,"#89a65f");g.addColorStop(.12,"#6f8950");g.addColorStop(.23,"#9a8660");g.addColorStop(1,"#69503b");ctx.fillStyle=g;ctx.fillRect(0,0,world.w,world.h);
    ctx.fillStyle="#31442d";ctx.fillRect(0,0,world.w,118);
    for(let i=0;i<24;i++){const x=i*92;ctx.fillStyle=i%3?"#273c29":"#3c5234";ctx.beginPath();ctx.moveTo(x,118);ctx.lineTo(x+52,45+(i%4)*7);ctx.lineTo(x+115,118);ctx.closePath();ctx.fill();}
    ctx.fillStyle="#708951";ctx.fillRect(0,118,world.w,100);
    for(let y=225;y<world.h+80;y+=96){ctx.fillStyle=y%192===0?"#7c6248":"#72573f";ctx.fillRect(0,y,world.w,64);ctx.strokeStyle="rgba(48,31,20,.27)";ctx.lineWidth=3;for(let x=-20;x<world.w;x+=44){ctx.beginPath();ctx.moveTo(x,y+5);ctx.lineTo(x+28,y+59);ctx.stroke();}ctx.strokeStyle="rgba(209,176,126,.16)";ctx.lineWidth=1.4;for(let x=10;x<world.w;x+=62){ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x+18,y+56);ctx.stroke();}}
    for(let i=0;i<150;i++){const x=(i*127)%world.w,y=220+((i*83)%960);ctx.fillStyle=i%2?"rgba(52,40,29,.32)":"rgba(205,176,127,.22)";ctx.fillRect(x,y,2+(i%3),2+(i%2));}
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
    else if(p.type==="fieldpit"){ctx.rotate(p.angle||0);const w=(p.w||180),h=(p.h||70);ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.ellipse(0,16,w*.58,h*.42,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#9d7248";roundRect(ctx,-w/2-16,-h/2-10,w+32,h+20,16);ctx.fill();ctx.fillStyle="#c59663";roundRect(ctx,-w/2-8,-h/2-4,w+16,h+8,11);ctx.fill();ctx.fillStyle="#241a13";ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(w/2,-h/2);ctx.lineTo(w/2-18,h/2);ctx.lineTo(-w/2+18,h/2);ctx.closePath();ctx.fill();ctx.strokeStyle="#e2bb88";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="rgba(255,255,255,.08)";ctx.fillRect(-w/2+10,-h/2+6,w-20,6);}
    else if(p.type==="soilheap"){ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(0,12,35,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#886747";ctx.beginPath();ctx.moveTo(-36,12);ctx.quadraticCurveTo(-12,-22,0,-12);ctx.quadraticCurveTo(18,-28,39,12);ctx.closePath();ctx.fill();ctx.fillStyle="rgba(188,151,100,.26)";ctx.beginPath();ctx.arc(-8,-4,5,0,Math.PI*2);ctx.arc(12,-7,4,0,Math.PI*2);ctx.fill();}
    else if(p.type==="stubble"){ctx.strokeStyle="#b7a271";ctx.lineWidth=2;for(let i=-4;i<=4;i+=2){ctx.beginPath();ctx.moveTo(i,9);ctx.lineTo(i-2,-9-(i%3));ctx.stroke();}}
    else if(p.type==="realpine"){ctx.rotate(p.lean||0);ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(0,16,18,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#8a5738";roundRect(ctx,-4,-58,8,78,3);ctx.fill();ctx.fillStyle="#b36d42";ctx.fillRect(-3,-54,2,60);ctx.fillStyle=world.id==="locenice"?"#49634a":"#2d5236";for(const q of [[0,-72,20],[0,-55,24],[0,-38,21]]){ctx.beginPath();ctx.moveTo(0,q[1]-q[2]);ctx.lineTo(-q[2],q[1]+q[2]);ctx.lineTo(q[2],q[1]+q[2]);ctx.closePath();ctx.fill();}}
    else if(p.type==="sandmound"||p.type==="earthbank"){ctx.rotate(p.angle||0);ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(0,15,52,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.type==="sandmound"?"#c7b38a":"#9b7858";ctx.beginPath();ctx.moveTo(-55,15);ctx.quadraticCurveTo(-20,-25,0,-15);ctx.quadraticCurveTo(30,-32,58,15);ctx.closePath();ctx.fill();ctx.strokeStyle=p.type==="sandmound"?"rgba(238,220,177,.45)":"rgba(190,148,102,.35)";ctx.lineWidth=3;ctx.stroke();}
    else if(p.type==="sandpit"||p.type==="minepit"){ctx.rotate(p.angle||0);const w=(p.w||100),h=(p.h||52);const lip=p.type==="sandpit"?"#d8c39a":"#956c4a";const wall=p.type==="sandpit"?"#9d8861":"#694a33";const deep=p.type==="sandpit"?"#62584b":"#241a13";ctx.fillStyle="rgba(0,0,0,.2)";ctx.beginPath();ctx.ellipse(0,12,w*.58,h*.45,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=lip;roundRect(ctx,-w/2-10,-h/2-8,w+20,h+16,12);ctx.fill();ctx.fillStyle=wall;ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(w/2,-h/2);ctx.lineTo(w/2-14,h/2);ctx.lineTo(-w/2+14,h/2);ctx.closePath();ctx.fill();ctx.fillStyle=deep;ctx.beginPath();ctx.moveTo(-w/2+10,-h/2+9);ctx.lineTo(w/2-10,-h/2+9);ctx.lineTo(w/2-22,h/2-7);ctx.lineTo(-w/2+22,h/2-7);ctx.closePath();ctx.fill();ctx.strokeStyle=p.type==="sandpit"?"#f2debb":"#c7986a";ctx.lineWidth=3;ctx.stroke();}
    else if(p.type==="fallenpine"){ctx.rotate(p.angle||0);ctx.fillStyle="#8b5737";roundRect(ctx,-50,-5,100,10,5);ctx.fill();ctx.strokeStyle="#385b3f";ctx.lineWidth=3;for(let x=-35;x<45;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-8,-15);ctx.moveTo(x+5,0);ctx.lineTo(x+12,13);ctx.stroke();}}
    else if(p.type==="trackscar"){ctx.rotate(p.angle||0);ctx.strokeStyle="rgba(68,48,34,.55)";ctx.lineWidth=5;for(const y of [-10,10]){ctx.beginPath();ctx.moveTo(-55,y);ctx.lineTo(55,y);ctx.stroke();for(let x=-48;x<50;x+=14){ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+7,y+4);ctx.stroke();}}}
    else if(p.type==="excavator"){ctx.rotate(p.angle||0);ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(0,22,58,16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#36322d";roundRect(ctx,-42,8,74,18,8);ctx.fill();ctx.strokeStyle="#5a554d";ctx.lineWidth=4;for(let x=-34;x<28;x+=14){ctx.beginPath();ctx.moveTo(x,10);ctx.lineTo(x+8,24);ctx.stroke();}ctx.fillStyle="#d6a52e";roundRect(ctx,-26,-18,48,32,7);ctx.fill();ctx.fillStyle="#35434a";roundRect(ctx,-14,-34,28,22,4);ctx.fill();ctx.fillStyle="rgba(194,225,235,.35)";ctx.fillRect(-10,-31,11,12);ctx.strokeStyle="#d6a52e";ctx.lineWidth=10;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(20,-12);ctx.lineTo(50,-40);ctx.lineTo(78,-18);ctx.stroke();ctx.fillStyle="#6e5432";ctx.beginPath();ctx.moveTo(70,-25);ctx.lineTo(91,-16);ctx.lineTo(75,-3);ctx.closePath();ctx.fill();}
    else if(p.type==="plazatree"){ctx.fillStyle="rgba(0,0,0,.16)";ctx.beginPath();ctx.ellipse(0,15,24,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#6a5140";ctx.fillRect(-4,-32,8,50);ctx.fillStyle="#507044";for(const q of [[-12,-35,18],[12,-38,20],[0,-55,22]]){ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,Math.PI*2);ctx.fill();}}
    else if(p.type==="plaza"){ctx.fillStyle="rgba(232,233,228,.5)";roundRect(ctx,-190,-70,380,140,16);ctx.fill();for(let i=-160;i<=160;i+=40){ctx.strokeStyle="rgba(110,115,112,.18)";ctx.beginPath();ctx.moveTo(i,-70);ctx.lineTo(i,70);ctx.stroke();}for(let i=0;i<8;i++){const x=-140+i*40;ctx.fillStyle=i%2?"#48535c":"#7a6a5d";ctx.beginPath();ctx.arc(x,5+(i%3)*10,5,0,Math.PI*2);ctx.fill();}}
    else if(p.type==="npc")drawActor(0,0,p.role==="owner"?"ranger":"farmer",0,p.name,true);
    else if(p.type==="pit"){const r=p.r||28;ctx.fillStyle="rgba(0,0,0,.25)";ellipse(0,12,r*1.1,r*.55);ctx.fill();ctx.fillStyle="#a27a4f";roundRect(ctx,-r-8,-r*.55,r*2+16,r*1.15,9);ctx.fill();ctx.fillStyle="#251b14";ctx.beginPath();ctx.moveTo(-r,-r*.38);ctx.lineTo(r,-r*.38);ctx.lineTo(r-10,r*.38);ctx.lineTo(-r+10,r*.38);ctx.closePath();ctx.fill();ctx.strokeStyle="#d0ad7d";ctx.lineWidth=4;ctx.stroke();}
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
    if(world?.theme==="night"){const glow=ctx.createRadialGradient(0,-10,7,0,-10,58);glow.addColorStop(0,"rgba(210,255,228,.36)");glow.addColorStop(1,"rgba(210,255,228,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,-10,58,0,Math.PI*2);ctx.fill();}
    drawActor(0,0,"player",player.angle||0,"",true);
    ctx.strokeStyle=world?.theme==="night"?"rgba(229,255,239,.72)":"rgba(255,255,255,.12)";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-12,25,0,Math.PI*2);ctx.stroke();ctx.restore();
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
      const spin=performance.now()*.02*(p.speed>0?1:-1),sc=p.scale||1.25;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(sc,sc);
      ctx.fillStyle="rgba(0,0,0,.26)";ctx.beginPath();ctx.ellipse(0,25,50,17,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#a94428";roundRect(ctx,-48,-20,73,37,9);ctx.fill();
      ctx.fillStyle="#d0673d";roundRect(ctx,-46,-17,34,15,5);ctx.fill();
      ctx.fillStyle="#2d4f5e";roundRect(ctx,-9,-39,32,27,5);ctx.fill();
      ctx.fillStyle="rgba(220,242,249,.27)";ctx.fillRect(-5,-34,12,12);ctx.fillRect(10,-34,9,12);
      ctx.fillStyle="#292827";ctx.fillRect(26,-35,5,26);
      ctx.fillStyle="#1d1e1d";ctx.beginPath();ctx.arc(-28,23,17,0,Math.PI*2);ctx.arc(23,21,12,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#70716e";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(-28,23,9,spin,spin+Math.PI*2);ctx.arc(23,21,6,-spin,-spin+Math.PI*2);ctx.stroke();
      ctx.fillStyle="#f2dda2";ctx.beginPath();ctx.arc(30,-3,5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#74281c";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-9,12);ctx.lineTo(13,12);ctx.stroke();
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
      ctx.translate(0,bob);ctx.fillStyle="rgba(64,230,135,.15)";ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.fillStyle=i.type==="sample"?"#43f58a":"#5bd98d";gemPath(0,0,13);ctx.fill();
    }else if(i.type==="clue"){
      ctx.fillStyle="#74adff";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d6e7ff";ctx.lineWidth=3;ctx.stroke();
    }else if(i.type==="paper"){
      ctx.fillStyle="#e7dfbd";ctx.rotate(-.12);ctx.fillRect(-14,-18,28,36);ctx.strokeStyle="#607b8f";ctx.strokeRect(-14,-18,28,36);ctx.fillStyle="#6f8798";ctx.fillRect(-8,-8,16,3);ctx.fillRect(-8,0,14,3);
    }else if(i.type==="hole"){
      ctx.rotate(i.angle||0);const w=i.w||82,h=i.h||44;
      ctx.fillStyle="rgba(0,0,0,.22)";ctx.beginPath();ctx.ellipse(0,10,w*.56,h*.43,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#b08052";roundRect(ctx,-w/2-9,-h/2-8,w+18,h+16,9);ctx.fill();
      ctx.fillStyle="#6d4a31";ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(w/2,-h/2);ctx.lineTo(w/2-11,h/2);ctx.lineTo(-w/2+11,h/2);ctx.closePath();ctx.fill();
      ctx.fillStyle="#17120e";ctx.beginPath();ctx.moveTo(-w/2+9,-h/2+8);ctx.lineTo(w/2-9,-h/2+8);ctx.lineTo(w/2-20,h/2-7);ctx.lineTo(-w/2+20,h/2-7);ctx.closePath();ctx.fill();
      ctx.strokeStyle="#e1bd88";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#f0c88f";ctx.font="bold 18px sans-serif";ctx.textAlign="center";ctx.fillText("↶",0,6);
    }
    ctx.restore();
  }

  function drawHotspot(h){
    ctx.save();ctx.translate(h.x,h.y);const pulse=1+Math.sin(performance.now()*.006+h.x)*.08;ctx.scale(pulse,pulse);ctx.rotate(h.angle||0);
    ctx.strokeStyle=h.special?"#f2cb72":"#72e5a1";ctx.lineWidth=3;ctx.setLineDash([7,6]);
    if(h.needsFill||h.special==="hedgehog"){
      const w=h.w||82,hh=h.h||44;
      ctx.fillStyle="rgba(0,0,0,.18)";ctx.beginPath();ctx.ellipse(0,10,w*.56,hh*.43,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=h.special?"rgba(242,203,114,.22)":"rgba(114,229,161,.16)";roundRect(ctx,-w/2-6,-hh/2-6,w+12,hh+12,8);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle="rgba(25,18,14,.78)";ctx.beginPath();ctx.moveTo(-w/2,-hh/2);ctx.lineTo(w/2,-hh/2);ctx.lineTo(w/2-11,hh/2);ctx.lineTo(-w/2+11,hh/2);ctx.closePath();ctx.fill();
      ctx.strokeStyle=h.special?"rgba(255,231,164,.96)":"rgba(177,245,205,.96)";ctx.lineWidth=2.5;ctx.stroke();
      if(h.special){ctx.fillStyle="#f4d37f";ctx.font="bold 15px sans-serif";ctx.textAlign="center";ctx.fillText("JEŽKOVÝ PROFIL",0,-hh/2-12);}
    }else{
      ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=h.special?"rgba(242,203,114,.12)":"rgba(114,229,161,.1)";ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  function drawExit(e){ctx.save();ctx.translate(e.x,e.y);const pulse=1+Math.sin(performance.now()*.004)*.08;ctx.scale(pulse,pulse);ctx.fillStyle=goalComplete()?"rgba(99,228,155,.19)":"rgba(255,255,255,.05)";ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=goalComplete()?"#63e49b":"rgba(255,255,255,.25)";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText(e.label,0,4);ctx.restore();}
  function drawEffects(){if(scanPulse>0){const radius=260+state.perks.scanner*55,ang=player.angle-Math.PI+scanPulse*Math.PI*2;ctx.save();ctx.translate(player.x,player.y);ctx.rotate(ang);ctx.fillStyle=`rgba(106,236,163,${(1-scanPulse)*.16})`;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,-.34,.34);ctx.closePath();ctx.fill();ctx.strokeStyle=`rgba(142,245,185,${1-scanPulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,radius*.72,-.34,.34);ctx.stroke();ctx.restore();}for(const h of world.hazards){ctx.fillStyle="#7b5635";ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();}for(const p of world.particles){ctx.globalAlpha=clamp(p.life*1.4,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}if(world.theme==="night"){ctx.save();ctx.fillStyle="rgba(2,7,6,.44)";ctx.fillRect(camera.x,camera.y,viewport.w,viewport.h);ctx.globalCompositeOperation="destination-out";const g=ctx.createRadialGradient(player.x,player.y,58,player.x,player.y,330);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(player.x,player.y,340,0,Math.PI*2);ctx.fill();ctx.restore();
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
  function ellipse(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  function gemPath(x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.8,y-r*.35);ctx.lineTo(x+r*.65,y+r*.7);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.75,y+r*.35);ctx.lineTo(x-r*.8,y-r*.4);ctx.closePath();}

  function loop(now){const dt=Math.min(.035,(now-last)/1000||.016);last=now;update(dt);render();requestAnimationFrame(loop);}

  function setupControls(){
    const zone=$("moveZone"),stick=$("stick");let pid=null;
    const move=e=>{const r=zone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.33,len=Math.hypot(dx,dy)||1,s=Math.min(1,max/len),x=dx*s,y=dy*s;input.x=x/max;input.y=y/max;stick.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;};
    zone.addEventListener("pointerdown",e=>{pid=e.pointerId;zone.setPointerCapture(pid);move(e);});zone.addEventListener("pointermove",e=>{if(e.pointerId===pid)move(e);});
    const end=e=>{if(e.pointerId!==pid)return;pid=null;input.x=input.y=0;stick.style.transform="translate(-50%,-50%)";};zone.addEventListener("pointerup",end);zone.addEventListener("pointercancel",end);
    const action=$("actionButton");action.addEventListener("pointerdown",e=>{e.preventDefault();action.classList.add("active");haptic(8);performAction();});const stop=()=>action.classList.remove("active");action.addEventListener("pointerup",stop);action.addEventListener("pointercancel",stop);
    addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="Space")performAction();if(e.code==="Escape"&&mode==="playing")pause();const x=(e.code==="KeyD"||e.code==="ArrowRight")?1:(e.code==="KeyA"||e.code==="ArrowLeft")?-1:0;const y=(e.code==="KeyS"||e.code==="ArrowDown")?1:(e.code==="KeyW"||e.code==="ArrowUp")?-1:0;if(x)input.x=x;if(y)input.y=y;});
    addEventListener("keyup",e=>{if(["KeyA","KeyD","ArrowLeft","ArrowRight"].includes(e.code))input.x=0;if(["KeyW","KeyS","ArrowUp","ArrowDown"].includes(e.code))input.y=0;});
  }

  function pause(){if(mode!=="playing"||theftAlertShown)return;mode="pause";audio.pauseMusic();setPlaying(false);showOnly(screens.pause);}
  function resume(){screens.pause.classList.remove("visible");mode="playing";audio.resumeMusic();setPlaying(true);last=performance.now();}
  function toMenu(){save();audio.pauseMusic();mode="menu";world=null;setPlaying(false);showOnly(screens.title);refreshContinue();}
  function showRecords(){const list=$("recordsList"),rows=getRecords();list.innerHTML="";if(!rows.length){list.innerHTML="<li><span>–</span><div>Zatím žádná dokončená výprava</div></li>";}else rows.forEach((r,i)=>{const li=document.createElement("li");li.innerHTML=`<b>${i+1}.</b><div><strong>${escapeHtml(r.title)}</strong><small>${r.stones} kamenů · ${new Date(r.date).toLocaleDateString("cs-CZ")}</small></div><strong>${Number(r.score).toLocaleString("cs-CZ")}</strong>`;list.append(li);});showOnly(screens.records);}

  function bindUI(){
    $("playButton").addEventListener("click",startNew);$("continueButton").addEventListener("click",continueGame);$("briefButton").addEventListener("click",enterLevel);
    $("digButton").addEventListener("click",digAttempt);$("realButton").addEventListener("click",()=>resolveSample(true));$("glassButton").addEventListener("click",()=>resolveSample(false));$("dialogButton").addEventListener("click",closeDialog);
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
    if(new URLSearchParams(location.search).has("debug")){
      window.__lovecDebug={
        startLevel(index=0){state=freshState();state.levelIndex=clamp(index,0,LEVELS.length-1);generateLevel(state.levelIndex);mode="playing";showOnly(null);setPlaying(true);return {level:world.id,player:{x:player.x,y:player.y}};},
        spawnBoss(name="karel"){if(!world)return null;startRival(name,player.x+240,player.y-120);return world.rival;},
        hitBoss(){hitRival();return world?.rival?{active:world.rival.active,hits:world.rival.hits,maxHits:world.rival.maxHits,phase:world.rival.phase}:null;},
        setPlayer(x,y){player.x=x;player.y=y;return {x:player.x,y:player.y};},
        setBossPose(x,y,angle=0){if(!world?.rival)return null;world.rival.x=x;world.rival.y=y;world.rival.angle=angle;world.rival.speed=0;world.rival.target={x,y};return {x,y,angle};},
        setHeat(value){state.heat=clamp(value,0,100);return state.heat;},
        setBossStun(value=1){if(!world?.rival)return null;world.rival.stunTimer=value;return world.rival.stunTimer;},
        triggerTheft(){if(!world)return null;showTheftAlert();startRival("karel",player.x+180,player.y-100);return {shown:theftAlertShown,boss:world.rival?.name};},
        snapshot(){return {mode,level:world?.id,heat:state.heat,dangerActive,theftAlertShown,boss:world?.rival?{name:world.rival.name,active:world.rival.active,hits:world.rival.hits,maxHits:world.rival.maxHits,phase:world.rival.phase,stunTimer:world.rival.stunTimer,dashTime:world.rival.dashTime,graceTimer:world.rival.graceTimer}:null};}
      };
    }
    addEventListener("resize",()=>requestAnimationFrame(resize));
    addEventListener("orientationchange",()=>setTimeout(resize,120));
    visualViewport?.addEventListener("resize",()=>requestAnimationFrame(resize));
    document.addEventListener("visibilitychange",()=>{if(document.hidden&&mode==="playing")pause();});
    if("serviceWorker" in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
    requestAnimationFrame(loop);
  }
  try{boot();}catch(error){console.error(error);$("playButton").disabled=true;$("playButton").innerHTML="<span>CHYBA SPUŠTĚNÍ</span><small>obnov stránku</small>";}
})();
