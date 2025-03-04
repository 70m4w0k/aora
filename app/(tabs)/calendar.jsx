import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import CalendarView from "../(chores)/calendar";

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
  }
});

export default CalendarTab;
