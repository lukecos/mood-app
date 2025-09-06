import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Modal,
} from 'react-native';
import { saveMoodEntry as saveToStorage, getMoodEntryForDate } from './storage';
import { useTheme } from './ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: screenHeight } = Dimensions.get('window');

interface MoodTrackerProps {
  onNavigateToCalendar?: (shouldRefresh?: boolean) => void;
}

export default function MoodTrackerApp({ onNavigateToCalendar }: MoodTrackerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Debug: Log current safe area insets
  console.log('🔍 Safe Area Insets:', {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    platform: Platform.OS
  });
  
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isEditingMood, setIsEditingMood] = useState<boolean>(false);
  const [moodValue, setMoodValue] = useState<number>(3); // Default to neutral (middle)
  const [journalText, setJournalText] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const CHARACTER_LIMIT = 300;
  const [currentAdviceIndex, setCurrentAdviceIndex] = useState(0);
  const [todaysMoodEntry, setTodaysMoodEntry] = useState<any>(null);
  const [hasEntryToday, setHasEntryToday] = useState<boolean>(false);
  const [isCheckingEntry, setIsCheckingEntry] = useState<boolean>(true);
  const [containerPaddingBottom, setContainerPaddingBottom] = useState(100); // Dynamic padding
  const [tempSelectedMood, setTempSelectedMood] = useState<number | null>(3); // Default to Neutral
  const [isTextInputFocused, setIsTextInputFocused] = useState<boolean>(false);
  const [showChangeMoodModal, setShowChangeMoodModal] = useState<boolean>(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState<boolean>(false);

  // Animation values
  const moodSelectorPosition = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const textInputPosition = useRef(new Animated.Value(0)).current; // For moving text input container only
  const moodSpherePosition = useRef(new Animated.Value(0)).current; // For moving mood sphere up when keyboard appears
  const isTextInputFocusedRef = useRef(false); // Ref to track focus state for keyboard listener
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbRotation = useRef(new Animated.Value(0)).current;
  const sliderPosition = useRef(new Animated.Value(0.5)).current; // 0.5 for middle (neutral)
  const adviceOpacity = useRef(new Animated.Value(1)).current;
  
  // Animated values for mood option upward movement (one for each mood 1-5)
  const moodOptionAnimations = useRef([
    new Animated.Value(0), // mood 1
    new Animated.Value(0), // mood 2
    new Animated.Value(0), // mood 3
    new Animated.Value(0), // mood 4
    new Animated.Value(0), // mood 5
  ]).current;

  // Mood-specific advice collections
  const moodAdvice = {
    1: [ // Rough
      "Take deep breaths and remember this feeling will pass with time",
      "Reach out to someone you trust and talk about your feelings openly",
      "Try gentle movement like stretching or taking a short walk outside",
      "Practice self-compassion - treat yourself like a good friend would treat you",
      "Consider professional support if these feelings persist or feel overwhelming",
      "Create a cozy, safe space for yourself right now and rest there"
    ],
    2: [ // Meh
      "Go for a walk outside and get some fresh air to help clear your mind",
      "Make your bed and tidy up your immediate space to create order around you",
      "Listen to music that comforts you and helps you feel less alone",
      "Do something creative, even if it's just doodling or writing a few words",
      "Call a friend or family member for connection and meaningful conversation",
      "Take a warm shower or bath to reset your energy and wash away stress"
    ],
    3: [ // Fine
      "Set a small, achievable goal for today that will give you a sense of progress",
      "Practice gratitude by writing down 3 good things that happened recently",
      "Try a new activity or hobby you've been curious about but haven't started yet",
      "Take time to reflect on what you need right now to feel more fulfilled",
      "Go for a walk and observe your surroundings mindfully, noticing small details",
      "Do something kind for someone else to create positive connections today"
    ],
    4: [ // Great
      "Share your good mood with someone you care about and brighten their day too",
      "Capture this moment with a photo or journal entry to remember this feeling",
      "Use this positive energy to tackle something you've been putting off recently",
      "Try something new while you're feeling confident and open to experiences",
      "Help someone else in need - spread the positive energy you're feeling right now",
      "Take time to appreciate what's going well in your life and acknowledge your wins"
    ],
    5: [ // Peak
      "Celebrate this amazing feeling - you deserve every moment of this joy!",
      "Plan something fun for your future self to look forward to and extend this happiness",
      "Share your joy - call someone special and spread this wonderful happiness around",
      "Document what led to this feeling so you can recreate these conditions again",
      "Use this high energy for a meaningful project or goal that excites you",
      "Practice gratitude for this moment of pure joy and let it fill your entire being"
    ]
  };

  // Mood configurations with colors and labels
  const moodConfigs = {
    1: { color: '#ef4444', label: 'Rough', emoji: '😢' }, // True Red - more vibrant
    2: { color: '#fb923c', label: 'Meh', emoji: '😔' },   // Orange - warm transition
    3: { color: '#fbbf24', label: 'Fine', emoji: '😐' },  // Amber - rich gold
    4: { color: '#22c55e', label: 'Great', emoji: '😊' }, // Bright Green - vibrant
    5: { color: '#8b5cf6', label: 'Peak', emoji: '😄' },  // Purple - joyful peak
  };

  // Get interpolated color based on mood value (smooth transitions)
  const getOrbColor = (value: number) => {
    // Smooth color interpolation between mood colors
    if (value <= 1) return '#ef4444'; // Rough - True Red
    if (value <= 2) {
      const factor = value - 1;
      return interpolateColor('#ef4444', '#fb923c', factor); // True Red to Orange
    }
    if (value <= 3) {
      const factor = value - 2;
      return interpolateColor('#fb923c', '#fbbf24', factor); // Orange to Amber
    }
    if (value <= 4) {
      const factor = value - 3;
      return interpolateColor('#fbbf24', '#22c55e', factor); // Amber to Bright Green
    }
    if (value <= 5) {
      const factor = value - 4;
      return interpolateColor('#22c55e', '#8b5cf6', factor); // Bright Green to Purple
    }
    return '#8b5cf6'; // Peak - Purple
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
    setIsCheckingEntry(true);
    try {
      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const entry = await getMoodEntryForDate(todayKey);
      
      if (entry) {
        setTodaysMoodEntry(entry);
        setHasEntryToday(true);
        // Set the previous mood as the temp selected mood for editing
        setTempSelectedMood(entry.mood);
        setMoodValue(entry.mood);
      } else {
        setHasEntryToday(false);
        // Ensure default mood is selected (Fine/3)
        setTempSelectedMood(3);
        setMoodValue(3);
      }
    } catch (error) {
      console.error('Error checking today\'s mood:', error);
      setHasEntryToday(false);
      // Ensure default mood is selected (Fine/3)
      setTempSelectedMood(3);
      setMoodValue(3);
    } finally {
      setIsCheckingEntry(false);
    }
  };

  // Check for today's mood on component mount
  useEffect(() => {
    checkTodaysMood();
  }, []);

  // Keyboard event listeners - primary drivers for text input animation
  useEffect(() => {
    // Use keyboard event coordinates so the animation adapts to different device keyboards
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e: any) => {
      const kbHeight = (e && e.endCoordinates && e.endCoordinates.height) ? e.endCoordinates.height : 150;
      // Use gentler multipliers so content doesn't move too far on large keyboards
      const clampedKb = Math.min(kbHeight, 300);
      // Text input should move roughly half the keyboard height, but no more than 160
      const textInputOffset = -Math.min(Math.round(clampedKb * 0.5), 160);
      // Mood sphere should move less so it stays visible; cap at 60
      const sphereOffset = -Math.min(Math.round(clampedKb * 0.25), 60);

      console.log('Keyboard did show - height:', kbHeight, 'textInputOffset:', textInputOffset, 'sphereOffset:', sphereOffset);
      setIsTextInputFocused(true);
      isTextInputFocusedRef.current = true;

      // Animate both text input and mood sphere up using keyboard height
      Animated.parallel([
        Animated.timing(textInputPosition, {
          toValue: textInputOffset,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(moodSpherePosition, {
          toValue: sphereOffset,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      console.log('Keyboard did hide - animating text input and mood sphere down');
      setIsTextInputFocused(false);
      isTextInputFocusedRef.current = false;

      // Animate both back to original positions
      Animated.parallel([
        Animated.timing(textInputPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(moodSpherePosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []); // No dependencies - listeners handle all keyboard events

  // Animate mood options when tempSelectedMood changes
  useEffect(() => {
    // Animate all mood options
    [1, 2, 3, 4, 5].forEach(moodValue => {
      const isSelected = tempSelectedMood === moodValue;
      animateMoodOption(moodValue, isSelected);
    });
  }, [tempSelectedMood]);

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

  // Character counting and limiting function
  const handleJournalTextChange = (text: string) => {
    const currentCharacterCount = text.length;
    
    if (currentCharacterCount <= CHARACTER_LIMIT) {
      setJournalText(text);
      setCharacterCount(currentCharacterCount);
    } else {
      // If character limit exceeded, truncate to the character limit
      const truncatedText = text.slice(0, CHARACTER_LIMIT);
      setJournalText(truncatedText);
      setCharacterCount(CHARACTER_LIMIT);
    }
  };

  // Handle text input focus - just update state, let keyboard events handle animation
  const handleTextInputFocus = () => {
    console.log('Text input focused');
    setIsTextInputFocused(true);
    isTextInputFocusedRef.current = true;
    // Animation will be handled by keyboardDidShow listener
  };

  // Handle text input blur - just update state, let keyboard events handle animation
  const handleTextInputBlur = () => {
    console.log('Text input blurred');
    setIsTextInputFocused(false);
    isTextInputFocusedRef.current = false;
    // Animation will be handled by keyboardDidHide listener
  };

  // Animate mood option upward movement
  const animateMoodOption = (moodIndex: number, isSelected: boolean) => {
    const animationValue = moodOptionAnimations[moodIndex - 1]; // Convert 1-5 to 0-4 index
    
    Animated.spring(animationValue, {
      toValue: isSelected ? -8 : 0, // Move up 8px when selected, back to 0 when deselected
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
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
    // Ensure mood is set if not already
    if (!selectedMood && tempSelectedMood) {
      setSelectedMood(tempSelectedMood);
    }
    
    // Always animate to show content, regardless of current state
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
    setIsEditingMood(false);
    setTempSelectedMood(3); // Reset to default Fine mood
    setJournalText('');
    setCharacterCount(0);
    setCurrentAdviceIndex(0);
    setMoodValue(3); // Reset to neutral
    
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

  // Go back to mood selection - same interface as initial selection
  const goBackToMoodSelection = () => {
    // Reset to initial selection state - no selected mood, no editing mode
    setSelectedMood(null);
    setIsEditingMood(false);
    
    // Keep the current mood as temp selected for highlighting
    setTempSelectedMood(selectedMood);
    
    // Clear journal and advice
    setJournalText('');
    setCharacterCount(0);
    setCurrentAdviceIndex(0);
    
    // Animate back to show the full mood selection interface
    Animated.parallel([
      Animated.timing(moodSelectorPosition, {
        toValue: 0, // Center the mood selector
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0, // Hide journal/advice content
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(sliderPosition, {
        toValue: selectedMood ? (selectedMood - 1) / 4 : 0.5, // Position slider to current mood
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const saveMoodEntry = async () => {
    // Create date key using local date instead of UTC
    const now = new Date();
    const localDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const entry = {
      date: localDateKey, // Use local date key for storage
      mood: selectedMood!,
      journal: journalText,
      advice: getCurrentAdvice(),
    };
    
    console.log('Saving mood entry:', {
      date: localDateKey,
      mood: selectedMood,
      journalLength: journalText.length,
      advice: getCurrentAdvice()
    });
    
    try {
      await saveToStorage(entry);
      console.log('Mood entry saved successfully for date:', localDateKey);
      
      // Show success modal
      setShowSaveSuccessModal(true);
      
      // Auto-dismiss modal after 2 seconds and show today's mood summary
      setTimeout(() => {
        setShowSaveSuccessModal(false);
        // Reset form state completely
        setSelectedMood(null);
        setJournalText('');
        setCharacterCount(0);
        setCurrentAdviceIndex(0);
        setTodaysMoodEntry(entry);
        setHasEntryToday(true);
        // Navigate to calendar and request a refresh since a new entry was just saved
        if (typeof onNavigateToCalendar === 'function') {
          onNavigateToCalendar(true);
        }
      }, 2000);
      
      // Reset form animations
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
    } catch (error) {
      Alert.alert('Error', 'Failed to save mood entry. Please try again.');
    }
  };

  // Calculate the translateY value for vertical centering animation
  const translateY = moodSelectorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100], // Move sphere up when mood is selected to make room for content
  });

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      enabled={true}
    >
      <Pressable onPress={() => Keyboard.dismiss()} style={{ flex: 1 }}>
      <View style={[styles.container, { 
        paddingBottom: 50, // Fixed padding to prevent smooshing
        paddingTop: insets.top + 20, // Proper top spacing for header
        backgroundColor: colors.background 
      }]}> 
        
  {isCheckingEntry ? null : hasEntryToday ? (
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
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Today's Mood</Text>
            </View>
          
          <TouchableOpacity
            onPress={() => setShowChangeMoodModal(true)}
            activeOpacity={1}
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
          
          <Text style={[styles.moodLabel, { color: colors.text }]}>
            {moodConfigs[todaysMoodEntry?.mood as keyof typeof moodConfigs]?.label}
          </Text>
          
          {todaysMoodEntry?.journal && (
            <View style={[styles.journalPreview, { backgroundColor: colors.surface }]}>
              <Text style={[styles.journalLabel, { color: colors.text }]}>Your feelings:</Text>
              <Text style={[styles.journalText, { color: colors.textSecondary }]}>{todaysMoodEntry.journal}</Text>
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
              <Text style={[styles.title, { color: colors.text }]}>How are you feeling today?</Text>
            ) : (
              <View style={styles.titleSpacer} />
            )}
          </View>
          
          {/* Mood Orb - Animated container for keyboard movement */}
          <Animated.View
            style={{
              transform: [{ translateY: moodSpherePosition }],
            }}
          >
            <TouchableOpacity
              onPress={selectedMood ? goBackToMoodSelection : undefined}
              activeOpacity={1}
            >
              <Animated.View
                style={[
                  styles.moodOrb,
                  {
                    backgroundColor: selectedMood ? getOrbColor(selectedMood) : (tempSelectedMood ? getOrbColor(tempSelectedMood) : getOrbColor(moodValue)),
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
            <Text style={[styles.moodLabel, { color: colors.text }]}>
              {selectedMood ? getMoodLabel(selectedMood) : (tempSelectedMood ? getMoodLabel(tempSelectedMood) : "Select your mood")}
            </Text>
          </Animated.View>

          {/* 5 Mood Options - Show when no mood selected OR when editing existing mood */}
          {(!selectedMood || isEditingMood) && (
            <View style={styles.moodOptionsContainer}>
              <View style={styles.moodOptionsGrid}>
                {Object.entries(moodConfigs).map(([value, config]) => {
                  const moodValue = parseInt(value);
                  const animationValue = moodOptionAnimations[moodValue - 1]; // Convert 1-5 to 0-4 index
                  
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.moodOption,
                        selectedMood === moodValue && styles.selectedMoodOption // Highlight current mood
                      ]}
                      activeOpacity={1}
                      onPress={() => {
                        setTempSelectedMood(moodValue);
                        setMoodValue(moodValue);
                      }}
                    >
                      <Animated.View
                        style={{
                          alignItems: 'center',
                          transform: [{ translateY: animationValue }]
                        }}
                      >
                        <View style={[
                          styles.moodOptionOrb, 
                          { backgroundColor: config.color },
                          tempSelectedMood === moodValue && styles.selectedMoodOption
                        ]}>
                          <View style={styles.moodOptionOrbInner}>
                            <View style={styles.moodOptionOrbHighlight} />
                          </View>
                        </View>
                        <Text style={[styles.moodOptionLabel, { color: colors.text }]}>{config.label}</Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {/* Confirm Button - Only show when a mood is temporarily selected */}
              {tempSelectedMood && (
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: getOrbColor(tempSelectedMood) }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    const moodToSelect = tempSelectedMood;
                    setSelectedMood(moodToSelect);
                    setMoodValue(moodToSelect);
                    setTempSelectedMood(null);
                    setIsEditingMood(false); // Exit editing mode
                    
                    // Force animation to show content
                    setTimeout(() => {
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
                    }, 100);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Confirm Mood</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>

        {/* Animated Content - Journal and Steps */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: (selectedMood && !isEditingMood) ? 1 : contentOpacity,
            },
          ]}
        >
          {selectedMood && !isEditingMood && (
            <>
              {/* Journal Section - Animated container for keyboard movement */}
              <Animated.View
                style={{
                  transform: [{ translateY: textInputPosition }],
                }}
              >
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{getJournalPrompt(selectedMood)}</Text>
                  <ScrollView 
                    style={[styles.journalInputContainer, { 
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }]}
                    contentContainerStyle={{ flexGrow: 1 }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    <TextInput
                      style={[styles.journalInputText, { 
                        backgroundColor: colors.surface,
                        color: colors.text
                      }]}
                      multiline
                      textAlignVertical="top"
                      placeholder="Write about your feelings..."
                      placeholderTextColor={colors.textMuted}
                      value={journalText}
                      onChangeText={handleJournalTextChange}
                      onFocus={handleTextInputFocus}
                      onBlur={handleTextInputBlur}
                      blurOnSubmit={true}
                      returnKeyType="done"
                      scrollEnabled={false}
                      editable={true}
                      selectTextOnFocus={false}
                      caretHidden={false}
                      contextMenuHidden={false}
                    />
                  </ScrollView>
                  <View style={styles.wordCountContainer}>
                    <Text style={[
                      styles.wordCountText,
                      { color: colors.textMuted },
                      characterCount > CHARACTER_LIMIT * 0.9 && [styles.wordCountWarning, { color: colors.warning }],
                      characterCount === CHARACTER_LIMIT && [styles.wordCountLimit, { color: colors.error }]
                    ]}>
                      {characterCount}/{CHARACTER_LIMIT} characters
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Personalized Advice */}
              <TouchableOpacity onPress={getNextAdvice} style={[styles.adviceContainer, { backgroundColor: colors.surface }]}>
                <Animated.Text style={[styles.adviceText, { opacity: adviceOpacity, color: colors.text }]}>
                  {getCurrentAdvice()}
                </Animated.Text>
                <Text style={[styles.tapForMoreText, { color: colors.textMuted }]}>Tap for more advice</Text>
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  { 
                    backgroundColor: selectedMood ? getOrbColor(selectedMood) : '#0284c7',
                    marginBottom: Platform.OS === 'android' ? insets.bottom + 20 : 15 
                  }
                ]} 
                onPress={saveMoodEntry}
              >
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
        </>
      )}
  </View>
  </Pressable>

      {/* Change Mood Confirmation Modal */}
      <Modal
        visible={showChangeMoodModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChangeMoodModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChangeMoodModal(false)}
        >
          <TouchableOpacity 
            style={[styles.changeMoodModal, { backgroundColor: colors.surface }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Change Today's Mood?
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Do you want to update your mood entry for today? This will replace your current entry.
            </Text>
            
            <TouchableOpacity
              style={[styles.singleModalButton, { 
                backgroundColor: todaysMoodEntry ? moodConfigs[todaysMoodEntry.mood as keyof typeof moodConfigs]?.color : '#0284c7'
              }]}
              onPress={() => {
                setShowChangeMoodModal(false);
                setHasEntryToday(false);
                setTodaysMoodEntry(null);
                // Pre-select Fine (3) as the default mood
                setTempSelectedMood(3);
                setMoodValue(3);
              }}
            >
              <Text style={styles.confirmButtonText}>Change Mood</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Save Success Modal */}
      <Modal
        visible={showSaveSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.changeMoodModal, { backgroundColor: colors.surface }]}>
            <View style={styles.successIcon}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Entry Saved!
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Your daily mood has been recorded.
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from center to flex-start
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, 
    // paddingBottom is now dynamic via state
  },
  moodSelectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50, // Reduced from 100 to save space
  },
  titleContainer: {
    height: 60, // Reduced from 80
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSpacer: {
    height: 40, // Reduced from 54 to save space
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
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 0,
    marginTop: -30, // Move content up to be closer to mood sphere and clear navigation UI
    paddingBottom: 20, // Add bottom padding to ensure button clears navigation UI
    flex: 1, // Allow content to fill available space
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15, // Reduced from 20
    marginBottom: 10, // Reduced from 25 to save space
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16, // Reduced from 18
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12, // Reduced from 15
  },
  journalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 15,
    maxHeight: 78, // Maximum height for 2 lines, won't grow beyond this
    minHeight: 78, // Minimum height to maintain consistent button position
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    overflow: 'hidden', // Ensures proper clipping for scrollable content
  },
  journalInputContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    maxHeight: 78,
    minHeight: 78,
    backgroundColor: '#f8fafc',
  },
  journalInputText: {
    padding: 15,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: 'transparent',
    minHeight: 48, // Minimum height for text content (78 - 30 padding)
    textAlignVertical: 'top',
  },
  // Advice Styles
  adviceContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 15, // Reduced from 20
    marginBottom: 15, // Reduced from 25
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    minHeight: 70, // Reduced from 100 to save space
    alignSelf: 'stretch', // Ensure container stretches to full width
  },
  adviceText: {
    fontSize: 14, // Reduced from 16
    color: '#1e293b',
    lineHeight: 20, // Reduced from 24
    marginBottom: 8, // Reduced from 10
    fontStyle: 'italic',
  },
  tapForMoreText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 10, // Reduced from 12
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 30,
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
  // Mood Options Styles
  moodOptionsContainer: {
    marginTop: 30,
    marginBottom: 30, // Add bottom margin for better spacing
    width: '100%',
  },
  moodOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  moodOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  moodOption: {
    width: '19%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  moodOptionOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 8,
  },
  moodOptionOrbInner: {
    width: '85%',
    height: '85%',
    borderRadius: 25,
    position: 'relative',
    overflow: 'hidden',
  },
  moodOptionOrbHighlight: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '40%',
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 15,
  },
  moodOptionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedMoodOption: {
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  confirmButton: {
    marginTop: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Word Count Styles
  wordCountContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  wordCountText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  wordCountWarning: {
    color: '#f59e0b', // Orange warning when approaching limit
  },
  wordCountLimit: {
    color: '#dc2626', // Red when at limit
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeMoodModal: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  singleModalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});