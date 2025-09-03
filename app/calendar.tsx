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

export default function MoodCalendar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodHistory, setMoodHistory] = useState<Record<string, MoodEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'history'>('calendar');
  const [selectedMoodData, setSelectedMoodData] = useState<{
    date: string;
    mood: string;
    journal: string;
    moodValue: number;
    moodColor: string;
  } | null>(null);
  
  // Just use current month for optimal performance
  const currentMonth = useMemo(() => new Date(), []);

  // Memoized mood helper functions
  const getMoodColor = useCallback((mood: number) => {
    const colors = {
      1: '#f87171', // Rough - Coral Red
      2: '#fb923c', // Meh - Orange  
      3: '#fbbf24', // Fine - Amber
      4: '#34d399', // Great - Emerald
      5: '#10b981', // Peak - Green
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

  // Inject test data for development
  const injectTestData = async () => {
    const today = new Date();
    const testEntries = [
      // This month's test data
      { date: new Date(today.getFullYear(), today.getMonth(), 1), mood: 4, journal: "Great start to the month! Feeling optimistic." },
      { date: new Date(today.getFullYear(), today.getMonth(), 3), mood: 2, journal: "Monday blues hit hard today." },
      { date: new Date(today.getFullYear(), today.getMonth(), 5), mood: 5, journal: "Amazing day! Everything went perfectly." },
      { date: new Date(today.getFullYear(), today.getMonth(), 8), mood: 3, journal: "Just an okay day, nothing special." },
      { date: new Date(today.getFullYear(), today.getMonth(), 12), mood: 1, journal: "Really struggling today. Work was overwhelming." },
      { date: new Date(today.getFullYear(), today.getMonth(), 15), mood: 4, journal: "Good day with friends, feeling better!" },
      { date: new Date(today.getFullYear(), today.getMonth(), 18), mood: 5, journal: "Celebrated a big achievement today!" },
      { date: new Date(today.getFullYear(), today.getMonth(), 20), mood: 2, journal: "Feeling a bit down, need some self-care." },
      { date: new Date(today.getFullYear(), today.getMonth(), 22), mood: 3, journal: "Neutral day, just going through the motions." },
      { date: new Date(today.getFullYear(), today.getMonth(), 25), mood: 4, journal: "Had a lovely dinner with family." },
      { date: new Date(today.getFullYear(), today.getMonth(), 28), mood: 5, journal: "Feeling grateful for all the good things in life!" },
    ];

    // Save test entries to storage
    const { saveMoodEntry } = await import('./storage');
    for (const entry of testEntries) {
      const dateKey = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}-${String(entry.date.getDate()).padStart(2, '0')}`;
      const moodEntry = {
        date: dateKey,
        mood: entry.mood,
        journal: entry.journal,
        advice: "Test advice entry"
      };
      await saveMoodEntry(moodEntry);
    }

    // Reload data
    loadMoodHistory();
  };

  // Refresh data when component mounts
  useEffect(() => {
    // Inject test data first (comment out in production)
    injectTestData();
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
  }, [getDaysInMonth, formatDateKey, getMoodColor, getMoodEmoji, moodHistory]);

  // Analyze mood patterns for insights
  const renderMoodPatterns = useCallback(() => {
    if (Object.keys(moodHistory).length === 0) {
      return (
        <Text style={[styles.noDataText, { color: colors.textMuted }]}>
          Track more moods to see patterns and insights!
        </Text>
      );
    }

    const patterns = [];
    
    // Analyze by day of week
    const dayStats: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    Object.entries(moodHistory).forEach(([dateKey, entry]) => {
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

    if (dayAverages.length > 0) {
      const sortedDays = dayAverages.sort((a, b) => a.average - b.average);
      const saddestDay = sortedDays[0];
      const happiestDay = sortedDays[sortedDays.length - 1];

      if (saddestDay.average < happiestDay.average) {
        patterns.push({
          icon: '📉',
          text: `Your lowest moods tend to be on ${dayNames[saddestDay.day]}s`,
          type: 'warning'
        });

        patterns.push({
          icon: '📈',
          text: `${dayNames[happiestDay.day]}s are typically your best days`,
          type: 'positive'
        });
      }
    }

    // Overall mood trend
    const totalEntries = Object.keys(moodHistory).length;
    const averageMood = Object.values(moodHistory).reduce((sum, entry) => sum + entry.mood, 0) / totalEntries;
    
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
  }, [moodHistory]);

  // Render mood history as a chronological list
  const renderMoodHistory = useCallback(() => {
    const entries = Object.entries(moodHistory)
      .map(([dateKey, entry]) => ({
        ...entry,
        dateKey,
        displayDate: new Date(dateKey + 'T00:00:00').toLocaleDateString('en-AU', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: '2-digit'
        })
      }))
      .sort((a, b) => new Date(b.dateKey + 'T00:00:00').getTime() - new Date(a.dateKey + 'T00:00:00').getTime());

    if (entries.length === 0) {
      return (
        <View style={styles.emptyHistoryContainer}>
          <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>No mood history yet!</Text>
          <Text style={[styles.emptyHistorySubtext, { color: colors.textMuted }]}>Start tracking your moods to see your history here.</Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        {entries.map((entry, index) => {
          const moodDescriptions = {
            1: 'Rough',
            2: 'Meh', 
            3: 'Fine',
            4: 'Great',
            5: 'Peak'
          };
          
          const moodLabel = moodDescriptions[entry.mood as keyof typeof moodDescriptions];
          const moodColor = getMoodColor(entry.mood);
          
          return (
            <TouchableOpacity
              key={entry.dateKey}
              style={[styles.historyItem, { backgroundColor: colors.surface }]}
              onPress={() => {
                setSelectedMoodData({
                  date: entry.displayDate,
                  mood: moodLabel,
                  journal: entry.journal || '',
                  moodValue: entry.mood,
                  moodColor: moodColor
                });
                setModalVisible(true);
              }}
            >
              <View style={styles.historyItemHeader}>
                <View style={styles.historyDateContainer}>
                  <Text style={[styles.historyDate, { color: colors.text }]}>{entry.displayDate}</Text>
                </View>
                <View style={styles.historyMoodContainer}>
                  <View style={[styles.historyMoodDot, { backgroundColor: moodColor }]} />
                  <Text style={[styles.historyMoodLabel, { color: moodColor }]}>{moodLabel}</Text>
                </View>
              </View>
              
              {entry.journal && entry.journal.trim() && (
                <View style={[styles.historyJournalContainer, { borderTopColor: colors.border }]}>
                  <Text style={[styles.historyJournalText, { color: colors.textMuted }]} numberOfLines={2}>
                    "{entry.journal}"
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [moodHistory, getMoodColor]);

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
          {/* View Mode Toggle */}
          <View style={[styles.viewToggleContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'calendar' && [styles.viewToggleButtonActive, { backgroundColor: colors.cardBackground }]
              ]}
              onPress={() => setViewMode('calendar')}
            >
              <Text style={[
                styles.viewToggleText,
                { color: colors.textMuted },
                viewMode === 'calendar' && [styles.viewToggleTextActive, { color: colors.text }]
              ]}>
                📅 Calendar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'history' && [styles.viewToggleButtonActive, { backgroundColor: colors.cardBackground }]
              ]}
              onPress={() => setViewMode('history')}
            >
              <Text style={[
                styles.viewToggleText,
                { color: colors.textMuted },
                viewMode === 'history' && [styles.viewToggleTextActive, { color: colors.text }]
              ]}>
                📊 History
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {viewMode === 'calendar' ? (
              <>
                {renderMonth(currentMonth)}
                
                {/* Mood Patterns Analysis */}
                <View style={[styles.patternsContainer, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.patternsTitle, { color: colors.text }]}>Monthly Patterns</Text>
                  {renderMoodPatterns()}
                </View>
              </>
            ) : (
              <>
                {/* Mood History List */}
                <View style={styles.historyTitle}>
                  <Text style={[styles.historyTitleText, { color: colors.text }]}>Your Mood Journey</Text>
                  <Text style={[styles.historySubtitle, { color: colors.textMuted }]}>Tap any entry to see details</Text>
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
                
                <TouchableOpacity
                  style={[styles.modalCloseButton, { backgroundColor: selectedMoodData?.moodColor }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
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
    justifyContent: 'space-around', // Match calendar grid distribution
    paddingHorizontal: 10,
  },
  dayHeader: {
    width: 40,     // Match day cell width
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Distribute days evenly
    paddingHorizontal: 10,
  },
  emptyDay: {
    width: 40,     // Fixed pixel size for consistency
    height: 40,    // Same as width to make perfect circles
    margin: 2,     // Small margin for spacing
  },
  dayCell: {
    width: 40,     // Fixed pixel size for perfect circles
    height: 40,    // Same as width for circular shape
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 2,     // Consistent spacing around each cell
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
    color: '#1e293b',
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
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  pattern_warning: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  pattern_neutral: {
    backgroundColor: '#f1f5f9',
    borderLeftWidth: 4,
    borderLeftColor: '#64748b',
  },
  pattern_support: {
    backgroundColor: '#eff6ff',
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
    color: '#374151',
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
  // View Toggle Styles
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    margin: 20,
    marginBottom: 10,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  viewToggleTextActive: {
    color: '#1e293b',
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
});
