import React from 'react';
import CalendarView from "../(calendar)/calendar";
import { SafeAreaView, StyleSheet } from 'react-native';

const CalendarTab = () => {
  return (
    <SafeAreaView style={styles.container}>
      <CalendarView />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default CalendarTab;
