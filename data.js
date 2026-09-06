export const GAME_VERSION = "2.1.0";

export const DIFFICULTY = {
  story: { enemySpeed: .78, enemyDamage: .7, playerSpeed: 1.08, reputationLoss: .72, label: "Příběh" },
  normal: { enemySpeed: 1, enemyDamage: 1, playerSpeed: 1, reputationLoss: 1, label: "Sběratel" },
  hard: { enemySpeed: 1.22, enemyDamage: 1.2, playerSpeed: .96, reputationLoss: 1.25, label: "Černá noc" }
};

export const LEVELS = [
  {
    id: "chlum",
    location: "Chlum nad Malší",
    title: "Chlum: pole po dešti",
    story: "Noční déšť omyl vrchní vrstvu hlíny. Na poli se zelenají čerstvé výsevy a mezi brázdami mohou ležet první kusy. Nejdřív ale potřebuješ svolení majitele.",
    objective: "Domluv si povolení, nasbírej šest povrchových vltavínů a vrať se k dodávce.",
    rare: "Chlumský celotvar s jemnou skulptací.",
    lore: "Vltavíny jsou tektity – přírodní skla spojená s impaktem Ries. V terénu rozhoduje zkušené oko, kontext nálezu a přirozený povrch.",
    theme: "field",
    music: "field",
    size: 46,
    sky: 0x9dcbd4,
    fog: 0x9db8aa,
    ground: 0x664a32,
    start: [0, 18],
    exit: [0, -19]
  },
  {
    id: "locenice",
    location: "Ločenice",
    title: "Ločenice: zelené střepy",
    story: "Erozní rýha přinesla drobné úlomky, ale někdo sem vysypal i lahvové sklo. Na improvizovaném stole čeká lupa a sada vzorků.",
    objective: "Urči alespoň šest vzorků správně a najdi čtyři pravé vltavíny.",
    rare: "Olivově zelený splash s protáhlou bublinou.",
    lore: "Napodobeniny bývají nápadně hladké, nepřirozeně lesklé nebo mají opakující se odlité struktury. Ani jedna vlastnost sama o sobě ale není absolutním důkazem.",
    theme: "meadow",
    music: "meadow",
    size: 48,
    sky: 0xa8cbd0,
    fog: 0xaabca6,
    ground: 0x755f3c,
    start: [0, 20],
    exit: [0, -21]
  },
  {
    id: "nesmen",
    location: "Nesměň",
    title: "Nesměň: lesní profil",
    story: "Majitel lesa označil několik mělkých průzkumných profilů. Každý výkop musí být bezpečný, zdokumentovaný a po práci zasypaný. Po cestě projíždí policejní hlídka.",
    objective: "Získej povolení, vykopej čtyři profily, zdokumentuj nálezy a zasyp všechny jámy.",
    rare: "Vrstevnatý kus se zbytkem sedimentu.",
    lore: "Nelegální hluboké jámy ničí kořeny, ohrožují lidi i zvěř a poškozují pověst celé komunity. Hra odměňuje souhlas vlastníka a uvedení místa do původního stavu.",
    theme: "forest",
    music: "forest",
    size: 52,
    sky: 0x728f82,
    fog: 0x425b49,
    ground: 0x3e382c,
    start: [0, 22],
    exit: [0, -23]
  },
  {
    id: "besednice",
    location: "Besednice",
    title: "Besednice: ježková noc",
    story: "Soumrak přechází v déšť. V jílovité vrstvě může čekat ježkovitý kus, ale lokalitu obsadila parta nočních kopáčů. Jejich vůdce Krystalový Karel odmítá odejít.",
    objective: "Najdi tři indicie, vykopej ježka a poraz Krystalového Karla.",
    rare: "Besednický ježek s hlubokou ostrou skulptací.",
    lore: "Ježkovité vltavíny jsou ikonické sběratelské tvary. Nejcennější jsou celistvé kusy s výraznou skulptací a doloženým původem.",
    theme: "night",
    music: "night",
    size: 54,
    sky: 0x101b2d,
    fog: 0x17251f,
    ground: 0x29271a,
    start: [0, 23],
    exit: [0, -24]
  },
  {
    id: "malse",
    location: "Nábřeží Malše",
    title: "Malše: cesta do Budějovic",
    story: "Výstavní kufr je téměř připravený. U řeky se ale objevuje Feták Franta, který chce sbírku vyměnit za bednu zelených odlitků. Mezi parkovištěm a mostem hlídá doprava i policie.",
    objective: "Najdi ztracené dokumenty, poraz Frantu a projdi městskou trasou ke Slávii.",
    rare: "Výstavní kus s úplnou dokumentací.",
    lore: "Před výstavou je důležitá evidence: lokalita, hmotnost, fotografie a poznámky k nálezu. Dobrá dokumentace zvyšuje odbornou i sběratelskou hodnotu.",
    theme: "city",
    music: "city",
    size: 56,
    sky: 0x8db7c9,
    fog: 0x879c9a,
    ground: 0x55575b,
    start: [0, 24],
    exit: [0, -25]
  },
  {
    id: "slavie",
    location: "Kulturní dům Slávie",
    title: "Finále: Na Zelené Vlně",
    story: "Dveře Slávie jsou otevřené. Uvnitř jsou vitríny, přednáškový sál, sběratelé i odborná porota. Zbývá zaregistrovat sbírku a vybrat pět kamenů na hlavní výstavní stůl.",
    objective: "Projdi registrací, připrav výstavní pětici a získej hodnocení poroty.",
    rare: "Nejlepší kámen celé výpravy.",
    lore: "Finále hodnotí nejen vzhled, ale i pravost, původ, dokumentaci a respekt k lokalitám. Nejvyšší skóre získá vyvážená a důvěryhodná sbírka.",
    theme: "expo",
    music: "expo",
    size: 42,
    sky: 0x28342f,
    fog: 0x25322c,
    ground: 0x6a6258,
    start: [0, 16],
    exit: [0, -17]
  }
];

export const UPGRADES = [
  {
    id: "shovel",
    name: "Geologická lopatka",
    max: 3,
    prices: [500, 950, 1600],
    descriptions: [
      "Základní výbava.",
      "Kopání vyžaduje o jeden úder méně.",
      "Další zrychlení kopání.",
      "Profily odkryješ téměř okamžitě."
    ]
  },
  {
    id: "boots",
    name: "Terénní boty",
    max: 3,
    prices: [450, 850, 1400],
    descriptions: [
      "Běžná obuv.",
      "Vyšší rychlost a menší zpomalení v bahně.",
      "Rychlejší sprint.",
      "Maximální pohyblivost v terénu."
    ]
  },
  {
    id: "lamp",
    name: "Čelovka",
    max: 3,
    prices: [400, 750, 1200],
    descriptions: [
      "Slabé světlo telefonu.",
      "Větší dosah v noci.",
      "Jasnější kužel a lepší orientace.",
      "Profesionální terénní svítilna."
    ]
  },
  {
    id: "case",
    name: "Výstavní kufr",
    max: 3,
    prices: [650, 1100, 1800],
    descriptions: [
      "Kameny jsou v látkovém sáčku.",
      "Chrání sbírku a přidává body poroty.",
      "Lepší popisky a členění.",
      "Profesionální výstavní prezentace."
    ]
  }
];

export const IDENTIFY_SAMPLES = [
  {
    real: true,
    description: "Tmavě olivový nepravidelný úlomek s matně skulptovaným povrchem.",
    color: "olivově zelená",
    surface: "nepravidelné jamky bez opakujícího se vzoru",
    edges: "přirozeně odštípnuté",
    bubbles: "jedna protáhlá uzavřená bublina"
  },
  {
    real: false,
    description: "Jasně zelený lesklý kus stejnoměrného tvaru.",
    color: "sytá lahvově zelená",
    surface: "hladký a voskově lesklý",
    edges: "zaoblené jako z formy",
    bubbles: "mnoho kulatých bublinek"
  },
  {
    real: true,
    description: "Šedozelený plochý splash s jemnými rýhami a různou tloušťkou.",
    color: "šedozelená",
    surface: "jemná přirozená skulptace",
    edges: "tenké nepravidelné okraje",
    bubbles: "bez viditelné bubliny"
  },
  {
    real: false,
    description: "Průhledný střep s ostrými čerstvými lomovými plochami a nápadnou pravidelností.",
    color: "světle zelená",
    surface: "téměř zcela hladký",
    edges: "rovné a čerstvě řezané",
    bubbles: "drobné kulaté bublinky v řadě"
  },
  {
    real: true,
    description: "Hnědozelený kapkovitý kus s nestejnou průsvitností.",
    color: "hnědozelená",
    surface: "mělké jamky a vrásnění",
    edges: "přirozeně nepravidelné",
    bubbles: "podélná dutinka"
  },
  {
    real: false,
    description: "Kus s hlubokými identickými důlky opakujícími se kolem celého povrchu.",
    color: "jednotná zelená",
    surface: "opakující se odlité důlky",
    edges: "symetrické",
    bubbles: "kulaté"
  },
  {
    real: true,
    description: "Drobný olivový kus s povrchovou patinou a zbytky jílovitého sedimentu.",
    color: "tmavě olivová",
    surface: "matná skulptace a sediment",
    edges: "různě zaoblené zvětráváním",
    bubbles: "bez viditelné bubliny"
  },
  {
    real: false,
    description: "Zelená kulička s pravidelnou kapkovitou špičkou.",
    color: "neonově zelená",
    surface: "lesklá",
    edges: "žádné",
    bubbles: "mnoho stejných bublinek"
  },
  {
    real: true,
    description: "Protáhlý kus s hlubšími nepravidelnými rýhami a tenčí špičkou.",
    color: "olivová až hnědozelená",
    surface: "organicky působící rýhy",
    edges: "křehké a nepravidelné",
    bubbles: "jedna podélná"
  },
  {
    real: false,
    description: "Dokonale souměrný disk s uměle naleptaným povrchem.",
    color: "stále stejná zelená",
    surface: "rovnoměrně naleptaná",
    edges: "kruhové",
    bubbles: "bez bublinek"
  }
];

export const DIALOGUES = {
  vaclav: {
    name: "Sedlák Václav",
    portrait: "V",
    lines: [
      "Po dešti se něco najít dá, ale do zasetých řádků mi nevlez. Drž se tmavých brázd a každou díru hned zahrň.",
      "Tady máš souhlas pro dnešní dopoledne. Když budeš slušný, řeknu o tobě i ostatním."
    ]
  },
  geologist: {
    name: "Geolog Martin",
    portrait: "M",
    lines: [
      "Na stole je deset vzorků. Dívej se na povrch, tvar, bubliny a hlavně na celkový kontext.",
      "Nejde o jeden magický znak. Správné určení je součet více stop."
    ]
  },
  owner: {
    name: "Majitel lesa",
    portrait: "L",
    lines: [
      "Žluté kolíky označují čtyři mělké profily. Mimo ně nekopej.",
      "Každý nález vyfoť, napiš číslo profilu a jámu po sobě zasyp. Hlídka dnes projíždí často."
    ]
  },
  organizer: {
    name: "Organizátorka akce",
    portrait: "Z",
    lines: [
      "Vítej na Zelené Vlně. Nejprve registrace a kontrola dokumentace.",
      "Potom vyber pět kamenů. Porota ocení kvalitu, rozmanitost i příběh sbírky."
    ]
  },
  registrar: {
    name: "Registrace",
    portrait: "R",
    lines: [
      "Zkontroluji jméno, původ kamenů a poznámky z lokalit.",
      "Dobrá pověst a dokumentované nálezy ti otevřou hlavní výstavní stůl."
    ]
  }
};

export const MUSIC_TRACKS = {
  field: "./assets/audio/music/field.wav",
  meadow: "./assets/audio/music/meadow.wav",
  forest: "./assets/audio/music/forest.wav",
  night: "./assets/audio/music/night.wav",
  boss: "./assets/audio/music/boss.wav",
  city: "./assets/audio/music/city.wav",
  expo: "./assets/audio/music/expo.wav"
};

export const SFX = {
  menu: "./assets/audio/sfx/menu.wav",
  collect: "./assets/audio/sfx/collect.wav",
  rare: "./assets/audio/sfx/rare.wav",
  dig: "./assets/audio/sfx/dig.wav",
  fill: "./assets/audio/sfx/fill.wav",
  hit: "./assets/audio/sfx/hit.wav",
  police: "./assets/audio/sfx/police.wav",
  cash: "./assets/audio/sfx/cash.wav",
  boss: "./assets/audio/sfx/boss.wav",
  win: "./assets/audio/sfx/win.wav",
  wrong: "./assets/audio/sfx/wrong.wav",
  step: "./assets/audio/sfx/step.wav"
};
