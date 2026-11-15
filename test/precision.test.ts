import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentPlan } from '../src/proposal.js';

const percentages = [
  { title: 'Design', percentage: 33.33 },
  { title: 'Desenvolvimento', percentage: 33.33 },
  { title: 'Entrega', percentage: 33.34 },
];

test('maiores restos distribuem centavos com desempate determinístico', () => {
  const scenarios: [number, number[]][] = [
    [0, [0, 0, 0]],
    [1, [0, 0, 1]],
    [2, [1, 0, 1]],
    [3, [1, 1, 1]],
    [101, [34, 33, 34]],
    [100_000_000_000, [33_330_000_000, 33_330_000_000, 33_340_000_000]],
  ];
  for (const [total, expected] of scenarios) {
    const result = createPaymentPlan(total, percentages);
    assert.deepEqual(result.map((stage) => stage.amountCents), expected, String(total));
    assert.deepEqual(createPaymentPlan(total, percentages), result);
  }
});

test('parcelas sempre somam o total e se desviam menos de um centavo da proporção ideal', () => {
  const weights = [12.34, 17.65, 70.01];
  const stages = weights.map((percentage, index) => ({ title: 'Etapa ' + index, percentage }));
  const totals = [0, 1, 2, 3, 7, 9, 11, 99, 1001, 9999, 123456789, 100_000_000_000];
  for (const total of totals) {
    const plan = createPaymentPlan(total, stages);
    assert.equal(plan.reduce((sum, stage) => sum + stage.amountCents, 0), total);
    for (const [i, stage] of plan.entries()) {
      assert.ok(Number.isSafeInteger(stage.amountCents) && stage.amountCents >= 0);
      const bp = BigInt(Math.round(weights[i] * 100));
      const exactProduct = BigInt(total) * bp;
      const difference = BigInt(stage.amountCents) * 10_000n - exactProduct;
      assert.ok(difference > -10_000n && difference < 10_000n,
        'Etapa ' + i + ' fora de um centavo da parcela ideal');
    }
  }
});
