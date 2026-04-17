import React, { forwardRef, useState } from 'react';
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
  containerStyle?: object;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, leftIcon, rightIcon, style, containerStyle, onFocus, onBlur, multiline, ...rest }, ref) => {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);

    const borderColor = error
      ? colors.danger
      : focused
      ? colors.primary
      : colors.border;

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        ) : null}
        <View
          style={[
            styles.container,
            multiline && styles.containerMultiline,
            {
              borderColor,
              backgroundColor: colors.surface,
              shadowColor: focused ? colors.primary : 'transparent',
            },
            containerStyle,
          ]}
        >
          {leftIcon && (
            <View style={[styles.leftIcon, multiline && styles.leftIconMultiline]}>
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            multiline={multiline}
            style={[
              styles.input,
              { color: colors.textPrimary, flex: 1 },
              multiline && styles.inputMultiline,
              style as object,
            ]}
            placeholderTextColor={colors.textMuted}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
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
    marginBottom: 7,
    letterSpacing: 0.1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  containerMultiline: {
    height: undefined,
    minHeight: 50,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  input: { fontSize: 15, paddingVertical: 0 },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  leftIcon: { marginRight: 10 },
  leftIconMultiline: { marginTop: 2 },
  rightIcon: { marginLeft: 8 },
  error: { fontSize: 12, marginTop: 5, marginLeft: 2 },
});
