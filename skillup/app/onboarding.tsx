import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export const ONBOARDING_KEY = '@skillup:onboarding_seen';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'search',
    title: 'Find skilled pros nearby',
    subtitle:
      'Browse plumbers, electricians, beauticians, tutors and 100+ other service providers right in your neighbourhood.',
    color: '#2B9EE8',
  },
  {
    id: '2',
    icon: 'chatbubbles',
    title: 'Chat, WhatsApp & hire',
    subtitle:
      'Message providers in-app, continue on WhatsApp, or send a booking request instantly. No middleman — you deal directly.',
    color: '#10B981',
  },
  {
    id: '3',
    icon: 'star',
    title: 'Trusted reviews & ratings',
    subtitle:
      'Real reviews from real clients. Every provider is rated so you always know who you are hiring before they arrive.',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(auth)/login');
  }

  function next() {
    if (activeIndex < SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    } else {
      finish();
    }
  }

  // Stable ref — never recreated, satisfies FlatList invariant
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: { viewAreaCoveragePercentThreshold: 60 },
      onViewableItemsChanged: ({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
          setActiveIndex(viewableItems[0].index ?? 0);
        }
      },
    },
  ]);

  const activeColor = SLIDES[activeIndex]?.color ?? '#2B9EE8';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={72} color={item.color} />
            </View>
            <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.slideSub, { color: colors.textMuted }]}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: activeColor,
                width: i === activeIndex ? 24 : 8,
                opacity: i === activeIndex ? 1 : 0.3,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={next}
          style={[styles.nextBtn, { backgroundColor: activeColor }]}
        >
          <Text style={styles.nextBtnText}>
            {activeIndex === SLIDES.length - 1 ? "Let's go!" : 'Next'}
          </Text>
          <Ionicons
            name={activeIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>

        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  slideTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5 },
  slideSub: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 32 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 16 : 24, gap: 12 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 18,
    gap: 8,
  },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 15, fontWeight: '500' },
});
