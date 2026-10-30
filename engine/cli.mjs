#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';
import { auditCssFolder } from './css-audit.mjs';
import { browserExitCode } from './report-status.mjs';
import { audit } from './audit.mjs';
import { repair } from './repair.mjs';
import { buildButton } from './build.mjs';
import { auditFolder, previewFolder, applyPlan, undoPlan } from './workspace.mjs';
const sourceFile = file => { const stat=statSync(file); if(!stat.isFile()||stat.size>2*1024*1024)throw new Error('Source must be a regular file up to 2 MiB'); return readFileSync(file,'utf8'); };
const jsonFile = file => { const stat=statSync(file); if(!stat.isFile()||stat.size>16*1024*1024)throw new Error('Expected regular JSON file up to 16 MiB'); return JSON.parse(readFileSync(file,'utf8')); };
const [command, argument, ...rest] = process.argv.slice(2);
try {
  let result;
  if (command === '--version' && !argument) result=jsonFile(new URL('../package.json',import.meta.url)).version;
  else if (['--help','help'].includes(command) && !argument) result={commands:['build "Label" [variant]','build-component <id> <options.json>','registry','qa-plan [options.json]','qa-rules [filter.json]','qa-review <review.json>','suggest-replacements <audit-report.json>','audit <file|folder>','audit-css <folder> [--config JSON] [--baseline JSON]','audit-browser <config.json> [--yes]','repair <file>','preview <folder>','apply <folder> <plan.json> --yes','undo <folder> <journal-id> --yes'],exitCodes:{0:'completed without blocking findings',1:'findings',2:'invalid input or incomplete/error'},mcp:'bar-mcp <workspace-root>'};
  else if (command === 'registry' && !argument) { const {listComponents}=await import('../packages/registry/index.mjs');result=listComponents(); }
  else if (command === 'build-component' && argument && rest.length===1) { const {generateComponent}=await import('../packages/components/generate.mjs');result=generateComponent(argument,jsonFile(rest[0])); }
  else if (command === 'qa-plan' && !rest.length) { const {createAuditPlan}=await import('../packages/qa/index.mjs');result=createAuditPlan(argument?jsonFile(argument):{}); }
  else if (command === 'qa-rules' && !rest.length) { const {listRules}=await import('../packages/qa/index.mjs');result=listRules(argument?jsonFile(argument):{}); }
  else if (command === 'qa-review' && argument && !rest.length) { const {recordReview}=await import('../packages/qa/index.mjs');result=recordReview(jsonFile(argument)); }
  else if (command === 'suggest-replacements' && argument && !rest.length) { const {suggestReplacements}=await import('../packages/registry/suggest.mjs');result=suggestReplacements(jsonFile(argument)); }
  else if (command === 'audit-browser' && argument && (rest.length===0 || (rest.length===1&&rest[0]==='--yes'))) {
    const config=jsonFile(argument);
    if(['capture','update'].includes(config.baselineMode)&&rest[0]!=='--yes')throw new Error('Baseline capture/update requires --yes after reviewing config');
    const {runBrowserAudit}=await import('./browser-audit.mjs');result=await runBrowserAudit(config);
    process.exitCode=browserExitCode(result);
  }
  else if (command === 'audit-css' && argument) {
    let config = {}, baseline = null;
    for (let i=0;i<rest.length;i+=2) {
      if (!['--config','--baseline'].includes(rest[i]) || !rest[i+1]) throw new Error('Expected --config <json> or --baseline <json>');
      if (!statSync(rest[i+1]).isFile()) throw new Error('CSS input JSON must be a regular file');
      if (statSync(rest[i+1]).size > 16*1024*1024) throw new Error('CSS input JSON exceeds 16 MiB');
      const value=JSON.parse(readFileSync(rest[i+1],'utf8'));
      if(rest[i]==='--config') config=value; else baseline=value;
    }
    result=auditCssFolder(argument,config,baseline);
    if(result.errors.length) process.exitCode=2;
    else if(result.summary.warnings) process.exitCode=1;
  } else if (command === 'build') result = buildButton({ label: argument || 'Action', variant: rest[0] || 'contained' });
  else if (command === 'audit' && argument && !rest.length) {
    result = statSync(argument).isDirectory() ? auditFolder(argument) : audit(sourceFile(argument), argument);
    if (result.errors?.length || result.analysis?.imageSyntaxParsed === false) process.exitCode = 2;
    else if (result.summary.high) process.exitCode = 1;
  } else if (command === 'repair' && argument && !rest.length) result = repair(sourceFile(argument), argument);
  else if (command === 'preview' && argument && !rest.length) result = previewFolder(argument);
  else if (['apply', 'undo'].includes(command) && argument && rest.length === 2 && rest[1] === '--yes') {
    if (command === 'apply') {
      if (statSync(rest[0]).size > 64 * 1024 * 1024) throw new Error('Plan exceeds 64 MiB');
      result = applyPlan(argument, JSON.parse(readFileSync(rest[0], 'utf8')));
    } else result = undoPlan(argument, rest[0]);
  } else throw new Error('Usage: audit-css <folder> [--config config.json] [--baseline report.json] | build "Label" [variant] | audit <file|folder> | repair <file> | preview <folder> | apply <folder> <plan.json> --yes | undo <folder> <journal-id> --yes');
  console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 2; }
