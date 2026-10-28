import { audit } from './audit.mjs';
import { jsxImages } from './jsx-images.mjs';

// Explicit author intent only: decorative images may receive empty alt text.
// Output is a preview; neither the API nor CLI writes the caller's source file.
export function repair(source, filename = 'input.jsx') {
  const edits = jsxImages(source).filter(image => image.fixable);
  const changes = edits.map(image => ({
    ruleId: 'a11y.image-alt', start: image.insert, end: image.insert,
    before: '', after: ' alt=""',
    reason: 'Author explicitly marked this image data-bar-decorative="true".',
  }));
  let output = source;
  for (const change of [...changes].reverse()) {
    output = output.slice(0, change.start) + change.after + output.slice(change.end);
  }
  const verified = audit(output, filename);
  return {
    source: output, changes, unresolved: verified.findings, verified,
    verification: { kind: 'static-reaudit', browserVerified: false },
    diff: changes.map(change => ({ line: source.slice(0, change.start).split('\n').length, ...change })),
  };
}
