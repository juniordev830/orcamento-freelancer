# Orçamento Freelancer

Propostas de serviços calculadas por horas e despesas.

## Estado atual

MVP executável em branch de desenvolvimento, com testes automatizados. Calculadora de orçamento com horas, despesas e desconto. Ainda não há interface, emissão de proposta ou persistência.

## Tecnologias implementadas

Node.js 20+ e TypeScript.

## Escopo da primeira versão

- [ ] Cadastrar itens e horas
- [x] Calcular totais e descontos
- [ ] Exportar proposta em PDF

## Critérios para concluir a primeira versão

- [ ] Implementar o fluxo principal com validação de entradas e tratamento de erros.
- [ ] Documentar instalação, configuração e execução com comandos reproduzíveis.
- [ ] Adicionar exemplos de uso e dados fictícios.
- [ ] Verificar os casos principais e limites e registrar os resultados.

## Desenvolvimento

Execute na raiz do repositório:

```bash
npm install
npm test
npm run build
```

O GitHub Actions executa a validação em pushes e pull requests. Este é um núcleo demonstrativo; as funcionalidades ainda marcadas como pendentes na lista acima continuam planejadas.

## Privacidade e configuração

Usar dados fictícios nos exemplos e manter senhas, tokens, arquivos pessoais e credenciais fora do controle de versão.

## Licença

Ainda não definida.

## Documentação para manutenção

O [guia de validação](docs/GUIA_DE_VALIDACAO.md) contém testes de regressão, pontos críticos e critérios para revisar a próxima alteração.
