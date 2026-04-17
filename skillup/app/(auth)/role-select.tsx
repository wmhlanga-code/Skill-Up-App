import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import type { UserRole } from '../../types';

const ROLES: {
  id: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    id: 'seeker',
    icon: 'search-outline',
    title: 'I need services',
    description: 'Find skilled providers nearby — plumbers, cleaners, tutors, and more.',
  },
  {
    id: 'provider',
    icon: 'construct-outline',
    title: 'I offer services',
    description: 'List your skills, get discovered by people nearby, and grow your work.',
  },
  {
    id: 'business',
    icon: 'business-outline',
    title: 'I run a business',
    description: 'Register your business on SkillUp and connect with local customers.',
  },
];

export default function RoleSelectScreen() {
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    if (!selected) return;
    setSaving(true);
    try {
      await updateProfile({ role: selected });
      if (selected === 'provider') {
        router.replace('/(provider)/dashboard');
      } else if (selected === 'business') {
        router.replace('/register-business');
      } else {
        router.replace('/(tabs)/index' as never);
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save role.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.waveIcon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="hand-left-outline" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          How will you be using SkillUp?
        </Text>
      </View>

      <View style={styles.roles}>
        {ROLES.map((role) => {
          const isSelected = selected === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              onPress={() => setSelected(role.id)}
              activeOpacity={0.8}
              style={[
                styles.roleCard,
                {
                  backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              <View style={styles.roleRow}>
                <View
                  style={[
                    styles.roleIconBox,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={role.icon}
                    size={22}
                    color={isSelected ? '#fff' : colors.textMuted}
                  />
                </View>
                <View style={styles.roleInfo}>
                  <Text
                    style={[
                      styles.roleTitle,
                      { color: isSelected ? colors.primary : colors.textPrimary },
                    ]}
                  >
                    {role.title}
                  </Text>
                  <Text style={[styles.roleDescription, { color: colors.textMuted }]}>
                    {role.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Button
        title="Continue"
        onPress={handleConfirm}
        loading={saving}
        disabled={!selected}
        size="lg"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  waveIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center' },
  roles: { gap: 12, marginBottom: 32 },
  roleCard: { borderRadius: 16, padding: 16 },
  roleRow: { flexDirection: 'row', alignItems: 'center' },
  roleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  roleDescription: { fontSize: 13, lineHeight: 18 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
});
