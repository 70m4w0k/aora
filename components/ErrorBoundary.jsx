import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0A0A0C',
  card: '#18181B',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  accent: '#F43F5E',
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to your error tracking service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={48} color={COLORS.accent} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.props.fallbackMessage || "We're sorry, but something unexpected happened. Please try again."}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
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
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  errorDetails: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.accent,
  },
});

export default ErrorBoundary;

