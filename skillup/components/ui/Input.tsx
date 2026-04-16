import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, style, ...rest }, ref) => {
    const { colors } = useTheme();

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text
            style={[styles.label, { color: colors.textPrimary }]}
          >
            {label}
          </Text>
        ) : null}
        <View
          style={[
            styles.container,
            {
              borderColor: error ? colors.danger : colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        >
          {leftIcon && (
            <View style={styles.icon}>{leftIcon}</View>
          )}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                flex: 1,
              },
              style as object,
            ]}
            placeholderTextColor={colors.textMuted}
            {...rest}
          />
          {rightIcon && (
            <View style={styles.icon}>{rightIcon}</View>
          )}
        </View>
        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  input: {
    fontSize: 15,
    paddingVertical: 0,
  },
  icon: { marginRight: 8 },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});
