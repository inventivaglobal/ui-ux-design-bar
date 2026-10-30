const definitions = {
  'action-button': ['BarButton', { label: 'Save' }],
  'icon-button': ['BarIconButton', { label: 'Close', icon: 'action.close' }],
  'text-field': ['BarTextField', { label: 'Name', name: 'name' }],
  'select-field': ['BarSelect', { label: 'Status', defaultValue: 'draft', options: [{ value: 'draft', label: 'Draft' }, { value: 'ready', label: 'Ready' }] }],
  'status-alert': ['BarAlert', { message: 'Changes saved', severity: 'success' }],
  'modal-dialog': ['BarDialog', { title: 'Confirm changes', open: false }],
  'content-card': ['BarCard', { title: 'Overview' }],
  'tabs': ['BarTabs', { label: 'Sections', value: 0, items: [{ label: 'Overview', content: 'Overview content' }, { label: 'Details', content: 'Details content' }] }],
  'data-table': ['BarTable', { caption: 'Records', columns: [{ key: 'name', label: 'Name' }], rows: [{ name: 'Example' }] }],
};
function assertJson(value, seen = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return;
  if (typeof value !== 'object' || seen.has(value) || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) throw new TypeError('Generated props must be finite, acyclic plain JSON data');
  seen.add(value);
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get || descriptor.set) throw new TypeError('Generated props cannot contain accessors');
    assertJson(descriptor.value, seen);
  }
  seen.delete(value);
}
/** Generates a standalone starter, never edits/replaces existing application code. */
export function generateComponent(id, options = {}) {
  if (!Object.hasOwn(definitions, id)) throw new TypeError(`Unknown component: ${id}`);
  assertJson(options);
  if (options === null || Array.isArray(options) || typeof options !== 'object') throw new TypeError('Options must be a JSON object');
  const [component, defaults] = definitions[id];
  const props = { ...defaults, ...options };
  for (const [key, value] of Object.entries(props)) {
    if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(key) || key === 'dangerouslySetInnerHTML' || key === 'ref' || key === 'key' || /^on[A-Z]/.test(key)) throw new TypeError(`Unsupported generated prop: ${key}`);
    if (typeof value === 'function' || value === undefined || typeof value === 'symbol' || typeof value === 'bigint') throw new TypeError('Generated props must be JSON data');
  }
  const callback = id === 'modal-dialog' ? ' onClose={onClose}' : id === 'tabs' ? ' onChange={onChange}' : '';
  const code = `<${component} ${Object.entries(props).map(([key, value]) => `${key}={${JSON.stringify(value)}}`).join(' ')}${callback} />`;
  return { id, component, import: `import { ${component} } from 'ui-ux-design-bar/components';`, code, requiredBindings: id === 'modal-dialog' ? ['onClose'] : id === 'tabs' ? ['onChange'] : [], replacementRequiresApproval: true };
}
