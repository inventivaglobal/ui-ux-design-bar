// Dependency-free, conservative JSX/HTML checks. Not a substitute for AST or browser audits.
export function audit(source, filename = 'input.jsx') {
  const findings = [];
  const add = (ruleId, severity, message, index, fixable = false) => {
    const line = source.slice(0, index).split('\n').length;
    findings.push({ruleId, severity, message, file:filename, line, fixable, evidence:source.slice(index,index+140).split('\n')[0]});
  };
  const tag = /<(button|Button|IconButton|img)\b([^>]*?)\/?\s*>/gs;
  for (const match of source.matchAll(tag)) {
    const [full,name,attrs] = match, i=match.index;
    if (name === 'img' && !/\balt\s*=/.test(attrs)) add('a11y.image-alt','high','Image is missing alt text',i,false);
    if (name === 'IconButton' && !/\baria-label\s*=|\baria-labelledby\s*=|\btitle\s*=/.test(attrs))
      add('a11y.icon-button-name','high','IconButton needs an accessible name',i,false);
    if (name === 'button' && /\btype\s*=/.test(attrs) === false && /<form\b/.test(source))
      add('form.explicit-button-type','medium','Button inside a file containing a form should declare type',i,false);
    if ((name === 'button' || name === 'Button') && /\bonClick\s*=/.test(attrs) && /\bdisabled\b/.test(attrs) && /\baria-disabled/.test(attrs))
      add('interaction.disabled-redundancy','low','Review redundant disabled semantics',i,false);
  }
  return {schemaVersion:'0.1',file:filename,findings,summary:{total:findings.length,high:findings.filter(f=>f.severity==='high').length}};
}
