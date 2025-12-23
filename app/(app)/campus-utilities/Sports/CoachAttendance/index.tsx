import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../../../../firebaseConfig";

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
  const { showToast } = useToast();
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
      showToast("Failed to fetch attendance logs", "error");
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

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const date = log.timestamp.toDate();
    const isToday = new Date().toDateString() === date.toDateString();
    const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
    
    let key = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    if (isToday) key = "Today";
    else if (isYesterday) key = "Yesterday";
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(log);
    return acc;
  }, {} as Record<string, AttendanceLog[]>);

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
              <ActivityIndicator size="large" color="#139d04ff" />
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

          {activeTab === "logs" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Stats Overview */}
              <View style={styles.statsContainer}>
                <View style={[styles.mainStatCard, { backgroundColor: isDarkMode ? "#1E293B" : "#00a53dff" }]}>
                   <View style={styles.mainStatContent}>
                      <Text style={[styles.mainStatLabel, { color: isDarkMode ? "#94A3B8" : "#dcfce7" }]}>Total Activity Today</Text>
                      <Text style={[styles.mainStatValue, { color: isDarkMode ? "#FFFFFF" : "#FFFFFF" }]}>{todayLogs.length}</Text>
                   </View>
                   <View style={styles.mainStatIcon}>
                      <Ionicons name="people" size={32} color={isDarkMode ? "#22c55e" : "#FFFFFF"} />
                   </View>
                </View>

                <View style={styles.subStatsRow}>
                  <View style={[styles.subStatCard, { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" }]}>
                    <View style={styles.subStatIconBgEntry}>
                      <Ionicons name="enter" size={20} color="#16a34a" />
                    </View>
                    <View>
                      <Text style={[styles.subStatValue, { color: isDarkMode ? "#FFFFFF" : "#0f172a" }]}>{entryCount}</Text>
                      <Text style={[styles.subStatLabel, { color: isDarkMode ? "#94A3B8" : "#64748B" }]}>Entries</Text>
                    </View>
                  </View>
                  <View style={[styles.subStatCard, { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" }]}>
                    <View style={styles.subStatIconBgExit}>
                       <Ionicons name="exit" size={20} color="#ea580c" />
                    </View>
                    <View>
                      <Text style={[styles.subStatValue, { color: isDarkMode ? "#FFFFFF" : "#0f172a" }]}>{exitCount}</Text>
                      <Text style={[styles.subStatLabel, { color: isDarkMode ? "#94A3B8" : "#64748B" }]}>Exits</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Filter Tabs */}
              <View style={[styles.filterContainer, { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" }]}>
                {[
                  { key: "all", label: "All Logs" },
                  { key: "entry", label: "Entries" },
                  { key: "exit", label: "Exits" },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterTab,
                      filterType === filter.key && styles.activeFilterTab,
                      filterType === filter.key && { backgroundColor: isDarkMode ? "#334155" : "#f0fdf4" }
                    ]}
                    onPress={() => setFilterType(filter.key as any)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        { 
                          color: filterType === filter.key 
                            ? "#16a34a" 
                            : isDarkMode ? "#94A3B8" : "#64748B" 
                        }
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Grouped Logs List */}
              <View style={styles.logsList}>
                {Object.keys(groupedLogs).length > 0 ? (
                  Object.entries(groupedLogs).map(([date, logs]) => (
                    <View key={date} style={styles.dateGroup}>
                      <View style={styles.dateHeader}>
                        <View style={[styles.dateIndicator, { backgroundColor: isDarkMode ? "#334155" : "#e2e8f0" }]} />
                        <Text style={[styles.dateHeaderText, { color: isDarkMode ? "#94A3B8" : "#64748B" }]}>
                          {date}
                        </Text>
                      </View>
                      
                      {logs.map((log, index) => (
                        <View key={log.id} style={styles.timelineRow}>
                          <View style={styles.timelineLineContainer}>
                             <View style={[styles.timelineLine, { backgroundColor: isDarkMode ? "#334155" : "#e2e8f0" }]} />
                             <View style={[
                               styles.timelineDot,
                               { 
                                 backgroundColor: log.type === 'entry' ? '#16a34a' : '#ea580c',
                                 borderColor: isDarkMode ? "#0f172a" : "#FFFFFF"
                               }
                             ]} />
                          </View>
                          
                          <Animated.View
                            style={[
                              styles.logCard,
                              {
                                backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#F1F5F9",
                              },
                            ]}
                          >
                            <View style={styles.logHeader}>
                              <View style={styles.logHeaderLeft}>
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
                                  {log.type === 'entry' ? 'Checked In' : 'Checked Out'} • {formatTime(log.timestamp)}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor:
                                      log.type === "entry" 
                                        ? "rgba(22, 163, 74, 0.1)" 
                                        : "rgba(234, 88, 12, 0.1)",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusBadgeText,
                                    {
                                      color: log.type === "entry" ? "#16a34a" : "#ea580c",
                                    },
                                  ]}
                                >
                                  {log.type.toUpperCase()}
                                </Text>
                              </View>
                            </View>
                          </Animated.View>
                        </View>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyStateIcon, { backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9" }]}>
                      <Ionicons
                        name="clipboard-outline"
                        size={48}
                        color={isDarkMode ? "#475569" : "#94A3B8"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyStateText,
                        { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                      ]}
                    >
                      No logs found
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateSubtext,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      Activity will appear here once recorded
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
  statsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  mainStatCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainStatContent: {
    gap: 4,
  },
  mainStatLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  mainStatIcon: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  subStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  subStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subStatIconBgEntry: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  subStatIconBgExit: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
  },
  subStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  subStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Enhanced Tabs / Filter
  filterContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 24,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeFilterTab: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Grouped Logs
  logsList: {
    paddingBottom: 20,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dateIndicator: {
    width: 20,
    height: 1,
  },
  dateHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLineContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 0,
    bottom: -20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 24, // align with card center approx
    backgroundColor: '#fff',
    zIndex: 1,
  },
  logCard: {
    flex: 1,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  logName: {
    fontSize: 16,
    fontWeight: '700',
  },
  logId: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // Empty State New
  emptyStateIcon: {
    padding: 24,
    borderRadius: 32,
    marginBottom: 16,
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