import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
test('MCP stdio negotiates tools, audits source and confines folder access without mutation tools',async()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),'bar-mcp-'));
 const client=new Client({name:'bar-tests',version:'1.0.0'});
 const transport=new StdioClientTransport({command:process.execPath,args:[path.resolve('engine/mcp.mjs'),root]});
 try {
  writeFileSync(path.join(root,'a.jsx'),'<img/>');symlinkSync(os.tmpdir(),path.join(root,'outside'));
  await client.connect(transport);const listed=await client.listTools();
  assert.equal(listed.tools.length,6);assert.ok(listed.tools.every(x=>x.annotations.readOnlyHint));
  const r=await client.callTool({name:'bar_audit_source',arguments:{source:'<img/>'}});assert.equal(JSON.parse(r.content[0].text).findings.length,1);
  const folder=await client.callTool({name:'bar_audit',arguments:{path:'.'}});assert.equal(folder.isError,undefined);
  for(const p of ['..','outside',os.tmpdir()])assert.equal((await client.callTool({name:'bar_audit',arguments:{path:p}})).isError,true);
  assert.equal((await client.callTool({name:'bar_audit_source',arguments:{source:'x',extra:1}})).isError,true);
  assert.equal((await client.callTool({name:'bar_apply',arguments:{path:'.'}})).isError,true);
 }finally{await client.close();rmSync(root,{recursive:true,force:true});}
});
