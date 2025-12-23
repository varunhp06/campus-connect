import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Theme {
  background: string;
  text: string;
  primaryText: string;
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  navbarBackground: string;
  navbarBorder: string;
  secondaryText: string;
  primary: string;
}

export const lightTheme: Theme = {
  background: '#f5f5f5',
  text: '#1a1a1a',
  primaryText: '#0F172A',
  inputBackground: '#ffffff',
  inputBorder: '#e0e0e0',
  placeholder: '#999',
  navbarBackground: '#f5f5f5',
  navbarBorder: 'transparent',
  secondaryText: '#64748B',
  primary: '#3B82F6',
};

export const darkTheme: Theme = {
  background: '#1a1a1a',
  text: '#ffffff',
  primaryText: '#F1F5F9',
  inputBackground: '#2a2a2a',
  inputBorder: '#404040',
  placeholder: '#d6d6d6ff',
  navbarBackground: '#1a1a1a',
  navbarBorder: 'transparent',
  secondaryText: '#94A3B8',
  primary: '#60A5FA',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};