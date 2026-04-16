import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z
  .object({
    full_name: z.string().min(2, 'Enter your full name'),
    phone: z
      .string()
      .min(9, 'Enter a valid phone number')
      .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await signUp(values.email, values.password, values.full_name, values.phone);
      router.replace('/(auth)/role-select');
    } catch (err: unknown) {
      Alert.alert(
        'Sign up failed',
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
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
          <Text style={[styles.backText, { color: colors.primary }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>⚡</Text>
          <Text style={[styles.logo, { color: colors.primary }]}>SkillUp</Text>
        </View>

        {/* Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Create account
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Join SkillUp today
          </Text>

          <View style={styles.fields}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Full Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.full_name?.message}
                  autoCapitalize="words"
                  autoComplete="name"
                  leftIcon={<Text style={{ fontSize: 16 }}>👤</Text>}
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
                  autoComplete="tel"
                  leftIcon={<Text style={{ fontSize: 16 }}>📱</Text>}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Text style={{ fontSize: 16 }}>✉️</Text>}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secureTextEntry={!showPassword}
                  leftIcon={<Text style={{ fontSize: 16 }}>🔒</Text>}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                      <Text style={{ fontSize: 16 }}>
                        {showPassword ? '🙈' : '👁️'}
                      </Text>
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirm_password?.message}
                  secureTextEntry={!showPassword}
                  leftIcon={<Text style={{ fontSize: 16 }}>🔒</Text>}
                />
              )}
            />
          </View>

          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  back: { marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: '600' },
  header: { alignItems: 'center', marginBottom: 28 },
  logoEmoji: { fontSize: 36, marginBottom: 6 },
  logo: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  fields: { gap: 16, marginBottom: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
