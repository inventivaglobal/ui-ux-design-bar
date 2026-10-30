#!/usr/bin/env node
// Local stdio only. Mutation deliberately stays in the explicit CLI approval flow.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { realpathSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditFolder, previewFolder } from './workspace.mjs';
import { auditCssFolder } from './css-audit.mjs';
import { audit } from './audit.mjs';
import { repair } from './repair.mjs';
import { buildButton } from './build.mjs';
const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const descriptions={bar_audit:'Read-only JSX/TSX folder audit',bar_css_audit:'Read-only CSS source audit',bar_preview:'Preview safe author-opt-in repairs; no files written',bar_audit_source:'Audit supplied JSX/TSX source',bar_repair_source:'Return repaired supplied source; never writes files',bar_build_button:'Generate a labelled MUI button as source'};
export function createBarServer(root) {
 const workspace=realpathSync(root);
 const server=new Server({name:'ui-ux-design-bar',version},{capabilities:{tools:{}}});
 const folder=name=>{if(typeof name!=='string'||path.isAbsolute(name))throw new Error('Path must be relative to configured workspace');const p=realpathSync(path.resolve(workspace,name));const rel=path.relative(workspace,p);if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw new Error('Path escapes configured workspace');return p;};
 server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:Object.entries(descriptions).map(([name,description])=>({name,description,annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false},inputSchema:{type:'object',properties:name==='bar_build_button'?{label:{type:'string'}}:name.endsWith('_source')?{source:{type:'string',maxLength:2097152}}:{path:{type:'string'}},required:[name==='bar_build_button'?'label':name.endsWith('_source')?'source':'path'],additionalProperties:false}}))}));
 server.setRequestHandler(CallToolRequestSchema,async request=>{
  try {
   const {name,arguments:a={}}=request.params;let result;
   if(!Object.hasOwn(descriptions,name))throw new Error('Unknown BAR tool');
   const key=name==='bar_build_button'?'label':name.endsWith('_source')?'source':'path';
   if(Object.keys(a).length!==1||typeof a[key]!=='string'||a[key].length>2097152)throw new Error('Invalid arguments');
   if(name==='bar_audit')result=auditFolder(folder(a.path));
   if(name==='bar_css_audit')result=auditCssFolder(folder(a.path));
   if(name==='bar_preview')result=previewFolder(folder(a.path));
   if(name==='bar_audit_source')result=audit(a.source);
   if(name==='bar_repair_source')result=repair(a.source);
   if(name==='bar_build_button')result=buildButton({label:a.label});
   return {content:[{type:'text',text:JSON.stringify(result)}]};
  }catch(error){return {isError:true,content:[{type:'text',text:error.message}]};}
 });
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.length!==3){console.error('Usage: bar-mcp <workspace-root>');process.exitCode=2;}
 else await createBarServer(process.argv[2]).connect(new StdioServerTransport());
}
