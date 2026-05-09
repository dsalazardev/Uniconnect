export const colors = {
  gold: '#D9B97E',
  goldLight: 'rgba(217, 185, 126, 0.15)',
  goldHover: '#c9a96e',
  dark: '#1a1a1a',
  darkSecondary: '#363636',
  darkTertiary: '#2a2a2a',
  white: '#ffffff',
  error: '#dc3545',
  errorLight: 'rgba(220, 53, 69, 0.15)',
  muted: '#888',
  mutedLight: '#aaa',
} as const;

export type ColorKey = keyof typeof colors;
