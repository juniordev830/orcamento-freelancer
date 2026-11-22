export interface BudgetLine {
  description: string;
  hours: number;
  hourlyRate: number;
  expenses?: number;
}

interface Decimal {
  coefficient: bigint;
  scale: number;
}

function toDecimal(value: number): Decimal {
  const [mantissa, exponent = '0'] = value.toString().split('e');
  const [integer, fraction = ''] = mantissa.split('.');
  return {
    coefficient: BigInt(integer + fraction),
    scale: fraction.length - Number(exponent),
  };
}

function add(left: Decimal, right: Decimal): Decimal {
  const scale = Math.max(left.scale, right.scale);
  return {
    coefficient: left.coefficient * 10n ** BigInt(scale - left.scale)
      + right.coefficient * 10n ** BigInt(scale - right.scale),
    scale,
  };
}

function multiply(left: Decimal, right: Decimal): Decimal {
  return { coefficient: left.coefficient * right.coefficient, scale: left.scale + right.scale };
}

function roundToCents(value: Decimal): bigint {
  if (value.scale <= 2) {
    return value.coefficient * 10n ** BigInt(2 - value.scale);
  }
  const divisor = 10n ** BigInt(value.scale - 2);
  return (value.coefficient + divisor / 2n) / divisor;
}

export function roundMoneyToCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('money value is invalid');
  }
  const cents = roundToCents(toDecimal(value));
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('money value exceeds safe integer cents');
  }
  return Number(cents);
}

export function calculateBudget(lines: BudgetLine[], discountPct = 0): number {
  if (!Array.isArray(lines) || lines.length > 10_000) {
    throw new RangeError('lines must be an array with up to 10000 items');
  }
  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
    throw new RangeError('discountPct must be between 0 and 100');
  }
  const subtotal = lines.reduce<Decimal>((total, line) => {
    if (!line || typeof line.description !== 'string' || !line.description.trim() ||
        line.description.trim().length > 160 ||
        [...line.description].some((character) =>
          character.charCodeAt(0) < 32 ||
          /[\u007F\u202A-\u202E\u2066-\u2069]/u.test(character)) ||
        !Number.isFinite(line.hours) || line.hours < 0 ||
        !Number.isFinite(line.hourlyRate) || line.hourlyRate < 0 ||
        !Number.isFinite(line.expenses ?? 0) || (line.expenses ?? 0) < 0) {
      throw new RangeError('invalid budget line');
    }
    const labor = multiply(toDecimal(line.hours), toDecimal(line.hourlyRate));
    return add(total, add(labor, toDecimal(line.expenses ?? 0)));
  }, { coefficient: 0n, scale: 0 });

  const discount = toDecimal(discountPct);
  const discountFraction = { coefficient: -discount.coefficient, scale: discount.scale + 2 };
  const multiplier = add({ coefficient: 1n, scale: 0 }, discountFraction);
  const cents = roundToCents(multiply(subtotal, multiplier));
  const total = Number(`${cents}e-2`);
  if (!Number.isFinite(total)) throw new RangeError('budget total is not finite');
  return total;
}
