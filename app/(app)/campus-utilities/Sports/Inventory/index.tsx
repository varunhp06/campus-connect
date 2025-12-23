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
  getDocs,
  updateDoc
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../../../../firebaseConfig";

const title = "View Inventory";

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

type Equipment = {
  id: string;
  name: string;
  sport: string;
  stock: number;
  rented?: number;
  img?: string;
};

export default function InventoryPage() {
  const [rentedRecords, setRentedRecords] = useState<RentedRecord[]>([]);
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "rented" | "available"
  >("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sport: "",
    stock: "",
    img: "",
  });
  const fadeAnim = useState(new Animated.Value(0))[0];

  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  const fetchRentedEquipment = async () => {
    try {
      const rentedRef = collection(db, "rented");
      const snapshot = await getDocs(rentedRef);

      const list = snapshot.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as RentedRecord)
      );

      setRentedRecords(list);
    } catch (error) {
      console.log("Error fetching rented records:", error);
    }
  };

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const equipmentRef = collection(db, "equipment");
      const snapshot = await getDocs(equipmentRef);
      const list = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Equipment)
      );
      setEquipmentData(list);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.log("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentedEquipment();
    fetchEquipment();
  }, []);

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

  const getDaysAgo = (timestamp?: { seconds: number; nanoseconds: number }) => {
    if (!timestamp) return "";
    const now = Date.now();
    const rentedTime = timestamp.seconds * 1000;
    const diffDays = Math.floor((now - rentedTime) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const getRentalsForItem = (itemId: string) => {
    return rentedRecords
      .filter((record) => record.items.some((item) => item.id === itemId))
      .map((record) => ({
        ...record,
        quantity:
          record.items.find((item) => item.id === itemId)?.quantity || 0,
      }));
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const resetForm = () => {
    setFormData({ name: "", sport: "", stock: "", img: "" });
    setEditingItem(null);
    setModalVisible(false);
  };

  const handleEditPress = (item: Equipment) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sport: item.sport,
      stock: item.stock.toString(),
      img: item.img || "",
    });
    setModalVisible(true);
  };

  const handleSaveEquipment = async () => {
    if (!formData.name || !formData.sport || !formData.stock) {
      showToast("Please fill in all required fields", "warning");
      return;
    }

    const stockNum = parseInt(formData.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      showToast("Please enter a valid stock number", "warning");
      return;
    }

    try {
      setLoading(true);
      if (editingItem) {
        // Update existing
        const itemRef = doc(db, "equipment", editingItem.id);
        await updateDoc(itemRef, {
          name: formData.name,
          sport: formData.sport,
          stock: stockNum,
          img: formData.img,
        });
        showToast("Equipment updated successfully", "success");
      } else {
        // Add new
        await addDoc(collection(db, "equipment"), {
          name: formData.name,
          sport: formData.sport,
          stock: stockNum,
          rented: 0,
          img: formData.img,
        });
        showToast("Equipment added successfully", "success");
      }
      resetForm();
      fetchEquipment();
    } catch (error) {
      console.error("Error saving equipment:", error);
      showToast("Failed to save equipment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePress = (item: Equipment) => {
    showDialog({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this item?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDoc(doc(db, "equipment", item.id));
              showToast("Item deleted", "success");
              fetchEquipment();
            } catch (error) {
              console.error("Error deleting:", error);
              showToast("Failed to delete item", "error");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  const totalStock = equipmentData.reduce((sum, item) => sum + item.stock, 0);
  const totalRented = equipmentData.reduce(
    (sum, item) => sum + (item.rented || 0),
    0
  );
  const filteredEquipment = equipmentData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sport.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "rented" && (item.rented || 0) > 0) ||
      (filterStatus === "available" && (item.rented || 0) === 0);
    return matchesSearch && matchesFilter;
  });

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
        <ServiceLayout icon="cube" title={title} showTitle={true}>
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
              Loading inventory...
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
      <ServiceLayout icon="cube" title={title} showTitle={true}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statContent}>
                  <View>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: isDarkMode ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      Total Stock
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                      ]}
                    >
                      {totalStock}
                    </Text>
                    <Text
                      style={[
                        styles.statSubtext,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      {equipmentData.length} items
                    </Text>
                  </View>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}
                  >
                    <Ionicons name="cube-outline" size={18} color="#2563EB" />
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statContent}>
                  <View>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: isDarkMode ? "#94A3B8" : "#64748B" },
                      ]}
                    >
                      Currently Rented
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                      ]}
                    >
                      {totalRented}
                    </Text>
                    <Text
                      style={[
                        styles.statSubtext,
                        { color: isDarkMode ? "#64748B" : "#94A3B8" },
                      ]}
                    >
                      {rentedRecords.length} rentals
                    </Text>
                  </View>
                  <View
                    style={[styles.statIcon, { backgroundColor: "#FED7AA" }]}
                  >
                    <Ionicons name="people-outline" size={28} color="#EA580C" />
                  </View>
                </View>
              </View>
            </View>

            {/* Search and Filter */}
            <View
              style={[
                styles.filterContainer,
                {
                  backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                  borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                },
              ]}
            >
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                    borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={isDarkMode ? "#64748B" : "#94A3B8"}
                  style={styles.searchIcon}
                />
                <KeyboardAvoidingView>
                  <TextInput
                    style={[
                      styles.searchInput,
                      { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                    ]}
                    placeholder="Search equipment..."
                    placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </KeyboardAvoidingView>
              </View>

              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "all" && styles.filterButtonActive,
                    {
                      backgroundColor:
                        filterStatus === "all"
                          ? "#2563EB"
                          : isDarkMode
                          ? "#334155"
                          : "#F1F5F9",
                    },
                  ]}
                  onPress={() => setFilterStatus("all")}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      {
                        color:
                          filterStatus === "all"
                            ? "#FFFFFF"
                            : isDarkMode
                            ? "#94A3B8"
                            : "#64748B",
                      },
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "rented" && styles.filterButtonActive,
                    {
                      backgroundColor:
                        filterStatus === "rented"
                          ? "#EA580C"
                          : isDarkMode
                          ? "#334155"
                          : "#F1F5F9",
                    },
                  ]}
                  onPress={() => setFilterStatus("rented")}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      {
                        color:
                          filterStatus === "rented"
                            ? "#FFFFFF"
                            : isDarkMode
                            ? "#94A3B8"
                            : "#64748B",
                      },
                    ]}
                  >
                    Rented
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "available" && styles.filterButtonActive,
                    {
                      backgroundColor:
                        filterStatus === "available"
                          ? "#16A34A"
                          : isDarkMode
                          ? "#334155"
                          : "#F1F5F9",
                    },
                  ]}
                  onPress={() => setFilterStatus("available")}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      {
                        color:
                          filterStatus === "available"
                            ? "#FFFFFF"
                            : isDarkMode
                            ? "#94A3B8"
                            : "#64748B",
                      },
                    ]}
                  >
                    Available
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Add Equipment Button */}
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: "#2563EB" },
              ]}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add New Equipment</Text>
            </TouchableOpacity>

            {/* Inventory List */}
            <View style={styles.inventoryList}>
              {filteredEquipment.map((item) => {
                const rentals = getRentalsForItem(item.id);
                const isExpanded = expandedItems[item.id];
                const availableStock = item.stock - (item.rented || 0);
                const stockPercentage = (
                  (availableStock / item.stock) *
                  100
                ).toFixed(0);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.inventoryCard,
                      {
                        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      },
                    ]}
                  >
                    {/* Main Item Row */}
                    <View style={styles.itemRow}>
                      {/* Item Image */}
                      {item.img && (
                        <Image
                          source={{ uri: item.img }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      )}

                      {/* Item Info */}
                      <View style={styles.itemInfo}>
                          <View style={styles.itemHeader}>
                            <View style={styles.headerTop}>
                              <View style={styles.itemTitleContainer}>
                                <Text
                                  style={[
                                    styles.itemName,
                                    { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                                  ]}
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  style={[
                                    styles.itemSport,
                                    { color: isDarkMode ? "#64748B" : "#94A3B8" },
                                  ]}
                                >
                                  {item.sport}
                                </Text>
                              </View>
                              <View style={styles.actionButtons}>
                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={() => handleEditPress(item)}
                                >
                                  <Ionicons
                                    name="create-outline"
                                    size={20}
                                    color="#2563EB"
                                  />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.actionButton}
                                  onPress={() => handleDeletePress(item)}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color="#EF4444"
                                  />
                                </TouchableOpacity>
                              </View>
                            </View>

                            <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                              <Text
                                style={[
                                  styles.statItemLabel,
                                  { color: isDarkMode ? "#64748B" : "#94A3B8" },
                                ]}
                              >
                                Total
                              </Text>
                              <Text
                                style={[
                                  styles.statItemValue,
                                  { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                                ]}
                              >
                                {item.stock}
                              </Text>
                            </View>

                            <View style={styles.statItem}>
                              <Text
                                style={[
                                  styles.statItemLabel,
                                  { color: isDarkMode ? "#64748B" : "#94A3B8" },
                                ]}
                              >
                                Rented
                              </Text>
                              <Text
                                style={[
                                  styles.statItemValue,
                                  {
                                    color:
                                      (item.rented || 0) > 0
                                        ? "#EA580C"
                                        : isDarkMode
                                        ? "#64748B"
                                        : "#94A3B8",
                                  },
                                ]}
                              >
                                {item.rented || 0}
                              </Text>
                            </View>

                            <View style={styles.statItem}>
                              <Text
                                style={[
                                  styles.statItemLabel,
                                  { color: isDarkMode ? "#64748B" : "#94A3B8" },
                                ]}
                              >
                                Available
                              </Text>
                              <Text
                                style={[
                                  styles.statItemValue,
                                  { color: "#16A34A" },
                                ]}
                              >
                                {availableStock}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Stock Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressHeader}>
                            <Text
                              style={[
                                styles.progressLabel,
                                { color: isDarkMode ? "#94A3B8" : "#64748B" },
                              ]}
                            >
                              Stock Availability
                            </Text>
                            <Text
                              style={[
                                styles.progressPercentage,
                                { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                              ]}
                            >
                              {stockPercentage}% available
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.progressBar,
                              {
                                backgroundColor: isDarkMode
                                  ? "#334155"
                                  : "#E2E8F0",
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Number(
                                    stockPercentage
                                  )}%` as `${number}%`,
                                  backgroundColor:
                                    Number(stockPercentage) > 50
                                      ? "#16A34A"
                                      : Number(stockPercentage) > 20
                                      ? "#EA580C"
                                      : "#DC2626",
                                },
                              ]}
                            />
                          </View>
                        </View>

                        {/* Expand Button */}
                        {(item.rented || 0) > 0 && (
                          <TouchableOpacity
                            style={styles.expandButton}
                            onPress={() => toggleExpand(item.id)}
                          >
                            <Ionicons
                              name={
                                isExpanded
                                  ? "chevron-up-outline"
                                  : "chevron-down-outline"
                              }
                              size={18}
                              color="#2563EB"
                            />
                            <Text style={styles.expandButtonText}>
                              {isExpanded
                                ? "Hide rental details"
                                : `Show ${rentals.length} rental${
                                    rentals.length !== 1 ? "s" : ""
                                  }`}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Expanded Rental Details */}
                    {isExpanded && rentals.length > 0 && (
                      <View
                        style={[
                          styles.rentalDetails,
                          {
                            backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                            borderTopColor: isDarkMode ? "#334155" : "#E2E8F0",
                          },
                        ]}
                      >
                        <View style={styles.rentalHeader}>
                          <Ionicons
                            name="calendar-outline"
                            size={16}
                            color={isDarkMode ? "#94A3B8" : "#64748B"}
                          />
                          <Text
                            style={[
                              styles.rentalHeaderText,
                              { color: isDarkMode ? "#94A3B8" : "#64748B" },
                            ]}
                          >
                            Rental History
                          </Text>
                        </View>

                        {rentals.map((rental) => (
                          <View
                            key={rental.id}
                            style={[
                              styles.rentalCard,
                              {
                                backgroundColor: isDarkMode
                                  ? "#1E293B"
                                  : "#FFFFFF",
                                borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                              },
                            ]}
                          >
                            <View style={styles.rentalCardContent}>
                              <View style={styles.rentalUserInfo}>
                                <View
                                  style={[
                                    styles.userIcon,
                                    { backgroundColor: "#DBEAFE" },
                                  ]}
                                >
                                  <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color="#2563EB"
                                  />
                                </View>
                                <View>
                                  <Text
                                    style={[
                                      styles.rentalUserId,
                                      {
                                        color: isDarkMode
                                          ? "#F1F5F9"
                                          : "#1E293B",
                                      },
                                    ]}
                                  >
                                    User ID: {rental.userId}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.rentalId,
                                      {
                                        color: isDarkMode
                                          ? "#64748B"
                                          : "#94A3B8",
                                      },
                                    ]}
                                  >
                                    Rental: {rental.id.slice(0, 8)}
                                  </Text>
                                </View>
                              </View>

                              <View style={styles.rentalStats}>
                                <Text
                                  style={[
                                    styles.rentalQuantity,
                                    {
                                      color: isDarkMode ? "#F1F5F9" : "#1E293B",
                                    },
                                  ]}
                                >
                                  {rental.quantity} units
                                </Text>
                                <View style={styles.rentalTimeInfo}>
                                  <Ionicons
                                    name="time-outline"
                                    size={12}
                                    color={isDarkMode ? "#64748B" : "#94A3B8"}
                                  />
                                  <Text
                                    style={[
                                      styles.rentalTime,
                                      {
                                        color: isDarkMode
                                          ? "#64748B"
                                          : "#94A3B8",
                                      },
                                    ]}
                                  >
                                    {getDaysAgo(rental.timestamp)}
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.rentalDate,
                                    {
                                      color: isDarkMode ? "#64748B" : "#94A3B8",
                                    },
                                  ]}
                                >
                                  {formatDate(rental.timestamp)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}

              {filteredEquipment.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="cube-outline"
                    size={64}
                    color={isDarkMode ? "#475569" : "#CBD5E1"}
                  />
                  <Text
                    style={[
                      styles.emptyStateTitle,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    No equipment found
                  </Text>
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: isDarkMode ? "#64748B" : "#94A3B8" },
                    ]}
                  >
                    Try adjusting your search or filter criteria
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={resetForm}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF" },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDarkMode ? "#F1F5F9" : "#1E293B" },
                ]}
              >
                {editingItem ? "Edit Equipment" : "Add Equipment"}
              </Text>

              <ScrollView style={styles.formScroll}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDarkMode ? "#CBD5E1" : "#475569" }]}>Item Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                        color: isDarkMode ? "#F1F5F9" : "#1E293B",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      },
                    ]}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="e.g., Cricket Bat"
                    placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDarkMode ? "#CBD5E1" : "#475569" }]}>Sport Category</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                        color: isDarkMode ? "#F1F5F9" : "#1E293B",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      },
                    ]}
                    value={formData.sport}
                    onChangeText={(text) => setFormData({ ...formData, sport: text })}
                    placeholder="e.g., Cricket"
                    placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDarkMode ? "#CBD5E1" : "#475569" }]}>Total Stock</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                        color: isDarkMode ? "#F1F5F9" : "#1E293B",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      },
                    ]}
                    value={formData.stock}
                    onChangeText={(text) => setFormData({ ...formData, stock: text })}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDarkMode ? "#CBD5E1" : "#475569" }]}>Image URL (Optional)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDarkMode ? "#0F172A" : "#F8FAFC",
                        color: isDarkMode ? "#F1F5F9" : "#1E293B",
                        borderColor: isDarkMode ? "#334155" : "#E2E8F0",
                      },
                    ]}
                    value={formData.img}
                    onChangeText={(text) => setFormData({ ...formData, img: text })}
                    placeholder="https://..."
                    placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={resetForm}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEquipment}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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

  // Stats Cards
  statsContainer: {
    gap: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minWidth: "48%",
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Search and Filter
  filterContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  filterButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Inventory List
  inventoryList: {
    gap: 16,
  },
  inventoryCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemRow: {
    padding: 16,
    flexDirection: "row",
    gap: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    gap: 12,
  },
  itemHeader: {
    gap: 12,
  },
  itemTitleContainer: {
    gap: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  itemSport: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statItemLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  statItemValue: {
    fontSize: 20,
    fontWeight: "bold",
  },

  // Progress Bar
  progressContainer: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  // Expand Button
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  // Rental Details
  rentalDetails: {
    borderTopWidth: 1,
    padding: 12,
    gap: 12,
  },
  rentalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rentalHeaderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  rentalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  rentalCardContent: {
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 4,
  },
  rentalUserInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rentalUserId: {
    fontSize: 15,
    fontWeight: "600",
  },
  rentalId: {
    fontSize: 12,
    fontWeight: "500",
  },
  rentalStats: {
    alignItems: "flex-end",
    gap: 4,
  },
  rentalQuantity: {
    fontSize: 16,
    fontWeight: "600",
  },
  rentalTimeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rentalTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  rentalDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Empty State
  emptyState: {
    alignItems: "center",
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Add Button
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Header Actions
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    maxHeight: "80%",
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  formScroll: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#EF4444",
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
