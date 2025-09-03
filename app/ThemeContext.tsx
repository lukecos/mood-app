import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: {
    // Background colors
    background: string;
    surface: string;
    cardBackground: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    
    // UI colors
    border: string;
    shadow: string;
    headerBackground: string;
    
    // Interactive colors
    buttonBackground: string;
    buttonText: string;
    
    // Status colors
    warning: string;
    error: string;
  };
}

const lightColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  cardBackground: '#ffffff',
  text: '#1e293b',
  textSecondary: '#374151',
  textMuted: '#64748b',
  border: '#e2e8f0',
  shadow: '#000000',
  headerBackground: '#f8fafc',
  buttonBackground: '#e2e8f0',
  buttonText: '#374151',
  warning: '#f59e0b',
  error: '#dc2626',
};

const darkColors = {
  background: '#0f172a',
  surface: '#1e293b',
  cardBackground: '#334155',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  border: '#475569',
  shadow: '#000000',
  headerBackground: '#1e293b',
  buttonBackground: '#475569',
  buttonText: '#f1f5f9',
  warning: '#fbbf24',
  error: '#f87171',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
