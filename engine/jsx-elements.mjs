import { parse } from '@babel/parser';
export function scanElements(source) {
  let ast, offset = 0;
  try { ast = parse(source, {sourceType:'module',plugins:['jsx','typescript']}); }
  catch {
    if (!source.trim().startsWith('<') || !source.trim().endsWith('>')) return {parsed:false,elements:[]};
    try {
      ast = parse(`<>${source}</>`, {sourceType:'module',plugins:['jsx','typescript']});
      const root = ast.program.body[0]?.expression;
      if(ast.program.body.length!==1 || root?.type!=='JSXFragment' || root.start!==0 || root.end!==source.length+5 || root.children.some(c=>!['JSXElement','JSXFragment'].includes(c.type)&&!(c.type==='JSXText'&&!c.value.trim()))) return {parsed:false,elements:[]};
      offset=2;
    } catch { return {parsed:false,elements:[]}; }
  }
  const elements=[];
  function safeDecorativeTree(n) {
    if (!n || typeof n !== 'object') return true;
    if (['JSXExpressionContainer','JSXSpreadAttribute','JSXSpreadChild'].includes(n.type)) return false;
    if (n.type === 'JSXOpeningElement') {
      if (n.name.type !== 'JSXIdentifier' || !['svg','g','path','circle','ellipse','rect','line','polyline','polygon'].includes(n.name.name)) return false;
      if (n.attributes.some(a => { if(a.type!=='JSXAttribute')return false; const name=(a.name.type==='JSXIdentifier'?a.name.name:a.name.namespace.name+':'+a.name.name.name).toLowerCase(); return /^on/.test(name)||/^aria-/.test(name)||['tabindex','focusable','role','title','href','xlinkhref','xlink:href'].includes(name); })) return false;
    }
    return Object.entries(n).every(([k,v]) => ['loc','comments','tokens','errors'].includes(k) || (Array.isArray(v) ? v.every(safeDecorativeTree) : safeDecorativeTree(v)));
  }
  function visit(n, parent){
    if(!n||typeof n!=='object')return;
    if(n.type==='JSXOpeningElement'&&n.name.type==='JSXIdentifier') {
      const attrs=n.attributes.filter(a=>a.type==='JSXAttribute');
      const has=name=>attrs.some(a=>a.name.name===name);
      const literal=name=>{const a=attrs.filter(a=>a.name.name===name);return a.length===1&&a[0].value?.type==='StringLiteral'?a[0].value.value:undefined;};
      elements.push({name:n.name.name,start:n.start-offset,insert:n.name.end-offset,has,literal,spread:n.attributes.some(a=>a.type==='JSXSpreadAttribute'),safeDecorative:safeDecorativeTree(parent)});
    }
    for(const [k,v] of Object.entries(n)){if(['loc','comments','tokens','errors'].includes(k))continue;if(Array.isArray(v))v.forEach(child=>visit(child,n));else if(v&&typeof v==='object')visit(v,n);}
  }
  visit(ast);return {parsed:true,elements};
}
export function repairCandidates(source) {
  const scan=scanElements(source),changes=[];
  const add=(e,ruleId,after,reason)=>changes.push({ruleId,start:e.insert,end:e.insert,before:'',after,reason});
  for(const e of scan.elements){
    if(e.spread)continue;
    if(e.name==='button'&&!e.has('type')&&['button','submit','reset'].includes(e.literal('data-bar-type')))
      add(e,'form.explicit-button-type',` type=${JSON.stringify(e.literal('data-bar-type'))}`,'Author supplied explicit button type in data-bar-type.');
    if(['button','IconButton'].includes(e.name)&&!e.has('aria-label')&&!e.has('aria-labelledby')&&!e.has('title')&&e.literal('data-bar-label')?.trim())
      add(e,'a11y.explicit-control-label',` aria-label={${JSON.stringify(e.literal('data-bar-label'))}}`,'Author supplied exact accessible name in data-bar-label.');
    if(e.name==='svg'&&e.safeDecorative&&e.literal('data-bar-decorative')==='true'&&!['role','aria-label','aria-labelledby','aria-hidden','tabIndex','focusable'].some(e.has))
      add(e,'a11y.decorative-svg',` aria-hidden="true" focusable="false"`,'Author explicitly marked this SVG as decorative.');
  }
  return {parsed:scan.parsed,changes};
}
