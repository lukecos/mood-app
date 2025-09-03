import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MoodTrackerApp from './mood-tracker';
import MoodCalendar from './calendar';
import { ThemeProvider, useTheme } from './ThemeContext';

function AppNavigationContent() {
  const [currentScreen, setCurrentScreen] = useState<'tracker' | 'calendar'>('tracker');
  const [refreshKey, setRefreshKey] = useState(0);
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme, colors } = useTheme();

  const handleNavigateToCalendar = () => {
    setCurrentScreen('calendar');
    setRefreshKey(prev => prev + 1); // Force calendar to re-render and load fresh data
  };

  const renderHeader = () => (
    <View style={[styles.header, { 
      paddingTop: insets.top + 10,
      backgroundColor: colors.headerBackground,
      borderBottomColor: colors.border
    }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {currentScreen === 'tracker' ? 'Mood Tracker' : 'Mood Calendar'}
      </Text>
      
      <View style={styles.headerButtons}>
        {/* Dark mode toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.headerButton, { backgroundColor: colors.buttonBackground }]}
        >
          <Ionicons 
            name={theme === 'light' ? 'moon-outline' : 'sunny-outline'} 
            size={22} 
            color={colors.buttonText}
          />
        </TouchableOpacity>
        
        {/* Navigation button */}
        <TouchableOpacity
          onPress={() => {
            if (currentScreen === 'tracker') {
              handleNavigateToCalendar();
            } else {
              setCurrentScreen('tracker');
            }
          }}
          style={[styles.headerButton, { backgroundColor: colors.buttonBackground }]}
        >
          <Ionicons 
            name={currentScreen === 'tracker' ? 'calendar-outline' : 'arrow-back-outline'} 
            size={24} 
            color={colors.buttonText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {currentScreen === 'tracker' ? (
        <MoodTrackerApp onNavigateToCalendar={handleNavigateToCalendar} />
      ) : (
        <MoodCalendar key={refreshKey} />
      )}
    </SafeAreaView>
  );
}

export default function AppNavigation() {
  return (
    <ThemeProvider>
      <AppNavigationContent />
    </ThemeProvider>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20, // Half of width/height for perfect circle
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
