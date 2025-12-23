import { CanteenCartItem, useCanteen } from "@/components/CanteenContext";
import { useDialog } from "@/components/DialogContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { useToast } from "@/components/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth, db } from "../../../../../../firebaseConfig";

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

  const { showToast } = useToast();
  const { showDialog } = useDialog();
  const router = useRouter();

  // Get authenticated user ID
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid || "";

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUser) {
      showToast("Please log in to access your cart", "error");
      router.push("/LoginScreen");
    }
  }, [currentUser]);

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
      showToast("Failed to load orders", "error");
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
    showDialog({
      title: 'Remove Item',
      message: `Remove ${itemName} from cart?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(itemId),
        },
      ],
    });
  };

  const handleClearCart = () => {
    showDialog({
      title: 'Clear Cart',
      message: 'Remove all items from cart?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearCart(),
        },
      ],
    });
  };

  const placeOrder = async () => {
    if (getTotalItems() === 0) return;

    const cartItems = getCartItems();
    const shopId = cartItems[0]?.shopId || "";

    showDialog({
      title: 'Place Order',
      message: `Total: ₹${getTotalPrice().toFixed(2)}\n\nConfirm your order?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
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

              showToast("Order placed! Waiting for shop approval.", "success");
              clearCart();
              setActiveTab("orders");
            } catch (error) {
              console.log("Error placing order:", error);
              showToast("Failed to place order. Please try again.", "error");
            } finally {
              setOrdering(false);
            }
          },
        },
      ],
    });
  };

  const renderCartItem = (item: CanteenCartItem) => {
    return (
      <View
        key={item.id}
        style={[styles.cartItem, { backgroundColor: theme.inputBackground }]}
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
              style={[styles.itemName, { color: theme.primaryText }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>
              ₹{item.price.toFixed(2)}
            </Text>
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => handleDecrement(item.id)}
            >
              <Ionicons
                name={item.quantity === 1 ? "trash-outline" : "remove"}
                size={16}
                color={item.quantity === 1 ? "#EF4444" : theme.primaryText}
              />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              <Text style={[styles.quantityText, { color: theme.primaryText }]}>
                {item.quantity}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => handleIncrement(item.id)}
            >
              <Ionicons
                name="add"
                size={16}
                color={theme.primaryText}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Item Total & Delete */}
        <View style={styles.itemActions}>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalLabel, { color: theme.secondaryText }]}>
              Total
            </Text>
            <Text style={[styles.itemTotal, { color: theme.primaryText }]}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
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
          return "#EF4444";
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
        style={[styles.orderCard, { backgroundColor: theme.inputBackground }]}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={[styles.orderId, { color: theme.secondaryText }]}>
              Order #{order.id.slice(-6).toUpperCase()}
            </Text>
            <Text style={[styles.orderDate, { color: theme.secondaryText }]}>
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
              <Text style={[styles.orderItemName, { color: theme.primaryText }]}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={[styles.orderItemPrice, { color: theme.secondaryText }]}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Total */}
        <View style={[styles.orderFooter, { borderTopColor: theme.inputBorder }]}>
          <Text style={[styles.orderTotalLabel, { color: theme.secondaryText }]}>
            Total Amount
          </Text>
          <Text style={[styles.orderTotalValue, { color: theme.primaryText }]}>
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
          <View style={[styles.tabContainer, { backgroundColor: theme.navbarBackground }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "cart" && styles.activeTab,
                activeTab === "cart" && { backgroundColor: "#4281ee" },
              ]}
              onPress={() => setActiveTab("cart")}
            >
              <Ionicons
                name="cart"
                size={20}
                color={activeTab === "cart" ? "#FFFFFF" : theme.secondaryText}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "cart" && styles.activeTabText,
                  { color: activeTab === "cart" ? "#FFFFFF" : theme.secondaryText },
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
                activeTab === "orders" && { backgroundColor: "#4281ee" },
              ]}
              onPress={() => setActiveTab("orders")}
            >
              <Ionicons
                name="receipt"
                size={20}
                color={activeTab === "orders" ? "#FFFFFF" : theme.secondaryText}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === "orders" && styles.activeTabText,
                  { color: activeTab === "orders" ? "#FFFFFF" : theme.secondaryText },
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
                  <Text style={[styles.emptyTitle, { color: theme.primaryText }]}>
                    Your Cart is Empty
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
                    Add items to your cart to see them here.
                  </Text>
                </View>
              ) : (
                <>
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
                      { backgroundColor: theme.inputBackground },
                    ]}
                  >
                    <View style={styles.summaryDetails}>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                          Subtotal
                        </Text>
                        <Text style={[styles.summaryValue, { color: theme.primaryText }]}>
                          ₹{getTotalPrice().toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.secondaryText }]}>
                          Delivery Fee
                        </Text>
                        <Text style={[styles.summaryValue, { color: "#16A34A" }]}>
                          Free
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.divider,
                          { backgroundColor: theme.inputBorder },
                        ]}
                      />
                      <View style={styles.summaryRow}>
                        <Text style={[styles.totalLabel, { color: theme.primaryText }]}>
                          Total
                        </Text>
                        <Text style={[styles.totalValue, { color: "#006eff" }]}>
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
                  <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
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
                  <Text style={[styles.emptyTitle, { color: theme.primaryText }]}>
                    No Pending Orders
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.secondaryText }]}>
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
    shadowColor: "#1072b9",
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
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  quantityOverlay: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  quantityOverlayText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
    gap: 8,
  },
  textContainer: {
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityDisplay: {
    minWidth: 20,
    alignItems: "center",
  },
  quantityText: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemActions: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginLeft: 8,
  },
  totalContainer: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "800",
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    fontWeight: "500",
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
    marginTop: 40,
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
    fontSize: 24,
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
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryDetails: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
    fontSize: 24,
    fontWeight: "800",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default Index;
