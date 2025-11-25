import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "./ThemeContext";
import { useDrawer } from "./DrawerContext";
import HapticPressable from "./HapticPressable";
import {  usePathname, useRouter } from "expo-router";
import { useCanteen } from "./CanteenContext";

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
  onHamburgerPress,
}) => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { openDrawer } = useDrawer();
  const router = useRouter();

  const pathname = usePathname();
  console.log("Current Pathname:", pathname);
  const { cart , getCartItems} = useCanteen();

  const items = getCartItems();
  console.log("Navbar - Cart Items:", items);

  const handleHamburgerPress = () => {
    if (onHamburgerPress) {
      onHamburgerPress();
    } else {
      openDrawer();
    }
  };

  return (
    <View
      style={[
        styles.navbar,
        {
          backgroundColor: theme.navbarBackground,
          borderBottomColor: theme.navbarBorder,
        },
      ]}
    >
      <View style={styles.leftSection}>
        {showHamburger && (
          <HapticPressable
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            onPress={handleHamburgerPress}
            hitSlop={{ top: 20, bottom: 20, left: 30, right: 30 }}
          >
            <View style={styles.hamburger}>
              <View
                style={[styles.hamburgerLine1, { backgroundColor: theme.text }]}
              />
              <View
                style={[styles.hamburgerLine2, { backgroundColor: theme.text }]}
              />
              <View
                style={[styles.hamburgerLine3, { backgroundColor: theme.text }]}
              />
            </View>
          </HapticPressable>
        )}

        {showTitle && (
          <HapticPressable onPress={()=>router.replace("/(app)")} style={styles.navTitle}>
            <Text style={[styles.navTitleText, { color: theme.text }]}>
              <Text style={[styles.navCampus, { color: theme.primaryText }]}>
                CAMPUS
              </Text>
              CONNECT
            </Text>
          </HapticPressable>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        { pathname.startsWith("/campus-utilities/Canteen/User") && 
          <HapticPressable
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            onPress={() => router.push("/campus-utilities/Canteen/User/Cart")}
          >
            <Text style={styles.themeIcon}>🛒</Text>
          </HapticPressable>
        }
        {showThemeToggle && (
          <HapticPressable
            style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{isDarkMode ? "☀️" : "🌙"}</Text>
          </HapticPressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 12,
    borderBottomWidth: 1,
    paddingRight: "7%",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    paddingLeft: "5%",
  },
  hamburger: {
    width: 20,
    height: 18,
    justifyContent: "space-between",
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
    fontFamily: "OpenSans_Light",
    fontSize: 15,
    paddingLeft: "10%",
  },
  navCampus: {
    fontFamily: "OpenSans_Bold",
  },
  themeIcon: {
    fontSize: 24,
  },
});
