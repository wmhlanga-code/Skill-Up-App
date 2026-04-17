// ============================================================
// SkillUp — Design tokens (light + dark)
// ============================================================

export const lightTheme = {
  background: '#F0F7FF',
  surface: '#FFFFFF',
  primary: '#2B9EE8',
  primaryLight: '#EAF4FD',
  textPrimary: '#0F1E2E',
  textMuted: '#7A9BB5',
  border: '#D0E8FA',
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  skeleton: '#E2EEF9',
  shadow: 'rgba(43,158,232,0.08)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#D0E8FA',
  statusBar: 'dark' as const,
};

export const darkTheme = {
  background: '#0B1622',
  surface: '#172232',
  primary: '#3AAFFF',
  primaryLight: '#0D2236',
  textPrimary: '#E8F4FF',
  textMuted: '#4D7898',
  border: '#1E3147',
  success: '#22C55E',
  successLight: '#052E16',
  danger: '#F87171',
  dangerLight: '#450A0A',
  warning: '#FCD34D',
  skeleton: '#1A2E44',
  shadow: 'rgba(0,0,0,0.3)',
  tabBar: '#172232',
  tabBarBorder: '#1E3147',
  statusBar: 'light' as const,
};

export type ThemeColors = typeof lightTheme;

// Icon names from @expo/vector-icons Ionicons
export const CATEGORY_ICONS: Record<string, string> = {
  Trades: 'construct-outline',
  Beauty: 'cut-outline',
  Automotive: 'car-outline',
  Cleaning: 'water-outline',
  Tech: 'laptop-outline',
  Garden: 'leaf-outline',
  Education: 'book-outline',
  Other: 'help-circle-outline',
};

// Fallback text abbreviations used where icons can't render
export const CATEGORY_LABELS: Record<string, string> = {
  Trades: 'Trades',
  Beauty: 'Beauty',
  Automotive: 'Auto',
  Cleaning: 'Clean',
  Tech: 'Tech',
  Garden: 'Garden',
  Education: 'Edu',
  Other: 'Other',
};

export const CATEGORIES = [
  'All',
  'Trades',
  'Beauty',
  'Automotive',
  'Cleaning',
  'Tech',
  'Garden',
  'Education',
  'Other',
] as const;
