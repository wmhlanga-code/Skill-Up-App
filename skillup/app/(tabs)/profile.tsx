import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useMyFavorites } from '../../hooks/useFavorites';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProviderCard } from '../../components/ProviderCard';

const ROLE_CONFIG: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  seeker:   { label: 'Service Seeker',  icon: 'search-outline' },
  provider: { label: 'Service Provider', icon: 'construct-outline' },
  business: { label: 'Business Owner',  icon: 'business-outline' },
};

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { favorites, loading: favsLoading, refresh: refreshFavs } = useMyFavorites(
    user?.role === 'seeker' ? (user?.id ?? null) : null
  );

  useFocusEffect(
    React.useCallback(() => {
      refreshFavs();
    }, [refreshFavs])
  );

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
        },
      },
    ]);
  }

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>
        </View>

        {/* Avatar + info */}
        <Card style={styles.profileCard} padding={20}>
          <View style={styles.avatarRow}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={[styles.avatar, { borderColor: colors.border }]}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                  {(user?.full_name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {user?.full_name ?? 'User'}
              </Text>
              {roleConfig && (
                <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={roleConfig.icon} size={12} color={colors.primary} />
                  <Text style={[styles.roleText, { color: colors.primary }]}>
                    {' '}{roleConfig.label}
                  </Text>
                </View>
              )}
              {user?.phone && (
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.phone, { color: colors.textMuted }]}>
                    {' '}{user.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          PREFERENCES
        </Text>

        <Card padding={0} style={{ overflow: 'hidden' }}>
          {/* Dark mode */}
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="moon-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {user?.role === 'business' && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => router.push('/register-business')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="business-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>My Business</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          {user?.role === 'provider' && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => router.push('/(provider)/dashboard')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="grid-outline" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Provider Dashboard</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconBox, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>About SkillUp</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>v1.0.0</Text>
          </View>
        </Card>

        {/* Saved Providers */}
        {user?.role === 'seeker' && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted, marginTop: 8 }]}>
              SAVED PROVIDERS
            </Text>
            {favorites.length === 0 ? (
              <Card padding={20} style={{ marginBottom: 8 }}>
                <View style={styles.emptyFavs}>
                  <Ionicons name="heart-outline" size={28} color={colors.textMuted} />
                  <Text style={[styles.emptyFavsText, { color: colors.textMuted }]}>
                    Tap the heart on a provider's profile to save them here.
                  </Text>
                </View>
              </Card>
            ) : (
              favorites.map((p) => <ProviderCard key={p.id} provider={p} />)
            )}
          </>
        )}

        <Button
          title="Sign Out"
          variant="outline"
          onPress={handleSignOut}
          loading={signingOut}
          style={{ marginTop: 24 }}
        />

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          Payments happen in person. SkillUp connects — you negotiate.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  profileCard: { marginBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, marginRight: 16 },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarInitial: { fontSize: 28, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  roleText: { fontSize: 12, fontWeight: '700' },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  phone: { fontSize: 13 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 13 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 32, lineHeight: 18 },
  emptyFavs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyFavsText: { fontSize: 14, flex: 1, lineHeight: 20 },
});
