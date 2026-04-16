import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { CATEGORIES, CATEGORY_EMOJIS } from '../constants/theme';

interface CategoryChipsProps {
  selected: string;
  onSelect: (cat: string) => void;
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat;
        const emoji = cat === 'All' ? '⚡' : CATEGORY_EMOJIS[cat] ?? '⭐';

        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onSelect(cat)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive
                  ? colors.primary
                  : colors.surface,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text
              style={[
                styles.label,
                { color: isActive ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingRight: 16,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  emoji: {
    fontSize: 14,
    marginRight: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
