import { useDialog } from "@/components/DialogContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { useToast } from "@/components/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    serverTimestamp,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { auth, db } from "../../../../../firebaseConfig";

const title = "Approve Requests";

type RentedItem = {
  id: string;
  name: string;
  quantity: number;
};

type RentedRecord = {
  id: string;
  userId: string;
  userName?: string;
  timestamp?: { seconds: number; nanoseconds: number };
  items: RentedItem[];
  status: string | boolean;
  // Additional fields for return requests
  rentalId?: string;
  itemId?: string;
  quantity?: number;
};

type TabType = "rent" | "return";

export default function RequestApprovalPage() {
  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const currentUser = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("rent");
  const [rentRequests, setRentRequests] = useState<RentedRecord[]>([]);
  const [returnRequests, setReturnRequests] = useState<RentedRecord[]>([]);
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchAllRequests();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);

      // Fetch rent requests
      const rentRef = collection(db, "rentrequest");
      const rentSnapshot = await getDocs(rentRef);
      const rentList = rentSnapshot.docs
        .map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as RentedRecord)
        )
        .filter((item) => item.status === false);
      setRentRequests(rentList);

      // Fetch return requests
      const returnRef = collection(db, "returnRequests");
      const returnSnapshot = await getDocs(returnRef);
      const returnList = returnSnapshot.docs
        .map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as RentedRecord)
        )
        .filter((item) => item.status === "pending");
      setReturnRequests(returnList);
      console.log(returnList);
    } catch (error) {
      console.error("Error fetching requests:", error);
      showToast("Failed to fetch requests", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllRequests();
  };

  const approveRentRequest = async (request: RentedRecord) => {
    showDialog({
      title: 'Approve Rent Request',
      message: `Approve rental request for ${request.userName || request.userId}?`,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingId(request.id);

              // Validate stock availability for all items BEFORE making any changes
              for (const item of request.items) {
                const equipmentRef = doc(db, "equipment", item.id);
                const equipmentSnap = await getDoc(equipmentRef);
                
                if (!equipmentSnap.exists()) {
                  throw new Error(`Equipment "${item.name}" not found in inventory`);
                }
                
                const equipmentData = equipmentSnap.data();
                const currentStock = equipmentData.stock || 0;
                const currentRented = equipmentData.rented || 0;
                const available = currentStock - currentRented;
                
                if (available < item.quantity) {
                  throw new Error(
                    `Insufficient stock for "${item.name}". Available: ${available}, Requested: ${item.quantity}`
                  );
                }
              }

              // All validations passed - proceed with approval
              // Update inventory for each item
              for (const item of request.items) {
                const equipmentRef = doc(db, "equipment", item.id);
                await updateDoc(equipmentRef, {
                  rented: increment(item.quantity),
                });
              }

              // Update request status
              await updateDoc(doc(db, "rentrequest", request.id), {
                status: "approved",
                approvedAt: Timestamp.now(),
                approvedBy: currentUser?.uid || "unknown",
              });

              // Create rental record
              await addDoc(collection(db, "rented"), {
                userId: request.userId,
                userName: request.userName || request.userId,
                items: request.items,
                timestamp: serverTimestamp(),
                approvedBy: currentUser?.uid || "unknown",
                approvedByName:
                  currentUser?.displayName || currentUser?.email || "Admin",
              });

              showToast("Rent request approved successfully!", "success");
              fetchAllRequests();
            } catch (error: any) {
              console.error("Error approving rent request:", error);
              showToast(
                error.message || "Failed to approve request",
                "error"
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    });
  };

  const approveReturnRequest = async (request: RentedRecord) => {
    showDialog({
      title: 'Approve Return Request',
      message: `Approve return request for ${request.userName || request.userId}?`,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            console.log("sdfg");
            try {
              setProcessingId(request.id);
              console.log("Request", request);
              const requestId = request.id;
              const rentalId = request.rentalId;
              const itemId = request.items[0]?.id;
              const quantity = request.items[0]?.quantity;

              console.log("sdfg");
              if (!rentalId || !itemId || !quantity) {
                throw new Error("Missing required fields in return request");
              }

              const equipmentRef = doc(db, "equipment", itemId);
              await updateDoc(equipmentRef, {
                rented: increment(-quantity),
              });
              const rentalRef = doc(db, "rented", rentalId);
              console.log("sdfg");
              const rentalSnap = await getDoc(rentalRef);
              console.log("sdfg");

              if (rentalSnap.exists()) {
                const rentalData = rentalSnap.data();
                const updatedItems = (rentalData.items || []).filter(
                  (i: RentedItem) => i.id !== itemId
                );

                if (updatedItems.length === 0) {
                  await deleteDoc(rentalRef);
                } else {
                  await updateDoc(rentalRef, {
                    items: updatedItems,
                  });
                }
              }
              console.log("mans");
              await updateDoc(doc(db, "returnRequests", requestId), {
                status: "approved",
                approvedAt: Timestamp.now(),
                approvedBy: currentUser?.uid || "unknown",
              });

              showToast("Return request approved successfully!", "success");
              fetchAllRequests();
            } catch (error) {
              console.error("Error approving return request:", error);
              showToast("Failed to approve return request", "error");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    });
  };

  const rejectRequest = async (request: RentedRecord, type: TabType) => {
    showDialog({
      title: 'Reject Request',
      message: `Are you sure you want to reject this ${type} request?`,
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(request.id);

              const collectionName =
                type === "rent" ? "rentrequest" : "returnRequests";
              
              // Mark request as rejected (keep for records)
              // No inventory changes needed - inventory was never decremented on request creation
              await updateDoc(doc(db, collectionName, request.id), {
                status: "rejected",
                rejectedAt: Timestamp.now(),
                rejectedBy: currentUser?.uid || "unknown",
              });

              showToast(
                `${type === "rent" ? "Rent" : "Return"} request rejected`,
                "info"
              );
              fetchAllRequests();
            } catch (error: any) {
              console.error("Error rejecting request:", error);
              showToast(
                error.message || "Failed to reject request",
                "error"
              );
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return "";
    const now = Date.now();
    const requestTime = timestamp.seconds * 1000;
    const diffMinutes = Math.floor((now - requestTime) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getTotalItems = (items?: RentedItem[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const currentRequests = activeTab === "rent" ? rentRequests : returnRequests;

  if (loading && rentRequests.length === 0 && returnRequests.length === 0) {
    return (
      <ThemedLayout
        showNavbar={true}
        navbarConfig={{
          showHamburger: true,
          showTitle: true,
          showThemeToggle: true,
        }}
      >
        <ServiceLayout icon="checkmark-circle" title={title} showTitle={true}>
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
              Loading requests...
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
      <ServiceLayout icon="checkmark-circle" title={title} showTitle={true}>
        <Animated.View style={[styles.container]}>
          {/* Tabs */}
          <View
            style={[
              styles.tabsContainer,
              {
                backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                borderBottomColor: isDarkMode ? "#334155" : "#E2E8F0",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "rent" && styles.activeTab,
                activeTab === "rent" && { borderBottomColor: "#228f16ff" },
              ]}
              onPress={() => setActiveTab("rent")}
            >
              <Ionicons
                name="cube-outline"
                size={20}
                color={
                  activeTab === "rent"
                    ? "#228f16ff"
                    : isDarkMode
                    ? "#64748B"
                    : "#94A3B8"
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "rent"
                        ? "#228f16ff"
                        : isDarkMode
                        ? "#64748B"
                        : "#94A3B8",
                  },
                  activeTab === "rent" && styles.activeTabText,
                ]}
              >
                Rent Requests
              </Text>
              {rentRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{rentRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "return" && styles.activeTab,
                activeTab === "return" && { borderBottomColor: "#228f16ff" },
              ]}
              onPress={() => setActiveTab("return")}
            >
              <Ionicons
                name="return-down-back-outline"
                size={20}
                color={
                  activeTab === "return"
                    ? "#228f16ff"
                    : isDarkMode
                    ? "#64748B"
                    : "#94A3B8"
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "return"
                        ? "#228f16ff"
                        : isDarkMode
                        ? "#64748B"
                        : "#94A3B8",
                  },
                  activeTab === "return" && styles.activeTabText,
                ]}
              >
                Return Requests
              </Text>
              {returnRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{returnRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#228f16ff"
                colors={["#228f16ff"]}
              />
            }
          >
            {/* Header Stats */}
            <View
              style={[
                styles.statsCard,
                {
                  backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                  borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                },
              ]}
            >
              <View style={styles.statsContent}>
                <View
                  style={[styles.statsIcon, { backgroundColor: "#FEF3C7" }]}
                >
                  <Ionicons name="time-outline" size={28} color="#F59E0B" />
                </View>
                <View style={styles.statsInfo}>
                  <Text
                    style={[
                      styles.statsValue,
                      { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                    ]}
                  >
                    {currentRequests.length}
                  </Text>
                  <Text
                    style={[
                      styles.statsLabel,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    Pending {activeTab === "rent" ? "Rent" : "Return"} Requests
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={isDarkMode ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            {/* Requests List */}
            <View style={styles.requestsList}>
              {currentRequests.map((request) => {
                const isExpanded = expandedItems[request.id];
                const isProcessing = processingId === request.id;
                const totalItems = getTotalItems(request.items);

                return (
                  <Animated.View
                    key={request.id}
                    style={[
                      styles.requestCard,
                      {
                        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                        opacity: isProcessing ? 0.6 : 1,
                      },
                    ]}
                  >
                    {/* Request Header */}
                    <TouchableOpacity
                      style={styles.requestHeader}
                      onPress={() => toggleExpand(request.id)}
                      activeOpacity={0.7}
                      disabled={isProcessing}
                    >
                      <View style={styles.requestHeaderLeft}>
                        <View
                          style={[
                            styles.userAvatar,
                            {
                              backgroundColor:
                                activeTab === "rent" ? "#DBEAFE" : "#FEE2E2",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              activeTab === "rent"
                                ? "arrow-forward"
                                : "arrow-back"
                            }
                            size={24}
                            color={activeTab === "rent" ? "#2563EB" : "#DC2626"}
                          />
                        </View>
                        <View style={styles.requestInfo}>
                          <Text
                            style={[
                              styles.userName,
                              { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                            ]}
                          >
                            {request.userName || "Unknown User"}
                          </Text>
                          <Text
                            style={[
                              styles.userId,
                              { color: isDarkMode ? "#64748B" : "#94A3B8" },
                            ]}
                          >
                            ID: {request.userId.slice(0, 12)}...
                          </Text>
                          <View style={styles.timeInfo}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={isDarkMode ? "#64748B" : "#94A3B8"}
                            />
                            <Text
                              style={[
                                styles.timeText,
                                { color: isDarkMode ? "#64748B" : "#94A3B8" },
                              ]}
                            >
                              {getTimeAgo(request.timestamp)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.requestHeaderRight}>
                        <View
                          style={[
                            styles.itemsBadge,
                            {
                              backgroundColor: isDarkMode
                                ? "#0F172A"
                                : "#F8FAFC",
                            },
                          ]}
                        >
                          <Ionicons
                            name="cube-outline"
                            size={14}
                            color="#228f16ff"
                          />
                          <Text
                            style={[
                              styles.itemsCount,
                              { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                            ]}
                          >
                            {totalItems} items
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color={isDarkMode ? "#64748B" : "#94A3B8"}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Items List */}
                    {isExpanded &&
                      request.items &&
                      request.items.length > 0 && (
                        <View
                          style={[
                            styles.itemsContainer,
                            {
                              backgroundColor: isDarkMode
                                ? "#0F172A"
                                : "#F8FAFC",
                              borderTopColor: isDarkMode
                                ? "#334155"
                                : "#E2E8F0",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemsTitle,
                              { color: isDarkMode ? "#94A3B8" : "#64748B" },
                            ]}
                          >
                            {activeTab === "rent"
                              ? "Requested Items"
                              : "Items to Return"}
                          </Text>
                          {request.items.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                              <View style={styles.itemLeft}>
                                <View
                                  style={[
                                    styles.itemIcon,
                                    {
                                      backgroundColor: isDarkMode
                                        ? "#1E293B"
                                        : "#FFFFFF",
                                    },
                                  ]}
                                >
                                  <Ionicons
                                    name="cube"
                                    size={16}
                                    color="#228f16ff"
                                  />
                                </View>
                                <Text
                                  style={[
                                    styles.itemName,
                                    {
                                      color: isDarkMode ? "#F1F5F9" : "#1E293B",
                                    },
                                  ]}
                                >
                                  {item.name}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.quantityBadge,
                                  { backgroundColor: "#FEF3C7" },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.quantityText,
                                    { color: "#B45309" },
                                  ]}
                                >
                                  ×{item.quantity}
                                </Text>
                              </View>
                            </View>
                          ))}

                          {/* Request Date */}
                          <View
                            style={[
                              styles.dateContainer,
                              {
                                borderTopColor: isDarkMode
                                  ? "#334155"
                                  : "#E2E8F0",
                              },
                            ]}
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color={isDarkMode ? "#64748B" : "#94A3B8"}
                            />
                            <Text
                              style={[
                                styles.dateText,
                                { color: isDarkMode ? "#64748B" : "#94A3B8" },
                              ]}
                            >
                              Requested on {formatDate(request.timestamp)}
                            </Text>
                          </View>
                        </View>
                      )}

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.rejectButton,
                          isProcessing && styles.disabledButton,
                        ]}
                        onPress={() => rejectRequest(request, activeTab)}
                        disabled={isProcessing}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#DC2626"
                        />
                        <Text style={[styles.rejectButtonText]}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.approveButton,
                          isProcessing && styles.disabledButton,
                        ]}
                        onPress={() =>
                          activeTab === "rent"
                            ? approveRentRequest(request)
                            : approveReturnRequest(request)
                        }
                        disabled={isProcessing}
                        activeOpacity={0.7}
                      >
                        {isProcessing ? (
                          <>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.approveButtonText}>
                              Processing...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#FFFFFF"
                            />
                            <Text style={styles.approveButtonText}>
                              Approve
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              })}
            </View>

            {/* Empty State */}
            {currentRequests.length === 0 && (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: isDarkMode ? "#1E293B" : "#F1F5F9" },
                  ]}
                >
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={64}
                    color={isDarkMode ? "#64748B" : "#94A3B8"}
                  />
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                  ]}
                >
                  All Caught Up!
                </Text>
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDarkMode ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  No pending {activeTab} requests at the moment
                </Text>
                <TouchableOpacity
                  style={styles.refreshEmptyButton}
                  onPress={onRefresh}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={20}
                    color="#228f16ff"
                  />
                  <Text style={styles.refreshEmptyText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  badge: {
    backgroundColor: "#228f16ff",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statsIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statsInfo: {
    gap: 4,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  refreshButton: {
    padding: 8,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  requestHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  requestInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userId: {
    fontSize: 12,
    fontWeight: "400",
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  requestHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemsCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemsContainer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  quantityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  rejectButton: {
    backgroundColor: "#FEE2E2",
  },
  rejectButtonText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
  approveButton: {
    backgroundColor: "#228f16ff",
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
  },
  refreshEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
  },
  refreshEmptyText: {
    color: "#228f16ff",
    fontSize: 15,
    fontWeight: "600",
  },
});
