import { scanJsxImages } from './jsx-images.mjs';
import { repairCandidates } from './jsx-elements.mjs';
// Image checks use JSX syntax; other checks remain conservative regex heuristics.
// This is not a substitute for a general AST or browser audit.
export function audit(source, filename = 'input.jsx') {
  const findings = [];
  const add = (ruleId, severity, message, index, fixable = false) => {
    const line = source.slice(0, index).split('\n').length;
    findings.push({ruleId, severity, message, file:filename, line, fixable, index, evidence:source.slice(index,index+140).split('\n')[0]});
  };
  const imageScan = scanJsxImages(source);
  for (const image of imageScan.images) {
    if (!image.hasAlt) add('a11y.image-alt','high','Image is missing alt text',image.start,image.fixable);
  }
  const tag = /<(button|Button|IconButton|img)\b([^>]*?)\/?\s*>/gs;
  for (const match of source.matchAll(tag)) {
    const [full,name,attrs] = match, i=match.index;
    if (name === 'IconButton' && !/\baria-label\s*=|\baria-labelledby\s*=|\btitle\s*=/.test(attrs))
      add('a11y.icon-button-name','high','IconButton needs an accessible name',i,false);
    if (name === 'button' && /\btype\s*=/.test(attrs) === false && /<form\b/.test(source))
      add('form.explicit-button-type','medium','Button inside a file containing a form should declare type',i,false);
    if ((name === 'button' || name === 'Button') && /\bonClick\s*=/.test(attrs) && /\bdisabled\b/.test(attrs) && /\baria-disabled/.test(attrs))
      add('interaction.disabled-redundancy','low','Review redundant disabled semantics',i,false);
  }
  for (const change of repairCandidates(source).changes) {
    const existing = findings.find(f => f.ruleId === change.ruleId && f.index <= change.start && change.start - f.index < 20);
    if (existing) existing.fixable = true;
    else add(change.ruleId, 'medium', change.reason, change.start, true);
  }
  findings.sort((a,b) => a.index-b.index);
  return {schemaVersion:'0.1',file:filename,analysis:{imageSyntaxParsed:imageScan.parsed},findings,summary:{total:findings.length,high:findings.filter(f=>f.severity==='high').length}};
}
