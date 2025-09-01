import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MoodTrackerApp from './mood-tracker';
import MoodCalendar from './calendar';

export default function AppNavigation() {
  const [currentScreen, setCurrentScreen] = useState<'tracker' | 'calendar'>('tracker');

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {currentScreen === 'tracker' ? 'Mood Tracker' : 'Mood Calendar'}
      </Text>
      <TouchableOpacity
        onPress={() => setCurrentScreen(currentScreen === 'tracker' ? 'calendar' : 'tracker')}
        style={styles.headerButton}
      >
        <Ionicons 
          name={currentScreen === 'tracker' ? 'calendar-outline' : 'arrow-back-outline'} 
          size={24} 
          color="#374151" 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {currentScreen === 'tracker' ? <MoodTrackerApp /> : <MoodCalendar />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
});
