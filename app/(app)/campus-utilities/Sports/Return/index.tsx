import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/components/ThemeContext";
import React, { useEffect, useState } from "react";
import { db } from "../../../../../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { ThemedLayout } from "@/components/ThemedLayout";
import { ServiceLayout } from "@/components/ServiceLayout";

const title = "Return Equipment";

type RentedItem = {
  id: string;
  name: string;
  quantity: number;
};

type RentedRecord = {
  id: string;
  userId: string;
  timestamp?: { seconds: number; nanoseconds: number };
  items: RentedItem[];
};

export default function ReturnPage() {
  const [rentedRecords, setRentedRecords] = useState<RentedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const { theme, isDarkMode } = useTheme();
  const userId = "user_123";

  const fetchRentedEquipment = async () => {
    try {
      setLoading(true);
      const rentedRef = collection(db, "rented");
      const snapshot = await getDocs(rentedRef);

      const list = snapshot.docs
        .map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as RentedRecord)
        )
        .filter((item) => item.userId === userId);

      setRentedRecords(list);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.log("Error fetching rented records:", error);
    } finally {
      setLoading(false);
    }
  };

  // const returnAllEquipment = async () => {
  //   Alert.alert(
  //     "Return All Equipment",
  //     "Are you sure you want to return all rented equipment?",
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Return All",
  //         style: "destructive",
  //         onPress: async () => {
  //           try {
  //             setReturning(true);
  //             for (const record of rentedRecords) {
  //               const items = record.items || [];

  //               for (const item of items) {
  //                 const equipmentRef = doc(db, "equipment", item.id);
  //                 await updateDoc(equipmentRef, {
  //                   rented: increment(-item.quantity),
  //                 });
  //               }

  //               await deleteDoc(doc(db, "rented", record.id));
  //             }

  //             setRentedRecords([]);
  //             Alert.alert("Success", "All equipment returned successfully!");
  //           } catch (error) {
  //             console.log("Error returning equipment:", error);
  //             Alert.alert(
  //               "Error",
  //               "Failed to return equipment. Please try again."
  //             );
  //           } finally {
  //             setReturning(false);
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };

  const returnAllEquipment = async () => {
    Alert.alert(
      "Request Return",
      "Are you sure you want to request a return for all rented equipment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Return",
          style: "destructive",
          onPress: async () => {
            try {
              setReturning(true);

              for (const record of rentedRecords) {
                await addDoc(collection(db, "returnRequests"), {
                  userId: record.userId,
                  rentalId: record.id,
                  items: record.items,
                  timestamp: new Date(),
                  status: "pending", 
                });
              }

              Alert.alert("Success", "Return request submitted successfully!");
            } catch (error) {
              console.log("Error creating return request:", error);
              Alert.alert(
                "Error",
                "Failed to request return. Please try again."
              );
            } finally {
              setReturning(false);
            }
          },
        },
      ]
    );
  };

  // const returnSingleItem = async (
  //   recordId: string,
  //   itemId: string,
  //   quantity: number,
  //   itemName: string
  // ) => {
  //   Alert.alert(
  //     "Return Item",
  //     `Return ${quantity} ${itemName}${quantity > 1 ? "s" : ""}?`,
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Return",
  //         onPress: async () => {
  //           try {
  //             const equipmentRef = doc(db, "equipment", itemId);
  //             await updateDoc(equipmentRef, {
  //               rented: increment(-quantity),
  //             });

  //             // Find the record and update items array
  //             const record = rentedRecords.find((r) => r.id === recordId);
  //             if (!record) return;

  //             const updatedItems = record.items.filter(
  //               (item) => item.id !== itemId
  //             );

  //             if (updatedItems.length === 0) {
  //               // Delete the entire record if no items left
  //               await deleteDoc(doc(db, "rented", recordId));
  //               setRentedRecords((prev) =>
  //                 prev.filter((r) => r.id !== recordId)
  //               );
  //             } else {
  //               // Update the record with remaining items
  //               await updateDoc(doc(db, "rented", recordId), {
  //                 items: updatedItems,
  //               });
  //               setRentedRecords((prev) =>
  //                 prev.map((r) =>
  //                   r.id === recordId ? { ...r, items: updatedItems } : r
  //                 )
  //               );
  //             }

  //             Alert.alert("Success", `${itemName} returned successfully!`);
  //           } catch (error) {
  //             console.log("Error returning item:", error);
  //             Alert.alert("Error", "Failed to return item.");
  //           }
  //         },
  //       },
  //     ]
  //   );
  // };

  const returnSingleItem = async (
  recordId: string,
  itemId: string,
  quantity: number,
  itemName: string
) => {
  Alert.alert(
    "Request Return",
    `Request return for ${quantity} ${itemName}${quantity > 1 ? "s" : ""}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit Request",
        onPress: async () => {
          try {
            const record = rentedRecords.find((r) => r.id === recordId);
            if (!record) return;

            await addDoc(collection(db, "returnRequests"), {
              userId: record.userId,
              rentalId: recordId,
              itemId,
              itemName,
              quantity,
              timestamp: new Date(),
              status: "pending", // pending | approved | rejected
            });

            Alert.alert(
              "Success",
              `Return request submitted for ${itemName}.`
            );
          } catch (error) {
            console.log("Error requesting return:", error);
            Alert.alert("Error", "Failed to request return. Please try again.");
          }
        },
      },
    ]
  );
};


  useEffect(() => {
    fetchRentedEquipment();
  }, []);

  const getTotalItems = () => {
    return rentedRecords.reduce((total, record) => {
      return (
        total +
        (record.items || []).reduce((sum, item) => sum + item.quantity, 0)
      );
    }, 0);
  };

  const getTotalRecords = () => {
    return rentedRecords.length;
  };

  const renderRentedCard = (record: RentedRecord, index: number) => {
    const cartItems = record.items || [];
    const totalItemsInRecord = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    return (
      <Animated.View
        key={record.id}
        style={[
          styles.rentedCard,
          {
            backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Card Header with Gradient */}
        <View
          style={[
            styles.cardHeader,
            { backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC" },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.dateIcon, { backgroundColor: "#3aaa3cff" }]}>
              <Ionicons name="calendar" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text
                style={[
                  styles.rentedLabel,
                  { color: isDarkMode ? "#94A3B8" : "#64748B" },
                ]}
              >
                RENTED ON
              </Text>
              <Text
                style={[
                  styles.rentedDate,
                  { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                ]}
              >
                {record.timestamp?.seconds
                  ? new Date(
                      record.timestamp.seconds * 1000
                    ).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Unknown Date"}
              </Text>
            </View>
          </View>
          <View
            style={[styles.itemCountBadge, { backgroundColor: "#3aaa3cff" }]}
          >
            <Ionicons name="cube" size={14} color="#ffffffff" />
            <Text style={styles.itemCountText}>{totalItemsInRecord}</Text>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          {cartItems.map((item, itemIndex) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                { borderBottomColor: isDarkMode ? "#334155" : "#F1F5F9" },
                itemIndex === cartItems.length - 1 && styles.lastItem,
              ]}
            >
              <View style={styles.itemInfo}>
                <View
                  style={[
                    styles.itemIcon,
                    { backgroundColor: isDarkMode ? "#334155" : "#F1F5F9" },
                  ]}
                >
                  <Ionicons name="cube-outline" size={18} color="#038f3bff" />
                </View>
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
                      styles.itemQuantity,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    {item.quantity} item{item.quantity !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.returnSingleButton,
                  { backgroundColor: "#10B98120" },
                ]}
                onPress={() =>
                  returnSingleItem(record.id, item.id, item.quantity, item.name)
                }
              >
                <Ionicons name="arrow-up-circle" size={22} color="#10B981" />
                <Text style={styles.returnSingleText}>Return</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Card Footer */}
        <View
          style={[
            styles.cardFooter,
            { borderTopColor: isDarkMode ? "#334155" : "#F1F5F9" },
          ]}
        >
          <Text
            style={[
              styles.footerText,
              { color: isDarkMode ? "#94A3B8" : "#64748B" },
            ]}
          >
            {cartItems.length} item type{cartItems.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </Animated.View>
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
        <ServiceLayout icon="return-down-back" title={title} showTitle={true}>
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
              Loading your rentals...
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
      <ServiceLayout icon="return-down-back" title={title} showTitle={true}>
        <View style={styles.container}>
          {rentedRecords.length === 0 ? (
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: "#10B98120" },
                ]}
              >
                <Ionicons
                  name="checkmark-done-circle"
                  size={64}
                  color="#10B981"
                />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDarkMode ? "#F1F5F9" : "#0F172A" },
                ]}
              >
                All Caught Up!
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDarkMode ? "#64748B" : "#94A3B8" },
                ]}
              >
                You don't have any rented equipment at the moment.
              </Text>
              <TouchableOpacity style={styles.browseButton}>
                <Ionicons name="search" size={20} color="#FFFFFF" />
                <Text style={styles.browseButtonText}>Browse Equipment</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <>
              {/* Enhanced Summary Card */}
              <Animated.View
                style={[
                  styles.summaryCard,
                  {
                    backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.summaryContent}>
                  <View
                    style={[
                      styles.summaryIconWrapper,
                      { backgroundColor: "#5cf65c20" },
                    ]}
                  >
                    <Ionicons name="bag-check" size={28} color="#00af0cff" />
                  </View>
                  <View style={styles.summaryInfo}>
                    <Text
                      style={[
                        styles.summaryLabel,
                        { color: isDarkMode ? "#94A3B8" : "#1c551dff" },
                      ]}
                    >
                      ACTIVE RENTALS
                    </Text>
                    <Text
                      style={[
                        styles.summaryValue,
                        { color: isDarkMode ? "#F1F5F9" : "#0f2a14ff" },
                      ]}
                    >
                      {getTotalItems()} Item{getTotalItems() !== 1 ? "s" : ""}
                    </Text>
                    <Text
                      style={[
                        styles.summarySubtext,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      Across {getTotalRecords()} rental
                      {getTotalRecords() !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.summaryDecoration,
                    { backgroundColor: "#69f65cff" },
                  ]}
                />
              </Animated.View>

              {/* Rented Items List */}
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {rentedRecords.map(renderRentedCard)}
              </ScrollView>

              {/* Enhanced Return All Button */}
              <Animated.View
                style={[
                  styles.buttonContainer,
                  {
                    backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                    opacity: fadeAnim,
                  },
                ]}
              >
                <View style={styles.buttonBackground}>
                  <TouchableOpacity
                    style={[
                      styles.returnAllButton,
                      returning && styles.buttonDisabled,
                    ]}
                    onPress={returnAllEquipment}
                    disabled={returning}
                  >
                    {returning ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <View style={styles.buttonIcon}>
                          <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.returnAllButtonText}>
                          Return All Equipment
                        </Text>
                        <View style={styles.buttonBadge}>
                          <Text style={styles.buttonBadgeText}>
                            {getTotalItems()}
                          </Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>
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
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    overflow: "hidden",
    borderWidth: 0.2,
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  summaryIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 13,
    fontWeight: "500",
  },
  summaryDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    borderBottomLeftRadius: 40,
    opacity: 0.1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  rentedCard: {
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    overflow: "hidden",
    borderWidth: 0.2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  rentedLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  rentedDate: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemCountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  itemsList: {
    paddingHorizontal: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    fontWeight: "500",
  },
  returnSingleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  returnSingleText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "700",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  quickReturnButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickReturnText: {
    color: "#b56102ff",
    fontSize: 13,
    fontWeight: "700",
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
    backgroundColor: "#119611ff",
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
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  buttonBackground: {
    backgroundColor: "transparent",
  },
  returnAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#019106ff",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    gap: 12,
    position: "relative",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    width: 24,
    alignItems: "center",
  },
  returnAllButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  buttonBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FFFFFF",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  buttonBadgeText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "900",
  },
});
