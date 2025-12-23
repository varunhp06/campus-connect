import { ServiceLayout } from "@/components/ServiceLayout";
import { ThemedLayout } from "@/components/ThemedLayout";
import { useToast } from "@/components/ToastContext";
import { auth, db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    collection,
    doc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import React, { JSX, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    LayoutAnimation,
    Linking,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";

// Enable LayoutAnimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Types ---
type OrderStatus =
  | "pending"
  | "preparing"
  | "delivering" // Added Delivering
  | "delivered"
  | "cancelled"
  | "rejected"
  | "completed";

type TabKey = "pending" | "preparing" | "delivering" | "history"; // Added delivering to tabs

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: OrderStatus;
  timestamp: Timestamp;
  deliveredAt?: Timestamp;
  total: number;
  items: OrderItem[];
  shopId?: string;
  userId?: string;
  userName?: string;
  PhoneNo?: string;
  Hostel?: string;
}

interface TabConfig {
  key: TabKey;
  label: string;
  count?: number;
}

interface StatusCounts {
  pending: number;
  preparing: number;
  delivering: number;
}

// --- Component ---
const OrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [tabBarWidth, setTabBarWidth] = useState<number>(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // --- Reject Modal State ---
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const { showToast } = useToast();
  const router = useRouter();

  // Get authenticated user and verify vendor status
  const currentUser = auth.currentUser;
  const [userId, setUserId] = useState<string>("");
  const [isVendor, setIsVendor] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check vendor authentication on mount
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!currentUser) {
        showToast("Please log in to access vendor dashboard", "error");
        router.push("/LoginScreen");
        return;
      }

      try {
        // Get custom claims to check vendor status
        const idTokenResult = await currentUser.getIdTokenResult();
        const isVendorUser = idTokenResult.claims.vendor === true;
        
        if (!isVendorUser) {
          showToast("Access denied: Vendor privileges required", "error");
          router.back();
          return;
        }

        setIsVendor(true);
        setUserId(currentUser.uid);
      } catch (error) {
        console.error("Error checking vendor status:", error);
        showToast("Authentication error", "error");
        router.push("/LoginScreen");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkVendorStatus();
  }, [currentUser]);

  // --- Helpers ---
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: OrderStatus | undefined): string => {
    switch (status?.toLowerCase()) {
      case "delivered": return "#10B981"; // Green
      case "delivering": return "#8B5CF6"; // Purple
      case "preparing": return "#3B82F6"; // Blue
      case "pending": return "#F59E0B"; // Orange
      case "rejected": return "#EF4444"; // Red
      default: return "#6B7280";
    }
  };

  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      showToast("No phone number available for this order", "error");
    }
  };

  // --- Filtering Logic ---
  const filteredOrders = useMemo((): Order[] => {
    return orders.filter((order) => {
      const s = order.status?.toLowerCase();
      if (activeTab === "pending") return s === "pending";
      if (activeTab === "preparing") return s === "preparing";
      if (activeTab === "delivering") return s === "delivering";
      if (activeTab === "history")
        return ["delivered", "cancelled", "rejected", "completed"].includes(s);
      return false;
    });
  }, [orders, activeTab]);

  const counts = useMemo((): StatusCounts => {
    return {
      pending: orders.filter((o) => o.status === "pending").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      delivering: orders.filter((o) => o.status === "delivering").length,
    };
  }, [orders]);

  // --- Kitchen Summary Logic (Unique Items) ---
  const kitchenSummary = useMemo(() => {
    // We aggregate items from Pending and Preparing orders only
    const activeOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "preparing"
    );

    const summary: Record<string, number> = {};

    activeOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (summary[item.name]) {
          summary[item.name] += item.quantity;
        } else {
          summary[item.name] = item.quantity;
        }
      });
    });

    return Object.entries(summary).map(([name, count]) => ({ name, count }));
  }, [orders]);

  // --- Data Fetching ---
  const fetchOrders = async (): Promise<void> => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("shopId", "==", userId));
      const snapshot = await getDocs(q);
      const allOrders: Order[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Order, "id">),
      }));
      setOrders(
        allOrders.sort(
          (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()
        )
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) fetchOrders();
  }, [userId]);

  // --- ACTION HANDLERS ---
  const updateStatus = async (
    orderId: string,
    newStatus: OrderStatus
  ): Promise<void> => {
    try {
      setLoading(true);
      const updateData: any = { status: newStatus };
      if (newStatus === "delivered") {
        updateData.deliveredAt = Timestamp.now();
      }
      await updateDoc(doc(db, "orders", orderId), updateData);
      await fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      setLoading(false);
    }
  };

  const onRejectPress = (order: Order) => {
    setOrderToReject(order);
    setRejectModalVisible(true);
  };

  const confirmReject = async (markOutOfStock: boolean) => {
    if (!orderToReject) return;
    try {
      setRejectLoading(true);
      const batch = writeBatch(db);
      const orderRef = doc(db, "orders", orderToReject.id);
      batch.update(orderRef, { status: "rejected" });
      if (markOutOfStock) {
        orderToReject.items.forEach((item) => {
          if (item.id) {
            const productRef = doc(db, "shops", userId, "menu", item.id);
            batch.update(productRef, { inStock: false });
          }
        });
      }
      await batch.commit();
      setRejectModalVisible(false);
      setOrderToReject(null);
      await fetchOrders();
    } catch (error) {
      console.error("Error rejecting order:", error);
      showToast("Could not reject order", "error");
    } finally {
      setRejectLoading(false);
    }
  };

  const toggleExpand = (id: string): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(id === expandedId ? null : id);
  };

  const handleTabPress = (index: number, tabKey: TabKey) => {
    setActiveTab(tabKey);
    setExpandedId(null);
    const singleTabWidth = tabBarWidth / 4; // Divided by 4 tabs now
    Animated.spring(translateX, {
      toValue: index * singleTabWidth,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  // --- Render Components ---

  // 1. Kitchen Summary Section
  const renderKitchenSummary = () => {
    // Only show active cooking summary in Pending/Preparing tabs
    if (
      (activeTab !== "pending" && activeTab !== "preparing") ||
      kitchenSummary.length === 0
    ) {
      return null;
    }

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Ionicons name="restaurant" size={18} color="#FFF" />
          <Text style={styles.summaryTitle}>Kitchen Summary (Total To Make)</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryScroll}
        >
          {kitchenSummary.map((item, idx) => (
            <View key={idx} style={styles.summaryChip}>
              <Text style={styles.summaryCount}>{item.count}x</Text>
              <Text style={styles.summaryName}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTabs = (): JSX.Element => {
    const tabs: TabConfig[] = [
      { key: "pending", label: "New", count: counts.pending },
      { key: "preparing", label: "Prep", count: counts.preparing },
      { key: "delivering", label: "Route", count: counts.delivering },
      { key: "history", label: "Done" },
    ];

    return (
      <View style={styles.tabWrapper}>
        <View
          style={styles.tabContainer}
          onLayout={(e) => setTabBarWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              styles.slidingIndicator,
              { width: tabBarWidth / 4, transform: [{ translateX }] },
            ]}
          />
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => handleTabPress(index, tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.tabText, isActive && styles.activeTabText]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                {tab.count !== undefined && tab.count > 0 && (
                  <View style={[styles.badge, isActive && styles.activeBadge]}>
                    <Text
                      style={[
                        styles.badgeText,
                        isActive && styles.activeBadgeText,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }): JSX.Element => {
    const isExpanded = expandedId === item.id;
    const statusColor = getStatusColor(item.status);
    const previewItems: OrderItem[] = item.items?.slice(0, 2) || [];
    const remainingCount: number = (item.items?.length || 0) - previewItems.length;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => toggleExpand(item.id)}
        style={[
          styles.card,
          { borderLeftColor: statusColor, borderLeftWidth: 4 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>
              #{item.id.slice(-5).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>{formatDate(item.timestamp)}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.totalPrice}>{formatCurrency(item.total)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {!isExpanded ? (
          <View style={styles.previewContainer}>
            <View style={{ flex: 1 }}>
              {previewItems.map((it, idx) => (
                <Text key={idx} style={styles.previewText} numberOfLines={1}>
                  <Text style={{ fontWeight: "600" }}>{it.quantity}x </Text>
                  {it.name}
                </Text>
              ))}
              {remainingCount > 0 && (
                <Text style={styles.moreText}>
                  + {remainingCount} more items
                </Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </View>
        ) : (
          <View style={styles.detailsContainer}>
            {/* Delivered Banner */}
            {item.status === "delivered" && item.deliveredAt && (
              <View style={styles.deliveredBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#065F46" />
                <Text style={styles.deliveredText}>
                  Delivered at {formatDate(item.deliveredAt)} •{" "}
                  {formatTime(item.deliveredAt)}
                </Text>
              </View>
            )}

            {/* Customer Details */}
            <View style={styles.customerBox}>
              <View style={styles.customerHeader}>
                <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.customerTitle}>Customer Details</Text>
              </View>
              <View style={styles.customerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>
                    {item.userName || "Guest User"}
                  </Text>
                  <View style={styles.hostelTag}>
                    <Ionicons name="business" size={12} color="#6B7280" />
                    <Text style={styles.hostelText}>
                      {item.Hostel || "No Hostel Info"}
                    </Text>
                  </View>
                </View>
                {item.PhoneNo && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCall(item.PhoneNo)}
                  >
                    <Ionicons name="call" size={18} color="#FFF" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Items</Text>
            {item.items?.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.quantityBox}>{it.quantity}x</Text>
                  <Text style={styles.itemName}>{it.name}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{it.price * it.quantity}</Text>
              </View>
            ))}

            {/* --- ACTION BUTTONS --- */}

            {/* 1. Pending: Reject OR Prepare */}
            {isVendor && item.status === "pending" && (
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => onRejectPress(item)}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => updateStatus(item.id, "preparing")}
                >
                  <Text style={styles.acceptText}>Accept & Prepare</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 2. Preparing: Reject OR Send to Delivering */}
            {isVendor && item.status === "preparing" && (
              <View style={{ gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.routeBtn]}
                  onPress={() => updateStatus(item.id, "delivering")}
                >
                  <Ionicons name="bicycle" size={20} color="#FFF" />
                  <Text style={styles.acceptText}>Mark Out for Delivery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: "#FFF",
                      borderWidth: 1,
                      borderColor: "#EF4444",
                    },
                  ]}
                  onPress={() => onRejectPress(item)}
                >
                  <Text style={[styles.rejectText, { fontSize: 13 }]}>
                    Reject Order
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 3. Delivering: Mark Delivered (No Reject) */}
            {isVendor && item.status === "delivering" && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.completeBtn]}
                onPress={() => updateStatus(item.id, "delivered")}
              >
                <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
                <Text style={styles.acceptText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedLayout>
        <ServiceLayout icon="pizza" title="Orders">
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        </ServiceLayout>
      </ThemedLayout>
    );
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <ThemedLayout>
        <ServiceLayout icon="pizza" title="Orders">
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={{ marginTop: 16, color: "#64748B" }}>
              Verifying vendor access...
            </Text>
          </View>
        </ServiceLayout>
      </ThemedLayout>
    );
  }

  // Don't render if not a vendor (should have been redirected already)
  if (!isVendor) {
    return null;
  }

  return (
    <ThemedLayout>
      <ServiceLayout icon="pizza" title="Kitchen Orders">
        
        {/* Render Kitchen Summary (Unique Items) */}
        {renderKitchenSummary()}

        {renderTabs()}

        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No {activeTab} orders</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchOrders();
              }}
              colors={["#FF6B35"]}
            />
          }
        />

        {/* --- REJECT MODAL --- */}
        <Modal
          visible={rejectModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRejectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="warning" size={28} color="#EF4444" />
                <Text style={styles.modalTitle}>Reject Order?</Text>
              </View>

              <Text style={styles.modalMessage}>
                You are about to reject Order #
                {orderToReject?.id.slice(-5).toUpperCase()}.
              </Text>

              <Text style={styles.modalSubMessage}>
                Are the items in this order currently Out of Stock?
              </Text>

              {rejectLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#EF4444"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSecondary]}
                    onPress={() => confirmReject(true)}
                  >
                    <Text style={styles.modalBtnTextSecondary}>
                      Yes, Mark Out of Stock
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                    onPress={() => confirmReject(false)}
                  >
                    <Text style={styles.modalBtnTextPrimary}>
                      No, Just Reject
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ marginTop: 10 }}
                    onPress={() => setRejectModalVisible(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ServiceLayout>
    </ThemedLayout>
  );
};

const styles = StyleSheet.create({
  listContainer: { padding: 16, paddingBottom: 100 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  
  // --- Kitchen Summary Styles ---
  summaryContainer: {
    backgroundColor: '#374151',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 6
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  summaryScroll: {
    paddingHorizontal: 12,
    gap: 8
  },
  summaryChip: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6
  },
  summaryCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B35'
  },
  summaryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937'
  },

  // Tabs
  tabWrapper: { paddingHorizontal: 16, marginBottom: 8 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    height: 50,
    position: "relative",
    overflow: "hidden",
  },
  slidingIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#FF6B35" },
  badge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 4,
  },
  activeBadge: { backgroundColor: "#FF6B35" },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#6B7280" },
  activeBadgeText: { color: "#FFF" },
  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: { fontSize: 16, fontWeight: "700", color: "#111827" },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  totalPrice: { fontSize: 16, fontWeight: "800", color: "#111827" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },
  deliveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  deliveredText: {
    color: "#065F46",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Customer
  customerBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  customerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  customerTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerName: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  hostelTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  hostelText: { fontSize: 13, color: "#6B7280" },
  callButton: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    gap: 6,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  callButtonText: { color: "#FFF", fontWeight: "600", fontSize: 13 },
  // Details
  previewContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewText: { fontSize: 14, color: "#4B5563", marginBottom: 2 },
  moreText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    fontStyle: "italic",
  },
  detailsContainer: {},
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  quantityBox: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  itemName: { fontSize: 14, color: "#374151", fontWeight: "500" },
  itemPrice: { fontSize: 14, fontWeight: "600", color: "#111827" },
  // Actions
  actionContainer: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: { backgroundColor: "#10B981" },
  routeBtn: { backgroundColor: "#8B5CF6" }, // Purple for delivering
  rejectBtn: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  completeBtn: { backgroundColor: "#10B981", marginTop: 16 },
  acceptText: { color: "#FFF", fontWeight: "700" },
  rejectText: { color: "#EF4444", fontWeight: "700" },
  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },

  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  modalMessage: {
    fontSize: 15,
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  modalSubMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalActions: { width: "100%", gap: 12 },
  modalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnPrimary: { backgroundColor: "#F3F4F6" },
  modalBtnTextPrimary: { color: "#374151", fontWeight: "700", fontSize: 15 },
  modalBtnSecondary: { backgroundColor: "#EF4444" },
  modalBtnTextSecondary: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  cancelText: {
    color: "#9CA3AF",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
    marginTop: 4,
  },
});

export default OrdersScreen;