import HapticPressable from "@/components/HapticPressable";
import { ServiceLayout } from "@/components/ServiceLayout";
import { ThemedLayout } from "@/components/ThemedLayout";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/components/ThemeContext";
import React, { useEffect, useState } from "react";
import { db } from "../../../../../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const icon = "pizza";
const title = "Menu";

type MenuData = {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: string;
  image?: string;
  img?: string;
  available?: boolean;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function Page() {
  const [menuData, setMenuData] = useState<MenuData[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  const { theme, isDarkMode } = useTheme();

  const { shop } = useLocalSearchParams();
  const shopId = shop as string;
  const userId = "user_123"; // Replace with actual user ID from context

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const menuRef = collection(db, "shops", shopId, "menu");
      const snapshot = await getDocs(menuRef);

      const list: MenuData[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Omit<MenuData, "id">;
        return { id: docSnap.id, ...data };
      });

      setMenuData(list);
      console.log("Fetched menu:", list);
    } catch (error) {
      console.log("Error fetching Menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuData) => {
    setCart((prev) => {
      const existingItem = prev[item.id];
      if (existingItem) {
        return {
          ...prev,
          [item.id]: {
            ...existingItem,
            quantity: existingItem.quantity + 1,
          },
        };
      } else {
        return {
          ...prev,
          [item.id]: {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
          },
        };
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existingItem = prev[itemId];
      if (existingItem && existingItem.quantity > 1) {
        return {
          ...prev,
          [itemId]: {
            ...existingItem,
            quantity: existingItem.quantity - 1,
          },
        };
      } else {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
    });
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
                shopId,
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

  useEffect(() => {
    if (shopId) {
      fetchMenu();
    }
  }, [shopId]);

  useEffect(() => {
    console.log("Current cart:", cart);
    }, [cart]);

  const renderMenuItem = (item: MenuData) => {
    const quantity = cart[item.id]?.quantity || 0;
    const isUnavailable = item.available === false;

    return (
      <View
        key={item.id}
        style={[
          {
            backgroundColor: "#00d5ff0f",
            width: "42%",
            borderRadius: 20,
            margin: 10,
            borderColor: "#00d0ffff",
            borderWidth: 0.3,
          },
        ]}
      >
        {/* Price Badge */}
        <View style={[{ alignItems: "flex-end", justifyContent: "flex-start" }]}>
          <View
            style={[
              {
                backgroundColor: "white",
                borderTopRightRadius: 15,
                borderBottomLeftRadius: 15,
                width: "40%",
                padding: 10,
                elevation: 5,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              },
            ]}
          >
            <Text
              style={[
                {
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#0F172A",
                },
              ]}
            >
              ₹{item.price}
            </Text>
          </View>
        </View>

        {/* Item Image */}
        <View style={{ elevation: 15 ,shadowColor: "#00eaffff" , shadowOffset: { width: 0, height: 4 } ,  shadowRadius: 5 , }}>
          <Image
            source={
              item.image || item.img
                ? { uri: item.image || item.img }
                : require("../../../../../assets/images/placeholder.png")
            }
            style={[
              {
                width: 120,
                height: 120,
                borderRadius: 200,
                alignSelf: "center",
                marginTop: 10,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
              },
            ]}
            resizeMode="cover"
          />
        </View>

        {/* Item Name */}
        <View>
          <Text
            style={[
              {
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 14,
                marginTop: 10,
                color: isDarkMode ? "#F1F5F9" : "#0F172A",
              },
            ]}
          >
            {item.name}
          </Text>
        </View>

        {/* Quantity Controls */}
        <View
          style={[
            {
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              margin: 10,
              gap: 15,
            },
          ]}
        >
          {!isUnavailable ? (
            quantity > 0 ? (
              <>
                <TouchableOpacity
                  onPress={() => removeFromCart(item.id)}
                  style={{
                    backgroundColor: isDarkMode ? "#334155" : "#F1F5F9",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={isDarkMode ? "#F1F5F9" : "#0F172A"}
                  />
                </TouchableOpacity>

                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    minWidth: 30,
                    textAlign: "center",
                    color: isDarkMode ? "#F1F5F9" : "#0F172A",
                  }}
                >
                  {quantity}
                </Text>

                <TouchableOpacity
                  onPress={() => addToCart(item)}
                  style={{
                    backgroundColor: isDarkMode ? "#334155" : "#F1F5F9",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={isDarkMode ? "#F1F5F9" : "#0F172A"}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => addToCart(item)}
                style={{
                  backgroundColor: "#33c03881",
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="add-circle" size={16} color="#005a5bff" />
                <Text style={{ color: "#005a5bff", fontWeight: "bold" , fontSize: 12 }}>
                  Add
                </Text>
              </TouchableOpacity>
            )
          ) : (
            <View
              style={{
                backgroundColor: "#EF444420",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#EF4444", fontSize: 8, fontWeight: "600" }}>
                Unavailable
              </Text>
            </View>
          )}
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
              Loading menu...
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
      <ServiceLayout icon={icon} title={title} showTitle={true}>
        <View style={styles.container}>
          {menuData.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: "#10B98120" },
                ]}
              >
                <Ionicons name="restaurant" size={64} color="#10B981" />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                ]}
              >
                No Menu Available
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDarkMode ? "#64748B" : "#94A3B8" },
                ]}
              >
                This shop hasn't added any items yet.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-evenly",
                  }}
                >
                  {menuData.map(renderMenuItem)}
                </View>
              </ScrollView>

              {getTotalItems() > 0 && (
                <View
                  style={[
                    styles.cartBar,
                    { backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF" },
                  ]}
                >
                  <View style={styles.cartSummary}>
                    <View style={styles.cartIconWrapper}>
                      <Ionicons name="cart" size={24} color="#10B981" />
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>
                          {getTotalItems()}
                        </Text>
                      </View>
                    </View>
                    <View>
                      <Text
                        style={[
                          styles.cartLabel,
                          { color: isDarkMode ? "#94A3B8" : "#64748B" },
                        ]}
                      >
                        Total Amount
                      </Text>
                      <Text
                        style={[
                          styles.cartTotal,
                          { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                        ]}
                      >
                        ₹{getTotalPrice().toFixed(2)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.orderButton,
                      ordering && styles.orderButtonDisabled,
                    ]}
                    onPress={placeOrder}
                    disabled={ordering}
                  >
                    {ordering ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.orderButtonText}>Place Order</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ServiceLayout>
    </ThemedLayout>
  );
}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 8,
    paddingBottom: 120,
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
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  cartBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cartSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartIconWrapper: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  cartLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: "800",
  },
  orderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});