# Orçamento Freelancer

Biblioteca de domínio em **TypeScript** para calcular propostas por horas, valor/hora, despesas e descontos.

## Funcionalidades

- `calculateBudget(lines, discountPct)`: devolve o total da proposta, compatível com o uso anterior.
- `calculateBudgetBreakdown(lines, discountPct)`: devolve uma memória de cálculo com itens, subtotal, desconto percentual, valor descontado e total.
- Valores financeiros são calculados em **centavos inteiros** após arredondar cada item. O desconto é arredondado para centavos, assegurando que `total = subtotal - discountAmount` no relatório.
- Valida descrições, quantidades, taxas, despesas, descontos de 0% a 100%, overflow e valores não finitos.

## Exemplo

```ts
import { calculateBudgetBreakdown } from './src/calculator.js';

const proposal = calculateBudgetBreakdown([
  { description: 'Desenvolvimento de API', hours: 10, hourlyRate: 80 },
  { description: 'Deslocamento', hours: 2, hourlyRate: 50, expenses: 20 },
], 10);

console.log(proposal);
// items: 800 e 120, subtotal: 920, desconto: 92, total: 828
```

## Testar e compilar

```bash
npm install
npm test
npm run build
```

O GitHub Actions executa os testes e a compilação em pushes e pull requests. Os dados do exemplo são fictícios.

## Escopo e limitações

Trata-se de uma biblioteca em memória, sem formulário, geração de PDF, banco, emissão fiscal ou persistência de propostas. O cálculo usa `number` do JavaScript e arredondamento em centavos por item, **não aritmética decimal exata**, e não substitui um sistema de contabilidade. Para cobrança com regras tributárias ou conciliação bancária, será necessário definir moeda, encargos, precisão e legislação aplicável.

Não versionar dados pessoais ou credenciais.

Licença: ainda não definida.
