import { calculateBudget, type BudgetLine } from './calculator.js';

const MAX_MONEY_CENTS = 100_000_000_000;
const DAY_MS = 86_400_000;

export interface PaymentStageInput {
  title: string;
  percentage: number;
}

export interface ProposalInput {
  id: string;
  client: string;
  project: string;
  issuedOn: string;
  validDays: number;
  lines: BudgetLine[];
  discountPct?: number;
  contingencyPct?: number;
  paymentStages?: PaymentStageInput[];
  notes?: string;
}

export interface ProposalItem extends BudgetLine {
  totalCents: number;
}

export interface PaymentStage {
  title: string;
  percentage: number;
  amountCents: number;
}

export interface Proposal {
  id: string;
  client: string;
  project: string;
  issuedOn: string;
  expiresOn: string;
  validDays: number;
  notes: string;
  items: ProposalItem[];
  discountPct: number;
  contingencyPct: number;
  subtotalCents: number;
  discountCents: number;
  contingencyCents: number;
  totalCents: number;
  stages: PaymentStage[];
}

export function calendarDay(value: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError('date must use YYYY-MM-DD');
  }
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError('invalid calendar date');
  }
  return date;
}

export function percentageToBasisPoints(value: number, name = 'percentage'): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(name + ' must be between 0 and 100');
  }
  const basisPoints = Math.round(value * 100);
  if (Math.abs(value * 100 - basisPoints) > 0.000001) {
    throw new RangeError(name + ' must have at most two decimal places');
  }
  return basisPoints;
}

function requireName(value: unknown, name: string, limit: number): string {
  if (typeof value !== 'string') throw new RangeError(name + ' must be a string');
  const result = value.trim();
  if (!result || result.length > limit || /[\u0000-\u001F]/.test(result)) {
    throw new RangeError(name + ' is empty, too long, or contains control characters');
  }
  return result;
}

function toCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError('money value is invalid');
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || cents > MAX_MONEY_CENTS) {
    throw new RangeError('money value exceeds the supported range');
  }
  return cents;
}

function distributeCents(totalCents: number, weights: number[]): number[] {
  // Largest-remainder allocation keeps exact totals without losing cents.
  const parts = weights.map((weight, index) => {
    const exact = totalCents * weight / 10_000;
    const floor = Math.floor(exact);
    return { index, floor, remainder: exact - floor };
  });
  let unallocated = totalCents - parts.reduce((sum, part) => sum + part.floor, 0);
  const rank = [...parts].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index,
  );
  for (const part of rank) {
    if (unallocated-- <= 0) break;
    parts[part.index].floor += 1;
  }
  return parts.map((part) => part.floor);
}

export function createPaymentPlan(totalCents: number, stages: PaymentStageInput[]): PaymentStage[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0 || totalCents > MAX_MONEY_CENTS) {
    throw new RangeError('totalCents must be a non-negative integer in range');
  }
  if (!Array.isArray(stages) || stages.length < 1 || stages.length > 10) {
    throw new RangeError('choose between 1 and 10 payment stages');
  }
  const cleaned = stages.map((stage) => {
    if (!stage || typeof stage !== 'object') throw new RangeError('invalid payment stage');
    return {
      title: requireName(stage.title, 'payment stage title', 80),
      basisPoints: percentageToBasisPoints(stage.percentage, 'stage percentage'),
    };
  });
  if (cleaned.reduce((sum, stage) => sum + stage.basisPoints, 0) !== 10_000) {
    throw new RangeError('payment stage percentages must add up to 100');
  }
  const amounts = distributeCents(totalCents, cleaned.map((stage) => stage.basisPoints));
  return cleaned.map((stage, index) => ({
    title: stage.title,
    percentage: stage.basisPoints / 100,
    amountCents: amounts[index],
  }));
}

export function createProposal(input: ProposalInput): Proposal {
  if (!input || typeof input !== 'object') throw new TypeError('proposal is required');

  const id = requireName(input.id, 'proposal id', 50);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new RangeError('proposal id has invalid characters');
  const client = requireName(input.client, 'client', 120);
  const project = requireName(input.project, 'project', 120);
  const issuedOn = calendarDay(input.issuedOn);
  if (!Number.isInteger(input.validDays) || input.validDays < 1 || input.validDays > 365) {
    throw new RangeError('validDays must be between 1 and 365');
  }
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 100) {
    throw new RangeError('proposal must contain between 1 and 100 budget items');
  }
  const notes = input.notes ?? '';
  if (typeof notes !== 'string' || notes.length > 1000 || /[\u0000-\u0008]/.test(notes)) {
    throw new RangeError('notes must be text up to 1000 characters');
  }

  const discountBP = percentageToBasisPoints(input.discountPct ?? 0, 'discountPct');
  const contingencyBP = percentageToBasisPoints(input.contingencyPct ?? 0, 'contingencyPct');

  const items: ProposalItem[] = input.lines.map((line) => {
    if (!line || typeof line !== 'object') throw new RangeError('budget item must be an object');
    const description = requireName(line.description, 'budget item description', 160);
    if (!Number.isFinite(line.hours) || line.hours < 0 || line.hours > 100_000 ||
        !Number.isFinite(line.hourlyRate) || line.hourlyRate < 0 || line.hourlyRate > 1_000_000 ||
        !Number.isFinite(line.expenses ?? 0) || (line.expenses ?? 0) < 0 ||
        (line.expenses ?? 0) > 1_000_000) {
      throw new RangeError('invalid hours, hourly rate or expenses');
    }
    const totalCents = toCents(calculateBudget([{ ...line, description }]));
    return { ...line, description, totalCents };
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  if (subtotalCents > MAX_MONEY_CENTS) throw new RangeError('budget subtotal too large');
  const discountCents = Math.round(subtotalCents * discountBP / 10_000);
  const discountedCents = subtotalCents - discountCents;
  // Contingency is a configurable project reserve, not a legal tax.
  const contingencyCents = Math.round(discountedCents * contingencyBP / 10_000);
  const totalCents = discountedCents + contingencyCents;
  if (totalCents > MAX_MONEY_CENTS) throw new RangeError('budget total too large');

  const defaultStages = [
    { title: 'Início', percentage: 50 },
    { title: 'Entrega', percentage: 50 },
  ];
  const stages = createPaymentPlan(totalCents, input.paymentStages ?? defaultStages);
  const expiresOn = new Date(issuedOn.getTime() + input.validDays * DAY_MS)
    .toISOString().slice(0, 10);
  return {
    id, client, project, issuedOn: input.issuedOn, expiresOn,
    validDays: input.validDays, notes, items,
    discountPct: discountBP / 100,
    contingencyPct: contingencyBP / 100,
    subtotalCents, discountCents, contingencyCents, totalCents, stages,
  };
}

export function isProposalExpired(proposal: Proposal, currentDay: string): boolean {
  calendarDay(currentDay);
  calendarDay(proposal.expiresOn);
  return currentDay > proposal.expiresOn;
}
