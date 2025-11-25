import { CanteenCartItem, useCanteen } from "@/components/CanteenContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../../../../../firebaseConfig";

type Order = {
  id: string;
  userId: string;
  shopId: string;
  items: CanteenCartItem[];
  total: number;
  timestamp: any;
  status: string;
};

const icon = "cart";
const title = "My Cart";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"cart" | "orders">("cart");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const { theme, isDarkMode } = useTheme();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getCartItems,
  } = useCanteen();

  const userId = "user_123"; // Replace with actual user ID from context

  // Load pending orders
  useEffect(() => {
    if (activeTab === "orders") {
      loadPendingOrders();
    }
  }, [activeTab]);

  // Real-time listener for orders
  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", userId),
      where("status", "in", ["pending", "preparing", "Not Available"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList: Order[] = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Order)
        )
        .sort((a, b) => {
          // Sort by timestamp manually (newest first)
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });
      setOrders(ordersList);
    });

    return () => unsubscribe();
  }, [userId]);

  const loadPendingOrders = async () => {
    try {
      setLoadingOrders(true);
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", userId),
        where("status", "in", ["pending", "preparing"])
      );

      const snapshot = await getDocs(q);
      const ordersList: Order[] = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Order)
        )
        .sort((a, b) => {
          // Sort by timestamp manually (newest first)
          const timeA = a.timestamp?.toMillis?.() || 0;
          const timeB = b.timestamp?.toMillis?.() || 0;
          return timeB - timeA;
        });

      setOrders(ordersList);
    } catch (error) {
      console.log("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleIncrement = (itemId: string) => {
    const currentQuantity = cart[itemId]?.quantity || 0;
    updateQuantity(itemId, currentQuantity + 1);
  };

  const handleDecrement = (itemId: string) => {
    const currentQuantity = cart[itemId]?.quantity || 0;
    if (currentQuantity > 1) {
      updateQuantity(itemId, currentQuantity - 1);
    } else {
      removeFromCart(itemId);
    }
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    Alert.alert("Remove Item", `Remove ${itemName} from cart?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFromCart(itemId),
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert("Clear Cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: () => clearCart(),
      },
    ]);
  };

  const placeOrder = async () => {
    if (getTotalItems() === 0) return;

    const cartItems = getCartItems();
    const shopId = cartItems[0]?.shopId || "";

    Alert.alert(
      "Place Order",
      `Total: ₹${getTotalPrice().toFixed(2)}\n\nConfirm your order?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setOrdering(true);

              await addDoc(collection(db, "orders"), {
                userId,
                shopId,
                items: cartItems,
                total: getTotalPrice(),
                timestamp: serverTimestamp(),
                status: "pending",
              });

              Alert.alert(
                "Success",
                "Your order has been placed! Waiting for shop approval.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      clearCart();
                      setActiveTab("orders");
                    },
                  },
                ]
              );
            } catch (error) {
              console.log("Error placing order:", error);
              Alert.alert("Error", "Failed to place order. Please try again.");
            } finally {
              setOrdering(false);
            }
          },
        },
      ]
    );
  };

  const renderCartItem = (item: CanteenCartItem) => {
    return (
      <View
        key={item.id}
        style={[
          styles.cartItem,
          {
            backgroundColor: isDarkMode
              ? "rgba(30, 41, 59, 0.8)"
              : "rgba(255, 255, 255, 0.9)",
            borderColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ]}
      >
        {/* Item Image with Overlay */}
        <View style={styles.imageContainer}>
          <Image
            source={
              item.img
                ? { uri: item.img }
                : require("../../../../../../assets/images/placeholder.png")
            }
            style={styles.itemImage}
            resizeMode="cover"
          />
          <View style={styles.quantityOverlay}>
            <Text style={styles.quantityOverlayText}>{item.quantity}x</Text>
          </View>
        </View>

        {/* Item Details */}
        <View style={styles.itemDetails}>
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.itemName,
                { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
              ]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text
              style={[
                styles.itemPrice,
                { color: isDarkMode ? "#00b3ffff" : "#006efdff" },
              ]}
            >
              ₹{item.price.toFixed(2)}
            </Text>
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[
                styles.quantityBtn,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(51, 65, 85, 0.6)"
                    : "rgba(241, 245, 249, 0.8)",
                  borderColor: isDarkMode
                    ? "rgba(100, 116, 139, 0.3)"
                    : "rgba(203, 213, 225, 0.5)",
                },
              ]}
              onPress={() => handleDecrement(item.id)}
            >
              <Ionicons
                name={item.quantity === 1 ? "trash-outline" : "remove"}
                size={16}
                color={
                  item.quantity === 1
                    ? "#EF4444"
                    : isDarkMode
                    ? "#94A3B8"
                    : "#64748B"
                }
              />
            </TouchableOpacity>

            <View
              style={[
                styles.quantityDisplay,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(60, 83, 136, 0.4)"
                    : "rgba(248, 250, 252, 0.8)",
                },
              ]}
            >
              <Text
                style={[
                  styles.quantityText,
                  { color: isDarkMode ? "#0095ffff" : "#006effff" },
                ]}
              >
                {item.quantity}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.quantityBtn,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(51, 65, 85, 0.6)"
                    : "rgba(241, 245, 249, 0.8)",
                  borderColor: isDarkMode
                    ? "rgba(100, 116, 139, 0.3)"
                    : "rgba(203, 213, 225, 0.5)",
                },
              ]}
              onPress={() => handleIncrement(item.id)}
            >
              <Ionicons
                name="add"
                size={16}
                color={isDarkMode ? "#94A3B8" : "#64748B"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Item Total & Delete */}
        <View style={styles.itemActions}>
          <View style={styles.totalContainer}>
            <Text
              style={[
                styles.totalLabel,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Total
            </Text>
            <Text
              style={[
                styles.itemTotal,
                { color: isDarkMode ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              {
                backgroundColor: isDarkMode
                  ? "rgba(239, 68, 68, 0.15)"
                  : "rgba(239, 68, 68, 0.08)",
                borderColor: isDarkMode
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(239, 68, 68, 0.2)",
              },
            ]}
            onPress={() => handleRemoveItem(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOrderItem = (order: Order) => {
    const formatDate = (timestamp: any) => {
      if (!timestamp) return "Just now";
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "#F59E0B";
        case "preparing":
          return "#10B981";
        default:
          return "#b73f3fff";
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "pending":
          return "time-outline";
        case "preparing":
          return "restaurant-outline";
        default:
          return "checkmark-circle-outline";
      }
    };

    return (
      <View
        key={order.id}
        style={[
          styles.orderCard,
          { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" },
        ]}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text
              style={[
                styles.orderId,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Order #{order.id.slice(-6).toUpperCase()}
            </Text>
            <Text
              style={[
                styles.orderDate,
                { color: isDarkMode ? "#64748B" : "#94A3B8" },
              ]}
            >
              {formatDate(order.timestamp)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(order.status)}20` },
            ]}
          >
            <Ionicons
              name={getStatusIcon(order.status)}
              size={16}
              color={getStatusColor(order.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(order.status) },
              ]}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.orderItems}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItemRow}>
              <Text
                style={[
                  styles.orderItemName,
                  { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                ]}
              >
                {item.quantity}x {item.name}
              </Text>
              <Text
                style={[
                  styles.orderItemPrice,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                ₹{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Total */}
        <View
          style={[
            styles.orderFooter,
            { borderTopColor: isDarkMode ? "#334155" : "#E2E8F0" },
          ]}
        >
          <Text
            style={[
              styles.orderTotalLabel,
              { color: isDarkMode ? "#94A3B8" : "#64748B" },
            ]}
          >
            Total Amount
          </Text>
          <Text
            style={[
              styles.orderTotalValue,
              { color: isDarkMode ? "#00a6ffff" : "#00a6ffff" },
            ]}
          >
            ₹{order.total.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const cartItems = getCartItems();

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <ServiceLayout icon={icon} title={title} showTitle={true}>
        <View style={styles.container}>
          {/* Tab Selector */}
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: isDarkMode ? "#1E293B" : "#F8FAFC" },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "cart" && styles.activeTab,
                activeTab === "cart" && { backgroundColor: "#4281eeff" },
              ]}
              onPress={() => setActiveTab("cart")}
            >
              <Ionicons
                name="cart"
                size={20}
                color={
                  activeTab === "cart"
                    ? "#FFFFFF"
                    : isDarkMode
                    ? "#94A3B8"
                    : "#64748B"
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "cart" && styles.activeTabText,
                  {
                    color:
                      activeTab === "cart"
                        ? "#FFFFFF"
                        : isDarkMode
                        ? "#94A3B8"
                        : "#64748B",
                  },
                ]}
              >
                Cart
              </Text>
              {getTotalItems() > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{getTotalItems()}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "orders" && styles.activeTab,
                activeTab === "orders" && { backgroundColor: "#4281eeff" },
              ]}
              onPress={() => setActiveTab("orders")}
            >
              <Ionicons
                name="receipt"
                size={20}
                color={
                  activeTab === "orders"
                    ? "#FFFFFF"
                    : isDarkMode
                    ? "#94A3B8"
                    : "#64748B"
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "orders" && styles.activeTabText,
                  {
                    color:
                      activeTab === "orders"
                        ? "#FFFFFF"
                        : isDarkMode
                        ? "#94A3B8"
                        : "#64748B",
                  },
                ]}
              >
                Orders
              </Text>
              {orders.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{orders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Cart Tab Content */}
          {activeTab === "cart" && (
            <>
              {cartItems.length === 0 ? (
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconContainer,
                      { backgroundColor: "#10B98120" },
                    ]}
                  >
                    <Ionicons name="cart-outline" size={64} color="#006de9ff" />
                  </View>
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                    ]}
                  >
                    Your Cart is Empty
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: isDarkMode ? "#64748B" : "#94A3B8" },
                    ]}
                  >
                    Add items to your cart to see them here.
                  </Text>
                </View>
              ) : (
                <>
                  

                  {/* Cart Items List */}
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {cartItems.map(renderCartItem)}
                  </ScrollView>

                  {/* Cart Summary */}
                  <View
                    style={[
                      styles.cartSummaryBar,
                      { backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF" },
                    ]}
                  >
                    <View style={styles.summaryDetails}>
                      <View style={styles.summaryRow}>
                        <Text
                          style={[
                            styles.summaryLabel,
                            { color: isDarkMode ? "#94A3B8" : "#64748B" },
                          ]}
                        >
                          Subtotal
                        </Text>
                        <Text
                          style={[
                            styles.summaryValue,
                            { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                          ]}
                        >
                          ₹{getTotalPrice().toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text
                          style={[
                            styles.summaryLabel,
                            { color: isDarkMode ? "#94A3B8" : "#64748B" },
                          ]}
                        >
                          Delivery Fee
                        </Text>
                        <Text
                          style={[
                            styles.summaryValue,
                            { color: isDarkMode ? "#00a6ffff" : "#0055ffff" },
                          ]}
                        >
                          Free
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.divider,
                          {
                            backgroundColor: isDarkMode ? "#334155" : "#E2E8F0",
                          },
                        ]}
                      />
                      <View style={styles.summaryRow}>
                        <Text
                          style={[
                            styles.totalLabel,
                            { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                          ]}
                        >
                          Total
                        </Text>
                        <Text
                          style={[
                            styles.totalValue,
                            { color: isDarkMode ? "#1692ffff" : "#006effff" },
                          ]}
                        >
                          ₹{getTotalPrice().toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.checkoutButton,
                        ordering && styles.checkoutButtonDisabled,
                      ]}
                      onPress={placeOrder}
                      disabled={ordering}
                    >
                      {ordering ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.checkoutButtonText}>
                            Place Order
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color="#FFFFFF"
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          )}

          {/* Orders Tab Content */}
          {activeTab === "orders" && (
            <>
              {loadingOrders ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#00b3ffff" />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    Loading orders...
                  </Text>
                </View>
              ) : orders.length === 0 ? (
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconContainer,
                      { backgroundColor: "#10B98120" },
                    ]}
                  >
                    <Ionicons
                      name="receipt-outline"
                      size={64}
                      color="#009dffff"
                    />
                  </View>
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                    ]}
                  >
                    No Pending Orders
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: isDarkMode ? "#64748B" : "#94A3B8" },
                    ]}
                  >
                    Your pending orders will appear here.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.ordersScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {orders.map(renderOrderItem)}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </ServiceLayout>
    </ThemedLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tabContainer: {
    flexDirection: "row",
    padding: 8,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    position: "relative",
  },
  activeTab: {
    shadowColor: "#1072b9ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 6,
    right: 10,
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  headerLeft: {
    flex: 1,
  },
  itemCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  itemCountText: {
    fontSize: 14,
    fontWeight: "700",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 220,
  },
  ordersScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  cartItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    position: "relative",
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },
  quantityOverlay: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#188cffda",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 30,
    alignItems: "center",
  },
  quantityOverlayText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  textContainer: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  quantityDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 36,
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemActions: {
    alignItems: "flex-end",
    gap: 12,
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemTotal: {
    fontSize: 17,
    fontWeight: "800",
  },
  deleteBtn: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  orderItems: {
    gap: 8,
    marginBottom: 16,
  },
  orderItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  orderTotalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  cartSummaryBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryDetails: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1070b9ff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Index;
