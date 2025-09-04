import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MoodTrackerApp from './mood-tracker';
import MoodCalendar from './calendar';
import { ThemeProvider, useTheme } from './ThemeContext';

function AppNavigationContent() {
  const [currentScreen, setCurrentScreen] = useState<'tracker' | 'calendar'>('tracker');
  const [showHistory, setShowHistory] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const renderHeader = () => (
    <View style={[styles.header, { 
      paddingTop: insets.top + 10,
      backgroundColor: colors.headerBackground,
      borderBottomColor: colors.border
    }]}> 
      <View style={styles.headerTitleRow}>
        <Image
          source={require('../assets/AppLogo.png')}
          style={styles.headerIcon}
          resizeMode="contain"
        />
        <Text style={[styles.headerTitle, { color: colors.text }]}>SimpleMoods</Text>
      </View>
      <View style={styles.headerButtons}>
        {/* Home/Tracker button */}
        <TouchableOpacity
          onPress={() => {
            setCurrentScreen('tracker');
            setShowHistory(false);
            // Do not force a calendar refresh when switching to tracker
          }}
          style={[styles.headerButton, { 
            backgroundColor: currentScreen === 'tracker' ? colors.buttonBackground : 'transparent'
          }]}
        >
          <Ionicons 
            name="home-outline"
            size={22} 
            color={colors.buttonText}
          />
        </TouchableOpacity>

        {/* Calendar button */}
        <TouchableOpacity
          onPress={() => {
            setCurrentScreen('calendar');
            setShowHistory(false);
            // Do not force refresh here; refresh only when explicitly requested by child
          }}
          style={[styles.headerButton, { 
            backgroundColor: (currentScreen === 'calendar' && !showHistory) ? colors.buttonBackground : 'transparent'
          }]}
        >
          <Ionicons 
            name="calendar-outline"
            size={22} 
            color={colors.buttonText}
          />
        </TouchableOpacity>

        {/* History button */}
        <TouchableOpacity
          onPress={() => {
            setCurrentScreen('calendar');
            setShowHistory(true);
            // Do not force refresh here; refresh only when explicitly requested by child
          }}
          style={[styles.headerButton, { 
            backgroundColor: showHistory ? colors.buttonBackground : 'transparent'
          }]}
        >
          <Ionicons 
            name="bar-chart-outline"
            size={22} 
            color={colors.buttonText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      {/* Keep both screens mounted to avoid remount flicker. Toggle visibility with display style. */}
      <View style={{ flex: 1, display: currentScreen === 'tracker' ? 'flex' : 'none' }}>
        <MoodTrackerApp onNavigateToCalendar={(shouldRefresh?: boolean) => {
          setCurrentScreen('calendar');
          setShowHistory(false);
          if (shouldRefresh) setRefreshKey(prev => prev + 1);
        }} />
      </View>

      <View style={{ flex: 1, display: currentScreen === 'calendar' ? 'flex' : 'none' }}>
        {/* Pass refreshSignal so MoodCalendar can reload without being remounted */}
        <MoodCalendar refreshSignal={refreshKey} initialViewMode={showHistory ? 'history' : 'calendar'} />
      </View>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
    borderRadius: 6,
  },
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
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    letterSpacing: 0.5,
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
