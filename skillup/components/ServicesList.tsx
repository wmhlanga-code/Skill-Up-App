import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import type { Service } from '../types';

interface ServicesListProps {
  services: Service[];
}

export function ServicesList({ services }: ServicesListProps) {
  const { colors } = useTheme();

  if (services.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="construct-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {' '}No services listed yet.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {services.map((service, index) => (
        <View
          key={service.id}
          style={[
            styles.row,
            {
              borderBottomColor: colors.border,
              borderBottomWidth: index < services.length - 1 ? 1 : 0,
            },
          ]}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="checkmark" size={14} color={colors.primary} />
          </View>
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
            <View style={[styles.priceBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.priceText, { color: colors.primary }]}>
                R{service.price_from.toFixed(0)}+
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  left: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  label: { fontSize: 12 },
  priceBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  priceText: { fontSize: 13, fontWeight: '700' },
  empty: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  emptyText: { fontSize: 14 },
});
