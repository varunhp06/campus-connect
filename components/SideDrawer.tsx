import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { auth } from '../firebaseConfig';
import { useDialog } from './DialogContext';
import HapticPressable from './HapticPressable';
import { useTheme } from './ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.65; // Slightly wider for better breathing room

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose }) => {
  const { theme, isDarkMode } = useTheme();
  const { showDialog } = useDialog();
  // Animation refs
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;
  const hasTriggeredHaptic = useRef(false);

  const user = auth.currentUser;
  const userName = user?.displayName  || 'Guest User';
  const userEmail = user?.email || 'Sign in to access features';

  // Animation Logic
  useEffect(() => {
    const config = { useNativeDriver: true };
    if (isOpen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      hasTriggeredHaptic.current = false;
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.poly(5)), ...config }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, ...config }),
        Animated.timing(contentScale, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.5)), ...config }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 250, easing: Easing.in(Easing.poly(4)), ...config }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, ...config }),
        Animated.timing(contentScale, { toValue: 0.95, duration: 200, ...config }),
      ]).start();
    }
  }, [isOpen]);

  // Gesture Handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && gestureState.dx > -DRAWER_WIDTH) {
          slideAnim.setValue(gestureState.dx);
          const progress = Math.abs(gestureState.dx) / DRAWER_WIDTH;
          overlayOpacity.setValue(1 - progress);
          // Haptic trigger point
          if (progress > 0.5 && !hasTriggeredHaptic.current) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            hasTriggeredHaptic.current = true;
          } else if (progress <= 0.5) {
            hasTriggeredHaptic.current = false;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -DRAWER_WIDTH * 0.25 || gestureState.vx < -0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }).start();
        }
      },
    })
  ).current;

  const handleLogout = async () => {
    showDialog({
      title: 'Log Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            onClose();
            router.replace('/LoginScreen');
          },
        },
      ]
    });
  };

  const menuItems = [
  { id: 'profile', icon: 'person', label: 'My Profile', color: '#6366f1', route: '/(app)/Profile' },
  { id: 'settings', icon: 'settings', label: 'Settings', color: '#8b5cf6', route: '/(app)/Settings' },
  { id: 'notifications', icon: 'notifications', label: 'Notifications', color: '#ec4899', route: '/(app)/notifications' },
  { id: 'orderhistory', icon: 'timer', label: 'Order History', color: '#e2bc01', route: '/(app)/campus-utilities/Canteen/User/OrderHistory' },
];


  const drawerBg = isDarkMode ? '#0f172a' : '#ffffff';
  const cardBg = isDarkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : '#f1f5f9';

  return (
    <>
      {/* Backdrop */}
      <Animated.View 
        style={[styles.overlay, { opacity: overlayOpacity }]} 
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <HapticPressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Drawer Container */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          {
            backgroundColor: theme.background,
            transform: [{ translateX: slideAnim }],
            borderRightWidth: 1,
            borderColor: borderColor,
          },
        ]}
      >
        <Animated.View style={[styles.drawerContent, { transform: [{ scale: contentScale }] }]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Menu</Text>
            <HapticPressable style={[styles.closeBtn, { backgroundColor: cardBg }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.text} />
            </HapticPressable>
          </View>

          {/* 2. Modern Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                <View style={[styles.onlineDot, { borderColor: drawerBg }]} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>{userName}</Text>
                <Text style={[styles.profileEmail, { color: theme.placeholder }]} numberOfLines={1}>{userEmail}</Text>
              </View>
            </View>
          </View>

          {/* 3. Menu Items List */}
          <View style={styles.menuContainer}>
            <Text style={[styles.sectionLabel, { color: theme.placeholder }]}>GENERAL</Text>
            {menuItems.map((item, index) => (
              <HapticPressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? cardBg : 'transparent' }
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onClose();
                  router.push(item.route)
                }}
              >
                {/* Squaricle Icon Background */}
                <View style={[styles.iconBox, { backgroundColor: isDarkMode ? `${item.color}20` : `${item.color}15` }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                
                <Text style={[styles.menuText, { color: theme.text }]}>{item.label}</Text>
              </HapticPressable>
            ))}
          </View>

          {/* 4. Footer & Logout */}
          <View style={styles.footer}>
            <View style={[styles.separator, { backgroundColor: borderColor }]} />
            <HapticPressable
              style={({ pressed }) => [
                styles.logoutItem,
                { opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={handleLogout}
            >
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="log-out" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.menuText, { color: '#ef4444' }]}>Log Out</Text>
            </HapticPressable>
            <Text style={[styles.version, { color: theme.placeholder }]}>v1.0.2 • Build 2024</Text>
          </View>

        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 1000,
    borderTopRightRadius: 35,
    borderBottomRightRadius: 35,
    // Soft Shadow
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 25,
  },
  drawerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Card
  profileCard: {
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 32,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 18, // Squaricle avatar
    backgroundColor: '#228f16',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#228f16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Menu List
  menuContainer: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 6,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  separator: {
    height: 1,
    width: '100%',
    marginBottom: 20,
    opacity: 0.5,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  version: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.4,
  },
});