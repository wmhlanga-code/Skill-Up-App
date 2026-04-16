import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide?: () => void;
}

export function Toast({
  message,
  type = 'info',
  visible,
  onHide,
}: ToastProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onHide?.());
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
      style={[styles.container, { opacity, backgroundColor: bgMap[type] }]}
    >
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
    borderRadius: 12,
    padding: 14,
    zIndex: 999,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
