import { useDialog } from "@/components/DialogContext";
import { useEquipment } from "@/components/EquipmentContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { auth, db } from "../../../../../firebaseConfig";

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const icon = "football";
const title = "Sports Equipment";

type Equipment = {
  id: string;
  name: string;
  sport: string;
  stock: number;
  rented?: number;
  img?: string;
};

type RentedItem = {
  id: string;
  name: string;
  quantity: number;
};

type SportName = "Football" | "Basketball" | "Tennis" | "Cricket" | "Chess" | "Kabaddi";

export default function Page() {
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const { theme, isDarkMode } = useTheme();
  const { cart, updateQuantity, getTotalItems, clearCart } = useEquipment();
  const { showDialog } = useDialog();

  // Get actual authenticated user
  const currentUser = auth.currentUser;
  const userSport: SportName = "Football";
  const userId = currentUser?.uid || "";
  const userName = currentUser?.displayName || currentUser?.email || "Unknown User";

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const equipmentRef = collection(db, "equipment");
      const snapshot = await getDocs(equipmentRef);
      const list = snapshot.docs.map((docSnap) => ({ 
        id: docSnap.id, 
        ...docSnap.data() 
      } as Equipment));
      const userEquipment = list.filter((item) => item.sport === userSport);
      setEquipmentData(userEquipment);
    } catch (error) {
      console.log("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const rentAllEquipment = async () => {
    // Validate user is authenticated
    if (!currentUser) {
      showDialog({
        title: 'Authentication Required',
        message: 'Please log in to rent equipment',
        buttons: [{ text: 'OK', style: 'default' }]
      });
      return;
    }

    const rentedItems: RentedItem[] = [];
    try {
      // Build items list WITHOUT updating inventory
      for (const itemId in cart) {
        const quantity = cart[itemId].quantity;
        const item = equipmentData.find((e) => e.id === itemId);
        if (item) {
          // Validate stock availability (client-side check)
          const available = (item.stock || 0) - (item.rented || 0);
          if (available < quantity) {
            showDialog({
              title: 'Insufficient Stock',
              message: `Only ${available} units of ${item.name} available`,
              buttons: [{ text: 'OK', style: 'default' }]
            });
            return;
          }
          
          rentedItems.push({
            id: itemId,
            name: item.name,
            quantity: quantity,
          });
        }
      }

      if (rentedItems.length === 0) {
        showDialog({
          title: 'Empty Cart',
          message: 'Please add items to your cart',
          buttons: [{ text: 'OK', style: 'default' }]
        });
        return;
      }

      // Create rent request WITHOUT updating inventory
      // Inventory will be updated only when admin approves the request
      await addDoc(collection(db, "rentrequest"), {
        userId,
        userName,
        items: rentedItems,
        timestamp: serverTimestamp(),
        status: false, // Pending approval
      });
      
      showDialog({
        title: 'Request Submitted',
        message: 'Your rent request has been submitted for approval. You will be notified once approved.',
        buttons: [
          {
            text: 'OK',
            style: 'default',
            onPress: () => clearCart()
          }
        ]
      });
    } catch (error) {
      console.log("Error creating rent request:", error);
      showDialog({
        title: 'Error',
        message: 'Failed to submit rent request. Please try again.',
        buttons: [{ text: 'OK', style: 'default' }]
      });
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    console.log("Cart updated:", cart);
    console.log("Total items in cart:", equipmentData);
  }, [cart]);

  const handleQuantityChange = (item: Equipment, change: number) => {
    const currentQty = cart[item.id]?.quantity || 0;
    const newQty = Math.max(0, Math.min(currentQty + change, item.stock));
    updateQuantity(item.id, newQty);
  };

  const getSportIcon = (sport: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<SportName, keyof typeof Ionicons.glyphMap> = {
      Football: "football",
      Basketball: "basketball",
      Tennis: "tennisball",
      Cricket: "baseball",
      Chess: "grid",
      Kabaddi: "fitness",
    };
    return icons[sport as SportName] || "trophy";
  };

  const renderEquipmentCard = ({ item }: { item: Equipment }) => {
    const quantity = cart[item.id]?.quantity || 0;
    const isOutOfStock = item.stock === 0;

    return (
      <View
        style={[
          styles.equipmentCard,
          { backgroundColor: isDarkMode ? "#0c2314ff" : "#FFFFFF" },
        ]}
      >
        {/* Equipment Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri:
                item.img ||
                "https://via.placeholder.com/200x200?text=Equipment",
            }}
            style={styles.equipmentImage}
            resizeMode="cover"
          />
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Equipment Details */}
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.equipmentName,
              { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
            ]}
          >
            {item.name}
          </Text>

          {/* Stock Info */}
          <View
            style={[
              styles.stockRow,
              {
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 4,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="cube-outline"
                size={14}
                color={item.stock < 5 ? "#EF4444" : "#10B981"}
              />

              <Text
                style={[
                  styles.stockText,
                  { color: item.stock < 5 ? "#EF4444" : "#10B981" },
                ]}
              >
                {!item.rented ? item.stock : item.stock - item.rented} Available{" "}
                {item.rented && item.rented > 0
                  ? `| ${item.rented} Rented`
                  : ""}
              </Text>
            </View>
          </View>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <>
              <View style={styles.quantitySection}>
                <Text
                  style={[
                    styles.quantityLabel,
                    { color: isDarkMode ? "#94A3B8" : "#64748B" },
                  ]}
                >
                  Quantity:
                </Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.quantityBtn,
                      { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" },
                      quantity === 0 && styles.disabledBtn,
                    ]}
                    onPress={() => handleQuantityChange(item, -1)}
                    disabled={quantity === 0}
                  >
                    <Ionicons
                      name="remove"
                      size={18}
                      color={
                        quantity === 0
                          ? "#94A3B8"
                          : isDarkMode
                          ? "#F1F5F9"
                          : "#0F172A"
                      }
                    />
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.quantityDisplay,
                      { backgroundColor: isDarkMode ? "#334155" : "#F8FAFC" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quantityText,
                        { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                      ]}
                    >
                      {quantity}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.quantityBtn,
                      { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" },
                      quantity >= item.stock && styles.disabledBtn,
                    ]}
                    onPress={() => handleQuantityChange(item, 1)}
                    disabled={quantity >= item.stock}
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={
                        quantity >= item.stock
                          ? "#94A3B8"
                          : isDarkMode
                          ? "#F1F5F9"
                          : "#0F172A"
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rent Button */}
              <TouchableOpacity
                style={[
                  styles.rentButton,
                  quantity === 0 && styles.rentButtonDisabled,
                ]}
                disabled={quantity === 0}
              >
                <Ionicons
                  name={
                    quantity > 0 ? "checkmark-circle" : "add-circle-outline"
                  }
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.rentButtonText}>
                  {quantity > 0 ? "Added" : "Add"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

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
          {/* Sport Header */}
          <View
            style={[
              styles.sportHeader,
              { backgroundColor: isDarkMode ? "#1e3b22ff" : "#F8FAFC" },
            ]}
          >
            <View style={styles.sportIconContainer}>
              <Ionicons
                name={getSportIcon(userSport)}
                size={28}
                color="#29bb1eff"
              />
            </View>
            <View style={styles.sportInfo}>
              <Text
                style={[
                  styles.sportLabel,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                Your Sport
              </Text>
              <Text
                style={[
                  styles.sportName,
                  { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                ]}
              >
                {userSport}
              </Text>
            </View>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>
                {equipmentData.length} Items
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <Pressable
              style={{ paddingHorizontal: 20, marginBottom: 10, width: "30%" }}
              onPress={() => clearCart()}
            >
              <View
                style={{
                  backgroundColor: isDarkMode ? "#3c5533ff" : "#E2E8F0",
                  padding: 5,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: isDarkMode ? "#F1F5F9" : "#0F172A",
                    fontWeight: "500",
                  }}
                >
                  Reset
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Equipment List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text
                style={[
                  styles.loadingText,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                Loading equipment...
              </Text>
            </View>
          ) : (
            <FlatList
              data={equipmentData}
              keyExtractor={(item) => item.id}
              renderItem={renderEquipmentCard}
              numColumns={2} // <-- 2 per row
              columnWrapperStyle={styles.rowWrapper} // spacing
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            />
          )}

          {getTotalItems() > 0 && (
            <View
              style={[
                styles.checkoutBar,
                { backgroundColor: isDarkMode ? "#001804ff" : "#FFFFFF" },
              ]}
            >
              <View style={styles.cartSummary}>
                <View style={styles.cartIconWrapper}>
                  <Ionicons name="cart" size={24} color="#3bf657ff" />
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
                  </View>
                </View>
                <View>
                  <Text
                    style={[
                      styles.cartLabel,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    Items in Cart
                  </Text>
                  <Text
                    style={[
                      styles.cartCount,
                      { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                    ]}
                  >
                    {getTotalItems()} Item{getTotalItems() !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => rentAllEquipment()}
                style={styles.checkoutButton}
              >
                <Text style={styles.checkoutButtonText}>
                  Proceed to Checkout
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
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

  sportHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sportIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e3fedbff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  sportInfo: {
    flex: 1,
  },
  sportLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sportName: {
    fontSize: 20,
    fontWeight: "700",
  },
  availableBadge: {
    backgroundColor: "#e1fedbff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  availableBadgeText: {
    color: "#1eaf36ff",
    fontSize: 13,
    fontWeight: "700",
  },

  scrollView: {
    flex: 1,
    flexWrap: "wrap",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  rowWrapper: {
    justifyContent: "space-between", // space between 2 cards
    marginBottom: 14,
  },

  // Equipment Card Grid Layout
  equipmentCard: {
    flexBasis: "48%", // 2 per row responsive
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageWrapper: {
    width: "100%",
    height: 140,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  equipmentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },
  outOfStockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Card body
  cardContent: {
    padding: 10,
  },
  equipmentName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Quantity selector
  quantitySection: {
    marginBottom: 10,
  },
  quantityLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  quantityBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  quantityDisplay: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "700",
  },
  rentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#429d26ff",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
    gap: 5,
  },
  rentButtonDisabled: {
    backgroundColor: "#83b88eff",
    opacity: 0.6,
  },
  rentButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  // Checkout Bar
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
  cartCount: {
    fontSize: 18,
    fontWeight: "700",
  },
  checkoutButton: {
    width: "55%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#03a75aff",
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});