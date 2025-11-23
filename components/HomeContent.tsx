import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  ImageSourcePropType,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "./ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import HapticPressable from "./HapticPressable";
import { fetchActivities } from "./data/activities";
import ButtonComp from "./ButtonComp";
import { checkUserHasEventManagementAccess } from "./EventsManagementContent";

interface UtilityCard {
  id: string;
  title: string;
  description: string;
  icon: ImageSourcePropType;
  color: string;
  route: string;
}

interface ActivityItem {
  id: string;
  date: string;
  tab: string;
  month: string;
  year: number;
  title: string;
  description: string;
}

export const HomeContent: React.FC = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<
    "SPORTS" | "CULT" | "TECH" | "ALL"
  >("SPORTS");
  
  // Add state for activities
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state for event management access
  const [hasEventManagementAccess, setHasEventManagementAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Add state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const TAB_WIDTH = containerWidth / 4;

  // Fetch activities from Firestore
  const loadActivities = async () => {
    const fetchedActivities = await fetchActivities();
    setActivities(fetchedActivities);
  };

  // Check if user has event management access
  const checkAccess = async () => {
    const hasAccess = await checkUserHasEventManagementAccess();
    setHasEventManagementAccess(hasAccess);
  };

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await Promise.all([loadActivities(), checkAccess()]);
      setIsLoading(false);
      setCheckingAccess(false);
    };

    initialLoad();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadActivities(), checkAccess()]);
    setRefreshing(false);
  };

  const handlePress = (index: number, tab: string) => {
    setSelectedTab(tab as typeof selectedTab);
    Animated.spring(translateX, {
      toValue: index,
      useNativeDriver: true,
    }).start();
  };

  const utilities: UtilityCard[] = [
    {
      id: "1",
      title: "Night Delivery",
      description:
        "Late-night food orders delivered to your hostel after mess hours",
      icon: require("../assets/images/icons/night-delivery.png"),
      color: "#2196F3",
      route: "/campus-utilities/",
    },
    {
      id: "2",
      title: "Sports Section",
      description:
        "Sports hub for complaints, equipment requests, and event updates.",
      icon: require("../assets/images/icons/sports.png"),
      color: "#4CAF50",
      route: "/campus-utilities/Sports",
    },
    {
      id: "3",
      title: "Cycle Rental",
      description: "Enjoy casual rides around campus",
      icon: require("../assets/images/icons/cycle-rental.png"),
      color: "#FFC107",
      route: "/campus-utilities/CycleSection",
    },
  ];

  const tabColors: Record<string, string> = {
    SPORTS: "#4CAF50",
    CULT: "#E91E63",
    TECH: "#2196F3",
    ALL: "#FF9800",
  };

  const isEventPassed = (
    eventDate: string,
    eventMonth: string,
    eventYear: number
  ): boolean => {
    const monthMap: Record<string, number> = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11,
    };

    const eventDateObj = new Date(
      eventYear,
      monthMap[eventMonth],
      parseInt(eventDate)
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventDateObj < today;
  };

  const upcomingActivities = useMemo(() => {
    return activities.filter(
      (activity) => !isEventPassed(activity.date, activity.month, activity.year)
    );
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return selectedTab === "ALL"
      ? upcomingActivities
      : upcomingActivities.filter((a) => a.tab === selectedTab);
  }, [selectedTab, upcomingActivities]);

  const services = [
    {
      id: "1",
      title: "Administration",
      description: "Find personnel details with contact info",
      icon: require("../assets/images/icons/administration.png"),
      color: "#2196F3",
      route: "/campus-services/AdministrationSection",
    },
    {
      id: "2",
      title: "Lost and Found",
      description: "Report lost items and find your belongings",
      icon: require("../assets/images/icons/lost-and-found.png"),
      color: "#E84343",
      route: "/campus-services/LostAndFoundSection",
    },
    {
      id: "3",
      title: "FAQs",
      description: "Quick help for everything",
      icon: require("../assets/images/icons/faq.png"),
      color: "#FFC107",
      route: "/campus-services/faq",
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primaryText}
          colors={[theme.primaryText]}
          title="Pull to refresh"
          titleColor={theme.text}
        />
      }
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchIconContainer}>
          <Ionicons name="search" color={theme.text} size={20} />
        </View>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            },
          ]}
          placeholder="Search"
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Campus Utilities
        </Text>
        {utilities.map((utility) => (
          <ButtonComp
            utility={utility}
            theme={theme}
            router={router}
            key={utility.id}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Upcoming Activity
        </Text>

        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <View
            style={{
              position: "relative",
              width: "100%",
            }}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            <View style={{ flexDirection: "row", width: "100%" }}>
              {["SPORTS", "CULT", "TECH", "ALL"].map((tab, index) => (
                <HapticPressable
                  key={tab}
                  style={({ pressed }) => [
                    styles.tab,
                    { opacity: pressed ? 0.7 : 1 },
                    { width: TAB_WIDTH },
                  ]}
                  onPress={() => handlePress(index, tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          selectedTab === tab
                            ? tabColors[tab]
                            : theme.placeholder,
                      },
                    ]}
                  >
                    {tab}
                  </Text>
                </HapticPressable>
              ))}
            </View>
            <Animated.View
              style={{
                position: "absolute",
                bottom: 0,
                height: 2,
                width: TAB_WIDTH,
                backgroundColor: tabColors[selectedTab],
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [0, 1, 2, 3],
                      outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2, TAB_WIDTH * 3],
                    }),
                  },
                ],
              }}
            />
          </View>
        </View>

        <View
          style={[
            styles.activityContainer,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          {isLoading ? (
            <View
              style={{
                minHeight: 300,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={tabColors[selectedTab]} />
              <Text
                style={{ color: theme.placeholder, marginTop: 12 }}
              >
                Loading activities...
              </Text>
            </View>
          ) : filteredActivities.length === 0 ? (
            <ScrollView
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              style={{ minHeight: 300, maxHeight: 300 }}
              contentContainerStyle={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.placeholder, textAlign: "center" }}>
                No upcoming {selectedTab.toLowerCase()} events.
              </Text>
            </ScrollView>
          ) : (
            <ScrollView
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              style={{ minHeight: 300, maxHeight: 300 }}
            >
              {filteredActivities.map((item, index) => (
                <View key={item.id}>
                  <HapticPressable
                    style={({ pressed }) => [
                      styles.activityItem,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.dateBox,
                        { backgroundColor: tabColors[item.tab] || "#5C9FD6" },
                      ]}
                    >
                      <Text style={styles.dateNumber}>{item.date}</Text>
                      <Text style={styles.dateMonth}>{item.month}</Text>
                    </View>

                    <View style={styles.activityContent}>
                      <Text
                        style={[styles.activityTitle, { color: theme.text }]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.activityDescription,
                          { color: theme.placeholder },
                        ]}
                      >
                        {item.description}
                      </Text>
                    </View>
                  </HapticPressable>
                  {index < filteredActivities.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: theme.inputBorder },
                      ]}
                    />
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Button Row with View All and Manage Events */}
        <View style={styles.buttonRow}>
          <HapticPressable
            style={({ pressed }) => [
              styles.viewAllButton,
              { opacity: pressed ? 0.7 : 1 },
              { backgroundColor: '#FF9800' },
              hasEventManagementAccess && styles.halfWidthButton,
            ]}
            onPress={() => router.push("/events/AllEventsScreen")}
          >
            <Text style={styles.viewMoreText}>View All</Text>
          </HapticPressable>

          {!checkingAccess && hasEventManagementAccess && (
            <HapticPressable
              style={({ pressed }) => [
                styles.viewAllButton,
                { opacity: pressed ? 0.7 : 1 },
                { backgroundColor: '#FF9800' },
              ]}
              onPress={() => router.push("/events/EventsManagementScreen")}
            >
              <Text style={styles.viewMoreText}>Manage Events</Text>
            </HapticPressable>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Campus Services
        </Text>
        {services.map((service) => (
          <ButtonComp
            utility={service}
            theme={theme}
            router={router}
            key={service.id}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 28,
    marginTop: 20,
  },
  searchIconContainer: {
    position: "absolute",
    left: 36,
    zIndex: 1,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    paddingHorizontal: 48,
    fontSize: 16,
    borderWidth: 0.7,
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  utilityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 0.7,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  utilityBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
  },
  utilityImage: { height: 56, width: 56, marginLeft: 8, marginRight: 12 },
  utilityContent: { flex: 1 },
  utilityTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  utilityDescription: { fontSize: 12 },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 0.7,
    marginBottom: 12,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  activityContainer: { borderRadius: 12, borderWidth: 0.7, overflow: "hidden" },
  activityItem: { flexDirection: "row", padding: 16 },
  dateBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  dateNumber: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  dateMonth: { fontSize: 10, fontWeight: "600", color: "#fff" },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  activityDescription: { fontSize: 12 },
  divider: { height: 1, marginLeft: 78 },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  viewAllButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: "#FF9800",
    borderColor: "#FF9800",
    borderWidth: 2,
  },
  halfWidthButton: {
    flex: 1,
  },
  viewMoreText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600" 
  },
});