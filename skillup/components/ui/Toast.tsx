import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide?: () => void;
}

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function Toast({ message, type = 'info', visible, onHide }: ToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 8, duration: 280, useNativeDriver: true }),
          ]).start(() => onHide?.());
        }, 2500);
      });
    }
  }, [visible]);

  const bgMap = {
    success: colors.success,
    error: colors.danger,
    info: colors.primary,
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }], backgroundColor: bgMap[type] },
      ]}
    >
      <Ionicons name={ICON[type]} size={18} color="#fff" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1 },
});
