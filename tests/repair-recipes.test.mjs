import test from 'node:test';
import assert from 'node:assert/strict';
import {parse} from '@babel/parser';
import {repair} from '../engine/repair.mjs';
import {buildButton} from '../engine/build.mjs';
test('explicit native button type and label preserve handlers and are idempotent',()=>{
 const input='<button data-bar-type="button" data-bar-label="Close dialog" onClick={close} />';
 const r=repair(input); assert.equal(r.changes.length,2);assert.match(r.source,/type="button"/);assert.match(r.source,/aria-label=\{"Close dialog"\}/);assert.match(r.source,/onClick=\{close\}/);assert.equal(repair(r.source).changes.length,0);
});
test('unknown button semantics or label are never invented',()=>{
 for(const s of ['<button onClick={x}/>', '<button data-bar-type="launch"/>','<button data-bar-type={kind}/>','<IconButton data-bar-label="Delete" {...props}/>','<button data-bar-label="new" aria-label="old"/>','<button data-bar-type="button" type="submit"/>']) assert.equal(repair(s).source,s);
});
test('decorative SVG opt-in has semantic conflict guards',()=>{
 assert.match(repair('<svg data-bar-decorative="true"><path /></svg>').source,/aria-hidden="true" focusable="false"/);
 for(const attr of ['role="img"','aria-label="Chart"','aria-labelledby="heading"','tabIndex={0}','focusable="true"','aria-hidden="false"','{...props}']) {const s=`<svg data-bar-decorative="true" ${attr}/>`;assert.equal(repair(s).source,s);}
});
test('label and BUILD output cannot inject JSX expressions',()=>{
 const label='{globalThis.pwned=true} < &';const jsx=buildButton({label}).jsx;const ast=parse(jsx,{plugins:['jsx']});assert.equal(ast.program.body[0].expression.children.some(x=>x.type==='JSXExpressionContainer'),false);
 const fixed=repair('<button data-bar-label="&quot;}{evil()}"/>').source;assert.doesNotThrow(()=>parse(fixed,{plugins:['jsx']}));
});
test('recipes refuse malformed input, duplicate markers and text decoys',()=>{
 for(const s of ['const = <button data-bar-type="button"/>','<button data-bar-label="a" data-bar-label="b"/>', 'const x = \'<button data-bar-type="button"/>\';']) assert.equal(repair(s).source,s);
});

test('SVG repair refuses interactive and dynamic descendants',()=>{
  for(const children of ['<a href="/">link</a>','{content}','<path onClick={go}/>','<foreignObject/>','<title>Meaning</title>']) assert.equal(repair(`<svg data-bar-decorative="true">${children}</svg>`).changes.length,0);
});

test('decorative repairs refuse all existing ARIA descriptions, titles and interactive intent',()=>{
 for(const attribute of ['aria-describedby="details"','aria-description="Meaning"','aria-details="details"','title="Meaning"','tabIndex="0"','tabindex="0"','onClick={go}','onclick="go()"','xlink:href="#target"']){
  assert.equal(repair(`<svg data-bar-decorative="true" ${attribute}><path d="M0 0"/></svg>`).changes.length,0);
  assert.equal(repair(`<svg data-bar-decorative="true"><g ${attribute}><path d="M0 0"/></g></svg>`).changes.length,0);
  assert.equal(repair(`<img data-bar-decorative="true" ${attribute}/>`).changes.length,0);
 }
});
