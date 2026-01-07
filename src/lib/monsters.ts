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
  type: "level" | "bxp" | "fxp" | "savings" | "streak" | "badges" | "transactions" | "special";
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
  // COMMON - Easy to unlock
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
      { stage: 1, name: "Uovo", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Pulcino", emoji: "🐣", minLevel: 2 },
      { stage: 3, name: "Uccellino", emoji: "🐥", minLevel: 4 },
      { stage: 4, name: "Giovane", emoji: "🐤", minLevel: 6 },
      { stage: 5, name: "Adulto", emoji: "🐔", minLevel: 8 },
      { stage: 6, name: "Fenice", emoji: "🦅", minLevel: 10 },
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
      { stage: 2, name: "Piccolo", emoji: "🐽", minLevel: 2 },
      { stage: 3, name: "Porcellino", emoji: "🐷", minLevel: 4 },
      { stage: 4, name: "Maialino", emoji: "🐖", minLevel: 6 },
      { stage: 5, name: "Cinghiale", emoji: "🐗", minLevel: 8 },
      { stage: 6, name: "Re Maiale", emoji: "👑🐷", minLevel: 10 },
    ],
  },

  // UNCOMMON - Medium difficulty
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
      { stage: 1, name: "Uovo Drago", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Draghetto", emoji: "🦎", minLevel: 2 },
      { stage: 3, name: "Piccolo Drago", emoji: "🐲", minLevel: 4 },
      { stage: 4, name: "Drago", emoji: "🐉", minLevel: 6 },
      { stage: 5, name: "Drago Anziano", emoji: "🔥🐉", minLevel: 8 },
      { stage: 6, name: "Drago Divino", emoji: "✨🐉", minLevel: 10 },
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
      { stage: 2, name: "Micio", emoji: "😺", minLevel: 2 },
      { stage: 3, name: "Gatto", emoji: "😸", minLevel: 4 },
      { stage: 4, name: "Gatto Saggio", emoji: "😼", minLevel: 6 },
      { stage: 5, name: "Maneki", emoji: "🎎", minLevel: 8 },
      { stage: 6, name: "Neko Divino", emoji: "✨🐱", minLevel: 10 },
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
      { stage: 1, name: "Uovo", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Gufetto", emoji: "🐤", minLevel: 2 },
      { stage: 3, name: "Civetta", emoji: "🦉", minLevel: 4 },
      { stage: 4, name: "Gufo", emoji: "🦉", minLevel: 6 },
      { stage: 5, name: "Gufo Antico", emoji: "📚🦉", minLevel: 8 },
      { stage: 6, name: "Arcigufo", emoji: "✨🦉", minLevel: 10 },
    ],
  },

  // RARE - Hard to unlock
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
      { stage: 1, name: "Polvere", emoji: "✨", minLevel: 1 },
      { stage: 2, name: "Pony", emoji: "🐴", minLevel: 2 },
      { stage: 3, name: "Cavallino", emoji: "🐎", minLevel: 4 },
      { stage: 4, name: "Unicorno", emoji: "🦄", minLevel: 6 },
      { stage: 5, name: "Alicorno", emoji: "🌈🦄", minLevel: 8 },
      { stage: 6, name: "Unicorno Celeste", emoji: "✨🦄", minLevel: 10 },
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
      { stage: 1, name: "Uovo", emoji: "🥚", minLevel: 1 },
      { stage: 2, name: "Tartarughina", emoji: "🐢", minLevel: 2 },
      { stage: 3, name: "Tartaruga", emoji: "🐢", minLevel: 4 },
      { stage: 4, name: "Tartaruga Marina", emoji: "🌊🐢", minLevel: 6 },
      { stage: 5, name: "Tartaruga Saggia", emoji: "📿🐢", minLevel: 8 },
      { stage: 6, name: "Tartaruga Cosmica", emoji: "🌌🐢", minLevel: 10 },
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
      { stage: 1, name: "Cucciolo", emoji: "🦊", minLevel: 1 },
      { stage: 2, name: "Volpina", emoji: "🦊", minLevel: 2 },
      { stage: 3, name: "Volpe", emoji: "🦊", minLevel: 4 },
      { stage: 4, name: "Volpe Rossa", emoji: "🔥🦊", minLevel: 6 },
      { stage: 5, name: "Kitsune", emoji: "🎭🦊", minLevel: 8 },
      { stage: 6, name: "Volpe Celestiale", emoji: "✨🦊", minLevel: 10 },
    ],
  },

  // EPIC - Very hard to unlock
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
      { stage: 1, name: "Larva", emoji: "🦐", minLevel: 1 },
      { stage: 2, name: "Polpo", emoji: "🐙", minLevel: 2 },
      { stage: 3, name: "Calamaro", emoji: "🦑", minLevel: 4 },
      { stage: 4, name: "Kraken", emoji: "🦑", minLevel: 6 },
      { stage: 5, name: "Kraken Antico", emoji: "🌊🦑", minLevel: 8 },
      { stage: 6, name: "Leviatano", emoji: "⚡🦑", minLevel: 10 },
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
      { stage: 1, name: "Scintilla", emoji: "✨", minLevel: 1 },
      { stage: 2, name: "Fiamma", emoji: "🔥", minLevel: 2 },
      { stage: 3, name: "Fenice", emoji: "🐦‍🔥", minLevel: 4 },
      { stage: 4, name: "Fenice Dorata", emoji: "💛🐦‍🔥", minLevel: 6 },
      { stage: 5, name: "Fenice Solare", emoji: "☀️🐦‍🔥", minLevel: 8 },
      { stage: 6, name: "Fenice Eterna", emoji: "👑🐦‍🔥", minLevel: 10 },
    ],
  },

  // LEGENDARY - Extremely hard to unlock
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
      { stage: 1, name: "Moneta", emoji: "🪙", minLevel: 1 },
      { stage: 2, name: "Sacco", emoji: "💰", minLevel: 2 },
      { stage: 3, name: "Forziere", emoji: "📦", minLevel: 4 },
      { stage: 4, name: "Tesoro", emoji: "💎", minLevel: 6 },
      { stage: 5, name: "Corona", emoji: "👑", minLevel: 8 },
      { stage: 6, name: "Dio della Fortuna", emoji: "🏆💰", minLevel: 10 },
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
      { stage: 3, name: "Stella", emoji: "⭐", minLevel: 4 },
      { stage: 4, name: "Costellazione", emoji: "🌟", minLevel: 6 },
      { stage: 5, name: "Galassia", emoji: "🌀", minLevel: 8 },
      { stage: 6, name: "Drago Celestiale", emoji: "🐉🌌", minLevel: 10 },
    ],
  },
];

// Helper function to check if a monster is unlocked
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
    case "special":
      // Special conditions - e.g., complete all goals AND reach level 20
      return stats.completedGoals >= 3 && stats.level >= 20;
    default:
      return false;
  }
};

// Get unlock progress as percentage
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
  }
): number => {
  const { unlockCondition } = monster;
  
  let current = 0;
  switch (unlockCondition.type) {
    case "level":
      current = stats.level;
      break;
    case "bxp":
      current = stats.bxp;
      break;
    case "fxp":
      current = stats.fxp;
      break;
    case "savings":
      current = stats.totalSavings;
      break;
    case "transactions":
      current = stats.transactionCount;
      break;
    case "badges":
      current = stats.badgeCount;
      break;
    case "special":
      // For special, use a combined metric
      const goalProgress = Math.min(stats.completedGoals / 3, 1) * 50;
      const levelProgress = Math.min(stats.level / 20, 1) * 50;
      return goalProgress + levelProgress;
    default:
      return 0;
  }
  
  return Math.min((current / unlockCondition.value) * 100, 100);
};
