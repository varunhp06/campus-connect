import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "../../../../../../firebaseConfig"; // Adjust import path as needed
import { useTheme } from "@/components/ThemeContext"; // Adjust import path as needed
import { ThemedLayout } from "@/components/ThemedLayout"; // Adjust import path as needed
import { ServiceLayout } from "@/components/ServiceLayout";

// Types
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  img?: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: string;
  timestamp: any;
  shopId?: string;
}

const { width } = Dimensions.get("window");

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode, theme } = useTheme();
  const router = useRouter();

  // Use actual auth ID or fallback for testing
  const userId = "user_123";

  const fetchHistory = async () => {
    try {
      const ordersRef = collection(db, "orders");
      // Fetch orders for user. Note: Ideally add index for compound query in Firestore
      // For now, we fetch by user and filter/sort in client to ensure it works without index errors
      const q = query(ordersRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const allOrders: Order[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Order)
      );
      console.log("fsdf", allOrders);

      // Filter for Past Orders only and Sort Newest First
      const pastOrders = allOrders
        .filter((order) =>
          [
            "completed",
            "delivered",
            "cancelled",
            "rejected",
            "pending",
            "preparing",
          ].includes(order.status.toLowerCase())
        )
        .sort((a, b) => {
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });

      setOrders(pastOrders);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  useEffect(() => {
    console.log("Orders", orders);
  }, [orders]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
      case "completed":
        return {
          bg: "rgba(16, 185, 129, 0.15)",
          text: "#10B981",
          icon: "checkmark-circle",
        };
      case "cancelled":
      case "rejected":
        return {
          bg: "rgba(239, 68, 68, 0.15)",
          text: "#EF4444",
          icon: "close-circle",
        };
      default:
        return {
          bg: "rgba(100, 116, 139, 0.15)",
          text: "#64748B",
          icon: "help-circle",
        };
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusColor(item.status);
    const itemCount = item.items.reduce((acc, curr) => acc + curr.quantity, 0);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
            borderColor: isDarkMode
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        {/* Header: Date & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isDarkMode ? "#94A3B8" : "#64748B"}
            />
            <Text
              style={[
                styles.dateText,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              {formatDate(item.timestamp)}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Ionicons
              name={statusStyle.icon as any}
              size={12}
              color={statusStyle.text}
            />
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.dividerContainer}>
          <View
            style={[
              styles.dashedLine,
              { borderColor: isDarkMode ? "#334155" : "#E2E8F0" },
            ]}
          />
        </View>

        {/* Content: Items Summary */}
        <View style={styles.cardBody}>
          <View style={styles.itemsList}>
            {item.items.slice(0, 2).map((orderItem, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View
                  style={[
                    styles.quantityBox,
                    { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" },
                  ]}
                >
                  <Text
                    style={[
                      styles.quantityText,
                      { color: isDarkMode ? "#F8FAFC" : "#334155" },
                    ]}
                  >
                    {orderItem.quantity}x
                  </Text>
                </View>
                <Text
                  style={[
                    styles.itemName,
                    { color: isDarkMode ? "#E2E8F0" : "#1E293B" },
                  ]}
                  numberOfLines={1}
                >
                  {orderItem.name}
                </Text>
              </View>
            ))}
            {item.items.length > 2 && (
              <Text
                style={[
                  styles.moreItemsText,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                +{item.items.length - 2} more items...
              </Text>
            )}
          </View>
        </View>

        {/* Footer: Totals & Reorder (Visual) */}
        <View
          style={[
            styles.cardFooter,
            { borderTopColor: isDarkMode ? "#334155" : "#F1F5F9" },
          ]}
        >
          <View>
            <Text
              style={[
                styles.totalLabel,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Total Amount
            </Text>
            <Text
              style={[
                styles.totalAmount,
                { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              ₹{item.total.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.detailsButton,
              {
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.05)"
                  : "#F8FAFC",
              },
            ]}
          >
            <Text
              style={[
                styles.detailsText,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Details
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={isDarkMode ? "#94A3B8" : "#64748B"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: isDarkMode ? "rgba(30,41,59,0.5)" : "#F1F5F9" },
        ]}
      >
        <Ionicons
          name="time-outline"
          size={64}
          color={isDarkMode ? "#475569" : "#CBD5E1"}
        />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
        ]}
      >
        No Past Orders
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: isDarkMode ? "#94A3B8" : "#64748B" },
        ]}
      >
        You haven't completed any orders yet. Check back here after you've
        enjoyed your meal!
      </Text>
    </View>
  );

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <ServiceLayout icon="timer" title={"Order History"} showTitle={true}>
        <View style={[styles.container, { backgroundColor: "transparent" }]}>
          {/* Header Summary */}
          <View
            style={[
              styles.pageHeader,
              { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                ]}
              >
                Past Orders
              </Text>
              <Text
                style={[
                  styles.headerSubtitle,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                {orders.length} orders in total
              </Text>
            </View>
            <View
              style={[
                styles.headerIcon,
                { backgroundColor: isDarkMode ? "#334155" : "#EFF6FF" },
              ]}
            >
              <Ionicons name="receipt" size={20} color="#3B82F6" />
            </View>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={EmptyState}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={isDarkMode ? "#F1F5F9" : "#0F172A"}
                />
              }
            />
          )}
        </View>
      </ServiceLayout>
    </ThemedLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    position: "relative",
    height: 1,
    width: "100%",
    overflow: "hidden",
  },
  dashedLine: {
    borderWidth: 1,
    borderStyle: "dashed",
    width: "100%",
    height: 1,
  },
  cardBody: {
    padding: 16,
    paddingBottom: 12,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quantityBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 28,
    alignItems: "center",
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default OrderHistory;
