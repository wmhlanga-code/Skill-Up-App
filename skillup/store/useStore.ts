import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, Coordinates, ThemeMode } from '../types';

interface AppState {
  // ─── Auth ────────────────────────────────────────────────
  user: Profile | null;
  setUser: (user: Profile | null) => void;

  // ─── Location ───────────────────────────────────────────
  coordinates: Coordinates | null;
  locationName: string;
  setCoordinates: (coords: Coordinates | null) => void;
  setLocationName: (name: string) => void;

  // ─── Theme ──────────────────────────────────────────────
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  // ─── Search / Filter ────────────────────────────────────
  searchQuery: string;
  selectedCategory: string;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;
}

const THEME_KEY = '@skillup:theme';

export const useStore = create<AppState>((set, get) => ({
  // ─── Auth ────────────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),

  // ─── Location ───────────────────────────────────────────
  coordinates: null,
  locationName: 'Getting location…',
  setCoordinates: (coordinates) => set({ coordinates }),
  setLocationName: (locationName) => set({ locationName }),

  // ─── Theme ──────────────────────────────────────────────
  theme: 'light',
  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem(THEME_KEY, theme);
  },
  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: next });
    await AsyncStorage.setItem(THEME_KEY, next);
  },

  // ─── Search / Filter ────────────────────────────────────
  searchQuery: '',
  selectedCategory: 'All',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}));

/** Load persisted theme from AsyncStorage on app start */
export async function loadPersistedTheme(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    return (stored as ThemeMode) ?? 'light';
  } catch {
    return 'light';
  }
}
