import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useLocation } from '../../hooks/useLocation';
import { useProviders } from '../../hooks/useProviders';
import { useStore } from '../../store/useStore';
import { CATEGORY_ICONS } from '../../constants/theme';
import type { NearbyProvider } from '../../types';

/** Generate a consistent ±1 float from a UUID string and an index (0 or 1). */
function deterministicOffset(id: string, idx: number): number {
  let hash = 0;
  const seed = id + String(idx);
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  return (hash % 1000) / 1000; // -1 to 1
}

export default function MapScreen() {
  const { colors, isDark } = useTheme();
  const { coordinates, refresh } = useLocation();
  const { selectedCategory } = useStore();
  const router = useRouter();

  const { providers } = useProviders(
    coordinates?.latitude ?? null,
    coordinates?.longitude ?? null,
    selectedCategory
  );

  const mapRef = useRef<MapView>(null);
  const [selectedProvider, setSelectedProvider] = useState<NearbyProvider | null>(null);

  const initialRegion: Region | undefined = coordinates
    ? {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : undefined;

  function centerOnUser() {
    if (coordinates) {
      mapRef.current?.animateToRegion({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      refresh();
    }
  }

  if (!coordinates) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.noLocation}>
          <View style={[styles.noLocationIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="location-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.noLocationTitle, { color: colors.textPrimary }]}>
            Location Required
          </Text>
          <Text style={[styles.noLocationSub, { color: colors.textMuted }]}>
            Enable location access to see providers on the map.
          </Text>
          <TouchableOpacity
            onPress={refresh}
            style={[styles.enableBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.enableBtnText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        onPress={() => setSelectedProvider(null)}
      >
        {providers.map((provider) => {
          const iconName = (CATEGORY_ICONS[provider.category ?? 'Other'] ?? 'help-circle-outline') as keyof typeof Ionicons.glyphMap;
          // Use provider's real coordinates if available from updated RPC,
          // otherwise fall back to a deterministic offset based on provider ID
          const provAny = provider as typeof provider & { provider_lat?: number; provider_lng?: number };
          const markerLat = provAny.provider_lat && provAny.provider_lat !== 0
            ? provAny.provider_lat
            : (coordinates?.latitude ?? 0) + deterministicOffset(provider.id, 0) * 0.04;
          const markerLng = provAny.provider_lng && provAny.provider_lng !== 0
            ? provAny.provider_lng
            : (coordinates?.longitude ?? 0) + deterministicOffset(provider.id, 1) * 0.04;
          return (
            <Marker
              key={provider.id}
              coordinate={{ latitude: markerLat, longitude: markerLng }}
              onPress={() => setSelectedProvider(provider)}
            >
              <View
                style={[
                  styles.markerBubble,
                  {
                    backgroundColor: provider.is_available ? colors.primary : colors.textMuted,
                    borderColor: '#fff',
                  },
                ]}
              >
                <Ionicons name={iconName} size={16} color="#fff" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.headerLeft}>
            <Ionicons name="map" size={18} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {' '}Nearby Providers
            </Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {providers.length} found
          </Text>
        </View>
      </SafeAreaView>

      {/* Center button */}
      <TouchableOpacity
        style={[styles.centerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={centerOnUser}
      >
        <Ionicons name="locate" size={22} color={colors.primary} />
      </TouchableOpacity>

      {/* Provider callout */}
      {selectedProvider && (
        <TouchableOpacity
          style={[
            styles.callout,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push(`/provider/${selectedProvider.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.calloutRow}>
            <View style={[styles.calloutAvatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons
                name={(CATEGORY_ICONS[selectedProvider.category ?? 'Other'] ?? 'help-circle-outline') as keyof typeof Ionicons.glyphMap}
                size={22}
                color={colors.primary}
              />
            </View>
            <View style={styles.calloutInfo}>
              <Text style={[styles.calloutName, { color: colors.textPrimary }]}>
                {selectedProvider.full_name ?? 'Provider'}
              </Text>
              <Text style={[styles.calloutCat, { color: colors.primary }]}>
                {selectedProvider.category}
              </Text>
              <View style={styles.calloutRatingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[styles.calloutRating, { color: colors.textMuted }]}>
                  {' '}{selectedProvider.avg_rating.toFixed(1)} · {selectedProvider.total_jobs} jobs
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: {
    margin: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 13 },
  centerBtn: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  markerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callout: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  calloutRow: { flexDirection: 'row', alignItems: 'center' },
  calloutAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  calloutInfo: { flex: 1 },
  calloutName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  calloutCat: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  calloutRatingRow: { flexDirection: 'row', alignItems: 'center' },
  calloutRating: { fontSize: 12 },
  noLocation: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  noLocationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noLocationTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  noLocationSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  enableBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  enableBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
