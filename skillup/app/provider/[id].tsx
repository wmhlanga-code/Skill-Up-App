import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  Share,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useProviderDetail } from '../../hooks/useProviders';
import { useLocation } from '../../hooks/useLocation';
import { createBooking } from '../../hooks/useBookings';
import { getOrCreateConversation } from '../../hooks/useMessages';
import { useFavoriteStatus } from '../../hooks/useFavorites';
import { openWhatsApp } from '../../lib/whatsapp';
import { formatDistance } from '../../lib/location';
import { Ionicons } from '@expo/vector-icons';
import { StatsRow } from '../../components/StatsRow';
import { ServicesList } from '../../components/ServicesList';
import { ReviewsList } from '../../components/ReviewsList';
import { ReviewModal } from '../../components/ReviewModal';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CATEGORY_ICONS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import type { Provider } from '../../types';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { coordinates } = useLocation();
  const router = useRouter();

  const { provider, services, reviews, loading, refresh: refreshDetail } = useProviderDetail(id ?? '');
  const [showingInterest, setShowingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const { favorited, loading: favLoading, toggle: toggleFav } = useFavoriteStatus(
    user?.id ?? null,
    id ?? null
  );

  // Increment profile view count once on mount
  useEffect(() => {
    if (id) {
      void supabase.rpc('increment_profile_views', { p_provider_id: id });
    }
  }, [id]);

  if (loading || !provider) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="time-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading provider…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryIcon = (CATEGORY_ICONS[provider.category ?? 'Other'] ?? 'help-circle-outline') as keyof typeof Ionicons.glyphMap;

  // Compute distance from user's coordinates
  // NearbyProvider extends Provider with distance_km
  const providerAny = provider as Provider & { distance_km?: number };
  const distanceKm =
    coordinates && providerAny.distance_km != null
      ? providerAny.distance_km
      : null;

  const stats = [
    { icon: 'star' as const,             iconColor: '#F59E0B',       value: provider.avg_rating.toFixed(1),          label: 'Rating' },
    { icon: 'checkmark-circle' as const, iconColor: colors.success,  value: String(provider.total_jobs),             label: 'Jobs' },
    { icon: 'trophy-outline' as const,   iconColor: colors.primary,  value: `${provider.years_experience}yr`,        label: 'Experience' },
    { icon: 'time-outline' as const,     iconColor: colors.textMuted, value: `${provider.avg_response_minutes}m`,   label: 'Response' },
  ];

  async function handleShowInterest() {
    if (!user || !provider) {
      Alert.alert('Sign in required', 'Please sign in to show interest.');
      return;
    }
    if (interestSent) {
      Alert.alert('Already sent', 'You have already shown interest in this provider.');
      return;
    }

    const p = provider;
    setShowingInterest(true);
    try {
      await createBooking({
        seekerId: user.id,
        providerId: p.id,
      });
      setInterestSent(true);
      Alert.alert(
        'Interest Sent!',
        `${p.full_name} has been notified. They will contact you shortly.`
      );
    } catch (err: unknown) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Could not send interest.'
      );
    } finally {
      setShowingInterest(false);
    }
  }

  async function handleWhatsApp() {
    if (!provider) return;
    if (!provider.phone) {
      Alert.alert('No phone number', 'This provider has not added a phone number yet.');
      return;
    }
    await openWhatsApp(
      provider.phone,
      `Hi ${provider.full_name}, I found you on SkillUp and I'm interested in your ${provider.category} services.`
    );
  }

  async function handleShare() {
    if (!provider) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${provider.full_name ?? 'Provider'} on SkillUp`,
        message: `Check out ${provider.full_name ?? 'this provider'} on SkillUp — ${provider.category} services in ${provider.area_name ?? 'your area'}. ⭐ ${provider.avg_rating.toFixed(1)} · ${provider.total_jobs} jobs done.`,
      });
    } catch {
      // User cancelled share
    }
  }

  async function handleToggleFavorite() {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save providers.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await toggleFav();
    } catch {
      Alert.alert('Error', 'Could not update saved providers.');
    }
  }

  async function handleInAppMessage() {
    if (!user || !provider) {
      Alert.alert('Sign in required', 'Please sign in to send a message.');
      return;
    }
    setOpeningChat(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const conversationId = await getOrCreateConversation(user.id, provider.id);
      router.push({
        pathname: '/conversation/[id]',
        params: {
          id: conversationId,
          otherName: provider.full_name ?? 'Provider',
          otherAvatar: provider.avatar_url ?? '',
        },
      });
    } catch {
      Alert.alert('Error', 'Could not open conversation. Please try again.');
    } finally {
      setOpeningChat(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Top-right action buttons */}
      <View style={styles.topRight}>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.topActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          disabled={favLoading}
          style={[styles.topActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={20}
            color={favorited ? colors.danger : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {provider && user && (
        <ReviewModal
          visible={reviewModalVisible}
          providerId={provider.id}
          reviewerId={user.id}
          providerName={provider.full_name ?? 'Provider'}
          onClose={() => setReviewModalVisible(false)}
          onSubmitted={refreshDetail}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={[styles.hero, { backgroundColor: colors.primaryLight }]}>
          {provider.avatar_url ? (
            <Image
              source={{ uri: provider.avatar_url }}
              style={[styles.avatar, { borderColor: colors.primary }]}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.surface }]}>
              <Ionicons name={categoryIcon} size={40} color={colors.primary} />
            </View>
          )}

          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {provider.full_name ?? 'Provider'}
          </Text>

          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.categoryText}>{provider.category}</Text>
            </View>
            <View
              style={[
                styles.availBadge,
                {
                  backgroundColor: provider.is_available
                    ? colors.successLight
                    : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.availDot,
                  {
                    backgroundColor: provider.is_available
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.availText,
                  {
                    color: provider.is_available
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              >
                {provider.is_available ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>

          {distanceKm !== null && (
            <View style={styles.distanceRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.distance, { color: colors.textMuted }]}>
                {' '}{provider.area_name ?? ''} · {formatDistance(distanceKm)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Stats */}
          <StatsRow stats={stats} />

          {/* About */}
          {provider.bio && (
            <Card style={{ marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                About
              </Text>
              <Text style={[styles.bio, { color: colors.textPrimary }]}>
                {provider.bio}
              </Text>
            </Card>
          )}

          {/* Mini map */}
          {coordinates && (
            <Card padding={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, padding: 14, paddingBottom: 0 }]}>
                Area
              </Text>
              <MapView
                style={styles.miniMap}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                userInterfaceStyle={isDark ? 'dark' : 'light'}
              >
                <Marker
                  coordinate={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                  }}
                >
                  <View style={[styles.mapMarker, { backgroundColor: colors.primary }]}>
                    <Ionicons name={categoryIcon} size={16} color="#fff" />
                  </View>
                </Marker>
              </MapView>
            </Card>
          )}

          {/* Services */}
          <Card style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Services & Pricing
            </Text>
            <ServicesList services={services} />
          </Card>

          {/* Reviews */}
          <View style={{ marginBottom: 24 }}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Reviews ({reviews.length})
              </Text>
              {user && (
                <TouchableOpacity
                  onPress={() => setReviewModalVisible(true)}
                  style={[styles.writeReviewBtn, { borderColor: colors.primary }]}
                >
                  <Ionicons name="star-outline" size={14} color={colors.primary} />
                  <Text style={[styles.writeReviewText, { color: colors.primary }]}>
                    Write a review
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ReviewsList reviews={reviews} />
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View
        style={[
          styles.cta,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Button
          title="Chat"
          variant="secondary"
          onPress={handleInAppMessage}
          loading={openingChat}
          leftIcon={<Ionicons name="chatbubble-outline" size={16} color={colors.primary} />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title="WhatsApp"
          variant="secondary"
          onPress={handleWhatsApp}
          leftIcon={<Ionicons name="logo-whatsapp" size={16} color={colors.success} />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title={interestSent ? 'Sent!' : 'Hire'}
          variant={interestSent ? 'ghost' : 'primary'}
          onPress={handleShowInterest}
          loading={showingInterest}
          disabled={interestSent}
          leftIcon={interestSent
            ? <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            : <Ionicons name="flash" size={16} color="#fff" />
          }
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 15 },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 20, fontWeight: '600' },
  topRight: {
    position: 'absolute',
    top: 56,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    gap: 8,
  },
  topActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  writeReviewText: { fontSize: 13, fontWeight: '600' },
  container: { paddingBottom: 100 },
  hero: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    marginBottom: 12,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 24, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '700' },
  distanceRow: { flexDirection: 'row', alignItems: 'center' },
  distance: { fontSize: 13 },
  body: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 10 },
  bio: { fontSize: 14, lineHeight: 22 },
  miniMap: { height: 160, marginTop: 8 },
  mapMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cta: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
});
