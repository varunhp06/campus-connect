import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { ThemedLayout } from "@/components/ThemedLayout";
import { ServiceLayout } from "@/components/ServiceLayout";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useTheme } from "@/components/ThemeContext";

// --- Types ---
type TimeFilter = "today" | "week" | "month";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  cancelledOrders: number;
  topItems: { name: string; count: number; revenue: number }[];
  chartData: { labels: string[]; data: number[] };
}

type OrderStatus =
  | "pending"
  | "preparing"
  | "delivered"
  | "cancelled"
  | "rejected"
  | "completed";

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

interface OrderItem {
  id?: string; // Product ID is needed to update stock
  name: string;
  quantity: number;
  price: number;
}

const screenWidth = Dimensions.get("window").width;

const AnalyticsScreen = () => {
  const { theme } = useTheme();
  const userId = "uMs7DQkbWE4jLLnUHxYQ"; // Replace with dynamic ID

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>("week");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    cancelledOrders: 0,
    topItems: [],
    chartData: { labels: [], data: [0] },
  });

  // --- Helper: Get Start Date based on filter ---
  const getStartDate = (filterType: TimeFilter) => {
    const now = new Date();
    switch (filterType) {
      case "today":
        return new Date(now.setHours(0, 0, 0, 0));
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case "month":
        const monthAgo = new Date(now);
        monthAgo.setDate(now.getDate() - 30);
        return monthAgo;
    }
  };

  const calculateAnalytics = (orders: any[]) => {
    let revenue = 0,
      orderCount = 0,
      cancelledCount = 0;
    const itemFrequency: Record<string, any> = {};
    const chartMap: Record<string, number> = {};

    orders.forEach((order) => {
      if (["cancelled", "rejected"].includes(order.status)) {
        cancelledCount++;
        return;
      }

      revenue += order.total;
      orderCount++;

      order.items?.forEach((item: any) => {
        if (!itemFrequency[item.name])
          itemFrequency[item.name] = { count: 0, revenue: 0 };

        itemFrequency[item.name].count += item.quantity;
        itemFrequency[item.name].revenue += item.price * item.quantity;
      });

      const label = order.timestamp
        .toDate()
        .toLocaleDateString("en-US", { weekday: "short" });
      chartMap[label] = (chartMap[label] || 0) + order.total;
    });

    setStats({
      totalRevenue: revenue,
      totalOrders: orderCount,
      averageOrderValue: orderCount ? Math.round(revenue / orderCount) : 0,
      cancelledOrders: cancelledCount,
      topItems: Object.keys(itemFrequency)
        .map((name) => ({
          name,
          ...itemFrequency[name],
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      chartData: {
        labels: Object.keys(chartMap),
        data: Object.values(chartMap),
      },
    });
  };

  const applyFilter = (ordersList: any[], filterType: TimeFilter) => {
    const startDate = getStartDate(filterType);

    const filtered = ordersList.filter(
      (order) => order.timestamp?.toDate() >= startDate
    );

    calculateAnalytics(filtered);
  };

  // --- Fetch Logic ---
  // --- Fetch Logic ---
  const fetchAllOrders = async () => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("shopId", "==", userId));
      const snapshot = await getDocs(q);

      // FIX: Add 'as Order[]' at the end to tell TS this data matches your interface
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      setAllOrders(list);
      applyFilter(list, filter);
    } catch (error) {
      console.log("Error fetching", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders(); // Only fetch once on mount
  }, []);

  useEffect(() => {
    applyFilter(allOrders, filter);
  }, [filter, allOrders]);

  const onRefresh = () => {
    fetchAllOrders();
  };

  // --- Render Helpers ---
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <ThemedLayout>
      <ServiceLayout icon="stats-chart" title="Analytics">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF6B35"]}
            />
          }
        >
          {/* --- Filter Chips --- */}
          <View
            style={[
              styles.filterContainer,
              { backgroundColor: theme.background },
            ]}
          >
            {(["today", "week", "month"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      filter === f ? theme.text : theme.inputBorder,
                  },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        filter === f ? theme.background : theme.primaryText,
                    },
                  ]}
                >
                  {f === "today"
                    ? "Today"
                    : f === "week"
                    ? "Last 7 Days"
                    : "Last 30 Days"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={{ height: 300, justifyContent: "center" }}>
              <ActivityIndicator size="large" color="#FF6B35" />
            </View>
          ) : (
            <>
              {/* --- Summary Grid --- */}
              <View style={styles.gridContainer}>
                <StatCard
                  label="Total Revenue"
                  value={formatCurrency(stats.totalRevenue)}
                  icon="cash"
                  color="#10B981"
                  theme={theme}
                />
                <StatCard
                  label="Total Orders"
                  value={stats.totalOrders.toString()}
                  icon="cart"
                  color="#3B82F6"
                  theme={theme}
                />
                <StatCard
                  label="Avg. Order Value"
                  value={formatCurrency(stats.averageOrderValue)}
                  icon="analytics"
                  color="#8B5CF6"
                  theme={theme}
                />
                <StatCard
                  label="Cancelled"
                  value={stats.cancelledOrders.toString()}
                  icon="close-circle"
                  color="#EF4444"
                  theme={theme}
                />
              </View>

              {/* --- Chart Section --- */}
              <View
                style={[
                  styles.sectionContainer,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Revenue Trend
                </Text>
                {stats.chartData.data.length > 0 && stats.totalRevenue > 0 ? (
                  <LineChart
                    data={{
                      labels: stats.chartData.labels,
                      datasets: [{ data: stats.chartData.data }],
                    }}
                    width={screenWidth - 64} // Adjust for padding
                    height={220}
                    yAxisLabel="₹"
                    yAxisInterval={1}
                    chartConfig={{
                      backgroundColor: theme.inputBackground,
                      backgroundGradientFrom: theme.inputBackground,
                      backgroundGradientTo: theme.inputBackground,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`, // Orange Theme
                      labelColor: (opacity = 1) => theme.primaryText,
                      style: { borderRadius: 16 },
                      propsForDots: {
                        r: "5",
                        strokeWidth: "2",
                        stroke: "#ffa726",
                      },
                    }}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                  />
                ) : (
                  <View style={styles.noDataChart}>
                    <Text style={{ color: theme.placeholder }}>
                      Not enough data to graph
                    </Text>
                  </View>
                )}
              </View>

              {/* --- Top Items List --- */}
              <View
                style={[
                  styles.sectionContainer,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Top Selling Items
                </Text>

                {stats.topItems.length === 0 ? (
                  <Text style={{ color: theme.placeholder, padding: 10 }}>
                    No sales yet.
                  </Text>
                ) : (
                  stats.topItems.map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.topItemRow,
                        { borderBottomColor: theme.inputBorder },
                      ]}
                    >
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, { color: theme.text }]}>
                          {item.name}
                        </Text>
                        <Text
                          style={[styles.itemSub, { color: theme.primaryText }]}
                        >
                          {item.count} sold
                        </Text>
                      </View>
                      <Text style={[styles.itemRevenue, { color: theme.text }]}>
                        {formatCurrency(item.revenue)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </ServiceLayout>
    </ThemedLayout>
  );
};

// --- Reusable Stat Card Component ---
const StatCard = ({ label, value, icon, color, theme }: any) => (
  <View
    style={[
      styles.statCard,
      {
        backgroundColor: theme.inputBackground,
        borderColor: theme.inputBorder,
      },
    ]}
  >
    <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.primaryText }]}>
        {label}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // Grid
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 44) / 2, // 2 cols
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  // Sections
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  noDataChart: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  // Top Items
  topItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rankBadge: {
    backgroundColor: "#F3F4F6",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  itemRevenue: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default AnalyticsScreen;
