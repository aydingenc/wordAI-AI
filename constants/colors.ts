/**
 * Dark premium design tokens with purple/violet glow accents.
 *
 * The app is intentionally dark-only, so both the `light` and `dark` palettes
 * use the same dark values — the UI looks identical regardless of the device's
 * appearance setting.
 */

const palette = {
  // Legacy aliases
  text: '#F5F3FF',
  tint: '#8B5CF6',

  // Core surfaces
  background: '#0B0713',
  backgroundElevated: '#120C1F',
  foreground: '#F5F3FF',

  // Cards / elevated surfaces
  card: '#17112A',
  cardAlt: '#1E1636',
  cardForeground: '#F5F3FF',

  // Primary action color (violet)
  primary: '#8B5CF6',
  primaryForeground: '#FFFFFF',
  primaryGlow: '#A855F7',

  // Secondary interactive surfaces
  secondary: '#211A38',
  secondaryForeground: '#EDE9FE',

  // Muted / subdued elements
  muted: '#1B1430',
  mutedForeground: '#A79FC4',

  // Accent highlights
  accent: '#C084FC',
  accentForeground: '#1A1030',

  // Positive / success (for "known" states, unlocks)
  success: '#34D399',
  successForeground: '#052E20',

  // Warning (for "hard" flashcard state)
  warning: '#FBBF24',

  // Destructive
  destructive: '#F87171',
  destructiveForeground: '#2A0A0A',

  // Borders and inputs
  border: '#2A2342',
  borderStrong: '#3B3160',
  input: '#221A3A',

  // Gradient stops used for atmospheric backgrounds
  glowViolet: '#7C3AED',
  glowMagenta: '#C026D3',
};

const colors = {
  light: palette,
  dark: palette,
  radius: 22,
};

export default colors;
