import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Card } from './ui/Card';
import type { Service } from '../types';

interface ServicesListProps {
  services: Service[];
}

export function ServicesList({ services }: ServicesListProps) {
  const { colors } = useTheme();

  if (services.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.textMuted }]}>
        No services listed yet.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {services.map((service) => (
        <View
          key={service.id}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View style={styles.left}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {service.name}
            </Text>
            {service.price_label ? (
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {service.price_label}
              </Text>
            ) : null}
          </View>
          {service.price_from != null && (
            <View
              style={[styles.priceBadge, { backgroundColor: colors.primaryLight }]}
            >
              <Text style={[styles.priceText, { color: colors.primary }]}>
                From R{service.price_from.toFixed(0)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  left: { flex: 1, marginRight: 12 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  label: { fontSize: 12 },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priceText: { fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 8 },
});
