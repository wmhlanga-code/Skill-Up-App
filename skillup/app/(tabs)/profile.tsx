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
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

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

  const roleLabels: Record<string, string> = {
    seeker: '🔍 Service Seeker',
    provider: '🛠️ Service Provider',
    business: '🏢 Business Owner',
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Profile
          </Text>
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
              <View
                style={[styles.avatarFallback, { backgroundColor: colors.primaryLight }]}
              >
                <Text style={styles.avatarInitial}>
                  {(user?.full_name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {user?.full_name ?? 'User'}
              </Text>
              {user?.role && (
                <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.roleText, { color: colors.primary }]}>
                    {roleLabels[user.role]}
                  </Text>
                </View>
              )}
              {user?.phone && (
                <Text style={[styles.phone, { color: colors.textMuted }]}>
                  📱 {user.phone}
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          PREFERENCES
        </Text>

        <Card padding={0} style={{ overflow: 'hidden' }}>
          {/* Dark mode */}
          <View
            style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.rowEmoji}>🌙</Text>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Register business (for business role) */}
          {user?.role === 'business' && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => router.push('/register-business')}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowEmoji}>🏢</Text>
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                  My Business
                </Text>
              </View>
              <Text style={[styles.rowChevron, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          )}

          {/* Switch to provider dashboard */}
          {user?.role === 'provider' && (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => router.push('/(provider)/dashboard')}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.rowEmoji}>📊</Text>
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                  Provider Dashboard
                </Text>
              </View>
              <Text style={[styles.rowChevron, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          )}

          {/* About */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowEmoji}>ℹ️</Text>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>
                About SkillUp
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.textMuted }]}>
              v1.0.0
            </Text>
          </View>
        </Card>

        {/* Sign out */}
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
  avatarInitial: { fontSize: 28, fontWeight: '800', color: '#2B9EE8' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginBottom: 6 },
  roleText: { fontSize: 12, fontWeight: '700' },
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
  rowEmoji: { fontSize: 20, marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 13 },
  rowChevron: { fontSize: 22 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 32, lineHeight: 18 },
});
