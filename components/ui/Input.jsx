import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../constants';

const Input = ({
  label, placeholder, value, onChangeText, error, hint, icon,
  secureTextEntry = false, multiline = false, style, inputStyle, ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;
  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, isFocused && styles.inputFocused, hasError && styles.inputError]}>
        {icon && <Ionicons name={icon} size={20} color={hasError ? colors.semantic.error : colors.text.tertiary} style={styles.leftIcon} />}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon, multiline && styles.multilineInput, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.rightIcon} hitSlop={8}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.text.tertiary} />
          </Pressable>
        )}
      </View>
      {(error || hint) && <Text style={[styles.helperText, hasError && styles.errorText]}>{error || hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  label: { ...typography.styles.label, marginBottom: spacing.sm, color: colors.text.secondary, textTransform: 'none', fontSize: 14, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.tertiary, borderRadius: borderRadius.input, borderWidth: 1, borderColor: 'transparent' },
  inputFocused: { borderColor: colors.accent.primary, backgroundColor: colors.background.secondary },
  inputError: { borderColor: colors.semantic.error },
  input: { flex: 1, color: colors.text.primary, fontSize: 16, paddingVertical: spacing.md, paddingHorizontal: spacing.base },
  inputWithIcon: { paddingLeft: 0 },
  multilineInput: { minHeight: 100, paddingTop: spacing.md },
  leftIcon: { marginLeft: spacing.base, marginRight: spacing.sm },
  rightIcon: { padding: spacing.md },
  helperText: { ...typography.styles.caption, marginTop: spacing.xs, marginLeft: spacing.xs },
  errorText: { color: colors.semantic.error },
});

export default Input;

