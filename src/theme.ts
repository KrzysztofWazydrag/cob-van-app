export const colors = {
  ink: '#0D1B2A',
  inkSoft: '#1C2C3D',
  mustard: '#F8C537',
  mustardDark: '#DFA91C',
  cream: '#FFF8E8',
  paper: '#FFFFFF',
  mist: '#EEF1F3',
  muted: '#66727E',
  green: '#16855A',
  greenSoft: '#E5F5EE',
  orange: '#E76A24',
  red: '#D64B3C',
  line: '#DDE2E6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const type = {
  tiny: 12,
  label: 14,
  body: 16,
  title: 22,
  hero: 32,
} as const;

export const shadow = {
  shadowColor: colors.ink,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 18,
  elevation: 5,
} as const;
