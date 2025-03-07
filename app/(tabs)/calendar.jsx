import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import CalendarView from "../(chores)/calendar";
import GardenCalendar from "../../components/GardenCalendar";

const CalendarTab = () => {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'garden'
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
            Tasks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'garden' && styles.activeTab]}
          onPress={() => setActiveTab('garden')}
        >
          <Text style={[styles.tabText, activeTab === 'garden' && styles.activeTabText]}>
            Garden
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'tasks' ? (
        <CalendarView />
      ) : (
        <GardenCalendar />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#4CAF50',
  }
});

export default CalendarTab;
