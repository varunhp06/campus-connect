import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Navbar, NavbarConfig } from './Navbar';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ThemedLayoutProps {
  children: ReactNode;
  showNavbar?: boolean;
  navbarConfig?: NavbarConfig;
}

export const ThemedLayout: React.FC<ThemedLayoutProps> = ({ 
  children, 
  showNavbar = true,
  navbarConfig = {}
}) => {
  const { theme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.container]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {showNavbar && <Navbar {...navbarConfig} />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
});