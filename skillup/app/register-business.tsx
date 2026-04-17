import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const BUSINESS_CATEGORIES = [
  'Trades',
  'Beauty',
  'Automotive',
  'Cleaning',
  'Tech',
  'Garden',
  'Education',
  'Retail',
  'Food & Beverage',
  'Healthcare',
  'Other',
];

const schema = z.object({
  business_name: z.string().min(2, 'Enter your business name'),
  category: z.string().min(1, 'Select a category'),
  owner_name: z.string().min(2, 'Enter the owner name'),
  phone: z
    .string()
    .min(9, 'Enter a valid phone number')
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
  area_name: z.string().min(2, 'Enter your area'),
  services_description: z.string().min(10, 'Describe your services (min 10 chars)'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterBusinessScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { coordinates } = useLocation();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name: '',
      category: '',
      owner_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      area_name: '',
      services_description: '',
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSaving(true);
    try {
      const locationValue = coordinates
        ? `SRID=4326;POINT(${coordinates.longitude} ${coordinates.latitude})`
        : null;

      const { error } = await supabase.from('businesses').insert({
        user_id: user.id,
        business_name: values.business_name,
        category: values.category,
        owner_name: values.owner_name,
        phone: values.phone,
        area_name: values.area_name,
        services_description: values.services_description,
        location: locationValue,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to register business.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
            Business Registered!
          </Text>
          <Text style={[styles.successSub, { color: colors.textMuted }]}>
            Your business is now listed on SkillUp. Customers in your area can find you.
          </Text>
          <Button
            title="Go to Home"
            onPress={() => router.replace('/(tabs)/index' as never)}
            leftIcon={<Ionicons name="home" size={18} color="#fff" />}
            style={{ marginTop: 24, minWidth: 200 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.back}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}> Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="business" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Register Your Business
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Get discovered by customers near you on SkillUp
            </Text>
          </View>

          <Card>
            <View style={styles.fields}>
              <Controller
                control={control}
                name="business_name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Business Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.business_name?.message}
                    leftIcon={<Ionicons name="business-outline" size={18} color={colors.textMuted} />}
                  />
                )}
              />

              {/* Category */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Category
                </Text>
                <Controller
                  control={control}
                  name="category"
                  render={({ field: { onChange, value } }) => (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 4 }}
                    >
                      {BUSINESS_CATEGORIES.map((cat) => {
                        const active = value === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => onChange(cat)}
                            style={[
                              styles.catChip,
                              {
                                backgroundColor: active ? colors.primary : colors.surface,
                                borderColor: active ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            <Text style={[styles.catLabel, { color: active ? '#fff' : colors.textPrimary }]}>
                              {cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                />
                {errors.category && (
                  <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>
                    {errors.category.message}
                  </Text>
                )}
              </View>

              <Controller
                control={control}
                name="owner_name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Owner Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.owner_name?.message}
                    leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Phone Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                    keyboardType="phone-pad"
                    leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="area_name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Area / Suburb"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.area_name?.message}
                    leftIcon={<Ionicons name="location-outline" size={18} color={colors.textMuted} />}
                  />
                )}
              />

              <Controller
                control={control}
                name="services_description"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Describe Your Services"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.services_description?.message}
                    multiline
                    numberOfLines={4}
                    style={{ height: 100, textAlignVertical: 'top' }}
                    placeholder="What services does your business offer?"
                  />
                )}
              />
            </View>

            {coordinates && (
              <View style={[styles.locationNote, { backgroundColor: colors.successLight }]}>
                <Ionicons name="location" size={14} color={colors.success} />
                <Text style={[styles.locationNoteText, { color: colors.success }]}>
                  {' '}GPS location will be saved with your listing
                </Text>
              </View>
            )}

            <Button
              title="Register Business"
              onPress={handleSubmit(onSubmit)}
              loading={saving}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backText: { fontSize: 15, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 24 },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  fields: { gap: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    marginRight: 8,
  },
  catLabel: { fontSize: 13, fontWeight: '600' },
  locationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  locationNoteText: { fontSize: 13, fontWeight: '500' },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  successSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
