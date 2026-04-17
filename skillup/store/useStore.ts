import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Profile, Coordinates, ThemeMode } from '../types';

export interface FilterState {
  maxDistanceKm: number;
  minRating: number;
  availableOnly: boolean;
}

interface AppState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;

  coordinates: Coordinates | null;
  locationName: string;
  setCoordinates: (coords: Coordinates | null) => void;
  setLocationName: (name: string) => void;

  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  searchQuery: string;
  selectedCategory: string;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: string) => void;

  filters: FilterState;
  setFilters: (f: FilterState) => void;
}

const THEME_KEY = '@skillup:theme';

export const useStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),

  coordinates: null,
  locationName: 'Getting location…',
  setCoordinates: (coordinates) => set({ coordinates }),
  setLocationName: (locationName) => set({ locationName }),

  theme: 'light',
  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    set({ theme: next });
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  },

  searchQuery: '',
  selectedCategory: 'All',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),

  filters: { maxDistanceKm: 50, minRating: 0, availableOnly: false },
  setFilters: (filters) => set({ filters }),
}));

export async function loadPersistedTheme(): Promise<ThemeMode> {
  try {
    const stored = await AsyncStorage.getItem(THEME_KEY);
    return (stored as ThemeMode) ?? 'light';
  } catch {
    return 'light';
  }
}
