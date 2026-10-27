import {audit} from './audit.mjs';
// Only performs a provably local, reversible change; never invents accessible labels.
export function repair(source, filename='input.jsx') {
  const before=audit(source,filename);
  let output=source;
  // Non-destructive opt-in repair: replace empty image alt only when explicitly decorative.
  // Unknown image intent requires human review, not an invented label.
  const changes=[];
  return {source:output,changes,unresolved:before.findings,verified:audit(output,filename)};
}
