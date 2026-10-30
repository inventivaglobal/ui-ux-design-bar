import { parse } from '@babel/parser';

// Parse full modules, or JSX fragments used by the small CLI examples. Never
// interpret text, comments or strings as elements. Invalid input is not repaired.
export function scanJsxImages(source) {
  let tree, offset = 0;
  try { tree = parse(source, { sourceType: 'module', plugins: ['jsx', 'typescript'] }); }
  catch {
    // Only sibling JSX roots may use the fragment fallback. Never reinterpret
    // malformed JavaScript or bare text as JSX.
    if (!source.trim().startsWith('<') || !source.trim().endsWith('>')) return { parsed: false, images: [] };
    try {
      tree = parse(`<>${source}</>`, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
      const fragment = tree.program.body[0]?.expression;
      if (tree.program.body.length !== 1 || fragment?.type !== 'JSXFragment' ||
          fragment.start !== 0 || fragment.end !== source.length + 5 || fragment.children.some(child =>
        !['JSXElement', 'JSXFragment'].includes(child.type) && !(child.type === 'JSXText' && !child.value.trim()))) {
        return { parsed: false, images: [] };
      }
      offset = 2;
    } catch { return { parsed: false, images: [] }; }
  }
  const images = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && node.name.name === 'img') {
      const attrs = node.attributes;
      const hasAlt = attrs.some(a => a.type === 'JSXAttribute' && a.name.name === 'alt');
      const markers = attrs.filter(a => a.type === 'JSXAttribute' && a.name.name === 'data-bar-decorative');
      const decorative = markers.length === 1 && markers[0].value?.type === 'StringLiteral' && markers[0].value.value === 'true';
      const spread = attrs.some(a => a.type === 'JSXSpreadAttribute');
      // Spreads may supply alt, roles or image intent. Refuse to guess.
      const semantic = attrs.some(a => { if(a.type!=='JSXAttribute')return false; const name=(a.name.type==='JSXIdentifier'?a.name.name:a.name.namespace.name+':'+a.name.name.name).toLowerCase(); return /^aria-/.test(name)||/^on/.test(name)||['role','title','tabindex','usemap','ismap','href','xlinkhref','xlink:href'].includes(name); });
      images.push({ start: node.start - offset, insert: node.name.end - offset, hasAlt, fixable: !hasAlt && decorative && !spread && !semantic });
    }
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'comments', 'tokens', 'errors'].includes(key)) continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(tree);
  return { parsed: true, images };
}

export function jsxImages(source) { return scanJsxImages(source).images; }
