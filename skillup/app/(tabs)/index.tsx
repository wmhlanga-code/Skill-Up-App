import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { useProviders, useBusinesses } from '../../hooks/useProviders';
import { useStore } from '../../store/useStore';
import { LocationBar } from '../../components/LocationBar';
import { SearchBar } from '../../components/SearchBar';
import { CategoryChips } from '../../components/CategoryChips';
import { ProviderCard } from '../../components/ProviderCard';
import { BusinessCard } from '../../components/BusinessCard';
import type { NearbyProvider } from '../../types';

function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.skeleton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.skeletonAvatar, { backgroundColor: colors.skeleton }]} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.skeleton, width: '55%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.skeleton, width: '35%', height: 10, marginTop: 7 }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.skeleton, width: '75%', height: 10, marginTop: 7 }]} />
      </View>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { coordinates, locationName, loading: locLoading, refresh: refreshLoc } = useLocation();
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory } = useStore();

  const {
    providers,
    loading: providersLoading,
    refresh,
  } = useProviders(
    coordinates?.latitude ?? null,
    coordinates?.longitude ?? null,
    selectedCategory,
    searchQuery
  );

  const {
    businesses,
    loading: businessesLoading,
    refresh: refreshBusinesses,
  } = useBusinesses(
    coordinates?.latitude ?? null,
    coordinates?.longitude ?? null
  );

  const onRefresh = useCallback(async () => {
    await refreshLoc();
    await refresh();
    await refreshBusinesses();
  }, [refreshLoc, refresh, refreshBusinesses]);

  const isLoading = providersLoading && providers.length === 0;
  const firstName = user?.full_name?.split(' ')[0];

  // Filter businesses by selected category and search
  const filteredBusinesses = businesses.filter((b) => {
    if (selectedCategory && selectedCategory !== 'All' && b.category !== selectedCategory) return false;
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.business_name?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.area_name?.toLowerCase().includes(q) ||
        b.services_description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: colors.textMuted }]}>
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Find a service
        </Text>
      </View>

      <LocationBar locationName={locationName} loading={locLoading} onRefresh={refreshLoc} />
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />

      {!isLoading && providers.length > 0 && (
        <View style={styles.resultsRow}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {providers.length} provider{providers.length !== 1 ? 's' : ''} nearby
          </Text>
        </View>
      )}
    </View>
  );

  const BusinessesSection =
    !businessesLoading && filteredBusinesses.length > 0 ? (
      <View style={styles.businessSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="storefront-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {' '}Local Businesses
          </Text>
          <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
            ({filteredBusinesses.length})
          </Text>
        </View>
        {filteredBusinesses.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </View>
    ) : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.container}>
          {ListHeader}
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item: NearbyProvider) => item.id}
          renderItem={({ item }) => <ProviderCard provider={item} />}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={BusinessesSection}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={providersLoading || businessesLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons
                  name={coordinates ? 'search-outline' : 'location-outline'}
                  size={36}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {coordinates ? 'No providers found' : 'Location needed'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {coordinates
                  ? 'Try a different category or clear your search'
                  : 'Enable location access to see providers near you'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },
  listHeader: { marginBottom: 8 },
  greeting: { marginBottom: 20 },
  greetingText: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  resultsRow: { marginBottom: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '500' },
  businessSection: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  sectionCount: { fontSize: 14, marginLeft: 4 },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  skeletonAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  skeletonLines: { flex: 1 },
  skeletonLine: { height: 14, borderRadius: 7 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, color: '#7A9BB5' },
});
