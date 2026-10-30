export function buildButton({label,variant='contained',icon=false}={}) {
  if (typeof label !== 'string' || !label.trim()) throw new Error('A non-empty accessible label is required');
  if (!['contained','outlined','text'].includes(variant)) throw new Error('Unsupported MUI button variant');
  const escaped=label.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('{','&#123;').replaceAll('}','&#125;');
  if (icon) return {imports:["import IconButton from '@mui/material/IconButton';"],jsx:`<IconButton aria-label={${JSON.stringify(label)}}><YourIcon /></IconButton>`,status:'template'};
  return {imports:["import Button from '@mui/material/Button';"],jsx:`<Button variant="${variant}" type="button">${escaped}</Button>`,status:'template'};
}
