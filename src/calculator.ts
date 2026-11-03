export interface BudgetLine {
  description: string;
  hours: number;
  hourlyRate: number;
  expenses?: number;
}

export function calculateBudget(lines: BudgetLine[], discountPct = 0): number {
  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
    throw new RangeError('discountPct must be between 0 and 100');
  }
  const subtotal = lines.reduce((total, line) => {
    if (!line.description.trim() || !Number.isFinite(line.hours) || line.hours < 0 ||
        !Number.isFinite(line.hourlyRate) || line.hourlyRate < 0 ||
        !Number.isFinite(line.expenses ?? 0) || (line.expenses ?? 0) < 0) {
      throw new RangeError('invalid budget line');
    }
    return total + line.hours * line.hourlyRate + (line.expenses ?? 0);
  }, 0);
  const total = subtotal * (1 - discountPct / 100);
  if (!Number.isFinite(total)) throw new RangeError('budget total is not finite');
  return Math.round(total * 100) / 100;
}
