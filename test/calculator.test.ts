import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateBudget } from '../src/calculator.js';

test('calculates line items and discount', () => {
  assert.equal(calculateBudget([
    { description: 'Desenvolvimento', hours: 10, hourlyRate: 80 },
    { description: 'Deslocamento', hours: 2, hourlyRate: 50, expenses: 20 },
  ], 10), 810);
});

test('rejects invalid budget values', () => {
  assert.throws(() => calculateBudget([{ description: '', hours: 1, hourlyRate: 10 }]), RangeError);
  assert.throws(() => calculateBudget([{ description: 'Dev', hours: -1, hourlyRate: 10 }]), RangeError);
});
