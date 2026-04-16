import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Stat {
  label: string;
  value: string;
  emoji: string;
}

interface StatsRowProps {
  stats: Stat[];
}

export function StatsRow({ stats }: StatsRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          <View style={styles.stat}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {s.value}
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {s.label}
            </Text>
          </View>
          {i < stats.length - 1 && (
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  emoji: { fontSize: 20, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 12, fontWeight: '500' },
  divider: {
    width: 1,
    borderRadius: 1,
    marginVertical: 4,
  },
});
