import React from 'react';
import { Button, IconButton, TextField, MenuItem, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Typography, Tabs, Tab, Box, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import symbols from '../registry/icons/material-symbols.json' with { type: 'json' };
import aliases from '../registry/icons/semantic-icons.json' with { type: 'json' };
const h = React.createElement;
const required = (value, name) => { if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a nonempty string`); return value; };
export function BarIcon({ name, label, size = 24, ...props }) {
  const icon = symbols.icons[aliases.roles[name] ?? name];
  if (!icon) throw new TypeError(`Unknown Material Symbol: ${name}`);
  if (label !== undefined) required(label, 'Icon label');
  return h('svg', { ...props, width: size, height: size, viewBox: icon.viewBox, fill: 'currentColor', focusable: 'false', role: label ? 'img' : undefined, 'aria-hidden': label ? undefined : true, 'aria-label': label || undefined }, h('path', { d: icon.path }));
}
export function BarButton({ label, icon, ...props }) {
  return h(Button, { variant: 'contained', type: 'button', ...props, startIcon: icon ? h(BarIcon, { name: icon }) : props.startIcon }, required(label, 'Button label'));
}
export function BarIconButton({ label, icon, ...props }) {
  return h(IconButton, { type: 'button', ...props, 'aria-label': required(label, 'Icon button label') }, h(BarIcon, { name: icon }));
}
export function BarTextField({ label, id, ...props }) {
  const generatedId = React.useId();
  return h(TextField, { ...props, id: id ?? generatedId, label: required(label, 'Field label') });
}
export function BarSelect({ label, options, id, ...props }) {
  const generatedId = React.useId();
  if (!Array.isArray(options) || !options.length) throw new TypeError('Select options required');
  return h(TextField, { ...props, id: id ?? generatedId, select: true, label: required(label, 'Select label') }, options.map((option, index) => h(MenuItem, { key: index, value: option.value, disabled: option.disabled }, required(option.label, 'Option label'))));
}
export function BarAlert({ message, severity = 'info', ...props }) {
  return h(Alert, { ...props, severity }, required(message, 'Alert message'));
}
export function BarDialog({ title, children, actions, open, onClose, ...props }) {
  const titleId = React.useId();
  if (typeof onClose !== 'function') throw new TypeError('Dialog requires an onClose handler');
  return h(Dialog, { ...props, open, onClose, 'aria-labelledby': titleId }, h(DialogTitle, { id: titleId }, required(title, 'Dialog title')), h(DialogContent, null, children), actions ? h(DialogActions, null, actions) : null);
}
export function BarCard({ title, children, headingLevel = 'h2', ...props }) {
  if (!/^h[1-6]$/.test(headingLevel)) throw new TypeError('headingLevel must be h1–h6');
  return h(Card, props, h(CardContent, null, h(Typography, { variant: 'h6', component: headingLevel }, required(title, 'Card title')), children));
}
export function BarTabs({ label, items, value, onChange, ...props }) {
  const id = React.useId();
  if (!Array.isArray(items) || !items.length || !Number.isInteger(value) || value < 0 || value >= items.length) throw new TypeError('Tabs require items and a valid controlled index');
  if (typeof onChange !== 'function') throw new TypeError('Tabs require an onChange handler');
  return h(React.Fragment, null,
    h(Tabs, { ...props, value, onChange, 'aria-label': required(label, 'Tabs label') }, items.map((item, i) => h(Tab, { key: i, id: `${id}-tab-${i}`, 'aria-controls': `${id}-panel-${i}`, label: required(item.label, 'Tab label') }))),
    items.map((item, i) => h(Box, { key: i, role: 'tabpanel', id: `${id}-panel-${i}`, 'aria-labelledby': `${id}-tab-${i}`, hidden: i !== value, tabIndex: 0 }, i === value ? item.content : null)));
}
export function BarTable({ caption, columns, rows, ...props }) {
  if (!Array.isArray(columns) || !columns.length || !Array.isArray(rows)) throw new TypeError('Table columns and rows required');
  const keys = columns.map(c => required(c.key, 'Column key'));
  if (new Set(keys).size !== keys.length) throw new TypeError('Column keys must be unique');
  return h(TableContainer, null, h(Table, props, h('caption', null, required(caption, 'Table caption')), h(TableHead, null, h(TableRow, null, columns.map(c => h(TableCell, { key: c.key, component: 'th', scope: 'col' }, required(c.label, 'Column label'))))), h(TableBody, null, rows.map((row, i) => h(TableRow, { key: i }, columns.map(c => h(TableCell, { key: c.key }, row[c.key])))))));
}
