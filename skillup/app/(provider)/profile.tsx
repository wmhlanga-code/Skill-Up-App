import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useMyProviderProfile } from '../../hooks/useProviders';
import { useLocation } from '../../hooks/useLocation';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES, CATEGORY_ICONS } from '../../constants/theme';
import type { ProviderCategory } from '../../types';

const PROVIDER_CATEGORIES = CATEGORIES.filter((c) => c !== 'All') as ProviderCategory[];

const schema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  category: z.string().min(1, 'Select a category'),
  years_experience: z.string().regex(/^\d+$/, 'Enter a valid number'),
  area_name: z.string().min(2, 'Enter your area'),
});

type FormValues = z.infer<typeof schema>;

export default function ProviderProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { provider, refresh } = useMyProviderProfile(user?.id ?? null);
  const { coordinates } = useLocation();
  const [saving, setSaving] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bio: '',
      category: 'Trades',
      years_experience: '1',
      area_name: '',
    },
  });

  useEffect(() => {
    if (provider) {
      reset({
        bio: provider.bio ?? '',
        category: provider.category ?? 'Trades',
        years_experience: String(provider.years_experience),
        area_name: provider.area_name ?? '',
      });
    }
  }, [provider]);

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSaving(true);
    try {
      const locationValue = coordinates
        ? `SRID=4326;POINT(${coordinates.longitude} ${coordinates.latitude})`
        : null;

      const yearsExp = parseInt(values.years_experience, 10);

      if (provider) {
        const { error } = await supabase
          .from('providers')
          .update({
            bio: values.bio,
            category: values.category,
            years_experience: yearsExp,
            area_name: values.area_name,
            ...(locationValue && { location: locationValue }),
          })
          .eq('id', provider.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('providers').insert({
          user_id: user.id,
          bio: values.bio,
          category: values.category,
          years_experience: yearsExp,
          area_name: values.area_name,
          location: locationValue,
        });
        if (error) throw error;
      }

      await refresh();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function addService() {
    if (!provider || !serviceName.trim()) return;
    setAddingService(true);
    try {
      const { error } = await supabase.from('services').insert({
        provider_id: provider.id,
        name: serviceName.trim(),
        price_from: servicePrice ? parseFloat(servicePrice) : null,
        price_label: servicePrice ? `From R${servicePrice}` : null,
      });
      if (error) throw error;
      setServiceName('');
      setServicePrice('');
      Alert.alert('Added', 'Service added.');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add service.');
    } finally {
      setAddingService(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Provider Profile
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {provider ? 'Update your profile' : 'Complete your profile to get discovered'}
          </Text>

          {/* Profile form */}
          <Card style={{ marginBottom: 20 }}>
            <View style={styles.fields}>

              {/* Bio */}
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Bio / About You"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bio?.message}
                    multiline
                    numberOfLines={4}
                    placeholder="Tell clients what you do and what makes you great…"
                  />
                )}
              />

              {/* Category — wrapped flex row, no nested ScrollView */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Category
                </Text>
                <Controller
                  control={control}
                  name="category"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.chipsWrap}>
                      {PROVIDER_CATEGORIES.map((cat) => {
                        const active = value === cat;
                        const iconName = (CATEGORY_ICONS[cat] ?? 'help-circle-outline') as keyof typeof Ionicons.glyphMap;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => onChange(cat)}
                            activeOpacity={0.75}
                            style={[
                              styles.catChip,
                              {
                                backgroundColor: active ? colors.primary : colors.surface,
                                borderColor: active ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Ionicons
                              name={iconName}
                              size={13}
                              color={active ? '#fff' : colors.textMuted}
                            />
                            <Text
                              style={[
                                styles.catLabel,
                                { color: active ? '#fff' : colors.textPrimary },
                              ]}
                            >
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                />
                {errors.category && (
                  <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>
                    {errors.category.message}
                  </Text>
                )}
              </View>

              {/* Years of experience */}
              <Controller
                control={control}
                name="years_experience"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Years of Experience"
                    value={String(value)}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.years_experience?.message}
                    keyboardType="number-pad"
                    placeholder="e.g. 3"
                    leftIcon={<Ionicons name="trophy-outline" size={18} color={colors.textMuted} />}
                  />
                )}
              />

              {/* Area */}
              <Controller
                control={control}
                name="area_name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Your Area / Suburb"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.area_name?.message}
                    placeholder="e.g. Sandton, Johannesburg"
                    leftIcon={<Ionicons name="location-outline" size={18} color={colors.textMuted} />}
                  />
                )}
              />
            </View>

            {coordinates ? (
              <View style={[styles.locationNote, { backgroundColor: colors.successLight }]}>
                <Ionicons name="location" size={14} color={colors.success} />
                <Text style={[styles.locationNoteText, { color: colors.success }]}>
                  {' '}GPS location will be saved with your profile
                </Text>
              </View>
            ) : (
              <View style={[styles.locationNote, { backgroundColor: colors.border }]}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.locationNoteText, { color: colors.textMuted }]}>
                  {' '}Enable location so clients can find you nearby
                </Text>
              </View>
            )}

            <Button
              title={provider ? 'Update Profile' : 'Create Profile'}
              onPress={() => handleSubmit(onSubmit)()}
              loading={saving}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </Card>

          {/* Add service — only shown after profile exists */}
          {provider && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Add a Service
              </Text>
              <Card style={{ marginBottom: 20 }}>
                <View style={styles.fields}>
                  <Input
                    label="Service Name"
                    value={serviceName}
                    onChangeText={setServiceName}
                    placeholder="e.g. Plumbing repair"
                    leftIcon={<Ionicons name="construct-outline" size={18} color={colors.textMuted} />}
                  />
                  <Input
                    label="Starting Price (R)"
                    value={servicePrice}
                    onChangeText={setServicePrice}
                    placeholder="e.g. 250"
                    keyboardType="numeric"
                    leftIcon={<Ionicons name="cash-outline" size={18} color={colors.textMuted} />}
                  />
                </View>
                <Button
                  title="Add Service"
                  variant="secondary"
                  onPress={addService}
                  loading={addingService}
                  disabled={!serviceName.trim()}
                />
              </Card>
            </>
          )}

          {/* Sign out */}
          <Button
            title="Sign Out"
            variant="outline"
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
              ])
            }
            style={{ marginTop: 8, marginBottom: 16 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  fields: { gap: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 5,
  },
  catLabel: { fontSize: 12, fontWeight: '600' },
  locationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  locationNoteText: { fontSize: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
});
