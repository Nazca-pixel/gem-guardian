// Monster types and unlock conditions

export interface Monster {
  id: string;
  name: string;
  emoji: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  unlockCondition: UnlockCondition;
  evolutions: Evolution[];
}

export interface Evolution {
  stage: number;
  name: string;
  emoji: string;
  minLevel: number;
}

export interface UnlockCondition {
  type: "level" | "bxp" | "fxp" | "savings" | "streak" | "badges" | "transactions" | "special" | "premium";
  value: number;
  description: string;
}

export const rarityColors: Record<Monster["rarity"], string> = {
  common: "from-slate-400 to-slate-500",
  uncommon: "from-emerald-400 to-emerald-500",
  rare: "from-blue-400 to-blue-500",
  epic: "from-purple-400 to-purple-500",
  legendary: "from-amber-400 to-orange-500",
};

export const rarityLabels: Record<Monster["rarity"], string> = {
  common: "Comune",
  uncommon: "Non Comune",
  rare: "Raro",
  epic: "Epico",
  legendary: "Leggendario",
};

export const monsters: Monster[] = [
  // ============= COMMON - Easy to unlock (3 monsters) =============
  {
    id: "phoenix",
    name: "Fenice",
    emoji: "🐦‍🔥",
    description: "La creatura iniziale, simbolo di rinascita finanziaria",
    rarity: "common",
    unlockCondition: {
      type: "level",
      value: 1,
      description: "Disponibile all'inizio",
    },
    evolutions: [
      { stage: 1, name: "Uovo di Fuoco", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Scintilla", emoji: "✨", minLevel: 2 },
      { stage: 3, name: "Pulcino Ardente", emoji: "🐣", minLevel: 3 },
      { stage: 4, name: "Fiammella", emoji: "🔥", minLevel: 5 },
      { stage: 5, name: "Uccello di Fuoco", emoji: "🐥", minLevel: 7 },
      { stage: 6, name: "Fenice Giovane", emoji: "🦅", minLevel: 10 },
      { stage: 7, name: "Fenice Radiante", emoji: "🐦‍🔥", minLevel: 15 },
      { stage: 8, name: "Fenice Immortale", emoji: "👑🐦‍🔥", minLevel: 20 },
    ],
  },
  {
    id: "piggy",
    name: "Porcellino",
    emoji: "🐷",
    description: "Il classico salvadanaio vivente, ama accumulare monete",
    rarity: "common",
    unlockCondition: {
      type: "savings",
      value: 100,
      description: "Risparmia €100 nei tuoi obiettivi",
    },
    evolutions: [
      { stage: 1, name: "Monetina", emoji: "🪙", minLevel: 1 },
      { stage: 2, name: "Monete", emoji: "💰", minLevel: 2 },
      { stage: 3, name: "Porcellino Baby", emoji: "🐽", minLevel: 3 },
      { stage: 4, name: "Porcellino Rosa", emoji: "🐷", minLevel: 5 },
      { stage: 5, name: "Maialino Ricco", emoji: "🐖", minLevel: 7 },
      { stage: 6, name: "Cinghiale d'Oro", emoji: "🐗", minLevel: 10 },
      { stage: 7, name: "Re Porcello", emoji: "👑🐷", minLevel: 15 },
      { stage: 8, name: "Imperatore del Risparmio", emoji: "💎🐷", minLevel: 20 },
    ],
  },
  {
    id: "bunny",
    name: "Coniglietto",
    emoji: "🐰",
    description: "Veloce e attento, moltiplica i tuoi risparmi come conigli!",
    rarity: "common",
    unlockCondition: {
      type: "transactions",
      value: 10,
      description: "Registra 10 transazioni",
    },
    evolutions: [
      { stage: 1, name: "Uovo Pasquale", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Coniglietto Nano", emoji: "🐇", minLevel: 2 },
      { stage: 3, name: "Coniglio Bianco", emoji: "🐰", minLevel: 3 },
      { stage: 4, name: "Coniglio Agile", emoji: "💨🐰", minLevel: 5 },
      { stage: 5, name: "Lepre Veloce", emoji: "⚡🐇", minLevel: 7 },
      { stage: 6, name: "Coniglio Lunare", emoji: "🌙🐰", minLevel: 10 },
      { stage: 7, name: "Lepre delle Stelle", emoji: "⭐🐰", minLevel: 15 },
      { stage: 8, name: "Coniglio Celestiale", emoji: "✨🐰", minLevel: 20 },
    ],
  },

  // ============= UNCOMMON - Medium difficulty (4 monsters) =============
  {
    id: "dragon",
    name: "Drago",
    emoji: "🐉",
    description: "Custode dei tesori, respira fuoco e protegge i tuoi risparmi",
    rarity: "uncommon",
    unlockCondition: {
      type: "bxp",
      value: 500,
      description: "Accumula 500 BXP totali",
    },
    evolutions: [
      { stage: 1, name: "Uovo di Drago", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Draghetto", emoji: "🦎", minLevel: 2 },
      { stage: 3, name: "Lucertola di Fuoco", emoji: "🔥", minLevel: 3 },
      { stage: 4, name: "Piccolo Drago", emoji: "🐲", minLevel: 5 },
      { stage: 5, name: "Drago Giovane", emoji: "🐉", minLevel: 7 },
      { stage: 6, name: "Drago Adulto", emoji: "🔥🐉", minLevel: 10 },
      { stage: 7, name: "Drago Anziano", emoji: "⚡🐉", minLevel: 15 },
      { stage: 8, name: "Drago Divino", emoji: "👑🐉", minLevel: 20 },
    ],
  },
  {
    id: "cat",
    name: "Gatto Fortunato",
    emoji: "🐱",
    description: "Maneki-neko, porta fortuna nelle finanze",
    rarity: "uncommon",
    unlockCondition: {
      type: "transactions",
      value: 50,
      description: "Registra 50 transazioni",
    },
    evolutions: [
      { stage: 1, name: "Gattino", emoji: "🐱", minLevel: 1 },
      { stage: 2, name: "Micio Curioso", emoji: "😺", minLevel: 2 },
      { stage: 3, name: "Gatto Felice", emoji: "😸", minLevel: 3 },
      { stage: 4, name: "Gatto Furbo", emoji: "😼", minLevel: 5 },
      { stage: 5, name: "Gatto d'Oro", emoji: "🐱💰", minLevel: 7 },
      { stage: 6, name: "Maneki-neko", emoji: "🎎", minLevel: 10 },
      { stage: 7, name: "Neko Reale", emoji: "👑🐱", minLevel: 15 },
      { stage: 8, name: "Neko Divino", emoji: "✨🐱", minLevel: 20 },
    ],
  },
  {
    id: "owl",
    name: "Gufo Saggio",
    emoji: "🦉",
    description: "Osserva ogni spesa con saggezza millenaria",
    rarity: "uncommon",
    unlockCondition: {
      type: "fxp",
      value: 300,
      description: "Accumula 300 FXP totali",
    },
    evolutions: [
      { stage: 1, name: "Uovo Misterioso", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Gufetto", emoji: "🐤", minLevel: 2 },
      { stage: 3, name: "Civetta", emoji: "🦉", minLevel: 3 },
      { stage: 4, name: "Gufo Attento", emoji: "👀🦉", minLevel: 5 },
      { stage: 5, name: "Gufo Bibliotecario", emoji: "📚🦉", minLevel: 7 },
      { stage: 6, name: "Gufo Antico", emoji: "📿🦉", minLevel: 10 },
      { stage: 7, name: "Arcigufo", emoji: "🔮🦉", minLevel: 15 },
      { stage: 8, name: "Gufo Onnisciente", emoji: "👁️🦉", minLevel: 20 },
    ],
  },
  {
    id: "wolf",
    name: "Lupo Alpha",
    emoji: "🐺",
    description: "Leader del branco, guida le tue finanze con determinazione",
    rarity: "uncommon",
    unlockCondition: {
      type: "streak",
      value: 14,
      description: "Raggiungi una streak di 14 giorni",
    },
    evolutions: [
      { stage: 1, name: "Cucciolo", emoji: "🐕", minLevel: 1 },
      { stage: 2, name: "Lupacchiotto", emoji: "🐺", minLevel: 2 },
      { stage: 3, name: "Lupo Giovane", emoji: "🐺", minLevel: 3 },
      { stage: 4, name: "Lupo Grigio", emoji: "🐺", minLevel: 5 },
      { stage: 5, name: "Lupo Alpha", emoji: "🐺💪", minLevel: 7 },
      { stage: 6, name: "Lupo della Luna", emoji: "🌙🐺", minLevel: 10 },
      { stage: 7, name: "Lupo Ancestrale", emoji: "⚡🐺", minLevel: 15 },
      { stage: 8, name: "Fenrir", emoji: "👑🐺", minLevel: 20 },
    ],
  },

  // ============= RARE - Hard to unlock (4 monsters) =============
  {
    id: "unicorn",
    name: "Unicorno",
    emoji: "🦄",
    description: "Creatura magica che trasforma i sogni in realtà finanziaria",
    rarity: "rare",
    unlockCondition: {
      type: "savings",
      value: 1000,
      description: "Risparmia €1.000 nei tuoi obiettivi",
    },
    evolutions: [
      { stage: 1, name: "Polvere Magica", emoji: "✨", minLevel: 1 },
      { stage: 2, name: "Scintillio", emoji: "💫", minLevel: 2 },
      { stage: 3, name: "Pony", emoji: "🐴", minLevel: 3 },
      { stage: 4, name: "Cavallo Bianco", emoji: "🐎", minLevel: 5 },
      { stage: 5, name: "Unicorno Baby", emoji: "🦄", minLevel: 7 },
      { stage: 6, name: "Unicorno Radioso", emoji: "🌈🦄", minLevel: 10 },
      { stage: 7, name: "Alicorno", emoji: "👼🦄", minLevel: 15 },
      { stage: 8, name: "Unicorno Celestiale", emoji: "👑🦄", minLevel: 20 },
    ],
  },
  {
    id: "turtle",
    name: "Tartaruga Antica",
    emoji: "🐢",
    description: "Lenta ma costante, simbolo di risparmio paziente",
    rarity: "rare",
    unlockCondition: {
      type: "level",
      value: 8,
      description: "Raggiungi il livello 8",
    },
    evolutions: [
      { stage: 1, name: "Uovo di Mare", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Tartarughina", emoji: "🐢", minLevel: 2 },
      { stage: 3, name: "Tartaruga Verde", emoji: "🐢", minLevel: 3 },
      { stage: 4, name: "Tartaruga Marina", emoji: "🌊🐢", minLevel: 5 },
      { stage: 5, name: "Tartaruga Saggia", emoji: "📿🐢", minLevel: 7 },
      { stage: 6, name: "Tartaruga Millenaria", emoji: "🏛️🐢", minLevel: 10 },
      { stage: 7, name: "Tartaruga Cosmica", emoji: "🌌🐢", minLevel: 15 },
      { stage: 8, name: "Genbu", emoji: "👑🐢", minLevel: 20 },
    ],
  },
  {
    id: "fox",
    name: "Volpe Astuta",
    emoji: "🦊",
    description: "Furba e intelligente, trova sempre le migliori offerte",
    rarity: "rare",
    unlockCondition: {
      type: "badges",
      value: 5,
      description: "Sblocca 5 badge",
    },
    evolutions: [
      { stage: 1, name: "Cucciolo di Volpe", emoji: "🦊", minLevel: 1 },
      { stage: 2, name: "Volpina", emoji: "🦊", minLevel: 2 },
      { stage: 3, name: "Volpe Rossa", emoji: "🦊", minLevel: 3 },
      { stage: 4, name: "Volpe Arguta", emoji: "🧠🦊", minLevel: 5 },
      { stage: 5, name: "Kitsune", emoji: "🔥🦊", minLevel: 7 },
      { stage: 6, name: "Kitsune a Due Code", emoji: "🎭🦊", minLevel: 10 },
      { stage: 7, name: "Kitsune Anziano", emoji: "✨🦊", minLevel: 15 },
      { stage: 8, name: "Kyubi", emoji: "👑🦊", minLevel: 20 },
    ],
  },
  {
    id: "bear",
    name: "Orso del Mercato",
    emoji: "🐻",
    description: "Potente e saggio, naviga sia i mercati bull che bear",
    rarity: "rare",
    unlockCondition: {
      type: "fxp",
      value: 1000,
      description: "Accumula 1.000 FXP totali",
    },
    evolutions: [
      { stage: 1, name: "Orsetto Peluche", emoji: "🧸", minLevel: 1 },
      { stage: 2, name: "Cucciolo d'Orso", emoji: "🐻", minLevel: 2 },
      { stage: 3, name: "Orso Bruno", emoji: "🐻", minLevel: 3 },
      { stage: 4, name: "Orso Grizzly", emoji: "🐻💪", minLevel: 5 },
      { stage: 5, name: "Orso Polare", emoji: "🐻‍❄️", minLevel: 7 },
      { stage: 6, name: "Orso delle Borse", emoji: "📈🐻", minLevel: 10 },
      { stage: 7, name: "Orso Leggendario", emoji: "⚡🐻", minLevel: 15 },
      { stage: 8, name: "Re degli Orsi", emoji: "👑🐻", minLevel: 20 },
    ],
  },

  // ============= EPIC - Very hard to unlock (3 monsters) =============
  {
    id: "kraken",
    name: "Kraken",
    emoji: "🦑",
    description: "Creatura degli abissi che domina i mari della finanza",
    rarity: "epic",
    unlockCondition: {
      type: "bxp",
      value: 2000,
      description: "Accumula 2.000 BXP totali",
    },
    evolutions: [
      { stage: 1, name: "Larva Marina", emoji: "🦐", minLevel: 1 },
      { stage: 2, name: "Piccolo Polpo", emoji: "🐙", minLevel: 2 },
      { stage: 3, name: "Polpo Blu", emoji: "🐙", minLevel: 3 },
      { stage: 4, name: "Calamaro Gigante", emoji: "🦑", minLevel: 5 },
      { stage: 5, name: "Kraken Giovane", emoji: "🦑", minLevel: 7 },
      { stage: 6, name: "Kraken degli Abissi", emoji: "🌊🦑", minLevel: 10 },
      { stage: 7, name: "Kraken Antico", emoji: "⚡🦑", minLevel: 15 },
      { stage: 8, name: "Leviatano", emoji: "👑🦑", minLevel: 20 },
    ],
  },
  {
    id: "phoenix_golden",
    name: "Fenice Dorata",
    emoji: "🔥",
    description: "La forma suprema della Fenice, arde di ricchezza eterna",
    rarity: "epic",
    unlockCondition: {
      type: "savings",
      value: 5000,
      description: "Risparmia €5.000 nei tuoi obiettivi",
    },
    evolutions: [
      { stage: 1, name: "Scintilla Dorata", emoji: "✨", minLevel: 1 },
      { stage: 2, name: "Fiamma Aurea", emoji: "🔥", minLevel: 2 },
      { stage: 3, name: "Uccello d'Oro", emoji: "🐤", minLevel: 3 },
      { stage: 4, name: "Fenice Dorata", emoji: "🐦‍🔥", minLevel: 5 },
      { stage: 5, name: "Fenice Imperiale", emoji: "💛🐦‍🔥", minLevel: 7 },
      { stage: 6, name: "Fenice Solare", emoji: "☀️🐦‍🔥", minLevel: 10 },
      { stage: 7, name: "Fenice Astrale", emoji: "🌟🐦‍🔥", minLevel: 15 },
      { stage: 8, name: "Fenice Eterna", emoji: "👑🐦‍🔥", minLevel: 20 },
    ],
  },
  {
    id: "tiger",
    name: "Tigre Imperiale",
    emoji: "🐯",
    description: "Feroce e regale, domina le finanze con potenza assoluta",
    rarity: "epic",
    unlockCondition: {
      type: "streak",
      value: 60,
      description: "Raggiungi una streak di 60 giorni",
    },
    evolutions: [
      { stage: 1, name: "Tigrotto", emoji: "🐱", minLevel: 1 },
      { stage: 2, name: "Tigre Cucciolo", emoji: "🐯", minLevel: 2 },
      { stage: 3, name: "Tigre Giovane", emoji: "🐯", minLevel: 3 },
      { stage: 4, name: "Tigre del Bengala", emoji: "🐯", minLevel: 5 },
      { stage: 5, name: "Tigre Bianca", emoji: "🐯❄️", minLevel: 7 },
      { stage: 6, name: "Tigre Imperiale", emoji: "👑🐯", minLevel: 10 },
      { stage: 7, name: "Byakko", emoji: "⚡🐯", minLevel: 15 },
      { stage: 8, name: "Tigre Celestiale", emoji: "🌟🐯", minLevel: 20 },
    ],
  },

  // ============= LEGENDARY - Extremely hard to unlock (3 monsters) =============
  {
    id: "money_god",
    name: "Dio della Fortuna",
    emoji: "💰",
    description: "La divinità suprema della ricchezza, rarissima da incontrare",
    rarity: "legendary",
    unlockCondition: {
      type: "level",
      value: 15,
      description: "Raggiungi il livello 15",
    },
    evolutions: [
      { stage: 1, name: "Moneta Antica", emoji: "🪙", minLevel: 1 },
      { stage: 2, name: "Sacco d'Oro", emoji: "💰", minLevel: 2 },
      { stage: 3, name: "Forziere", emoji: "📦", minLevel: 3 },
      { stage: 4, name: "Tesoro", emoji: "💎", minLevel: 5 },
      { stage: 5, name: "Montagna d'Oro", emoji: "🏔️💰", minLevel: 7 },
      { stage: 6, name: "Spirito della Fortuna", emoji: "✨💰", minLevel: 10 },
      { stage: 7, name: "Avatar della Ricchezza", emoji: "👑💰", minLevel: 15 },
      { stage: 8, name: "Dio della Fortuna", emoji: "🏆💰", minLevel: 20 },
    ],
  },
  {
    id: "celestial_dragon",
    name: "Drago Celestiale",
    emoji: "🌌",
    description: "Il drago più potente, nato dalle stelle e custode dell'universo finanziario",
    rarity: "legendary",
    unlockCondition: {
      type: "special",
      value: 1,
      description: "Completa tutti gli obiettivi e raggiungi il livello 20",
    },
    evolutions: [
      { stage: 1, name: "Polvere Stellare", emoji: "✨", minLevel: 1 },
      { stage: 2, name: "Nebulosa", emoji: "🌌", minLevel: 2 },
      { stage: 3, name: "Stella Nascente", emoji: "⭐", minLevel: 3 },
      { stage: 4, name: "Costellazione", emoji: "🌟", minLevel: 5 },
      { stage: 5, name: "Galassia", emoji: "🌀", minLevel: 7 },
      { stage: 6, name: "Drago Stellare", emoji: "🐉✨", minLevel: 10 },
      { stage: 7, name: "Drago Galattico", emoji: "🐉🌌", minLevel: 15 },
      { stage: 8, name: "Shenlong", emoji: "👑🐉🌌", minLevel: 20 },
    ],
  },
  {
    id: "diamond_golem",
    name: "Golem di Diamante",
    emoji: "💎",
    description: "Creatura indistruttibile fatta di ricchezze pure, il guardiano definitivo",
    rarity: "legendary",
    unlockCondition: {
      type: "savings",
      value: 10000,
      description: "Risparmia €10.000 nei tuoi obiettivi",
    },
    evolutions: [
      { stage: 1, name: "Pietra Grezza", emoji: "🪨", minLevel: 1 },
      { stage: 2, name: "Cristallo", emoji: "💎", minLevel: 2 },
      { stage: 3, name: "Golem di Pietra", emoji: "🗿", minLevel: 3 },
      { stage: 4, name: "Golem di Ferro", emoji: "⚙️", minLevel: 5 },
      { stage: 5, name: "Golem d'Argento", emoji: "🪙", minLevel: 7 },
      { stage: 6, name: "Golem d'Oro", emoji: "💰", minLevel: 10 },
      { stage: 7, name: "Golem di Platino", emoji: "⚡💎", minLevel: 15 },
      { stage: 8, name: "Golem di Diamante", emoji: "👑💎", minLevel: 20 },
    ],
  },
];

export const isMonsterUnlocked = (
  monster: Monster,
  stats: {
    level: number;
    bxp: number;
    fxp: number;
    totalSavings: number;
    transactionCount: number;
    badgeCount: number;
    completedGoals: number;
    currentStreak: number;
    isPremium?: boolean;
  }
): boolean => {
  const { unlockCondition } = monster;

  switch (unlockCondition.type) {
    case "level":
      return stats.level >= unlockCondition.value;
    case "bxp":
      return stats.bxp >= unlockCondition.value;
    case "fxp":
      return stats.fxp >= unlockCondition.value;
    case "savings":
      return stats.totalSavings >= unlockCondition.value;
    case "transactions":
      return stats.transactionCount >= unlockCondition.value;
    case "badges":
      return stats.badgeCount >= unlockCondition.value;
    case "streak":
      return stats.currentStreak >= unlockCondition.value;
    case "special":
      return stats.completedGoals >= 3 && stats.level >= 20;
    case "premium":
      return stats.isPremium === true;
    default:
      return false;
  }
};

export const getUnlockProgress = (
  monster: Monster,
  stats: {
    level: number;
    bxp: number;
    fxp: number;
    totalSavings: number;
    transactionCount: number;
    badgeCount: number;
    completedGoals: number;
    currentStreak: number;
    isPremium?: boolean;
  }
): number => {
  const { unlockCondition } = monster;

  let current = 0;
  switch (unlockCondition.type) {
    case "level": {
      current = stats.level;
      break;
    }
    case "bxp": {
      current = stats.bxp;
      break;
    }
    case "fxp": {
      current = stats.fxp;
      break;
    }
    case "savings": {
      current = stats.totalSavings;
      break;
    }
    case "transactions": {
      current = stats.transactionCount;
      break;
    }
    case "badges": {
      current = stats.badgeCount;
      break;
    }
    case "streak": {
      current = stats.currentStreak;
      break;
    }
    case "special": {
      const goalProgress = Math.min(stats.completedGoals / 3, 1) * 50;
      const levelProgress = Math.min(stats.level / 20, 1) * 50;
      return goalProgress + levelProgress;
    }
    case "premium": {
      return stats.isPremium ? 100 : 0;
    }
    default:
      return 0;
  }

  return Math.min((current / unlockCondition.value) * 100, 100);
};
