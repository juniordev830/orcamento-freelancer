import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBudget, roundMoneyToCents } from '../src/calculator.js';

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

test('rounds half a cent up after multiplying hours by the hourly rate', () => {
  assert.equal(calculateBudget([{ description: 'Dev', hours: 0.3, hourlyRate: 3.35 }]), 1.01);
  assert.equal(calculateBudget([{ description: 'Dev', hours: 1, hourlyRate: 10.075 }]), 10.08);
});

test('rounds only after all expenses and the discount have been applied', () => {
  const lines = [
    { description: 'Dev', hours: 1, hourlyRate: 1.115 },
    { description: 'Expense', hours: 0, hourlyRate: 0, expenses: 0.01 },
  ];
  assert.equal(calculateBudget(lines, 10), 1.01);
  assert.equal(calculateBudget(lines.reverse(), 10), 1.01);
  assert.equal(calculateBudget(lines, 100), 0);
});

test('handles scientific notation, finite large totals, and overflow', () => {
  assert.equal(calculateBudget([{ description: 'Dev', hours: 1e-8, hourlyRate: 1e8 }]), 1);
  assert.equal(calculateBudget([{ description: 'Dev', hours: 1, hourlyRate: 1e308 }]), 1e308);
  assert.throws(
    () => calculateBudget([{ description: 'Dev', hours: 2, hourlyRate: 1e308 }]),
    RangeError,
  );
});

test('roundMoneyToCents rejects values beyond exact integer-cent precision', () => {
  assert.equal(roundMoneyToCents(0.015), 2);
  assert.equal(roundMoneyToCents(123.45), 12345);
  assert.throws(() => roundMoneyToCents(1e15), RangeError);
});

test('calculateBudget validates collection and line shapes consistently', () => {
  assert.throws(() => calculateBudget(null as unknown as []), RangeError);
  assert.throws(() => calculateBudget([null] as unknown as []), RangeError);
  assert.throws(() => calculateBudget([{ description: 5, hours: 1, hourlyRate: 10 }] as unknown as []), RangeError);
  assert.throws(() => calculateBudget(Array(10_001).fill({ description: 'Dev', hours: 1, hourlyRate: 1 })), RangeError);
});
