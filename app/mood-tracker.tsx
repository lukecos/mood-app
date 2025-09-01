import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { saveMoodEntry as saveToStorage, getMoodEntryForDate } from './storage';

const { height: screenHeight } = Dimensions.get('window');

interface MoodTrackerProps {
  onNavigateToCalendar?: () => void;
}

export default function MoodTrackerApp({ onNavigateToCalendar }: MoodTrackerProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [moodValue, setMoodValue] = useState<number>(3); // Default to neutral (middle)
  const [journalText, setJournalText] = useState('');
  const [currentAdviceIndex, setCurrentAdviceIndex] = useState(0);
  const [todaysMoodEntry, setTodaysMoodEntry] = useState<any>(null);
  const [hasEntryToday, setHasEntryToday] = useState<boolean>(false);

  // Animation values
  const moodSelectorPosition = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbRotation = useRef(new Animated.Value(0)).current;
  const sliderPosition = useRef(new Animated.Value(0.5)).current; // 0.5 for middle (neutral)
  const adviceOpacity = useRef(new Animated.Value(1)).current;

  // Mood-specific advice collections
  const moodAdvice = {
    1: [ // Very Sad
      "Take deep breaths and remember this feeling will pass",
      "Reach out to someone you trust and talk about your feelings",
      "Try gentle movement like stretching or a short walk",
      "Practice self-compassion - treat yourself like a good friend would",
      "Consider professional support if these feelings persist",
      "Create a cozy, safe space for yourself right now"
    ],
    2: [ // Sad
      "Go for a walk outside and get some fresh air",
      "Make your bed and tidy up your immediate space",
      "Listen to music that comforts you",
      "Do something creative, even if it's just doodling",
      "Call a friend or family member for connection",
      "Take a warm shower or bath to reset your energy"
    ],
    3: [ // Neutral
      "Set a small, achievable goal for today",
      "Practice gratitude by writing down 3 good things",
      "Try a new activity or hobby you've been curious about",
      "Take time to reflect on what you need right now",
      "Go for a walk and observe your surroundings mindfully",
      "Do something kind for someone else"
    ],
    4: [ // Happy
      "Share your good mood with someone you care about",
      "Capture this moment with a photo or journal entry",
      "Use this energy to tackle something you've been putting off",
      "Try something new while you're feeling confident",
      "Help someone else - spread the positive energy",
      "Take time to appreciate what's going well in your life"
    ],
    5: [ // Very Happy
      "Celebrate this feeling - you deserve it!",
      "Plan something fun for your future self to look forward to",
      "Share your joy - call someone and spread the happiness",
      "Document what led to this feeling so you can recreate it",
      "Use this high energy for a meaningful project or goal",
      "Practice gratitude for this moment of pure joy"
    ]
  };

  // Mood configurations with colors and labels
  const moodConfigs = {
    1: { color: '#dc2626', label: 'Very Sad', emoji: '😢' },
    2: { color: '#ea580c', label: 'Sad', emoji: '😔' },
    3: { color: '#eab308', label: 'Neutral', emoji: '😐' },
    4: { color: '#16a34a', label: 'Happy', emoji: '😊' },
    5: { color: '#7c3aed', label: 'Very Happy', emoji: '😄' },
  };

  // Get interpolated color based on mood value (smooth transitions)
  const getOrbColor = (value: number) => {
    // Smooth color interpolation between mood colors
    if (value <= 1) return '#dc2626'; // Very Sad - Red
    if (value <= 2) {
      const factor = value - 1;
      return interpolateColor('#dc2626', '#ea580c', factor); // Red to Orange
    }
    if (value <= 3) {
      const factor = value - 2;
      return interpolateColor('#ea580c', '#eab308', factor); // Orange to Yellow
    }
    if (value <= 4) {
      const factor = value - 3;
      return interpolateColor('#eab308', '#16a34a', factor); // Yellow to Green
    }
    if (value <= 5) {
      const factor = value - 4;
      return interpolateColor('#16a34a', '#7c3aed', factor); // Green to Purple
    }
    return '#7c3aed'; // Very Happy - Purple
  };

  // Helper function to interpolate between two hex colors
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Check if today's mood has already been entered
  const checkTodaysMood = async () => {
    try {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const entry = await getMoodEntryForDate(todayKey);
      
      if (entry) {
        setTodaysMoodEntry(entry);
        setHasEntryToday(true);
      } else {
        setHasEntryToday(false);
      }
    } catch (error) {
      console.error('Error checking today\'s mood:', error);
      setHasEntryToday(false);
    }
  };

  // Check for today's mood on component mount
  useEffect(() => {
    checkTodaysMood();
  }, []);

  const getMoodLabel = (value: number) => {
    const config = moodConfigs[Math.round(value) as keyof typeof moodConfigs];
    return config ? config.label : moodConfigs[3].label;
  };

  // Get dynamic journal prompt based on mood
  const getJournalPrompt = (mood: number | null) => {
    if (!mood) return "Why do you feel this way?";
    
    const moodPrompts = {
      1: "What's bringing you down right now?",
      2: "What's making you sad today?", 
      3: "How are you feeling and why?",
      4: "What's making you happy today?",
      5: "What's bringing you so much joy?"
    };
    
    return moodPrompts[mood as keyof typeof moodPrompts] || "Why do you feel this way?";
  };

  // Get current advice for selected mood
  const getCurrentAdvice = () => {
    if (!selectedMood) return "";
    const adviceList = moodAdvice[selectedMood as keyof typeof moodAdvice];
    return adviceList[currentAdviceIndex] || "";
  };

  // Rotate to next advice with animation
  const getNextAdvice = () => {
    if (!selectedMood) return;
    
    const adviceList = moodAdvice[selectedMood as keyof typeof moodAdvice];
    const nextIndex = (currentAdviceIndex + 1) % adviceList.length;
    
    // Fade out, change advice, fade in
    Animated.sequence([
      Animated.timing(adviceOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(adviceOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Change advice during fade out
    setTimeout(() => {
      setCurrentAdviceIndex(nextIndex);
    }, 200);
  };

  // Pan responder for smooth slider interaction
  const sliderWidth = 280;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Start gesture - animate orb scale
        Animated.timing(orbScale, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate position relative to slider track
        const sliderTrackLeft = 50; // Approximate left margin
        const relativeX = evt.nativeEvent.pageX - sliderTrackLeft;
        const clampedX = Math.max(0, Math.min(sliderWidth, relativeX));
        const normalizedPosition = clampedX / sliderWidth;
        
        // Convert to mood value (1-5)
        const newMoodValue = 1 + (normalizedPosition * 4);
        setMoodValue(newMoodValue);
        
        // Update slider position animation
        Animated.timing(sliderPosition, {
          toValue: normalizedPosition,
          duration: 0,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderRelease: () => {
        // End gesture - animate orb back to normal
        Animated.timing(orbScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleMoodSelection = () => {
    setSelectedMood(Math.round(moodValue));
    
    // Animate mood selector to top and show content
    Animated.parallel([
      Animated.timing(moodSelectorPosition, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSliderChange = (value: number) => {
    setMoodValue(value);
    
    // Update slider position
    const normalizedPosition = (value - 1) / 4;
    Animated.timing(sliderPosition, {
      toValue: normalizedPosition,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    // Animate orb when mood changes
    Animated.sequence([
      Animated.timing(orbScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(orbScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle rotation animation
    const currentRotation = Math.random() * 0.5 - 0.25; // Small random rotation
    Animated.timing(orbRotation, {
      toValue: currentRotation,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Initialize slider position on component mount
  useEffect(() => {
    const initialPosition = (moodValue - 1) / 4;
    sliderPosition.setValue(initialPosition);
  }, []);

  const resetMoodSelection = () => {
    setSelectedMood(null);
    setJournalText('');
    setCurrentAdviceIndex(0);
    
    // Animate back to center
    Animated.parallel([
      Animated.timing(moodSelectorPosition, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const saveMoodEntry = async () => {
    // Create date key using local date instead of UTC
    const now = new Date();
    const localDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const entry = {
      date: now.toISOString(), // Keep full timestamp for records
      mood: selectedMood!,
      journal: journalText,
      advice: getCurrentAdvice(),
    };
    
    try {
      // Override the date key to use local date
      const entryWithLocalDate = { ...entry, date: localDateKey };
      await saveToStorage(entryWithLocalDate);
      Alert.alert('Success', 'Mood entry saved!', [
        { text: 'OK', onPress: () => {
          // Reset form
          setSelectedMood(null);
          setJournalText('');
          setCurrentAdviceIndex(0);
          
          // Reset animations
          Animated.parallel([
            Animated.timing(moodSelectorPosition, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(contentOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(sliderPosition, {
              toValue: 0.5, // Reset to neutral
              duration: 300,
              useNativeDriver: false,
            }),
          ]).start();
          
          setMoodValue(3); // Reset to neutral
          
          // Navigate to calendar
          if (onNavigateToCalendar) {
            onNavigateToCalendar();
          }
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save mood entry. Please try again.');
    }
  };

  // Calculate the translateY value for vertical centering animation
  const translateY = moodSelectorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0], // Keep sphere in the same position
  });

  return (
    <View style={styles.container}>
      {hasEntryToday ? (
        // Show today's mood summary
        <Animated.View 
          style={[
            styles.moodSelectorContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.summaryTitle}>Today's Mood Entry</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              setHasEntryToday(false);
              setTodaysMoodEntry(null);
            }}
            activeOpacity={0.7}
          >
            <Animated.View 
              style={[
                styles.moodOrb, // Use same style as main page
                { backgroundColor: moodConfigs[todaysMoodEntry?.mood as keyof typeof moodConfigs]?.color || '#eab308' }
              ]} 
            >
              <View style={styles.orbInner}>
                <View style={styles.orbHighlight} />
              </View>
            </Animated.View>
          </TouchableOpacity>
          
          <Text style={styles.moodLabel}>
            {moodConfigs[todaysMoodEntry?.mood as keyof typeof moodConfigs]?.label}
          </Text>
          
          {todaysMoodEntry?.journal && (
            <View style={styles.journalPreview}>
              <Text style={styles.journalLabel}>Your thoughts:</Text>
              <Text style={styles.journalText}>{todaysMoodEntry.journal}</Text>
            </View>
          )}
        </Animated.View>
      ) : (
        // Show regular mood entry interface
        <>
        {/* Animated Mood Selector */}
        <Animated.View
          style={[
            styles.moodSelectorContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.titleContainer}>
            {!selectedMood ? (
              <Text style={styles.title}>How are you feeling today?</Text>
            ) : (
              <View style={styles.titleSpacer} />
            )}
          </View>
          
          {/* Mood Orb */}
          <TouchableOpacity
            onPress={selectedMood ? resetMoodSelection : undefined}
            activeOpacity={selectedMood ? 0.7 : 1}
          >
            <Animated.View
              style={[
                styles.moodOrb,
                {
                  backgroundColor: getOrbColor(moodValue),
                  transform: [
                    { scale: orbScale },
                    { rotate: orbRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                },
              ]}
            >
              <View style={styles.orbInner}>
                <View style={styles.orbHighlight} />
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Mood Label */}
          <Text style={styles.moodLabel}>{getMoodLabel(moodValue)}</Text>

          {/* Mood Slider - Only show when no mood selected */}
          {!selectedMood && (
            <>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Slide to adjust your mood</Text>
                <View style={styles.sliderTrack} {...panResponder.panHandlers}>
                  <Animated.View 
                    style={[
                      styles.sliderFill,
                      {
                        width: sliderPosition.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: getOrbColor(moodValue),
                      }
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.sliderThumb,
                      {
                        left: sliderPosition.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, sliderWidth - 20],
                        }),
                        backgroundColor: getOrbColor(moodValue),
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Select Button */}
              <TouchableOpacity 
                style={[styles.selectButton, { backgroundColor: getOrbColor(moodValue) }]}
                onPress={handleMoodSelection}
              >
                <Text style={styles.selectButtonText}>Select This Mood</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Animated Content - Journal and Steps */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacity,
            },
          ]}
        >
          {selectedMood && (
            <>
              {/* Journal Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{getJournalPrompt(selectedMood)}</Text>
                <TextInput
                  style={styles.journalInput}
                  multiline
                  placeholder="Write about your feelings..."
                  value={journalText}
                  onChangeText={setJournalText}
                />
              </View>

              {/* Personalized Advice */}
              <TouchableOpacity onPress={getNextAdvice} style={styles.adviceContainer}>
                <Animated.Text style={[styles.adviceText, { opacity: adviceOpacity }]}>
                  {getCurrentAdvice()}
                </Animated.Text>
                <Text style={styles.tapForMoreText}>Tap for more advice</Text>
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={saveMoodEntry}>
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  moodSelectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSpacer: {
    height: 54, // Same height as title to maintain layout
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 30,
    textAlign: 'center',
  },
  // Mood Orb Styles
  moodOrb: {
    width: Math.min(120, screenHeight * 0.15), // Responsive size based on screen height
    height: Math.min(120, screenHeight * 0.15),
    borderRadius: Math.min(60, screenHeight * 0.075),
    marginBottom: 20,
    marginTop: 10, // Extra top margin for safety
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  orbInner: {
    flex: 1,
    borderRadius: 60,
    opacity: 0.8,
  },
  orbHighlight: {
    position: 'absolute',
    top: 15,
    left: 20,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  moodLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 30,
    textAlign: 'center',
  },
  // Slider Styles
  sliderContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 15,
  },
  sliderTrack: {
    width: 280,
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sliderPoint: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -7,
    marginLeft: -10,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: -7,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  // Scale Labels
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    marginTop: 10,
    marginBottom: 30,
  },
  scaleLabel: {
    fontSize: 20,
    textAlign: 'center',
  },
  // Select Button
  selectButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Content Styles
  contentContainer: {
    marginTop: 40,
    paddingBottom: 120, // More space above Android navigation
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15, // Reduced from 20 to tighten layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 15,
  },
  journalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  // Advice Styles
  adviceContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    minHeight: 100, // Fixed minimum height to prevent layout shifts
  },
  adviceText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  tapForMoreText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0284c7',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15, // Reduced from 20 to tighten layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Today's mood summary styles
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  journalPreview: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  journalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  journalText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
  },
});