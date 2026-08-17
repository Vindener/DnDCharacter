export function parseDice(dice: string): { count: number; sides: number } {
  const match = dice.match(/(\d+)d(\d+)/);
  if (!match) return { count: 0, sides: 0 };
  return { count: parseInt(match[1], 10), sides: parseInt(match[2], 10) };
}

export function rollDice(count: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}
