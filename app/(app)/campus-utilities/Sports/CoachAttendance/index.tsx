import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/components/ThemeContext";
import React, { useEffect, useState } from "react";
import { db, auth } from "../../../../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  Dimensions,
} from "react-native";
import { ThemedLayout } from "@/components/ThemedLayout";
import { ServiceLayout } from "@/components/ServiceLayout";
import QRCode from "react-native-qrcode-svg";

const title = "Attendance Tracker";

type AttendanceLog = {
  id: string;
  coachId: string;
  coachName: string;
  timestamp: Timestamp;
  type: "entry" | "exit";
  scannedBy?: string;
};

type TabType = "generate" | "scan" | "logs";

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("logs");
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState<"entry" | "exit">("entry");
  const [filterType, setFilterType] = useState<"all" | "entry" | "exit">("all");
  const fadeAnim = useState(new Animated.Value(0))[0];
  const modalAnim = useState(new Animated.Value(0))[0];

  const { theme, isDarkMode } = useTheme();
  const coach = auth.currentUser;
  const { width } = Dimensions.get("window");
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    fetchAttendanceLogs();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, "attendanceLogs");
      const q = query(logsRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);

      const logs = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AttendanceLog)
      );
      setAttendanceLogs(logs);
    } catch (error) {
      console.log("Error fetching logs:", error);
      Alert.alert("Error", "Failed to fetch attendance logs");
    } finally {
      setLoading(false);
    }
  };





  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (timestamp: Timestamp) => {
    const now = Date.now();
    const logTime = timestamp.toMillis();
    const diffMinutes = Math.floor((now - logTime) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const filteredLogs = attendanceLogs.filter((log) => {
    if (filterType === "all") return true;
    return log.type === filterType;
  });

  const todayLogs = filteredLogs.filter((log) => {
    const today = new Date();
    const logDate = log.timestamp.toDate();
    return (
      logDate.getDate() === today.getDate() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getFullYear() === today.getFullYear()
    );
  });

  const entryCount = todayLogs.filter((log) => log.type === "entry").length;
  const exitCount = todayLogs.filter((log) => log.type === "exit").length;

  if (loading && attendanceLogs.length === 0) {
    return (
      <ThemedLayout
        showNavbar={true}
        navbarConfig={{
          showHamburger: true,
          showTitle: true,
          showThemeToggle: true,
        }}
      >
        <ServiceLayout icon="reader" title={title} showTitle={true}>
          <View style={styles.centerContainer}>
            <View
              style={[
                styles.loadingIcon,
                { backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9" },
              ]}
            >
              <ActivityIndicator size="large" color="#228f16ff" />
            </View>
            <Text
              style={[
                styles.loadingText,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Loading attendance logs...
            </Text>
          </View>
        </ServiceLayout>
      </ThemedLayout>
    );
  }

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <ServiceLayout icon="reader" title={title} showTitle={true}>
        <Animated.View style={[styles.container]}>
          <View
            style={[
              styles.tabContainer,
              {
                backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                shadowColor: isDarkMode ? "#000" : "#6366F1",
              },
            ]}
          >
            {[
              { key: "logs", icon: "list-outline", label: "Logs" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                ]}
                onPress={() => setActiveTab(tab.key as TabType)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={
                    activeTab === tab.key
                      ? "#00aa03ff"
                      : isDarkMode
                      ? "#94A3B8"
                      : "#64748B"
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === tab.key
                          ? "#28a000ff"
                          : 
                           "#64748B",
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Enhanced Stats */}
              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      shadowColor: isDarkMode ? "#000" : "#6366F1",
                    },
                  ]}
                >
                  <View style={[styles.statIcon, { backgroundColor: "rgba(42, 234, 12, 0.1)" }]}>
                    <Ionicons name="enter-outline" size={24} color="#008526ff" />
                  </View>
                  <Text
                    style={[
                      styles.statValue,
                      { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                    ]}
                  >
                    {entryCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: isDarkMode ? "#64748B" : "#94A3B8" },
                    ]}
                  >
                    Entries Today
                  </Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      shadowColor: isDarkMode ? "#000" : "#6366F1",
                    },
                  ]}
                >
                  <View style={[styles.statIcon, { backgroundColor: "rgba(42, 234, 12, 0.1)" }]}>
                    <Ionicons name="exit-outline" size={24} color="#2c8b00ff" />
                  </View>
                  <Text
                    style={[
                      styles.statValue,
                      { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                    ]}
                  >
                    {exitCount}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: isDarkMode ? "#64748B" : "#94A3B8" },
                    ]}
                  >
                    Exits Today
                  </Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      shadowColor: isDarkMode ? "#000" : "#6366F1",
                    },
                  ]}
                >
                  <View style={[styles.statIcon, { backgroundColor: "rgba(34, 197, 94, 0.1)" }]}>
                    <Ionicons name="people-outline" size={24} color="#16A34A" />
                  </View>
                  <Text
                    style={[
                      styles.statValue,
                      { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                    ]}
                  >
                    {todayLogs.length}
                  </Text>
                  <Text
                    style={[
                      styles.statLabel,
                      { color: isDarkMode ? "#64748B" : "#94A3B8" },
                    ]}
                  >
                    Total Today
                  </Text>
                </View>
              </View>

              {/* Enhanced Filter */}
              <View
                style={[
                  styles.filterContainer,
                  {
                    backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                {[
                  { key: "all", label: "All", color: "#228f16ff" },
                  { key: "entry", label: "Entry", color: "#007548ff" },
                  { key: "exit", label: "Exit", color: "#459400ff" },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterButton,
                      filterType === filter.key && [
                        styles.activeFilterButton,
                        { backgroundColor: filter.color },
                      ],
                    ]}
                    onPress={() => setFilterType(filter.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        {
                          color:
                            filterType === filter.key
                              ? "#FFFFFF"
                              : isDarkMode
                              ? "#94A3B8"
                              : "#64748B",
                        },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Enhanced Logs List */}
              <View style={styles.logsList}>
                {filteredLogs.map((log, index) => (
                  <Animated.View
                    key={log.id}
                    style={[
                      styles.logCard,
                      {
                        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                        shadowColor: isDarkMode ? "#000" : "#6366F1",
                      },
                    ]}
                  >
                    <View style={styles.logHeader}>
                      <View
                        style={[
                          styles.logTypeIndicator,
                          {
                            backgroundColor:
                              log.type === "entry" 
                                ? "rgba(37, 99, 235, 0.1)" 
                                : "rgba(234, 88, 12, 0.1)",
                          },
                        ]}
                      >
                        <Ionicons
                          name={log.type === "entry" ? "enter-outline" : "exit-outline"}
                          size={20}
                          color={log.type === "entry" ? "#2563EB" : "#EA580C"}
                        />
                      </View>
                      <View style={styles.logInfo}>
                        <Text
                          style={[
                            styles.logName,
                            { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                          ]}
                        >
                          {log.coachName}
                        </Text>
                        <Text
                          style={[
                            styles.logId,
                            { color: isDarkMode ? "#64748B" : "#94A3B8" },
                          ]}
                        >
                          ID: {log.coachId.slice(0, 8)}...
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.logTypeBadge,
                          {
                            backgroundColor:
                              log.type === "entry" 
                                ? "rgba(37, 99, 235, 0.1)" 
                                : "rgba(234, 88, 12, 0.1)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.logTypeBadgeText,
                            {
                              color: log.type === "entry" ? "#2563EB" : "#EA580C",
                            },
                          ]}
                        >
                          {log.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.logFooter}>
                      <View style={styles.logTimeContainer}>
                        <View style={styles.logTime}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={isDarkMode ? "#64748B" : "#94A3B8"}
                          />
                          <Text
                            style={[
                              styles.logTimeText,
                              { color: isDarkMode ? "#64748B" : "#94A3B8" },
                            ]}
                          >
                            {formatDate(log.timestamp)}
                          </Text>
                        </View>
                        <View style={styles.logTime}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={isDarkMode ? "#64748B" : "#94A3B8"}
                          />
                          <Text
                            style={[
                              styles.logTimeText,
                              { color: isDarkMode ? "#64748B" : "#94A3B8" },
                            ]}
                          >
                            {formatTime(log.timestamp)}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.logTimeAgo,
                          { color: isDarkMode ? "#64748B" : "#94A3B8" },
                        ]}
                      >
                        {getTimeAgo(log.timestamp)}
                      </Text>
                    </View>
                  </Animated.View>
                ))}

                {filteredLogs.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="document-outline"
                      size={64}
                      color={isDarkMode ? "#475569" : "#CBD5E1"}
                    />
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: isDarkMode ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      No attendance logs found
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateSubtext,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      Attendance logs will appear here once recorded
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingIcon: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  // Enhanced Tab Navigation
  tabContainer: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
    padding: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 8,
  },
  headerContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  // Enhanced QR Buttons
  qrButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
  },
  qrButton: {
    flex: 1,
    padding: 24,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  qrButtonIcon: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 16,
  },
  qrButtonTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  qrButtonSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  qrButtonBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qrButtonBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  // Enhanced Coach Info
  coachInfo: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  coachInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  coachInfoHeaderText: {
    fontSize: 18,
    fontWeight: "600",
  },
  coachInfoContent: {
    gap: 4,
  },
  coachInfoLabel: {
    fontSize: 14,
  },
  coachInfoValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  coachInfoId: {
    fontSize: 13,
    marginTop: 4,
  },
  // Enhanced Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  // Enhanced Filter
  filterContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    padding: 6,
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeFilterButton: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // Enhanced Logs
  logsList: {
    gap: 16,
    marginBottom: 80,
  },
  logCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  logTypeIndicator: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  logId: {
    fontSize: 13,
  },
  logTypeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  logTypeBadgeText: {
    fontWeight: "700",
    fontSize: 12,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logTimeContainer: {
    flexDirection: "row",
    gap: 16,
  },
  logTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logTimeText: {
    fontSize: 14,
  },
  logTimeAgo: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Enhanced Empty State
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  modalCloseButton: {
    padding: 4,
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  qrBackground: {
    padding: 20,
    borderRadius: 20,
  },
  modalFooter: {
    width: "100%",
    alignItems: "center",
  },
  modalFooterText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActionButton: {
    backgroundColor: "#228f16ff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});