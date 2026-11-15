# Roteiro de manutenção — Orçamento Freelancer

## O que o código faz

Calculadora de orçamento em TypeScript; núcleo de domínio sem interface comercial final.

## Arquivos de referência

`src/calculator.ts`, `test/calculator.test.ts`, `package.json` e `tsconfig.json`.

## Executar verificações

`npm install`, `npm test`, `npm run build`.

Use ambiente local e dados fictícios. O CI complementa, mas não substitui a inspeção do comportamento e das entradas de fronteira.

## Testes que não podem regredir

Cobrir horas negativas, taxas inválidas, valores de desconto, custos variáveis, arredondamento monetário e orçamento de zero horas.

## Próxima melhoria útil

Separar cálculo de geração de proposta em PDF/HTML; versionar cenários de preço fictícios e regras comerciais antes de criar UI.

### Antes de abrir PR

- [ ] Teste ou exemplo reproduzível para a alteração.
- [ ] README atualizado se o comando ou escopo mudou.
- [ ] Dados privados e segredos fora do controle de versão.
- [ ] Revisão em branch, sem merge automático.
