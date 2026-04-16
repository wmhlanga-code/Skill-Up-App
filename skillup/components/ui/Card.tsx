import React from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps extends ViewProps {
  padding?: number;
  radius?: number;
  elevated?: boolean;
}

export function Card({
  children,
  style,
  padding = 16,
  radius = 16,
  elevated = true,
  ...rest
}: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius,
          padding,
          borderWidth: 1,
          borderColor: colors.border,
          ...(elevated && {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 8,
            elevation: 3,
          }),
        },
        style as object,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
