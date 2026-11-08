import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calendarDay, percentageToBasisPoints, createPaymentPlan,
  createProposal, isProposalExpired, type ProposalInput,
} from '../src/proposal.js';

const demo: ProposalInput = {
  id: 'GX-123',
  client: 'Cliente de Teste',
  project: 'Website de Exemplo',
  issuedOn: '2026-11-07',
  validDays: 30,
  lines: [
    { description: 'Desenvolvimento', hours: 10, hourlyRate: 80 },
    { description: 'Suporte', hours: 2, hourlyRate: 50, expenses: 20 },
  ],
  discountPct: 10,
  contingencyPct: 5,
  paymentStages: [
    { title: 'Início', percentage: 30 },
    { title: 'Entrega', percentage: 70 },
  ],
  notes: 'Contrato sujeito a aceite.',
};

test('accepts leap-day dates and rejects impossible calendar dates', () => {
  assert.equal(calendarDay('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
  for (const invalid of ['2026-02-29', '2026-04-31', '2026-1-1', 'bad']) {
    assert.throws(() => calendarDay(invalid), RangeError);
  }
});

test('enforces precise percentage inputs', () => {
  assert.equal(percentageToBasisPoints(12.34), 1234);
  assert.equal(percentageToBasisPoints(100), 10000);
  for (const invalid of [-1, 101, 2.345, Infinity, NaN]) {
    assert.throws(() => percentageToBasisPoints(invalid), RangeError);
  }
});

test('allocates every cent exactly to payment stages', () => {
  const plan = createPaymentPlan(101, [
    { title: 'A', percentage: 33.33 },
    { title: 'B', percentage: 33.33 },
    { title: 'C', percentage: 33.34 },
  ]);
  assert.deepEqual(plan.map(stage => stage.amountCents), [34, 33, 34]);
  assert.equal(plan.reduce((s, stage) => s + stage.amountCents, 0), 101);
  const oneCent = createPaymentPlan(1, [
    { title: 'Início', percentage: 50 },
    { title: 'Entrega', percentage: 50 },
  ]);
  assert.deepEqual(oneCent.map(stage => stage.amountCents), [1, 0]);
});

test('rejects invalid payment stage splits', () => {
  assert.throws(() => createPaymentPlan(100, []), RangeError);
  assert.throws(() => createPaymentPlan(100, [
    { title: 'Início', percentage: 30 },
    { title: 'Entrega', percentage: 60 },
  ]), /100/);
  assert.throws(() => createPaymentPlan(100, [
    { title: '', percentage: 100 },
  ]), RangeError);
  assert.throws(() => createPaymentPlan(-1, [
    { title: 'Total', percentage: 100 },
  ]), RangeError);
});

test('creates detailed, discounted proposals with exact totals', () => {
  const result = createProposal(demo);
  assert.equal(result.issuedOn, '2026-11-07');
  assert.equal(result.expiresOn, '2026-12-07');
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].totalCents, 80000);
  assert.equal(result.items[1].totalCents, 12000);
  assert.equal(result.subtotalCents, 92000);
  assert.equal(result.discountCents, 9200);
  assert.equal(result.contingencyCents, 4140);
  assert.equal(result.totalCents, 86940);
  assert.equal(result.stages[0].amountCents, 26082);
  assert.equal(result.stages[1].amountCents, 60858);
});

test('default installments are balanced and preserve the exact total', () => {
  const result = createProposal({
    ...demo,
    discountPct: 0,
    contingencyPct: 0,
    paymentStages: undefined,
  });
  assert.equal(result.stages.length, 2);
  assert.deepEqual(result.stages.map(stage => stage.percentage), [50, 50]);
  assert.equal(result.stages[0].amountCents + result.stages[1].amountCents, result.totalCents);
});

test('does not modify the proposal input', () => {
  const source = structuredClone(demo);
  createProposal(demo);
  assert.deepEqual(demo, source);
});

test('rejects invalid customer, project, budget and validity data', () => {
  const invalid: ProposalInput[] = [
    { ...demo, id: 'spaces not allowed' },
    { ...demo, client: '   ' },
    { ...demo, project: '\nInjected' },
    { ...demo, issuedOn: '2026-02-30' },
    { ...demo, validDays: 0 },
    { ...demo, validDays: 366 },
    { ...demo, lines: [] },
    { ...demo, discountPct: 100.01 },
    { ...demo, contingencyPct: 12.345 },
    { ...demo, lines: [{ description: 'Dev', hours: -1, hourlyRate: 1 }] },
    { ...demo, lines: [{ description: 'Dev', hours: 2, hourlyRate: Infinity }] },
  ];
  for (const input of invalid) assert.throws(() => createProposal(input));
});

test('detects expiry only after the last valid day', () => {
  const proposal = createProposal(demo);
  assert.equal(isProposalExpired(proposal, '2026-12-07'), false);
  assert.equal(isProposalExpired(proposal, '2026-12-08'), true);
  assert.throws(() => isProposalExpired(proposal, '2026-02-30'), RangeError);
});

test('zero discount and contingency still yield a well-defined proposal', () => {
  const proposal = createProposal({
    ...demo,
    lines: [{ description: 'Auditoria', hours: 0, hourlyRate: 0 }],
    discountPct: 0,
    contingencyPct: 0,
    paymentStages: [{ title: 'Única', percentage: 100 }],
  });
  assert.equal(proposal.totalCents, 0);
  assert.equal(proposal.stages[0].amountCents, 0);
});
