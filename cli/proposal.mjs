#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createProposal } from '../dist/proposal.js';
import { proposalMarkdown } from '../dist/formatter.js';

const HELP = [
  'Gerador de orçamento — Node.js / TypeScript:',
  '  npm run build',
  '  node cli/proposal.mjs CAMINHO-DA-PROPOSTA.json [SAIDA.md]',
  '',
  'Sem SAIDA.md, o resultado vai para a saída padrão.',
  'Arquivos de saída existentes nunca são sobrescritos.',
].join('\n');

export async function generate(sourceFile, destinationFile) {
  const info = await stat(sourceFile);
  if (!info.isFile() || info.size > 256_000) {
    throw new RangeError('arquivo de entrada inválido ou maior que 256 KB');
  }

  let input;
  try {
    input = JSON.parse(await readFile(sourceFile, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SyntaxError('a proposta precisa ser um JSON válido');
    }
    throw error;
  }

  const proposal = createProposal(input);
  const markdown = proposalMarkdown(proposal);
  if (destinationFile) {
    // wx avoids overwriting an existing proposal by accident.
    await writeFile(destinationFile, markdown, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
  } else {
    process.stdout.write(markdown);
  }
  return { id: proposal.id, totalCents: proposal.totalCents };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length < 1 || args.length > 2 || args[0] === '--help') {
    console.log(HELP);
    if (args[0] !== '--help') process.exitCode = 2;
  } else {
    generate(args[0], args[1]).catch((error) => {
      console.error('Erro: ' + error.message);
      process.exitCode = 1;
    });
  }
}
