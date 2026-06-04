export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export type RollDiceInput = {
  dice: DiceType;
  count?: number;
  modifier?: number;
  proficiencyBonus?: number;
  includeProficiency?: boolean;
  mode?: RollMode;
  label?: string;
  random?: () => number;
};

export type RollFormulaInput = {
  formula: string;
  label?: string;
  random?: () => number;
};

export type DiceRollResult = {
  label?: string;
  formula: string;
  rolls: number[];
  usedRoll: number;
  modifier: number;
  proficiencyBonus: number;
  total: number;
  mode: RollMode;
  isCriticalSuccess: boolean;
  isCriticalFailure: boolean;
  createdAt: Date;
};

type FormulaTerm =
  | { type: 'dice'; sign: 1 | -1; count: number; sides: number }
  | { type: 'constant'; sign: 1 | -1; value: number };

const DICE_SIDES: Record<DiceType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
  d100: 100,
};

const DEFAULT_RANDOM = () => Math.random();

function randomInt(max: number, random: () => number): number {
  return Math.floor(random() * max) + 1;
}

function clampCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(Math.max(Math.floor(count), 1), 100);
}

function formatSigned(value: number): string {
  if (value === 0) return '';
  return value > 0 ? ` + ${value}` : ` - ${Math.abs(value)}`;
}

function normalizeFormula(count: number, dice: DiceType, modifier: number, proficiencyBonus: number): string {
  return `${count}${dice}${formatSigned(modifier)}${formatSigned(proficiencyBonus)}`.trim();
}

function parseFormulaTerms(rawFormula: string): FormulaTerm[] {
  const compact = rawFormula.trim().toLowerCase().replace(/\s+/g, '');
  if (!compact) throw new Error('Формула порожня.');
  if (!/^[+-]?(?:\d*d\d+|\d+)(?:[+-](?:\d*d\d+|\d+))*$/.test(compact)) {
    throw new Error('Формула має виглядати як 1d20+5, 2d6+3 або 1d8.');
  }

  const normalized = /^[+-]/.test(compact) ? compact : `+${compact}`;
  const matches = normalized.match(/[+-](?:\d*d\d+|\d+)/g) || [];

  return matches.map((token) => {
    const sign: 1 | -1 = token.startsWith('-') ? -1 : 1;
    const body = token.slice(1);
    const diceMatch = body.match(/^(\d*)d(\d+)$/);
    if (diceMatch) {
      const count = clampCount(diceMatch[1] ? parseInt(diceMatch[1], 10) : 1);
      const sides = parseInt(diceMatch[2], 10);
      if (!Number.isFinite(sides) || sides < 2 || sides > 1000) throw new Error('Некоректний кубик у формулі.');
      return { type: 'dice' as const, sign, count, sides };
    }

    return { type: 'constant' as const, sign, value: parseInt(body, 10) || 0 };
  });
}

export function rollDice(input: RollDiceInput): DiceRollResult {
  const mode = input.mode ?? 'normal';
  const dice = input.dice;
  const sides = DICE_SIDES[dice];
  const random = input.random ?? DEFAULT_RANDOM;
  const count = clampCount(input.count ?? 1);
  const modifier = input.modifier ?? 0;
  const proficiencyBonus = input.includeProficiency ? input.proficiencyBonus ?? 0 : 0;

  if (!sides) throw new Error('Непідтримуваний кубик.');
  if (mode !== 'normal' && (dice !== 'd20' || count !== 1)) {
    throw new Error('Перевага і перешкода доступні тільки для 1d20.');
  }

  const rollCount = mode === 'normal' ? count : 2;
  const rolls = Array.from({ length: rollCount }, () => randomInt(sides, random));
  const usedRoll =
    mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : rolls.reduce((sum, value) => sum + value, 0);
  const total = usedRoll + modifier + proficiencyBonus;
  const isD20Check = dice === 'd20' && count === 1;

  return {
    label: input.label,
    formula: normalizeFormula(count, dice, modifier, proficiencyBonus),
    rolls,
    usedRoll,
    modifier,
    proficiencyBonus,
    total,
    mode,
    isCriticalSuccess: isD20Check && usedRoll === 20,
    isCriticalFailure: isD20Check && usedRoll === 1,
    createdAt: new Date(),
  };
}

export function rollFormula(input: RollFormulaInput): DiceRollResult {
  const terms = parseFormulaTerms(input.formula);
  const random = input.random ?? DEFAULT_RANDOM;
  const rolls: number[] = [];
  let diceTotal = 0;
  let modifier = 0;

  terms.forEach((term) => {
    if (term.type === 'constant') {
      modifier += term.sign * term.value;
      return;
    }

    for (let index = 0; index < term.count; index += 1) {
      const roll = randomInt(term.sides, random);
      rolls.push(roll);
      diceTotal += term.sign * roll;
    }
  });

  if (!rolls.length) throw new Error('Формула має містити хоча б один кубик.');

  return {
    label: input.label,
    formula: input.formula.trim().replace(/\s+/g, ' '),
    rolls,
    usedRoll: diceTotal,
    modifier,
    proficiencyBonus: 0,
    total: diceTotal + modifier,
    mode: 'normal',
    isCriticalSuccess: false,
    isCriticalFailure: false,
    createdAt: new Date(),
  };
}

export function parseDiceType(sides: number): DiceType {
  const match = Object.entries(DICE_SIDES).find(([, value]) => value === sides);
  if (!match) throw new Error('Непідтримуваний кубик.');
  return match[0] as DiceType;
}
