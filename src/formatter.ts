import type { Proposal } from './proposal.js';

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const escapedEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

export function moneyBRL(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError('monetary amount must be a non-negative integer');
  }
  return currency.format(cents / 100);
}

export function markdownText(value: string): string {
  if (typeof value !== 'string') throw new TypeError('Markdown text must be a string');
  // Escape HTML and Markdown special characters in untrusted text fields.
  const escaped = value
    .replace(/[&<>]/g, (ch) => escapedEntities[ch])
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\\|*_![\]]/g, '\\$&');
  return escaped.replace(
    new RegExp(String.fromCharCode(96), 'g'),
    String.fromCharCode(92, 96),
  );
}

export function proposalMarkdown(proposal: Proposal): string {
  const lines: string[] = [
    '# Proposta de Serviços — ' + markdownText(proposal.id),
    '',
    '**Cliente:** ' + markdownText(proposal.client),
    '**Projeto:** ' + markdownText(proposal.project),
    '**Emissão:** ' + proposal.issuedOn,
    '**Válida até:** ' + proposal.expiresOn,
    '',
    '## Itens do orçamento',
    '',
    '| Serviço | Horas | Valor/hora | Despesas | Total |',
    '| --- | ---: | ---: | ---: | ---: |',
  ];

  for (const item of proposal.items) {
    lines.push([
      '| ' + markdownText(item.description),
      String(item.hours),
      moneyBRL(Math.round(item.hourlyRate * 100)),
      moneyBRL(Math.round((item.expenses ?? 0) * 100)),
      moneyBRL(item.totalCents) + ' |',
    ].join(' | '));
  }

  lines.push(
    '',
    '## Resumo financeiro',
    '',
    '| Categoria | Valor |',
    '| --- | ---: |',
    '| Subtotal | ' + moneyBRL(proposal.subtotalCents) + ' |',
    '| Desconto (' + proposal.discountPct + '%) | ' + moneyBRL(proposal.discountCents) + ' |',
    '| Reserva (' + proposal.contingencyPct + '%) | ' + moneyBRL(proposal.contingencyCents) + ' |',
    '| **Total** | **' + moneyBRL(proposal.totalCents) + '** |',
    '',
    '## Etapas de pagamento',
    '',
    '| Etapa | Percentual | Valor |',
    '| --- | ---: | ---: |',
  );

  for (const stage of proposal.stages) {
    lines.push(
      '| ' + markdownText(stage.title) + ' | ' + stage.percentage + '% | ' +
      moneyBRL(stage.amountCents) + ' |',
    );
  }

  if (proposal.notes.trim()) {
    lines.push('', '## Observações', '', markdownText(proposal.notes));
  }
  lines.push(
    '',
    '---',
    '',
    'Documento gerado localmente a partir de dados fornecidos pelo usuário.',
    'Não constitui nota fiscal, contrato assinado ou cálculo de tributos legais.',
    '',
  );
  return lines.join('\n');
}
