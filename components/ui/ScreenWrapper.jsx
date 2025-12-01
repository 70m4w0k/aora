import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants';

const ScreenWrapper = ({ children, noPadding = false, noSafeArea = false, backgroundColor = colors.background.primary, style, ...props }) => {
  const Container = noSafeArea ? View : SafeAreaView;
  return (
    <Container style={[styles.container, { backgroundColor }, style]} {...props}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <View style={[styles.content, !noPadding && styles.padding]}>{children}</View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { paddingHorizontal: spacing.screen.horizontal },
});

export default ScreenWrapper;

