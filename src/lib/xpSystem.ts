// Progressive XP System with loss mechanics

export interface XPCalculation {
  fxpGained: number;
  bxpGained: number;
  fxpLost: number;
  bxpLost: number;
  bonuses: string[];
  penalties: string[];
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  necessaryExpenses: number;
  unnecessaryExpenses: number;
  savingsRate: number; // percentage
}

// BXP scaling based on transaction amount
export const calculateTransactionBxp = (
  amount: number,
  isIncome: boolean,
  isNecessary: boolean,
  streakBonus: number = 1
): { bxp: number; breakdown: string[] } => {
  const breakdown: string[] = [];
  let baseBxp = 1;

  // Base BXP by transaction type
  if (isIncome) {
    // Income: 1 BXP base + scaled bonus
    baseBxp = 1 + Math.floor(amount / 100); // +1 BXP per €100
    breakdown.push(`Base entrata: +${baseBxp} BXP`);
  } else {
    if (isNecessary) {
      // Necessary expense: higher reward
      baseBxp = 3 + Math.floor(amount / 50); // +1 BXP per €50
      breakdown.push(`Spesa necessaria: +${baseBxp} BXP`);
    } else {
      // Unnecessary expense: lower reward but still positive
      baseBxp = 1 + Math.floor(amount / 200); // +1 BXP per €200
      breakdown.push(`Spesa non necessaria: +${baseBxp} BXP`);
    }
  }

  // Cap base BXP at 20
  baseBxp = Math.min(baseBxp, 20);

  // Apply streak bonus
  const finalBxp = Math.round(baseBxp * streakBonus);
  if (streakBonus > 1) {
    breakdown.push(`Bonus streak x${streakBonus.toFixed(1)}`);
  }

  return { bxp: finalBxp, breakdown };
};

// FXP calculation based on savings goals progress
export const calculateSavingsFxp = (
  amountAdded: number,
  goalTarget: number
): { fxp: number; breakdown: string[] } => {
  const breakdown: string[] = [];
  
  // Base: 10% of amount added
  const baseFxp = Math.round(amountAdded * 0.1);
  breakdown.push(`10% del risparmio: +${baseFxp} FXP`);
  
  // Bonus for large contributions (>10% of goal)
  const contributionRate = amountAdded / goalTarget;
  let bonusFxp = 0;
  
  if (contributionRate >= 0.5) {
    bonusFxp = 50;
    breakdown.push(`Contributo >50%: +50 FXP`);
  } else if (contributionRate >= 0.25) {
    bonusFxp = 25;
    breakdown.push(`Contributo >25%: +25 FXP`);
  } else if (contributionRate >= 0.1) {
    bonusFxp = 10;
    breakdown.push(`Contributo >10%: +10 FXP`);
  }

  return { fxp: baseFxp + bonusFxp, breakdown };
};

// Calculate BXP penalty for broken streak
export const calculateStreakPenalty = (brokenStreak: number): { bxpLost: number; message: string } => {
  if (brokenStreak === 0) {
    return { bxpLost: 0, message: "" };
  }

  // Progressive penalty based on streak lost
  let penalty = 10; // Base penalty
  
  if (brokenStreak >= 30) {
    penalty = 50;
  } else if (brokenStreak >= 14) {
    penalty = 30;
  } else if (brokenStreak >= 7) {
    penalty = 20;
  }

  return {
    bxpLost: penalty,
    message: `Streak di ${brokenStreak} giorni interrotta: -${penalty} BXP`,
  };
};

// Calculate monthly FXP bonus/penalty based on savings rate
export const calculateMonthlyFxpAdjustment = (stats: MonthlyStats): { fxpChange: number; message: string; isPositive: boolean } => {
  const { savingsRate, totalIncome, totalExpenses } = stats;
  
  // If in deficit (expenses > income)
  if (totalExpenses > totalIncome) {
    const deficitPercentage = ((totalExpenses - totalIncome) / totalIncome) * 100;
    const penalty = Math.round(deficitPercentage * 0.5); // 0.5% FXP loss per 1% deficit
    return {
      fxpChange: -Math.min(penalty, 50), // Cap at -50 FXP
      message: `Mese in deficit: -${Math.min(penalty, 50)} FXP`,
      isPositive: false,
    };
  }

  // Positive savings rate bonuses
  if (savingsRate >= 30) {
    return { fxpChange: 100, message: "Risparmio >30%: +100 FXP", isPositive: true };
  } else if (savingsRate >= 20) {
    return { fxpChange: 50, message: "Risparmio >20%: +50 FXP", isPositive: true };
  } else if (savingsRate >= 10) {
    return { fxpChange: 25, message: "Risparmio >10%: +25 FXP", isPositive: true };
  }

  return { fxpChange: 0, message: "", isPositive: true };
};

// Calculate BXP penalty for excessive unnecessary spending
export const calculateSpendingPenalty = (
  unnecessaryExpenses: number,
  totalIncome: number
): { bxpLost: number; message: string } => {
  if (totalIncome === 0) return { bxpLost: 0, message: "" };

  const unnecessaryRate = (unnecessaryExpenses / totalIncome) * 100;

  if (unnecessaryRate > 50) {
    return { bxpLost: 30, message: `Spese superflue >50%: -30 BXP` };
  } else if (unnecessaryRate > 40) {
    return { bxpLost: 20, message: `Spese superflue >40%: -20 BXP` };
  } else if (unnecessaryRate > 30) {
    return { bxpLost: 10, message: `Spese superflue >30%: -10 BXP` };
  }

  return { bxpLost: 0, message: "" };
};

// Daily check-in BXP reward
export const DAILY_CHECKIN_BXP = 5;

// Weekly challenge types
export interface WeeklyChallenge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: "no_unnecessary" | "savings_target" | "streak" | "budget";
  target: number;
  fxpReward: number;
  bxpReward: number;
}

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: "no_unnecessary_3",
    name: "Settimana Frugale",
    description: "Non fare spese non necessarie per 3 giorni",
    emoji: "🎯",
    type: "no_unnecessary",
    target: 3,
    fxpReward: 20,
    bxpReward: 15,
  },
  {
    id: "savings_100",
    name: "Risparmio Sprint",
    description: "Risparmia €100 questa settimana",
    emoji: "💰",
    type: "savings_target",
    target: 100,
    fxpReward: 30,
    bxpReward: 10,
  },
  {
    id: "streak_7",
    name: "Settimana Perfetta",
    description: "Mantieni una streak di 7 giorni",
    emoji: "🔥",
    type: "streak",
    target: 7,
    fxpReward: 15,
    bxpReward: 25,
  },
  {
    id: "budget_90",
    name: "Budget Master",
    description: "Rimani sotto il 90% del budget settimanale",
    emoji: "📊",
    type: "budget",
    target: 90,
    fxpReward: 25,
    bxpReward: 20,
  },
];

// Get random weekly challenge
export const getRandomChallenge = (): WeeklyChallenge => {
  const index = Math.floor(Math.random() * WEEKLY_CHALLENGES.length);
  return WEEKLY_CHALLENGES[index];
};
