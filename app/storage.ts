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
    
    // Handle both ISO date format and YYYY-MM-DD format
    const dateKey = entry.date.includes('T') ? entry.date.split('T')[0] : entry.date;
    const isOverwrite = !!moodHistory[dateKey];
    
    moodHistory[dateKey] = entry;
    
    // Save back to storage
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(moodHistory));
    
    // Simple logging for save operations only
    console.log(`💾 Mood entry ${isOverwrite ? 'updated' : 'saved'} for ${dateKey}`);
    
  } catch (error) {
    console.error('❌ Storage: Error saving mood entry:', error);
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

// Test data injection function - simulate October 2025
export const injectTestData = async (): Promise<void> => {
  try {
    const testEntries: Record<string, MoodEntry> = {};
    // Simulate October 2025 instead of current month
    const currentYear = 2025;
    const targetMonth = 9; // October (0-based indexing)
    
    // Get the first day of October 2025
    const firstDayOfMonth = new Date(currentYear, targetMonth, 1);
    // Get the last day of October 2025
    const lastDayOfMonth = new Date(currentYear, targetMonth + 1, 0);
    
    // Generate test data for each day of October 2025
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentYear, targetMonth, day);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Generate random mood (1-5)
      const mood = Math.floor(Math.random() * 5) + 1;
      
      // Sample journal entries based on mood with varied character lengths
      const journalEntries = {
        1: [
          // Short entries (50-100 characters)
          "Tough day. Everything feels overwhelming.",
          "Really struggling today with heavy feelings.",
          "Bad day. Can't shake this low mood.",
          // Medium entries (100-200 characters)
          "Having a really difficult time today. Work stress is getting to me and I'm feeling quite overwhelmed by everything going on.",
          "Feeling very low and unmotivated. The weight of daily responsibilities feels too heavy and I'm struggling to find any joy.",
          "Not a good day at all. Anxiety is through the roof and I can't seem to focus on anything productive or positive.",
          // Long entries (200+ characters)
          "This has been one of those days where everything feels impossible. Started with work stress, then personal issues piled on top. I'm feeling completely drained and overwhelmed by all the responsibilities I have. Even simple tasks feel monumental right now.",
          "Really struggling with my mental health today. The combination of work pressure, family stress, and general life challenges is making me feel like I'm drowning. I know these feelings will pass, but right now everything seems so difficult and heavy."
        ],
        2: [
          // Short entries
          "Bit of a rough day but managing.",
          "Feeling down but trying to stay positive.",
          "Some challenges today, not my best.",
          // Medium entries
          "Having some ups and downs today. Work was stressful but I managed to get through it okay. Just feeling a bit unmotivated overall.",
          "Not my best day but not terrible either. Dealing with some personal stuff that's weighing on me a bit. Could be better.",
          "Feeling somewhat low energy today. Had a few challenging moments but also some okay ones mixed in throughout the day.",
          // Long entries
          "Today was one of those days that wasn't terrible but definitely wasn't great either. I had some work challenges that stressed me out, but I managed to handle them reasonably well. Personal life has some complications right now that are affecting my mood.",
          "Mixed feelings today. Some good moments with friends and family, but also dealing with ongoing stress that's been building up. I'm trying to focus on the positives but it's been challenging to maintain that perspective consistently."
        ],
        3: [
          // Short entries
          "Pretty average day overall.",
          "Nothing special but nothing bad either.",
          "Okay day, just routine stuff.",
          // Medium entries
          "Had a pretty normal day today. Work was routine, spent some time relaxing at home. Nothing particularly exciting happened.",
          "Feeling neutral about today. Some good moments and some challenging ones too. Overall just a regular day with mixed feelings.",
          "Average day with the usual mix of tasks and activities. Not feeling particularly up or down, just going with the flow.",
          // Long entries
          "Today was pretty typical - nothing amazing happened but nothing terrible either. I got through my work responsibilities, had lunch with a colleague, and spent the evening watching TV. It's nice to have these calm, steady days sometimes.",
          "Neutral day overall. I accomplished what I needed to at work, had some good conversations with friends, and took care of routine tasks at home. Sometimes these ordinary days are exactly what I need to recharge and reset."
        ],
        4: [
          // Short entries
          "Great day! Feeling really positive.",
          "Had a wonderful time today.",
          "Good day with lots of accomplishments.",
          // Medium entries
          "Really good day today! Got a lot accomplished at work and felt very productive. Had a nice lunch with friends too.",
          "Feeling quite positive and energized. Had some great conversations and made good progress on my personal goals.",
          "Lovely day overall. Work went smoothly, enjoyed some quality time with family, and feeling grateful for the good things.",
          // Long entries
          "What a fantastic day! Everything seemed to go right from the moment I woke up. Work was productive and fulfilling, I had meaningful conversations with colleagues, and the evening was spent enjoying good food and laughter with loved ones. Days like this remind me how wonderful life can be.",
          "Today was filled with so many positive moments. I felt energized and motivated throughout the day, accomplished everything I set out to do, and even had time for some self-care. Grateful for my health, relationships, and the opportunities I have."
        ],
        5: [
          // Short entries
          "Amazing day! Everything went perfectly!",
          "Incredible day filled with joy and gratitude!",
          "Best day ever! So happy and fulfilled!",
          // Medium entries
          "Absolutely wonderful day! Had a breakthrough at work, celebrated with family, and feeling incredibly grateful for everything.",
          "Such an amazing day from start to finish! Beautiful weather, great conversations, meaningful work, and lots of laughter.",
          "Feeling on top of the world today! Everything aligned perfectly and I'm overflowing with happiness and appreciation.",
          // Long entries
          "Today was absolutely magical! From the moment I woke up, everything felt perfect. I had a major breakthrough on a project I've been working on for months, received wonderful news from family, and spent the evening celebrating with friends. The weather was beautiful, conversations were deep and meaningful, and I felt so connected to everyone around me.",
          "What an extraordinary day! I'm filled with such overwhelming gratitude and joy. Work was not just productive but truly fulfilling, I had amazing quality time with loved ones, and even small moments like my morning coffee tasted perfect. These are the days that remind me how incredibly blessed I am and how beautiful life can be when everything aligns."
        ]
      };
      
      // Sample advice based on mood
      const adviceEntries = {
        1: [
          "Consider talking to someone you trust about how you're feeling. Sometimes sharing can lighten the load.",
          "Try some gentle self-care activities like taking a warm bath or listening to calming music.",
          "Remember that difficult days don't last forever. Be patient and kind with yourself.",
        ],
        2: [
          "Maybe try doing one small thing that usually makes you feel better, like going for a walk.",
          "Consider reaching out to a friend or family member for some connection and support.",
          "Try to focus on one positive thing, no matter how small, from today.",
        ],
        3: [
          "Since you're feeling neutral, this might be a good time to plan something you enjoy for tomorrow.",
          "Consider trying a new activity or reaching out to someone you haven't talked to in a while.",
          "Neutral days are perfect for gentle self-reflection and setting small goals.",
        ],
        4: [
          "Great to hear you're feeling good! Try to notice what contributed to this positive feeling.",
          "Keep up whatever you're doing that's working well for you. You're on a good path!",
          "Consider sharing your positive energy with someone else - it can be contagious!",
        ],
        5: [
          "Wonderful! Take a moment to really savor and appreciate this great feeling.",
          "Try to remember what made today so special so you can recreate these positive experiences.",
          "Your joy is infectious! Consider doing something kind for someone else to spread the happiness.",
        ]
      };
      
      const journalOptions = journalEntries[mood as keyof typeof journalEntries];
      const adviceOptions = adviceEntries[mood as keyof typeof adviceEntries];
      
      testEntries[dateKey] = {
        date: date.toISOString(),
        mood: mood,
        journal: journalOptions[Math.floor(Math.random() * journalOptions.length)],
        advice: adviceOptions[Math.floor(Math.random() * adviceOptions.length)]
      };
    }
    
    // Save all test entries
    await AsyncStorage.setItem(MOOD_ENTRIES_KEY, JSON.stringify(testEntries));
    const daysGenerated = Object.keys(testEntries).length;
    const monthName = new Date(currentYear, targetMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    console.log(`🧪 Test Data: Successfully injected ${daysGenerated} days of test entries for ${monthName}`);
    
  } catch (error) {
    console.error('🧪 Test Data: Error injecting test data:', error);
    throw error;
  }
};
