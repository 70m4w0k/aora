import React from 'react';
import CalendarView from "../(calendar)/calendar";
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

const CalendarTab = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CalendarView />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
});

export default CalendarTab;
