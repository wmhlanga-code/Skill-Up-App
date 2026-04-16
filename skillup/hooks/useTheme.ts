import { useStore } from '../store/useStore';
import { lightTheme, darkTheme, type ThemeColors } from '../constants/theme';

export function useTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  toggle: () => void;
} {
  const { theme, toggleTheme } = useStore();
  const isDark = theme === 'dark';
  return {
    colors: (isDark ? darkTheme : lightTheme) as ThemeColors,
    isDark,
    toggle: toggleTheme,
  };
}
