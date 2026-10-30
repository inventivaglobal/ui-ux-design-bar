import { createTheme } from '@mui/material/styles';
import tokens from './tokens.json' with { type: 'json' };
export { tokens };
/** Semantic tokens drive both generated components and app-wide MUI styling. */
export function createBarTheme(overrides = {}) {
  return createTheme({
    palette: { primary: { main: tokens.color.action.primary, contrastText: tokens.color.action.onPrimary }, background: { default: tokens.color.surface.default, paper: tokens.color.surface.default }, text: tokens.color.text },
    spacing: tokens.spacing.unit,
    shape: { borderRadius: tokens.radius.control },
    transitions: { duration: { shortest: tokens.motion.fastMs, standard: tokens.motion.normalMs } },
    components: {
      MuiButtonBase: { styleOverrides: { root: { minWidth: 44, minHeight: 44, '&.Mui-focusVisible': { outline: `3px solid ${tokens.color.focus.ring}`, outlineOffset: 3 } } } },
      MuiCard: { styleOverrides: { root: { borderRadius: tokens.radius.card } } },
      MuiCssBaseline: { styleOverrides: { '@media (prefers-reduced-motion: reduce)': { '*, *::before, *::after': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' } } } },
    },
  }, overrides);
}
