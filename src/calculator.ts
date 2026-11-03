export interface BudgetLine {
  description: string;
  hours: number;
  hourlyRate: number;
  expenses?: number;
}

export interface BudgetItem {
  description: string;
  total: number;
}

export interface BudgetBreakdown {
  items: BudgetItem[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  total: number;
}

/** Monetary values use integer cents internally to keep displayed totals consistent. */
function amountInCents(value: number): number {
  if (!Number.isFinite(value) || value < 0 ||
      !Number.isSafeInteger(Math.round(value * 100))) {
    throw new RangeError('budget amount outside supported range');
  }
  return Math.round(value * 100);
}

export function calculateBudgetBreakdown(lines: BudgetLine[], discountPct = 0): BudgetBreakdown {
  if (!Array.isArray(lines) || !Number.isFinite(discountPct) ||
      discountPct < 0 || discountPct > 100) {
    throw new RangeError('discountPct must be between 0 and 100');
  }
  let subtotalCents = 0;
  const items = lines.map((line) => {
    if (typeof line.description !== 'string' || !line.description.trim() ||
        !Number.isFinite(line.hours) || line.hours < 0 ||
        !Number.isFinite(line.hourlyRate) || line.hourlyRate < 0 ||
        !Number.isFinite(line.expenses ?? 0) || (line.expenses ?? 0) < 0) {
      throw new RangeError('invalid budget line');
    }
    const itemCents = amountInCents(line.hours * line.hourlyRate + (line.expenses ?? 0));
    subtotalCents += itemCents;
    if (!Number.isSafeInteger(subtotalCents)) {
      throw new RangeError('budget subtotal outside supported range');
    }
    return { description: line.description.trim(), total: itemCents / 100 };
  });
  const discountCents = Math.round(subtotalCents * discountPct / 100);
  const totalCents = subtotalCents - discountCents;
  return {
    items,
    subtotal: subtotalCents / 100,
    discountPct,
    discountAmount: discountCents / 100,
    total: totalCents / 100,
  };
}

export function calculateBudget(lines: BudgetLine[], discountPct = 0): number {
  return calculateBudgetBreakdown(lines, discountPct).total;
}
