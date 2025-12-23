import { useDialog } from "@/components/DialogContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { useToast } from "@/components/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
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
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
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
  const [activeTab, setActiveTab] = useState<TabType>("generate");
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
  const { showDialog } = useDialog();
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

      const filteredLogs = logs.filter((log) => log.coachId === userId);

      setAttendanceLogs(filteredLogs);
    } catch (error) {
      console.log("Error fetching logs:", error);
      showToast("Failed to fetch attendance logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const openQRModal = (type: "entry" | "exit") => {
    setQrType(type);
    setShowQRModal(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const closeQRModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowQRModal(false);
    });
  };

  const generateQRPayload = () => {
    return JSON.stringify({
      coachId: coach?.uid || "unknown",
      coachName: coach?.displayName || coach?.email || "Unknown Coach",
      timestamp: Date.now(),
      type: qrType,
      action: "attendance",
    });
  };

  const handleBarCodeScanned = async ({ type, data }: any) => {
    if (scanned) return;
    
    setScanned(true);
    
    try {
      const scannedData = JSON.parse(data);
      
      if (scannedData.action !== "attendance") {
        showToast("This QR code is not for attendance tracking", "warning");
        setTimeout(() => setScanned(false), 2000);
        return;
      }

      await addDoc(collection(db, "attendanceLogs"), {
        coachId: scannedData.coachId,
        coachName: scannedData.coachName,
        timestamp: Timestamp.now(),
        type: scannedData.type,
        scannedBy: coach?.uid || "unknown",
      });

      showDialog({
        title: 'Success',
        message: `${scannedData.type === "entry" ? "Entry" : "Exit"} logged for ${scannedData.coachName}`,
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              fetchAttendanceLogs();
            },
          },
        ],
      });
    } catch (error) {
      console.log("Scan error:", error);
      showToast("Invalid QR code format", "error");
      setTimeout(() => setScanned(false), 2000);
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
              { key: "generate", icon: "qr-code-outline", label: "Generate" },
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

          {/* Generate QR Tab */}
          {activeTab === "generate" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.section}>
                <View style={styles.qrButtons}>
                  <TouchableOpacity
                    style={[
                      styles.qrButton,
                      {
                        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                        shadowColor: isDarkMode ? "#000" : "#6366F1",
                      },
                    ]}
                    onPress={() => openQRModal("entry")}
                  >
                    <View style={[styles.qrButtonIcon, { backgroundColor: "rgba(42, 234, 12, 0.1)" }]}>
                      <Ionicons name="enter-outline" size={32} color="#0c9600ff" />
                    </View>
                    <Text
                      style={[
                        styles.qrButtonTitle,
                        { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                      ]}
                    >
                      Entry QR
                    </Text>
                    <Text
                      style={[
                        styles.qrButtonSubtitle,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      Mark your arrival
                    </Text>
                    <View style={[styles.qrButtonBadge, { backgroundColor: "#2563EB" }]}>
                      <Text style={styles.qrButtonBadgeText}>IN</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.qrButton,
                      {
                        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                        shadowColor: isDarkMode ? "#000" : "#6366F1",
                      },
                    ]}
                    onPress={() => openQRModal("exit")}
                  >
                    <View style={[styles.qrButtonIcon, { backgroundColor: "rgba(42, 234, 12, 0.1)" }]}>
                      <Ionicons name="exit-outline" size={32} color="#407500ff" />
                    </View>
                    <Text
                      style={[
                        styles.qrButtonTitle,
                        { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                      ]}
                    >
                      Exit QR
                    </Text>
                    <Text
                      style={[
                        styles.qrButtonSubtitle,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      Mark your departure
                    </Text>
                    <View style={[styles.qrButtonBadge, { backgroundColor: "#EA580C" }]}>
                      <Text style={styles.qrButtonBadgeText}>OUT</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Enhanced Coach Info */}
                <View
                  style={[
                    styles.coachInfo,
                    {
                      backgroundColor: isDarkMode ? "#1E293B" : "#F8FAFC",
                      borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.coachInfoHeader}>
                    <Ionicons
                      name="person-circle-outline"
                      size={24}
                      color="#228f16ff"
                    />
                    <Text style={[styles.coachInfoHeaderText, { color: isDarkMode ? "#F1F5F9" : "#1E293B" }]}>
                      Your Profile
                    </Text>
                  </View>
                  <View style={styles.coachInfoContent}>
                    <Text
                      style={[
                        styles.coachInfoLabel,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      Logged in as
                    </Text>
                    <Text
                      style={[
                        styles.coachInfoValue,
                        { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                      ]}
                    >
                      {coach?.displayName || coach?.email || "Unknown"}
                    </Text>
                    <Text
                      style={[
                        styles.coachInfoId,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      ID: {coach?.uid?.slice(0, 8)}...
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

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

          {/* Enhanced QR Code Modal */}
          {showQRModal && (
            <Modal transparent visible={showQRModal} animationType="fade">
              <Animated.View
                style={[
                  styles.modalOverlay,
                  {
                    opacity: modalAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.modalBackdrop}
                  activeOpacity={1}
                  onPress={closeQRModal}
                />
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                      shadowColor: isDarkMode ? "#000" : "#6366F1",
                      transform: [
                        {
                          scale: modalAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <View>
                      <Text
                        style={[
                          styles.modalTitle,
                          { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                        ]}
                      >
                        {qrType === "entry" ? "Entry" : "Exit"} QR Code
                      </Text>
                      <Text
                        style={[
                          styles.modalSubtitle,
                          { color: isDarkMode ? "#64748B" : "#94A3B8" },
                        ]}
                      >
                        Show this QR to mark your {qrType}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={closeQRModal}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color={isDarkMode ? "#94A3B8" : "#64748B"} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.qrContainer}>
                    <View style={[
                      styles.qrBackground,
                      { backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC" }
                    ]}>
                      <QRCode 
                        value={generateQRPayload()} 
                        size={240} 
                        backgroundColor="transparent"
                        color={isDarkMode ? "#FFFFFF" : "#000000"}
                      />
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <Text
                      style={[
                        styles.modalFooterText,
                        { color: isDarkMode ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      Scan this QR code to record your {qrType}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={closeQRModal}
                    >
                      <Text style={styles.modalActionButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </Animated.View>
            </Modal>
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