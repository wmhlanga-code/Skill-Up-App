import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface FilterValues {
  maxDistanceKm: number;
  minRating: number;
  availableOnly: boolean;
}

interface Props {
  visible: boolean;
  current: FilterValues;
  onApply: (filters: FilterValues) => void;
  onClose: () => void;
}

const DISTANCES = [5, 10, 20, 30, 50];

export function FilterSheet({ visible, current, onApply, onClose }: Props) {
  const { colors } = useTheme();
  const [maxDistance, setMaxDistance] = useState(current.maxDistanceKm);
  const [minRating, setMinRating] = useState(current.minRating);
  const [availableOnly, setAvailableOnly] = useState(current.availableOnly);

  function handleApply() {
    onApply({ maxDistanceKm: maxDistance, minRating, availableOnly });
    onClose();
  }

  function handleReset() {
    setMaxDistance(50);
    setMinRating(0);
    setAvailableOnly(false);
  }

  const hasChanges =
    maxDistance !== current.maxDistanceKm ||
    minRating !== current.minRating ||
    availableOnly !== current.availableOnly;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Distance */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MAX DISTANCE</Text>
          <View style={styles.chipRow}>
            {DISTANCES.map((d) => {
              const active = maxDistance === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setMaxDistance(d)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.textPrimary }]}>
                    {d} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Min Rating */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MIN RATING</Text>
          <View style={styles.starsRow}>
            {[0, 1, 2, 3, 4, 5].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setMinRating(r)}
                style={[
                  styles.ratingChip,
                  {
                    backgroundColor: minRating === r ? colors.primary : colors.background,
                    borderColor: minRating === r ? colors.primary : colors.border,
                  },
                ]}
              >
                {r === 0 ? (
                  <Text style={[styles.chipText, { color: minRating === 0 ? '#fff' : colors.textPrimary }]}>
                    Any
                  </Text>
                ) : (
                  <View style={styles.ratingInner}>
                    <Ionicons name="star" size={13} color={minRating === r ? '#fff' : '#F59E0B'} />
                    <Text style={[styles.chipText, { color: minRating === r ? '#fff' : colors.textPrimary }]}>
                      {' '}{r}+
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Available only */}
          <View style={[styles.toggleRow, { borderColor: colors.border }]}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Available now</Text>
                <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                  Show only providers currently accepting work
                </Text>
              </View>
            </View>
            <Switch
              value={availableOnly}
              onValueChange={setAvailableOnly}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Apply */}
          <TouchableOpacity
            onPress={handleApply}
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.applyText}>
              {hasChanges ? 'Apply Filters' : 'Close'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800' },
  resetText: { fontSize: 15, fontWeight: '600' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  ratingChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  ratingInner: { flexDirection: 'row', alignItems: 'center' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  toggleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  toggleSub: { fontSize: 12, lineHeight: 16 },
  applyBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
