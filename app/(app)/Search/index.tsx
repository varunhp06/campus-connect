import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { FEATURES } from "../../../src/config/featuresRegistry";
import HapticPressable from "@/components/HapticPressable";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/components/ThemeContext";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { isDarkMode, theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const userRole = "student"; // Replace with actual auth role

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];

    const lower = query.toLowerCase();
    return FEATURES.filter((item) => item.roles.includes(userRole)) // ⬅ role check
      .filter(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          item.keywords.some((k) => k.toLowerCase().includes(lower)) ||
          item.description.toLowerCase().includes(lower)
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [query, userRole]);

  const handleItemPress = (route: string) => {
    Keyboard.dismiss();
    router.push(route);
  };

  const clearSearch = () => {
    setQuery("");
    Keyboard.dismiss();
  };

  const SearchIcon = () => (
    <Ionicons
      name="search"
      size={20}
      color={isDarkMode ? "#94A3B8" : "#64748B"}
      style={styles.searchIcon}
    />
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: isDarkMode
              ? "rgba(34, 143, 22, 0.1)"
              : "rgba(34, 143, 22, 0.08)",
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={48}
          color={isDarkMode ? "#228f16ff" : "#228f16ff"}
        />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
        ]}
      >
        No Results Found
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: isDarkMode ? "#94A3B8" : "#64748B" },
        ]}
      >
        Try searching with different keywords or browse all features
      </Text>
    </View>
  );

  const InitialState = () => (
    <View style={styles.initialContainer}>
      <View
        style={[
          styles.initialIcon,
          {
            backgroundColor: isDarkMode
              ? "rgba(34, 143, 22, 0.1)"
              : "rgba(34, 143, 22, 0.08)",
          },
        ]}
      >
        <Ionicons
          name="rocket-outline"
          size={48}
          color={isDarkMode ? "#228f16ff" : "#228f16ff"}
        />
      </View>
      <Text
        style={[
          styles.initialTitle,
          { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
        ]}
      >
        Discover Features
      </Text>
      <Text
        style={[
          styles.initialSubtitle,
          { color: isDarkMode ? "#94A3B8" : "#64748B" },
        ]}
      >
        Search for tools, services, and features across the app
      </Text>

      <View style={styles.popularSection}>
        <Text
          style={[
            styles.popularTitle,
            { color: isDarkMode ? "#94A3B8" : "#64748B" },
          ]}
        >
          Popular Searches
        </Text>
        <View style={styles.popularTags}>
          {FEATURES.slice(0, 4).map((item) => (
            <HapticPressable
              key={item.id}
              style={[
                styles.tag,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.04)",
                },
              ]}
              onPress={() => setQuery(item.title)}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: isDarkMode ? "#E2E8F0" : "#475569" },
                ]}
              >
                {item.title}
              </Text>
            </HapticPressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.background
        },
      ]}
    >
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDarkMode
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.9)",
            borderColor: isFocused
              ? "#228f16ff"
              : isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        <SearchIcon />
        <TextInput
          autoFocus
          placeholder="Search tools, features, services..."
          placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.searchInput,
            {
              color: isDarkMode ? "#F8FAFC" : "#0F172A",
            },
          ]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <HapticPressable onPress={clearSearch} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={20}
              color={isDarkMode ? "#94A3B8" : "#64748B"}
            />
          </HapticPressable>
        )}
      </View>

      {/* Results */}
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {query.length === 0 ? (
          <InitialState />
        ) : filtered.length > 0 ? (
          <View style={styles.resultsList}>
            <View style={styles.resultsHeader}>
              <Text
                style={[
                  styles.resultsCount,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                {filtered.length} {filtered.length === 1 ? "result" : "results"}{" "}
                found
              </Text>
            </View>
            {filtered.map((item, index) => {
              const safeIcon =
                (item.icon as keyof typeof Ionicons.glyphMap) || "cube-outline";

              return (
                <HapticPressable
                  key={item.id}
                  onPress={() => handleItemPress(item.route)}
                  style={[
                    styles.resultItem,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(30, 41, 59, 0.6)"
                        : "rgba(255, 255, 255, 0.8)",
                      borderColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    },
                  ]}
                >
                  <View style={styles.itemContent}>
                    <View
                      style={[
                        styles.itemIcon,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(34, 143, 22, 0.15)"
                            : "rgba(34, 143, 22, 0.08)",
                        },
                      ]}
                    >
                      <Ionicons name={safeIcon} size={20} color="#228f16ff" />
                    </View>
                    <View style={styles.itemText}>
                      <Text
                        style={[
                          styles.itemTitle,
                          { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.itemDescription,
                          { color: isDarkMode ? "#94A3B8" : "#64748B" },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isDarkMode ? "#475569" : "#CBD5E1"}
                  />
                </HapticPressable>
              );
            })}
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchHeader: {
    paddingVertical: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    marginVertical: 40,
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  initialContainer: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  initialIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  initialTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  initialSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  popularSection: {
    width: "100%",
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  popularTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
});
