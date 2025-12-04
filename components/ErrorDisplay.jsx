import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseAppwriteError } from '../lib/errorHandler';
import { useTranslation } from '../hooks/useTranslation';

const COLORS = {
  bg: '#0A0A0C',
  card: '#18181B',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  error: '#EF4444',
  accent: '#F43F5E',
};

/**
 * Error display component
 * Shows user-friendly error messages with retry option
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = null,
  message = null,
  showRetry = true,
  style 
}) => {
  const t = useTranslation();
  const errorMessage = message || parseAppwriteError(error);
  const displayTitle = title || t("errors.somethingWentWrong");

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        </View>
        
        <Text style={styles.title}>{displayTitle}</Text>
        
        <Text style={styles.message}>{errorMessage}</Text>
        
        {showRetry && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryText}>{t("errors.tryAgain")}</Text>
          </TouchableOpacity>
        )}
        
        {__DEV__ && error && (
          <View style={styles.errorDetails}>
            <Text style={styles.errorLabel}>{t("errors.errorDetails")}</Text>
            <Text style={styles.errorText}>
              {error.message || error.toString()}
            </Text>
            {error.stack && (
              <Text style={styles.errorStack}>{error.stack}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Inline error component for forms and smaller spaces
 */
export const InlineError = ({ error, message = null, style }) => {
  if (!error) return null;
  
  const errorMessage = message || parseAppwriteError(error);

  return (
    <View style={[styles.inlineContainer, style]}>
      <Ionicons name="alert-circle" size={16} color={COLORS.error} />
      <Text style={styles.inlineText}>{errorMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.bg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 24,
    padding: 12,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    width: '100%',
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.error,
    fontFamily: 'monospace',
  },
  errorStack: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  inlineText: {
    fontSize: 12,
    color: COLORS.error,
    flex: 1,
  },
});

export default ErrorDisplay;

