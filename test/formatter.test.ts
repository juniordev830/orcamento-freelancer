import assert from 'node:assert/strict';
import test from 'node:test';
import { createProposal } from '../src/proposal.js';
import { markdownText, moneyBRL, proposalMarkdown } from '../src/formatter.js';

function demoProposal() {
  return createProposal({
    id: 'GX-2026-001',
    client: 'Empresa de Exemplo',
    project: 'Sistema de estoque',
    issuedOn: '2026-11-07',
    validDays: 15,
    lines: [
      { description: 'Backend', hours: 10, hourlyRate: 90, expenses: 25 },
      { description: 'Frontend', hours: 5, hourlyRate: 80 },
    ],
    discountPct: 5,
    contingencyPct: 2,
    paymentStages: [
      { title: 'Início', percentage: 20 },
      { title: 'Entrega', percentage: 80 },
    ],
    notes: 'Dados fictícios para teste.',
  });
}

test('formats cents as Brazilian currency and checks input', () => {
  assert.match(moneyBRL(12345), /R\$\s*123,45/);
  assert.match(moneyBRL(0), /R\$\s*0,00/);
  assert.throws(() => moneyBRL(-1), RangeError);
  assert.throws(() => moneyBRL(1.3), RangeError);
});

test('escapes untrusted Markdown and inline HTML', () => {
  const unsafe = 'Teste | <script>alert(1)</script>\nPlanilha';
  const safe = markdownText(unsafe);
  assert.match(safe, /\\\|/);
  assert.match(safe, /&lt;script&gt;/);
  assert.doesNotMatch(safe, /<script>/);
  assert.equal(safe.includes('\n'), false);
  const withBackticks = markdownText('cmd ' + String.fromCharCode(96) + 'echo' + String.fromCharCode(96));
  assert.equal(withBackticks.includes(String.fromCharCode(92, 96)), true);
});

test('generates a proposal with totals and payment stages', () => {
  const markdown = proposalMarkdown(demoProposal());
  assert.match(markdown, /Proposta de Serviços/);
  assert.match(markdown, /Cliente:.*Empresa de Exemplo/);
  assert.match(markdown, /Backend/);
  assert.match(markdown, /Frontend/);
  assert.match(markdown, /Resumo financeiro/);
  assert.match(markdown, /Etapas de pagamento/);
  assert.match(markdown, /Aceite|Entrega/);
  assert.match(markdown, /R\$/);
  assert.match(markdown, /não constitui|Não constitui/);
});

test('escapes project-controlled values in rendered table rows', () => {
  const proposal = createProposal({
    id: 'X1',
    client: 'Alpha <Beta>',
    project: 'Painel | Portal',
    issuedOn: '2026-11-07',
    validDays: 7,
    lines: [{ description: 'Tela | Relatório', hours: 1, hourlyRate: 10 }],
  });
  const rendered = proposalMarkdown(proposal);
  assert.match(rendered, /&lt;Beta&gt;/);
  assert.match(rendered, /Painel \\\| Portal/);
  assert.match(rendered, /Tela \\\| Relatório/);
});
