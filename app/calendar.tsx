import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { getMoodHistory, MoodEntry } from './storage';

const { width: screenWidth } = Dimensions.get('window');

export default function MoodCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodHistory, setMoodHistory] = useState<Record<string, MoodEntry>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Generate array of months (6 months before and after current month)
  const generateMonths = () => {
    const months = [];
    const today = new Date();
    
    for (let i = -6; i <= 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push(monthDate);
    }
    return months;
  };
  
  const months = generateMonths();
  const currentMonthIndex = 6; // Current month is at index 6 (middle of array)

  // Load mood history from storage
  const loadMoodHistory = async () => {
    try {
      const history = await getMoodHistory();
      setMoodHistory(history);
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  // Refresh data when component mounts
  useEffect(() => {
    loadMoodHistory();
    // Scroll to current month on mount
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: currentMonthIndex * screenWidth,
        animated: false,
      });
    }, 100);
  }, []);

  const getMoodColor = (mood: number) => {
    const colors = {
      1: '#dc2626', // Very Sad - Red
      2: '#ea580c', // Sad - Orange  
      3: '#eab308', // Neutral - Yellow
      4: '#16a34a', // Happy - Green
      5: '#7c3aed', // Very Happy - Purple
    };
    return colors[mood as keyof typeof colors] || '#e5e7eb';
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = {
      1: '😢',
      2: '😔', 
      3: '😐',
      4: '😊',
      5: '😄',
    };
    return emojis[mood as keyof typeof emojis] || '❓';
  };

  const formatDateKey = (date: Date) => {
    // Use local date formatting to match storage
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDaysInMonth = (date: Date) => {
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
  };

  // Render individual month calendar
  const renderMonth = (monthDate: Date) => {
    const days = getDaysInMonth(monthDate);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.monthContainer} key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
        {/* Month Title */}
        <Text style={styles.monthTitle}>
          {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
        </Text>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {dayNames.map((day) => (
            <Text key={day} style={styles.dayHeader}>{day}</Text>
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
                  isToday && styles.today,
                  moodEntry && { 
                    backgroundColor: getMoodColor(moodEntry.mood), 
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)'
                  }
                ]}
                onPress={() => {
                  if (moodEntry) {
                    // Show mood details - could expand this later
                    alert(`${day.getDate()}: ${getMoodEmoji(moodEntry.mood)} ${moodEntry.journal}`);
                  }
                }}
              >
                <Text style={[
                  styles.dayNumber, 
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
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood Calendar</Text>
      <Text style={styles.subtitle}>Track your emotional journey over time</Text>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.monthsScrollView}
        contentContainerStyle={styles.monthsContainer}
      >
        {months.map((month) => renderMonth(month))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 30,
  },
  monthsScrollView: {
    flex: 1,
  },
  monthsContainer: {
    alignItems: 'flex-start',
  },
  monthContainer: {
    width: screenWidth,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  },
  dayHeader: {
    width: '13.8%', // Match day cells to maintain alignment
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '13.8%', // Slightly less than 14.28% to prevent overlap
    height: 45,     // Same as width to make perfect circles
  },
  dayCell: {
    width: '13.8%', // Slightly less than 14.28% to prevent overlap
    height: 45,     // Same as width for circular shape
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 8, // More space between rows for circular shape
    borderRadius: 22.5, // Half of width/height for perfect circle
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
});
