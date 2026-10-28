#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';
import { audit } from './audit.mjs';
import { repair } from './repair.mjs';
import { buildButton } from './build.mjs';
import { auditFolder, previewFolder, applyPlan, undoPlan } from './workspace.mjs';
const [command, argument, ...rest] = process.argv.slice(2);
try {
  let result;
  if (command === 'build') result = buildButton({ label: argument || 'Action', variant: rest[0] || 'contained' });
  else if (command === 'audit' && argument && !rest.length) {
    result = statSync(argument).isDirectory() ? auditFolder(argument) : audit(readFileSync(argument, 'utf8'), argument);
    if (result.errors?.length || result.analysis?.imageSyntaxParsed === false) process.exitCode = 2;
    else if (result.summary.high) process.exitCode = 1;
  } else if (command === 'repair' && argument && !rest.length) result = repair(readFileSync(argument, 'utf8'), argument);
  else if (command === 'preview' && argument && !rest.length) result = previewFolder(argument);
  else if (['apply', 'undo'].includes(command) && argument && rest.length === 2 && rest[1] === '--yes') {
    if (command === 'apply') {
      if (statSync(rest[0]).size > 64 * 1024 * 1024) throw new Error('Plan exceeds 64 MiB');
      result = applyPlan(argument, JSON.parse(readFileSync(rest[0], 'utf8')));
    } else result = undoPlan(argument, rest[0]);
  } else throw new Error('Usage: build "Label" [variant] | audit <file|folder> | repair <file> | preview <folder> | apply <folder> <plan.json> --yes | undo <folder> <journal-id> --yes');
  console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 2; }
