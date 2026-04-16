import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();

  const heights = { sm: 36, md: 48, lg: 56 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };
  const paddings = { sm: 12, md: 20, lg: 24 };
  const radii = { sm: 10, md: 14, lg: 16 };

  const bgMap = {
    primary: colors.primary,
    secondary: colors.primaryLight,
    outline: 'transparent',
    danger: colors.danger,
    ghost: 'transparent',
  };

  const textMap = {
    primary: '#FFFFFF',
    secondary: colors.primary,
    outline: colors.primary,
    danger: '#FFFFFF',
    ghost: colors.primary,
  };

  const borderMap = {
    primary: 'transparent',
    secondary: 'transparent',
    outline: colors.primary,
    danger: 'transparent',
    ghost: 'transparent',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        {
          height: heights[size],
          backgroundColor: bgMap[variant],
          borderColor: borderMap[variant],
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderRadius: radii[size],
          paddingHorizontal: paddings[size],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.55 : 1,
        },
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={textMap[variant]}
          size="small"
        />
      ) : (
        <View style={styles.inner}>
          {leftIcon && (
            <View style={{ marginRight: 8 }}>{leftIcon}</View>
          )}
          <Text
            style={{
              color: textMap[variant],
              fontSize: fontSizes[size],
              fontWeight: '600',
              letterSpacing: 0.3,
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
