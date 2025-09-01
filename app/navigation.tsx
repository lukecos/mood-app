import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MoodTrackerApp from './mood-tracker';
import MoodCalendar from './calendar';

export default function AppNavigation() {
  const [currentScreen, setCurrentScreen] = useState<'tracker' | 'calendar'>('tracker');
  const [refreshKey, setRefreshKey] = useState(0);
  const insets = useSafeAreaInsets();

  const handleNavigateToCalendar = () => {
    setCurrentScreen('calendar');
    setRefreshKey(prev => prev + 1); // Force calendar to re-render and load fresh data
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.headerTitle}>
        {currentScreen === 'tracker' ? 'Mood Tracker' : 'Mood Calendar'}
      </Text>
      <TouchableOpacity
        onPress={() => {
          if (currentScreen === 'tracker') {
            handleNavigateToCalendar();
          } else {
            setCurrentScreen('tracker');
          }
        }}
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
      {currentScreen === 'tracker' ? (
        <MoodTrackerApp onNavigateToCalendar={handleNavigateToCalendar} />
      ) : (
        <MoodCalendar key={refreshKey} />
      )}
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
    paddingBottom: 15,
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
