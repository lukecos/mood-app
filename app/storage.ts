import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MoodEntry {
  date: string;
  mood: number;
  journal: string;
  advice: string;
}

const MOOD_ENTRIES_KEY = 'mood_entries';

export const saveMoodEntry = async (entry: MoodEntry): Promise<void> => {
  try {
    // Get existing entries
    const existingData = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    const moodHistory: Record<string, MoodEntry> = existingData ? JSON.parse(existingData) : {};
    
    // Add new entry (using date as key)
    const dateKey = entry.date.split('T')[0]; // Get just the date part (YYYY-MM-DD)
    moodHistory[dateKey] = entry;
    
    // Save back to storage
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(moodHistory));
  } catch (error) {
    console.error('Error saving mood entry:', error);
    throw error;
  }
};

export const getMoodHistory = async (): Promise<Record<string, MoodEntry>> => {
  try {
    const data = await AsyncStorage.getItem(MOOD_ENTRIES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading mood history:', error);
    return {};
  }
};

export const getMoodEntryForDate = async (date: string): Promise<MoodEntry | null> => {
  try {
    const moodHistory = await getMoodHistory();
    return moodHistory[date] || null;
  } catch (error) {
    console.error('Error getting mood entry for date:', error);
    return null;
  }
};
