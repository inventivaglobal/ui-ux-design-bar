import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default || traverseModule;

const defaults = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.bar'];
const extensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx']);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end', 'extra'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
}
function validate(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('CSS config must be an object');
  for (const key of Object.keys(config)) if (!['version','roots','exclude','tokenNamespaces'].includes(key)) throw new Error(`Unknown CSS config key: ${key}`);
  if (config.version !== undefined && config.version !== 1) throw new Error('Unsupported CSS config version');
  for (const key of ['roots','exclude','tokenNamespaces']) if (config[key] !== undefined && (!Array.isArray(config[key]) || config[key].some(x => typeof x !== 'string' || !x.length))) throw new Error(`${key} must be an array of nonempty strings`);
  for (const item of [...(config.roots || []), ...(config.exclude || [])]) if (path.isAbsolute(item) || item.split(/[\\/]/).includes('..') || item.includes('\\')) throw new Error('Config paths must be relative POSIX paths without traversal');
  for (const prefix of config.tokenNamespaces || []) if (!/^--[\w-]+$/.test(prefix)) throw new Error('Token namespaces must start with --');
}

/** Source-only, report-only analysis. Never resolves runtime styles or edits files. */
export function auditCssFolder(directory, config = {}, baseline = null) {
  validate(config);
  const root = fs.realpathSync(directory);
  if (!fs.statSync(root).isDirectory()) throw new Error('Expected a directory');
  const findings = [], errors = [], files = new Map(), css = new Map();
  const excludes = [...defaults, ...(config.exclude || [])];
  const rel = file => path.relative(root, file).split(path.sep).join('/');
  const excluded = name => excludes.some(x => name === x || name.startsWith(x + '/') || (!x.includes('/') && name.split('/').includes(x)));
  const contained = file => { const relative=path.relative(root,file); return relative==='' || (!relative.startsWith('..'+path.sep) && relative!=='..' && !path.isAbsolute(relative)); };
  let totalBytes=0, visited=0, stopped=false, findingLimit=false;
  const discover = file => {
    if(stopped) return;
    if(++visited>20000) { errors.push({file:'',message:'Traversal limit exceeded'}); stopped=true; return; }
    if (!contained(file)) throw new Error('Path outside root');
    const name = rel(file);
    if (excluded(name)) return;
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) { errors.push({file:name,message:'Skipped symbolic link'}); return; }
    if (stat.isDirectory()) { for (const entry of fs.readdirSync(file).sort()) discover(path.join(file,entry)); return; }
    if (!stat.isFile() || !extensions.has(path.extname(file))) return;
    if (stat.size > 2 * 1024 * 1024 || files.size >= 5000) { errors.push({file:name,message:'Source size/file limit exceeded'}); return; }
    if (!files.has(file)) {
      if(totalBytes + stat.size > 32*1024*1024) { errors.push({file:name,message:'Aggregate source size limit exceeded'}); stopped=true; return; }
      totalBytes+=stat.size; files.set(file,fs.readFileSync(file,'utf8'));
    }
  };
  for (const entry of config.roots || ['.']) {
    const target = path.resolve(root,entry);
    // Inspect each component: a symlinked parent must not escape discovery.
    let cursor = root;
    for (const part of path.relative(root,target).split(path.sep).filter(Boolean)) { cursor = path.join(cursor,part); if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Root traverses a symbolic link'); }
    discover(target);
  }
  const add = (file, rule, node, message, evidence, severity='warning') => {
    if(findings.length>=10000) { if(!findingLimit) errors.push({file:rel(file),message:'Finding limit exceeded'}); findingLimit=true; return; }
    const line = node?.source?.start?.line || node?.loc?.start?.line || 1;
    const column = node?.source?.start?.column || (node?.loc?.start?.column ?? 0)+1;
    findings.push({rule,file:rel(file),line,column,severity,repairable:false,message,evidence});
  };
  for (const [file,source] of files) if (file.endsWith('.css')) {
    try {
      const ast = postcss.parse(source,{from:file}), classes = new Set();
      let uncertain = false;
      const contexts = new Map(), anonymousLayers = new WeakMap();
      let layerOrdinal=0;
      ast.walkAtRules(at => { if(at.name==='layer' && !at.params.trim()) anonymousLayers.set(at,++layerOrdinal); if(at.name==='value') uncertain=true; });
      ast.walkRules(rule => {
        if (rule.selector.includes(':export') || /:global(?!\s*\()/.test(rule.selector)) uncertain=true;
        try { selectorParser(selectors => selectors.walkClasses(c => { let global = false; for(let p=c.parent;p;p=p.parent) if(p.type==='pseudo' && p.value===':global') global=true; if(!global) classes.add(c.value); })).processSync(rule.selector); }
        catch { uncertain=true; add(file,'css-selector-unknown',rule,'Selector could not be analyzed',rule.selector,'info'); }
        const chain=[]; for(let p=rule.parent;p && p.type!=='root';p=p.parent) chain.unshift(p.type==='atrule'?`@${p.name} ${p.params}${anonymousLayers.has(p)?` [anonymous ${anonymousLayers.get(p)}]`:""}`:p.selector);
        const declarations = (rule.nodes || []).filter(n=>n.type==='decl');
        const seen = new Set();
        for (const declaration of declarations) {
          const key = JSON.stringify([declaration.prop,declaration.value,declaration.important || false]);
          if (seen.has(key)) add(file,'css-duplicate-declaration',declaration,'Repeated exact declaration; review cascade before changing',key);
          seen.add(key);
        }
        // Nested nodes/at-rules mean declaration-only equality is insufficient.
        if (declarations.length && rule.nodes.every(n=>['decl','comment'].includes(n.type))) {
          const key=JSON.stringify([chain,rule.selector,declarations.map(n=>[n.prop,n.value,!!n.important])]);
          if(contexts.has(key)) add(file,'css-duplicate-rule',rule,'Repeated rule in identical ancestor context; review cascade/order',key);
          else contexts.set(key,rule.source.start.line);
        }
      });
      ast.walkDecls(decl => {
        if(decl.prop==='composes' || decl.prop==='compose-with') uncertain=true;
        const tokens = [];
        if(decl.prop.startsWith('--')) tokens.push(decl.prop);
        valueParser(decl.value).walk(node => { if(node.type==='function' && node.value==='var') { const token=node.nodes.find(x=>x.type==='word'); if(token?.value.startsWith('--')) tokens.push(token.value); } });
        for(const token of new Set(tokens)) if(config.tokenNamespaces?.length && !config.tokenNamespaces.some(prefix=>token.startsWith(prefix))) add(file,'css-token-namespace',decl,'Token outside configured namespace prefixes (not proof it is undefined)',token);
      });
      css.set(file,{classes,uncertain});
    } catch(error) { errors.push({file:rel(file),message:`CSS parse failed: ${error.reason || error.message}`}); }
  }
  for(const [file,source] of files) if(!file.endsWith('.css')) {
    try {
      const ast=parse(source,{sourceType:'unambiguous',plugins:['jsx','typescript']}), imports=new Map(), importedReferences=new WeakSet();
      traverse(ast, { 'MemberExpression|OptionalMemberExpression'(p) {
        if(p.node.object.type !== 'Identifier') return;
        const binding=p.scope.getBinding(p.node.object.name);
        if(binding && ['ImportDefaultSpecifier','ImportNamespaceSpecifier'].includes(binding.path.node.type)) importedReferences.add(p.node);
      }});
      walk(ast,node=>{ if(node.type==='ImportDeclaration' && node.source.value.endsWith('.module.css')) for(const spec of node.specifiers) if(spec.type==='ImportDefaultSpecifier' || spec.type==='ImportNamespaceSpecifier') imports.set(spec.local.name,node.source.value); });
      walk(ast,node=>{
        if(node.type==='JSXAttribute' && node.name?.name==='style') {
          const expression=node.value?.expression;
          const staticValue=expression?.type==='ObjectExpression' && expression.properties.every(p=>p.type==='ObjectProperty' && !p.computed && ['StringLiteral','NumericLiteral','BooleanLiteral','NullLiteral'].includes(p.value.type));
          add(file,staticValue?'css-inline-static':'css-inline-dynamic',node,staticValue?'Static inline style: review for extraction':'Dynamic inline style: requires contextual review; may be intentional',source.slice(node.start,node.end),staticValue?'warning':'info');
        }
        if(!['MemberExpression','OptionalMemberExpression'].includes(node.type) || !importedReferences.has(node) || node.object.type!=='Identifier' || !imports.has(node.object.name)) return;
        const spec=imports.get(node.object.name), name=!node.computed && node.property.type==='Identifier'?node.property.name:node.computed && node.property.type==='StringLiteral'?node.property.value:null;
        if(!name) { add(file,'css-module-dynamic',node,'Dynamic module class reference is unknown',source.slice(node.start,node.end),'info'); return; }
        const target=path.resolve(path.dirname(file),spec);
        if(!spec.startsWith('.') || !contained(target) || !css.has(target)) { add(file,'css-module-unresolved',node,'Module source unavailable in configured scan; cannot validate class',spec,'info'); return; }
        const module=css.get(target);
        if(module.uncertain || !module.classes.has(name)) add(file,module.uncertain?'css-module-unknown':'css-module-missing-class',node,module.uncertain?'Module has composition/unsupported selectors; class availability unknown':'Static module class absent from parsed local selectors (check generated exports)',name,module.uncertain?'info':'warning');
      });
    } catch(error) { errors.push({file:rel(file),message:`JS/TS parse failed: ${error.message}`}); }
  }
  findings.sort((a,b)=>a.file.localeCompare(b.file)||a.line-b.line||a.column-b.column||a.rule.localeCompare(b.rule));
  // Include occurrence ordinal, but not line, so unrelated preceding lines don't invalidate baseline.
  const counts=new Map();
  for(const item of findings) { const key=JSON.stringify([item.file,item.rule,item.evidence]); const n=(counts.get(key)||0)+1; counts.set(key,n); item.fingerprint=hash(key+':'+n); }
  const report={schemaVersion:1,kind:'css-source-audit',mode:'report-only',config:{roots:config.roots||['.'],exclude:excludes,tokenNamespaces:config.tokenNamespaces||[]},filesScanned:files.size,findings,errors,summary:{warnings:findings.filter(x=>x.severity==='warning').length,info:findings.filter(x=>x.severity==='info').length},limitations:['Source analysis only; no rendered cascade, runtime overrides or accessibility certification.','Duplicates are candidates, never automatic removal instructions.','Dynamic styles/classes and external/generated sources require human review.']};
  if(baseline!==null) {
    if(baseline?.schemaVersion!==1 || baseline?.kind!=='css-source-audit' || !Array.isArray(baseline.findings) || baseline.findings.some(x=>typeof x.fingerprint!=='string')) throw new Error('Invalid CSS baseline');
    if(JSON.stringify(baseline.config)!==JSON.stringify(report.config)) throw new Error('Baseline configuration differs');
    const old=new Set(baseline.findings.map(x=>x.fingerprint)), current=new Set(findings.map(x=>x.fingerprint));
    report.comparison={new:findings.filter(x=>!old.has(x.fingerprint)).map(x=>x.fingerprint),persisting:findings.filter(x=>old.has(x.fingerprint)).map(x=>x.fingerprint),notObserved:baseline.findings.filter(x=>!current.has(x.fingerprint)).map(x=>x.fingerprint),complete:!errors.length && !baseline.errors?.length};
  }
  return report;
}
