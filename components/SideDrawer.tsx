import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
  Easing,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import HapticPressable from './HapticPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.55;

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const hasTriggeredHaptic = useRef(false);

  const user = auth.currentUser;
  const userName = user?.displayName || 'User';
  const userEmail = user?.email || 'No email';

  useEffect(() => {
    if (isOpen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && gestureState.dx > -DRAWER_WIDTH) {
          slideAnim.setValue(gestureState.dx);
          const progress = Math.abs(gestureState.dx) / DRAWER_WIDTH;
          overlayOpacity.setValue(1 - progress);

          if (progress > 0.5 && !hasTriggeredHaptic.current) {
            Haptics.selectionAsync();
            hasTriggeredHaptic.current = true;
          } else if (progress <= 0.5) {
            hasTriggeredHaptic.current = false;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50 || gestureState.vx < -0.5) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onClose();
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            onClose();
            router.replace('/LoginScreen');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.');
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'settings',
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => {
        Alert.alert('Settings', 'Settings screen coming soon');
        onClose();
      },
    },
    {
      id: 'complaints',
      icon: 'alert-circle-outline',
      label: 'Complaints',
      onPress: () => {
        Alert.alert('Complaints', 'Complaints screen coming soon');
        onClose();
      },
    },
    {
      id: 'logout',
      icon: 'log-out-outline',
      label: 'Logout',
      onPress: handleLogout,
      color: '#E84343',
    },
  ];

  return (
    <>
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <HapticPressable
          style={styles.overlayHapticPressable}
          onPress={() => {
            Haptics.selectionAsync();
            onClose();
          }}
        />
      </Animated.View>

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          {
            backgroundColor: theme.background,
            borderRightColor: theme.inputBorder,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.drawerContent}>
          <View
            style={[
              styles.profileSection,
              { borderBottomColor: theme.inputBorder },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: theme.primaryText }]}>
              <Text style={[styles.avatarText, { color: theme.inputBackground }]}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.placeholder }]} numberOfLines={1}>
              {userEmail}
            </Text>
          </View>

          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <HapticPressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  {
                    backgroundColor: pressed
                      ? theme.inputBackground
                      : 'transparent',
                  },
                ]}
                onPress={item.onPress}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.color || theme.text}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    { color: item.color || theme.text },
                  ]}
                >
                  {item.label}
                </Text>
              </HapticPressable>
            ))}
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  overlayHapticPressable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    borderRightWidth: 1,
    zIndex: 1000,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  drawerContent: {
    flex: 1,
    paddingTop: 60,
  },
  profileSection: {
    padding: 24,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  menuSection: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
});
