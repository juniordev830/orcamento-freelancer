import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBudget, calculateBudgetBreakdown } from '../src/calculator.js';

test('calculates line items and discount', () => {
  assert.equal(calculateBudget([
    { description: 'Desenvolvimento', hours: 10, hourlyRate: 80 },
    { description: 'Deslocamento', hours: 2, hourlyRate: 50, expenses: 20 },
  ], 10), 828);
});

test('rejects invalid budget values', () => {
  assert.throws(() => calculateBudget([{ description: '', hours: 1, hourlyRate: 10 }]), RangeError);
  assert.throws(() => calculateBudget([{ description: 'Dev', hours: -1, hourlyRate: 10 }]), RangeError);
});

test('returns consistent itemized subtotal, discount and total', () => {
  const lines = [
    { description: ' Desenvolvimento ', hours: 10, hourlyRate: 80 },
    { description: 'Deslocamento', hours: 2, hourlyRate: 50, expenses: 20 },
  ];
  assert.deepEqual(calculateBudgetBreakdown(lines, 10), {
    items: [
      { description: 'Desenvolvimento', total: 800 },
      { description: 'Deslocamento', total: 120 },
    ],
    subtotal: 920,
    discountPct: 10,
    discountAmount: 92,
    total: 828,
  });
  assert.equal(calculateBudget(lines, 10), 828);
});

test('rounds individual lines to cents and keeps sum reconciled', () => {
  const breakdown = calculateBudgetBreakdown([
    { description: 'A', hours: 1, hourlyRate: 0.104 },
    { description: 'B', hours: 1, hourlyRate: 0.104 },
    { description: 'C', hours: 1, hourlyRate: 0.104 },
  ], 10);
  assert.equal(Math.round(breakdown.items.reduce((sum, item) => sum + item.total * 100, 0)), Math.round(breakdown.subtotal * 100));
  assert.equal(breakdown.subtotal, 0.3);
  assert.equal(breakdown.discountAmount, 0.03);
  assert.equal(breakdown.total, 0.27);
});

test('validates discount and item values before returning a breakdown', () => {
  assert.throws(() => calculateBudgetBreakdown([], -1), RangeError);
  assert.throws(() => calculateBudgetBreakdown([], 101), RangeError);
  assert.throws(() => calculateBudgetBreakdown([], Number.NaN), RangeError);
  assert.throws(() => calculateBudgetBreakdown([{ description: 'x', hours: 1, hourlyRate: Infinity }]), RangeError);
  assert.throws(() => calculateBudgetBreakdown([{ description: 'x', hours: 1e20, hourlyRate: 5 }]), RangeError);
  assert.deepEqual(calculateBudgetBreakdown([]), {
    items: [], subtotal: 0, discountPct: 0, discountAmount: 0, total: 0,
  });
});
