import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useTheme } from './ThemeContext';

export interface NavbarConfig {
  showHamburger?: boolean;
  showTitle?: boolean;
  showThemeToggle?: boolean;
  onHamburgerPress?: () => void;
}

interface NavbarProps extends NavbarConfig {}

export const Navbar: React.FC<NavbarProps> = ({ 
  showHamburger = true, 
  showTitle = true, 
  showThemeToggle = true,
  onHamburgerPress 
}) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  const handleHamburgerPress = () => {
    if (onHamburgerPress) {
      onHamburgerPress();
    } else {
      Alert.alert('Menu', 'Hamburger menu pressed');
    }
  };

  return (
    <View style={[
      styles.navbar,
      { 
        backgroundColor: theme.navbarBackground,
        borderBottomColor: theme.navbarBorder,
      }
    ]}>
      <View style={styles.leftSection}>
        {showHamburger && (
          <Pressable
            style={({ pressed }) => [
              { opacity: pressed ? 0.5 : 1 }
            ]}
            onPress={handleHamburgerPress}
          >
            <View style={styles.hamburger}>
              <View style={[styles.hamburgerLine1, { backgroundColor: theme.text }]} />
              <View style={[styles.hamburgerLine2, { backgroundColor: theme.text }]} />
              <View style={[styles.hamburgerLine3, { backgroundColor: theme.text }]} />
            </View>
          </Pressable>
        )}

        {showTitle && (
          <View style={styles.navTitle}>
            <Text style={[styles.navTitleText, { color: theme.text }]}>
              <Text style={[styles.navCampus, { color: theme.primaryText }]}>CAMPUS</Text>
              CONNECT
            </Text>
          </View>
        )}
      </View>

      {showThemeToggle && (
        <Pressable
          style={({ pressed }) => [
            { opacity: pressed ? 0.5 : 1 }
          ]}
          onPress={toggleTheme}
        >
          <Text style={styles.themeIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    paddingRight: '7%'
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingLeft: '5%'
  },
  hamburger: {
    width: 20,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine1: {
    width: 30,
    height: 3,
  },
  hamburgerLine2: {
    width: 24,
    height: 3,
  },
  hamburgerLine3: {
    width: 18,
    height: 3,
  },
  navTitle: {
    flex: 1,
  },
  navTitleText: {
    fontFamily: 'OpenSans_Light',
    fontSize: 15,
    paddingLeft: '10%'
  },
  navCampus: {
    fontFamily: 'OpenSans_Bold',
  },
  themeIcon: {
    fontSize: 24,
  },
});
