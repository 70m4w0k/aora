import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';
import Button from './Button';

const EmptyState = ({ icon = 'file-tray-outline', title = 'Nothing here yet', description, actionLabel, onAction, style, ...props }) => {
  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={48} color={colors.text.tertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} variant="primary" size="md" style={styles.button} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'] },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background.tertiary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.styles.h4, textAlign: 'center', marginBottom: spacing.sm },
  description: { ...typography.styles.body, textAlign: 'center', color: colors.text.tertiary, maxWidth: 280 },
  button: { marginTop: spacing.xl },
});

export default EmptyState;

