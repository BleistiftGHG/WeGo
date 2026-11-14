export type Palette = {
  background: string;
  text: string;
  textSecondary: string;
  divider: string;
  border: string;
  surface: string;
  onSurface: string;
  input: string;
};

export const darkColors: Palette = {
  background: '#000000',
  text: '#F5F5F5',
  textSecondary: '#8A8A8A',
  divider: '#1E1E1E',
  border: '#2A2A2A',
  surface: '#FFFFFF',
  onSurface: '#000000',
  input: '#111111',
};

export const lightColors: Palette = {
  background: '#FFFFFF',
  text: '#111111',
  textSecondary: '#6B6B6B',
  divider: '#E5E5E5',
  border: '#D4D4D4',
  surface: '#000000',
  onSurface: '#FFFFFF',
  input: '#F2F2F2',
};

export const colors = darkColors;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const getTypography = (palette: Palette) =>
  ({
    title: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700',
      color: palette.text,
    },
    heading: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      color: palette.text,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      color: palette.text,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: palette.textSecondary,
    },
  }) as const;

export const typography = getTypography(darkColors);