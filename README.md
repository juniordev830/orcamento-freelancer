# Orçamento Freelancer

Ferramenta local em **TypeScript e Node.js 20+** para gerar propostas de serviços com itens, descontos, reserva financeira, parcelas e prazo de validade.

## Funcionalidades nesta branch

- Calcula preços por horas, taxa/hora e despesas por item.
- Gera uma proposta com identificação, cliente, projeto, data de emissão e vencimento.
- Valida nomes, datas, valores, limites e porcentagens de até duas casas decimais.
- Aplica desconto e reserva de contingência configuráveis. A reserva **não** é um tributo.
- Divide o total em até 10 etapas de pagamento, com alocação exata dos centavos.
- Exporta a proposta em **Markdown**, com caracteres especiais escapados.
- Inclui testes automatizados e uma CLI que evita sobrescrever propostas existentes.

## Instalar e testar

```bash
npm install
npm test
npm run build
```

## Gerar uma proposta

Com o JSON de exemplo (contém apenas informações fictícias):

```bash
npm run demo
npm run build
node cli/proposal.mjs examples/proposta-exemplo.json
node cli/proposal.mjs examples/proposta-exemplo.json minha-proposta.md
```

Sem um arquivo de saída, o conteúdo Markdown é exibido no terminal. Quando um nome de saída é fornecido, a CLI cria um arquivo novo e **não sobrescreve** um arquivo existente.

Para criar sua própria proposta, copie o JSON de exemplo para um arquivo privado, ajuste os valores e execute a CLI passando esse caminho. Evite versionar dados verdadeiros de clientes.

## Regras financeiras

- Valor de cada item: horas × valor/hora + despesas, com arredondamento para centavos.
- Subtotal: soma dos itens arredondados.
- Desconto: percentual sobre o subtotal.
- Contingência: percentual sobre o subtotal depois do desconto.
- Etapas de pagamento: os percentuais devem somar exatamente **100%**.
- A divisão utiliza o método dos maiores restos para que a soma das parcelas seja exatamente igual ao total, inclusive com centavos.
- O prazo informado é em dias corridos, de 1 a 365 dias. Datas usam o formato AAAA-MM-DD.

**Atenção:** isso não calcula impostos brasileiros, não emite notas fiscais e não substitui contrato ou aconselhamento contábil. A implementação atual **não exporta PDF**; o Markdown gerado pode ser convertido posteriormente em ferramentas apropriadas.

## Estrutura

- `src/calculator.ts`: função inicial de cálculo (API preservada).
- `src/proposal.ts`: validação, orçamento detalhado, validade e rateio das parcelas.
- `src/formatter.ts`: valores em reais e formatação Markdown.
- `cli/proposal.mjs`: ferramenta de linha de comando.
- `examples/proposta-exemplo.json`: exemplo com dados fictícios.
- `test/*.test.ts`: testes para regras financeiras, validações, vencimento e saída.

## Privacidade

Execute localmente e mantenha contratos, valores de clientes e dados confidenciais fora do GitHub público. O gerador não transmite informações para serviços externos.

## Licença

Ainda não definida.
