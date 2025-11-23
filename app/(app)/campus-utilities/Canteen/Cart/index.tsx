import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceLayout } from '@/components/ServiceLayout';
import { useTheme } from '@/components/ThemeContext';
import { db } from '../../../../../firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  shopId?: string;
};

const icon = "cart";
const title = "My Cart";

const Index = () => {
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const { theme, isDarkMode } = useTheme();
  
  const userId = "user_123"; // Replace with actual user ID from context

  // Load cart from storage or context
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      // Add your cart loading logic here
      // For now, using mock data
      const mockCart: Record<string, CartItem> = {
        "1": {
          id: "1",
          name: "Burger",
          price: 150,
          quantity: 2,
          image: "https://via.placeholder.com/100",
          shopId: "shop_1"
        },
        "2": {
          id: "2",
          name: "Pizza",
          price: 299,
          quantity: 1,
          image: "https://via.placeholder.com/100",
          shopId: "shop_1"
        }
      };
      setCart(mockCart);
    } catch (error) {
      console.log("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = (itemId: string) => {
    setCart((prev) => {
      const item = prev[itemId];
      if (!item) return prev;
      
      return {
        ...prev,
        [itemId]: {
          ...item,
          quantity: item.quantity + 1,
        },
      };
    });
  };

  const decrementQuantity = (itemId: string) => {
    setCart((prev) => {
      const item = prev[itemId];
      if (!item) return prev;
      
      if (item.quantity > 1) {
        return {
          ...prev,
          [itemId]: {
            ...item,
            quantity: item.quantity - 1,
          },
        };
      } else {
        // Remove item if quantity becomes 0
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const removeItem = (itemId: string, itemName: string) => {
    Alert.alert(
      "Remove Item",
      `Remove ${itemName} from cart?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setCart((prev) => {
              const { [itemId]: _, ...rest } = prev;
              return rest;
            });
          },
        },
      ]
    );
  };

  const clearCart = () => {
    Alert.alert(
      "Clear Cart",
      "Remove all items from cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => setCart({}),
        },
      ]
    );
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return Object.values(cart).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  };

  const placeOrder = async () => {
    if (getTotalItems() === 0) return;

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
              const orderItems = Object.values(cart);

              await addDoc(collection(db, "orders"), {
                userId,
                items: orderItems,
                total: getTotalPrice(),
                timestamp: serverTimestamp(),
                status: "pending",
              });

              Alert.alert("Success", "Your order has been placed!");
              setCart({});
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

  const renderCartItem = (item: CartItem) => {
    return (
      <View
        key={item.id}
        style={[
          styles.cartItem,
          { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" },
        ]}
      >
        {/* Item Image */}
        <Image
          source={
            item.image 
              ? { uri: item.image }
              : require("../../../../../assets/images/placeholder.png")
          }
          style={styles.itemImage}
          resizeMode="cover"
        />

        {/* Item Details */}
        <View style={styles.itemDetails}>
          <Text
            style={[
              styles.itemName,
              { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
            ]}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.itemPrice,
              { color: isDarkMode ? "#10B981" : "#059669" },
            ]}
          >
            ₹{item.price.toFixed(2)}
          </Text>

          {/* Quantity Controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[
                styles.quantityBtn,
                { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" },
              ]}
              onPress={() => decrementQuantity(item.id)}
            >
              <Ionicons
                name="remove"
                size={18}
                color={isDarkMode ? "#F1F5F9" : "#0F172A"}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.quantityText,
                { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
              ]}
            >
              {item.quantity}
            </Text>

            <TouchableOpacity
              style={[
                styles.quantityBtn,
                { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" },
              ]}
              onPress={() => incrementQuantity(item.id)}
            >
              <Ionicons
                name="add"
                size={18}
                color={isDarkMode ? "#F1F5F9" : "#0F172A"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Item Total & Delete */}
        <View style={styles.itemActions}>
          <Text
            style={[
              styles.itemTotal,
              { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
            ]}
          >
            ₹{(item.price * item.quantity).toFixed(2)}
          </Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => removeItem(item.id, item.name)}
          >
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
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
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text
              style={[
                styles.loadingText,
                { color: isDarkMode ? "#94A3B8" : "#64748B" },
              ]}
            >
              Loading cart...
            </Text>
          </View>
        </ServiceLayout>
      </ThemedLayout>
    );
  }

  const cartItems = Object.values(cart);

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
          {cartItems.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: "#10B98120" },
                ]}
              >
                <Ionicons name="cart-outline" size={64} color="#10B981" />
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
              <TouchableOpacity style={styles.browseButton}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Browse Menu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Cart Header */}
              <View
                style={[
                  styles.cartHeader,
                  { backgroundColor: isDarkMode ? "#1E293B" : "#F8FAFC" },
                ]}
              >
                <View style={styles.headerLeft}>
                  <View
                    style={[
                      styles.itemCountBadge,
                      { backgroundColor: "#10B98120" },
                    ]}
                  >
                    <Ionicons name="cube" size={18} color="#10B981" />
                    <Text
                      style={[
                        styles.itemCountText,
                        { color: isDarkMode ? "#10B981" : "#059669" },
                      ]}
                    >
                      {getTotalItems()} Items
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearCart}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#EF4444"
                  />
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>

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
                        { color: isDarkMode ? "#10B981" : "#059669" },
                      ]}
                    >
                      Free
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: isDarkMode ? "#334155" : "#E2E8F0" },
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
                        { color: isDarkMode ? "#10B981" : "#059669" },
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
                        Proceed to Checkout
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
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
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
  cartItem: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "center",
  },
  itemActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  deleteBtn: {
    padding: 8,
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
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
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

export default Index