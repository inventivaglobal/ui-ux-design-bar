#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
import {audit} from './audit.mjs';
import {repair} from './repair.mjs';
import {buildButton} from './build.mjs';
const [command,argument,...rest]=process.argv.slice(2);
if(command==='build'){console.log(JSON.stringify(buildButton({label:argument||'Action',variant:rest[0]||'contained'}),null,2));}
else if(['audit','repair'].includes(command)&&argument){
  const source=readFileSync(argument,'utf8');
  const result=command==='audit'?audit(source,argument):repair(source,argument);
  console.log(JSON.stringify(result,null,2));
  if(command==='audit'&&result.summary.high) process.exitCode=1;
}else{console.error('Usage: node engine/cli.mjs build "Label" [variant] | audit <file> | repair <file>');process.exitCode=2;}
