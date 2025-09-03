import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { getMoodHistory, MoodEntry } from './storage';
import { useTheme } from './ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MoodCalendarProps {
  initialViewMode?: 'calendar' | 'history';
}

export default function MoodCalendar({ initialViewMode = 'calendar' }: MoodCalendarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodHistory, setMoodHistory] = useState<Record<string, MoodEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'history'>(initialViewMode);
  const [selectedMoodData, setSelectedMoodData] = useState<{
    date: string;
    mood: string;
    journal: string;
    moodValue: number;
    moodColor: string;
  } | null>(null);
  
  // Just use current month for optimal performance
  const currentMonth = useMemo(() => new Date(), []);
  
  // Dynamic month display based on available data
  const [displayMonth, setDisplayMonth] = useState<Date>(currentMonth);
  
  // Determine which month to display based on available data
  const determineDisplayMonth = useCallback(() => {
    console.log('Determining display month from mood history...');
    
    // Always use current month - no more test data month switching
    console.log('Using current month for display');
    return currentMonth;
  }, [currentMonth]);

  // Update display month when mood history changes
  useEffect(() => {
    const newDisplayMonth = determineDisplayMonth();
    setDisplayMonth(newDisplayMonth);
  }, [determineDisplayMonth]);

  // Memoized mood helper functions
  const getMoodColor = useCallback((mood: number) => {
    const colors = {
      1: '#ef4444', // Rough - True Red
      2: '#fb923c', // Meh - Orange
      3: '#fbbf24', // Fine - Amber
      4: '#22c55e', // Great - Bright Green
      5: '#8b5cf6', // Peak - Purple
    };
    return colors[mood as keyof typeof colors] || '#e5e7eb';
  }, []);

  const getMoodEmoji = useCallback((mood: number) => {
    const emojis = {
      1: '😢',
      2: '😔', 
      3: '😐',
      4: '😊',
      5: '😄',
    };
    return emojis[mood as keyof typeof emojis] || '❓';
  }, []);

  // Load mood history from storage
  const loadMoodHistory = async () => {
    try {
      setIsLoading(true);
      const history = await getMoodHistory();
      setMoodHistory(history);
    } catch (error) {
      console.error('Error loading mood history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up any future data that shouldn't exist
  const cleanFutureData = async () => {
    try {
      const history = await getMoodHistory();
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      let hasChanges = false;
      const cleanedHistory: Record<string, MoodEntry> = {};
      
      for (const [dateKey, entry] of Object.entries(history)) {
        // Keep entries that are today or in the past
        if (dateKey <= todayKey) {
          cleanedHistory[dateKey] = entry;
        } else {
          console.log(`🗑️ Removing future data for ${dateKey}`);
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        // Save cleaned data back to storage
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem('mood_entries', JSON.stringify(cleanedHistory));
        console.log('✅ Future data cleaned up');
      }
      
    } catch (error) {
      console.error('❌ Error cleaning future data:', error);
    }
  };

  // Inject test data for development - spread across last 6 months
  const injectTestData = async () => {
    console.log('🎲 Starting test data generation...');
    
    try {
      setIsLoading(true); // Show loading state
      console.log('⏳ Loading state set to true');
      
      const today = new Date();
      console.log('📅 Today:', today.toISOString().split('T')[0]);
      
      const testEntries: { date: Date; mood: number; journal: string }[] = [];
      
      // Simplified journal entries
      const journals = [
        "Had a great day today!",
        "Feeling pretty good overall.",
        "Just an okay day.",
        "Struggling a bit today.",
        "Amazing day, everything went well!"
      ];
      
      console.log('📝 Creating test entries...');
      
      // Generate entries for random historical months (not consecutive)
      const randomMonthCount = Math.floor(Math.random() * 6) + 1; // Random between 1-6
      console.log(`🎲 Generating data for ${randomMonthCount} historical months`);
      
      // Create array of possible month offsets (1-12 to skip current month and go back up to a year)
      const possibleOffsets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      
      // Randomly select which months to populate
      const selectedOffsets = possibleOffsets
        .sort(() => Math.random() - 0.5) // Shuffle the array
        .slice(0, randomMonthCount) // Take only the number we want
        .sort((a, b) => a - b); // Sort them so we process in chronological order
      
      console.log(`📅 Selected month offsets: ${selectedOffsets.join(', ')}`);
      
      for (const monthOffset of selectedOffsets) {
        console.log(`📆 Processing month offset: ${monthOffset}`);
        
        const targetMonth = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
        console.log(`🗓️ Target month: ${targetMonth.getFullYear()}-${targetMonth.getMonth() + 1}`);
        
        // Fixed number of entries per month to avoid infinite loops
        const daysToAdd = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]; // Fixed days per month (15 entries)
        
        for (const day of daysToAdd) {
          const entryDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
          
          // Only add if date is not in future
          if (entryDate <= today) {
            const mood = Math.floor(Math.random() * 5) + 1;
            const journal = journals[mood - 1];
            
            testEntries.push({
              date: entryDate,
              mood: mood,
              journal: journal
            });
            
            console.log(`✅ Added entry for ${entryDate.toISOString().split('T')[0]} - mood: ${mood}`);
          } else {
            console.log(`⏭️ Skipped future date: ${entryDate.toISOString().split('T')[0]}`);
          }
        }
      }
      
      console.log(`📊 Created ${testEntries.length} test entries total`);
      
      if (testEntries.length === 0) {
        console.log('❌ No entries to save!');
        return;
      }
      
      // Create batch data for storage
      console.log('💾 Preparing data for storage...');
      const batchData: Record<string, any> = {};
      
      testEntries.forEach((entry, index) => {
        const dateKey = entry.date.toISOString().split('T')[0]; // YYYY-MM-DD format
        batchData[dateKey] = {
          date: dateKey,
          mood: entry.mood,
          journal: entry.journal,
          advice: "Test advice entry"
        };
        
        if (index < 3) { // Log first 3 entries
          console.log(`📝 Entry ${index + 1}: ${dateKey} - mood ${entry.mood}`);
        }
      });
      
      console.log('💽 Saving to AsyncStorage...');
      
      // Save to AsyncStorage
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const existingData = await AsyncStorage.default.getItem('mood_entries');
      const existingHistory = existingData ? JSON.parse(existingData) : {};
      
      console.log(`📚 Existing entries: ${Object.keys(existingHistory).length}`);
      
      // Merge with existing data
      const finalData = { ...existingHistory, ...batchData };
      
      console.log(`📊 Final data will have ${Object.keys(finalData).length} entries`);
      
      // Single write operation
      await AsyncStorage.default.setItem('mood_entries', JSON.stringify(finalData));
      
      console.log('✅ Data saved successfully!');
      
      // Reload data
      console.log('🔄 Reloading mood history...');
      await loadMoodHistory();
      
      console.log('🎉 Test data generation completed!');
      
    } catch (error) {
      console.error('❌ Error in test data generation:', error);
    } finally {
      console.log('🏁 Cleaning up - setting loading to false');
      setIsLoading(false);
    }
  };

  // Refresh data when component mounts
  useEffect(() => {
    const initializeCalendar = async () => {
      // Clean up any future data first
      await cleanFutureData();
      // Then load the cleaned data
      await loadMoodHistory();
    };
    
    initializeCalendar();
  }, []);

  const formatDateKey = useCallback((date: Date) => {
    // Use local date formatting to match storage
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }, []);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, []);

  // Render individual month calendar (memoized for performance)
  const renderMonth = useCallback((monthDate: Date) => {
    const days = getDaysInMonth(monthDate);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.monthContainer} key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
        {/* Month Title */}
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
        </Text>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {dayNames.map((day) => (
            <Text key={day} style={[styles.dayHeader, { color: colors.textMuted }]}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.emptyDay} />;
            }

            const dateKey = formatDateKey(day);
            const moodEntry = moodHistory[dateKey];
            const isToday = dateKey === formatDateKey(new Date());

            return (
              <TouchableOpacity
                key={dateKey}
                style={[
                  styles.dayCell,
                  { backgroundColor: colors.surface },
                  isToday && [styles.today, { 
                    backgroundColor: colors.surface, 
                    borderColor: '#0284c7' 
                  }],
                  moodEntry && { 
                    backgroundColor: getMoodColor(moodEntry.mood)
                    // Removed border for cleaner look in both light and dark modes
                  }
                ]}
                onPress={() => {
                  if (moodEntry) {
                    // Format date as DD/MM/YY
                    const formattedDate = `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}/${String(day.getFullYear()).slice(-2)}`;
                    
                    // Get mood description
                    const moodDescriptions = {
                      1: 'Rough',
                      2: 'Meh',
                      3: 'Fine',
                      4: 'Great',
                      5: 'Peak'
                    };
                    
                    const moodDescription = moodDescriptions[moodEntry.mood as keyof typeof moodDescriptions];
                    
                    // Set modal data and show modal
                    setSelectedMoodData({
                      date: formattedDate,
                      mood: moodDescription,
                      journal: moodEntry.journal || '',
                      moodValue: moodEntry.mood,
                      moodColor: getMoodColor(moodEntry.mood)
                    });
                    setModalVisible(true);
                  }
                }}
              >
                <Text style={[
                  styles.dayNumber, 
                  { color: colors.text },
                  isToday && styles.todayText,
                  moodEntry && styles.moodDayText
                ]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }, [getDaysInMonth, formatDateKey, getMoodColor, getMoodEmoji, moodHistory, colors]);

  // Analyze mood patterns for insights
  const renderMoodPatterns = useCallback(() => {
    // Filter mood history to only include current display month
    const currentMonthKey = `${displayMonth.getFullYear()}-${String(displayMonth.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthEntries = Object.entries(moodHistory).filter(([dateKey]) => 
      dateKey.startsWith(currentMonthKey)
    );

    // Require at least 7 days of data for meaningful patterns
    if (currentMonthEntries.length < 7) {
      return (
        <Text style={[styles.noDataText, { color: colors.textMuted }]}>
          Track moods for at least 7 days this month to see patterns and insights!
        </Text>
      );
    }

    const patterns = [];
    
    // Analyze by day of week (current month only)
    const dayStats: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    currentMonthEntries.forEach(([dateKey, entry]) => {
      const date = new Date(dateKey + 'T00:00:00');
      const dayOfWeek = date.getDay();
      dayStats[dayOfWeek].push(entry.mood);
    });

    // Find patterns
    const dayAverages = Object.entries(dayStats).map(([day, moods]) => ({
      day: parseInt(day),
      average: moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0,
      count: moods.length
    })).filter(d => d.count > 0);

    if (dayAverages.length > 1) { // Need at least 2 different days to compare
      const sortedDays = dayAverages.sort((a, b) => a.average - b.average);
      const saddestDay = sortedDays[0];
      const happiestDay = sortedDays[sortedDays.length - 1];

      if (saddestDay.average < happiestDay.average) {
        patterns.push({
          icon: '📉',
          text: `Your lowest moods this month tend to be on ${dayNames[saddestDay.day]}s`,
          type: 'warning'
        });

        patterns.push({
          icon: '📈',
          text: `${dayNames[happiestDay.day]}s are typically your best days this month`,
          type: 'positive'
        });
      }
    }

    // Current month mood trend
    const totalEntries = currentMonthEntries.length;
    const averageMood = currentMonthEntries.reduce((sum, [, entry]) => sum + entry.mood, 0) / totalEntries;
    
    if (averageMood >= 4) {
      patterns.push({
        icon: '😊',
        text: `You're doing great! Your average mood this month is ${averageMood.toFixed(1)}/5`,
        type: 'positive'
      });
    } else if (averageMood >= 3) {
      patterns.push({
        icon: '😐',
        text: `Your average mood this month is ${averageMood.toFixed(1)}/5 - pretty balanced!`,
        type: 'neutral'
      });
    } else {
      patterns.push({
        icon: '💙',
        text: `Consider self-care activities. Your average mood is ${averageMood.toFixed(1)}/5`,
        type: 'support'
      });
    }

    return patterns.map((pattern, index) => {
      const getPatternStyle = (type: string) => {
        const baseStyle = { backgroundColor: colors.cardBackground };
        switch (type) {
          case 'positive': return [baseStyle, styles.pattern_positive];
          case 'warning': return [baseStyle, styles.pattern_warning];
          case 'neutral': return [baseStyle, styles.pattern_neutral];
          case 'support': return [baseStyle, styles.pattern_support];
          default: return [baseStyle, styles.pattern_neutral];
        }
      };

      return (
        <View key={index} style={[styles.patternItem, getPatternStyle(pattern.type)]}>
          <Text style={styles.patternIcon}>{pattern.icon}</Text>
          <Text style={[styles.patternText, { color: colors.text }]}>{pattern.text}</Text>
        </View>
      );
    });
  }, [moodHistory, colors, displayMonth]);

  // Generate list of all historical months for history view (excluding current month)
  const getHistoricalMonths = useCallback(() => {
    const months: Array<{date: Date, key: string, name: string}> = [];
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all unique months from mood history data
    const monthsWithData = new Set<string>();
    Object.keys(moodHistory).forEach(dateKey => {
      const monthKey = dateKey.substring(0, 7); // Extract YYYY-MM
      if (monthKey !== currentMonthKey) { // Exclude current month
        monthsWithData.add(monthKey);
      }
    });
    
    // If no historical data, return empty array
    if (monthsWithData.size === 0) {
      return months;
    }
    
    // Convert to sorted array to find the range
    const sortedMonthKeys = Array.from(monthsWithData).sort();
    const earliestMonth = sortedMonthKeys[0]; // Earliest month with data
    const latestMonth = sortedMonthKeys[sortedMonthKeys.length - 1]; // Latest month with data
    
    // Parse earliest and latest months
    const [earliestYear, earliestMonthNum] = earliestMonth.split('-').map(Number);
    const [latestYear, latestMonthNum] = latestMonth.split('-').map(Number);
    
    // Generate all months from latest to earliest (including empty ones in between)
    const startDate = new Date(latestYear, latestMonthNum - 1, 1);
    const endDate = new Date(earliestYear, earliestMonthNum - 1, 1);
    
    let currentDate = new Date(startDate);
    while (currentDate >= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Skip current month even if it's in the range
      if (monthKey !== currentMonthKey) {
        months.push({
          date: new Date(currentDate),
          key: monthKey,
          name: currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
      }
      
      // Move to previous month
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
    
    return months;
  }, [moodHistory]);

  // Render bar chart for current month
  const renderCurrentMonthBarChart = useCallback(() => {
    const currentYear = displayMonth.getFullYear();
    const currentMonthIndex = displayMonth.getMonth();
    
    // Get entries for the current display month
    const monthEntries = Object.entries(moodHistory)
      .filter(([dateKey, entry]) => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonthIndex;
      })
      .map(([, entry]) => entry);

    return (
      <View style={styles.historyContainer}>
        <View style={[styles.historyMonthSection, { backgroundColor: colors.surface }]}>
          <View style={[styles.historyMonthHeader, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.historyMonthTitle, { color: colors.text }]}>
              Mood Summary
            </Text>
            <Text style={[styles.historyMonthStats, { color: colors.textMuted }]}>
              {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
          
          {monthEntries.length === 0 ? (
            <View style={styles.historyEmptyMonth}>
              <Text style={[styles.historyEmptyMonthText, { color: colors.textMuted }]}>No entries this month</Text>
            </View>
          ) : (
            <View style={styles.historyMonthEntries}>
              {/* Mood Distribution Bar Chart */}
              <View style={styles.moodSegmentedBarContainer}>
                {/* Horizontal Bar with Color Segments */}
                <View style={styles.segmentedBar}>
                  {[1, 2, 3, 4, 5].map(mood => {
                    const entriesForMood = monthEntries.filter(entry => entry.mood === mood).length;
                    if (entriesForMood === 0) return null;
                    
                    return (
                      <View
                        key={mood}
                        style={{
                          height: '100%',
                          backgroundColor: getMoodColor(mood),
                          flex: entriesForMood,
                          minWidth: 1,
                        }}
                      />
                    );
                  })}
                </View>
                
                {/* Color Legend */}
                <View style={styles.moodLegend}>
                  {[
                    { mood: 1, name: 'Rough' },
                    { mood: 2, name: 'Meh' },
                    { mood: 3, name: 'Fine' },
                    { mood: 4, name: 'Great' },
                    { mood: 5, name: 'Peak' }
                  ].map(({ mood, name }) => {
                    const count = monthEntries.filter(entry => entry.mood === mood).length;
                    if (count === 0) return null;
                    
                    return (
                      <View key={mood} style={styles.legendItem}>
                        <View style={[
                          styles.legendCircle,
                          { backgroundColor: getMoodColor(mood) }
                        ]} />
                        <Text style={[styles.legendText, { color: colors.text }]}>
                          {name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [displayMonth, moodHistory, getMoodColor, colors]);

  // Render mood history as monthly sections for historical months
  const renderMoodHistory = useCallback(() => {
    const historicalMonths = getHistoricalMonths();
    
    // Check if there are any historical entries (not including current month)
    if (historicalMonths.length === 0) {
      return (
        <View style={styles.emptyHistoryContainer}>
          <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>No mood history yet!</Text>
          <Text style={[styles.emptyHistorySubtext, { color: colors.textMuted }]}>Start tracking your moods to see your history here.</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.historyContainer}>
        {historicalMonths.map((month, index) => {
          // Get all entries for this month
          const monthEntries = Object.entries(moodHistory)
            .filter(([dateKey]) => dateKey.startsWith(month.key))
            .map(([dateKey, entry]) => ({
              ...entry,
              dateKey,
              displayDate: new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })
            }))
            .sort((a, b) => new Date(b.dateKey + 'T00:00:00').getTime() - new Date(a.dateKey + 'T00:00:00').getTime());
          
          return (
            <View key={month.key} style={[styles.historyMonthSection, { backgroundColor: colors.surface }]}>
              <View style={[styles.historyMonthHeader, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.historyMonthTitle, { color: colors.text }]}>{month.name}</Text>
                <Text style={[styles.historyMonthStats, { color: colors.textMuted }]}>
                  {monthEntries.length} {monthEntries.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
              
              {monthEntries.length === 0 ? (
                <View style={styles.historyEmptyMonth}>
                  <Text style={[styles.historyEmptyMonthText, { color: colors.textMuted }]}>No entries this month</Text>
                </View>
              ) : (
                <View style={styles.historyMonthEntries}>
                  {/* Mood Distribution Bar Chart */}
                  <View style={styles.moodSegmentedBarContainer}>
                    {/* Horizontal Bar with Color Segments */}
                    <View style={styles.segmentedBar}>
                      {[1, 2, 3, 4, 5].map(mood => {
                        const entriesForMood = monthEntries.filter(entry => entry.mood === mood).length;
                        if (entriesForMood === 0) return null;
                        
                        return (
                          <View
                            key={mood}
                            style={{
                              height: '100%',
                              backgroundColor: getMoodColor(mood),
                              flex: entriesForMood,
                              minWidth: 1,
                            }}
                          />
                        );
                      })}
                    </View>
                    
                    {/* Color Legend */}
                    <View style={styles.moodLegend}>
                      {[
                        { mood: 1, name: 'Rough' },
                        { mood: 2, name: 'Meh' },
                        { mood: 3, name: 'Fine' },
                        { mood: 4, name: 'Great' },
                        { mood: 5, name: 'Peak' }
                      ].map(({ mood, name }) => {
                        const count = monthEntries.filter(entry => entry.mood === mood).length;
                        if (count === 0) return null;
                        
                        return (
                          <View key={mood} style={styles.legendItem}>
                            <View style={[
                              styles.legendCircle,
                              { backgroundColor: getMoodColor(mood) }
                            ]} />
                            <Text style={[styles.legendText, { color: colors.text }]}>
                              {name}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  }, [moodHistory, colors, getMoodColor, getMoodEmoji, getHistoricalMonths]);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        paddingBottom: Platform.OS === 'android' ? insets.bottom + 10 : 0
      }
    ]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your mood history...</Text>
        </View>
      ) : (
        <>
          {/* Development Helper - Clear All Data */}
          {__DEV__ && (
            <View style={[styles.devHelperContainer, { backgroundColor: colors.surface }]}>
              <TouchableOpacity
                style={[styles.devHelperButton, { 
                  backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                  opacity: isLoading ? 0.7 : 1
                }]}
                onPress={injectTestData}
                disabled={isLoading}
              >
                <Text style={styles.devHelperButtonText}>
                  {isLoading ? '⏳ Generating Data...' : '🎲 Generate Test Data (1-6 months)'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.devHelperButton, { 
                  backgroundColor: isLoading ? '#9ca3af' : '#ef4444', 
                  marginTop: 8,
                  opacity: isLoading ? 0.7 : 1
                }]}
                disabled={isLoading}
                onPress={async () => {
                  try {
                    setIsLoading(true);
                    const AsyncStorage = await import('@react-native-async-storage/async-storage');
                    await AsyncStorage.default.removeItem('mood_entries');
                    console.log('🗑️ All mood data cleared');
                    await loadMoodHistory(); // Refresh
                  } catch (error) {
                    console.error('❌ Error clearing data:', error);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                <Text style={styles.devHelperButtonText}>
                  {isLoading ? '⏳ Clearing...' : '🗑️ Clear All Data'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {viewMode === 'calendar' ? (
              <>
                {renderMonth(displayMonth)}
                
                {/* Current Month Bar Chart */}
                {renderCurrentMonthBarChart()}
                
                {/* Mood Patterns Analysis */}
                <View style={[styles.patternsContainer, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.patternsTitle, { color: colors.text }]}>
                    Mood Patterns
                  </Text>
                  {renderMoodPatterns()}
                </View>
              </>
            ) : (
              <>
                {/* Mood History List */}
                <View style={styles.historyTitle}>
                  <Text style={[styles.historyTitleText, { color: colors.text }]}>Your Mood Journey</Text>
                </View>
                {renderMoodHistory()}
              </>
            )}
          </ScrollView>

          {/* Custom Mood Details Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <Pressable 
              style={styles.modalOverlay}
              onPress={() => setModalVisible(false)}
            >
              <Pressable 
                style={[styles.modalContainer, { backgroundColor: colors.surface }]} 
                onPress={(e) => e.stopPropagation()}
              >
                {/* Colored Header Bar */}
                <View style={[styles.modalHeader, { backgroundColor: selectedMoodData?.moodColor }]}>
                  <Text style={styles.modalTitle}>{selectedMoodData?.date}</Text>
                </View>
                
                <View style={styles.modalContent}>
                  {/* Mood Section with Color Accent */}
                  <View style={styles.modalSection}>
                    <Text style={[styles.modalMoodLabel, { color: colors.text }]}>Mood:</Text>
                    <View style={styles.moodValueContainer}>
                      <View style={[styles.moodColorDot, { backgroundColor: selectedMoodData?.moodColor }]} />
                      <Text style={[styles.modalMoodValue, { color: colors.text }]}>{selectedMoodData?.mood}</Text>
                    </View>
                  </View>
                  
                  {selectedMoodData?.journal && selectedMoodData.journal.trim() && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalJournalLabel, { color: colors.text }]}>Feeling:</Text>
                      <Text style={[styles.modalJournalValue, { 
                        color: colors.textSecondary, 
                        backgroundColor: colors.background,
                        borderLeftColor: colors.border
                      }]}>{selectedMoodData.journal}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    // Padding will be dynamic via inline styles
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Minimal padding for content spacing
  },
  monthContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 10,
    // Remove justifyContent - let margins handle spacing to match calendar grid
  },
  dayHeader: {
    width: 40,     // Match day cell width
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingVertical: 8,
    marginHorizontal: 2.5, // Match day cell spacing
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    // Remove justifyContent - let margins handle spacing for precise 7-column grid
  },
  emptyDay: {
    width: 40,     // Fixed pixel size for consistency
    height: 40,    // Same as width to make perfect circles
    marginHorizontal: 2.5, // Calculated for even distribution: (screenWidth - 2*padding - 7*40) / 14
    marginVertical: 2,
  },
  dayCell: {
    width: 40,     // Fixed pixel size for perfect circles
    height: 40,    // Same as width for circular shape
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 2.5, // Same as emptyDay for perfect alignment
    marginVertical: 2,
    borderRadius: 20, // Half of width/height for perfect circle
    position: 'relative',
  },
  today: {
    backgroundColor: '#e0f2fe',
    borderWidth: 2,
    borderColor: '#0284c7',
  },
  dayNumber: {
    fontSize: 16,
    // Removed hardcoded color - will be set dynamically by { color: colors.text }
    fontWeight: '500',
  },
  todayText: {
    color: '#0284c7',
    fontWeight: 'bold',
  },
  moodDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  patternsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patternsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 15,
  },
  noDataText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  patternItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  pattern_positive: {
    // Background will be set dynamically by getPatternStyle baseStyle
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  pattern_warning: {
    // Background will be set dynamically by getPatternStyle baseStyle
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  pattern_neutral: {
    // Background will be set dynamically by getPatternStyle baseStyle
    borderLeftWidth: 4,
    borderLeftColor: '#64748b',
  },
  pattern_support: {
    // Background will be set dynamically by getPatternStyle baseStyle
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  patternIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  patternText: {
    flex: 1,
    fontSize: 15,
    // Removed hardcoded color - will be set dynamically by { color: colors.text }
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Ensures rounded corners clip the header
  },
  modalHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalContent: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalMoodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  moodValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
    // Removed border for cleaner look in both light and dark modes
  },
  modalMoodValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalJournalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalJournalValue: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 22,
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e5e7eb',
  },
  modalCloseButton: {
    borderRadius: 0,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 'auto',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // History View Styles
  historyTitle: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    alignItems: 'center',
  },
  historyTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyHistoryContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  historyContainer: {
    paddingHorizontal: 20,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDateContainer: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  historyMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyMoodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  historyMoodLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyJournalContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  historyJournalText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Monthly section styles for history view
  historyMonthSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  historyMonthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  historyMonthStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyMonthEntries: {
    padding: 16,
  },
  historyEmptyMonth: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  historyEmptyMonthText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  historyMonthEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyMonthEntryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyMonthMoodIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyMonthMoodEmoji: {
    fontSize: 16,
  },
  historyMonthEntryDetails: {
    flex: 1,
  },
  historyMonthEntryDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  historyMonthEntryMood: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyMonthEntryJournal: {
    fontSize: 12,
    color: '#9ca3af',
    maxWidth: 120,
    marginLeft: 8,
  },
  historyMoreEntries: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  // Development helper styles
  devHelperContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  devHelperButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  devHelperButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Segmented bar graph styles for history view
  moodSegmentedBarContainer: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  moodSegment: {
    height: '100%',
    minWidth: 1, // Ensure very small segments are still visible
  },
  moodLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
