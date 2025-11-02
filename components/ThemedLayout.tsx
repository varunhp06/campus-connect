import React, { ReactNode } from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { Navbar, NavbarConfig } from './Navbar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SideDrawer } from './SideDrawer';
import { useDrawer } from './DrawerContext';

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
  const { isDrawerOpen, closeDrawer, createSwipeHandler } = useDrawer();
  
  const swipeHandler = createSwipeHandler();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
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
        {...swipeHandler.panHandlers}
      >
        {children}
      </KeyboardAvoidingView>
      <SideDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
});