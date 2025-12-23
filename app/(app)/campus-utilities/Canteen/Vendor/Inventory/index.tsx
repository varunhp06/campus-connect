import { useDialog } from "@/components/DialogContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { useToast } from "@/components/ToastContext";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  SectionList,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Types ---
interface MenuItem {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  category: string;
  img?: string;
  isVeg?: boolean;
}

interface SectionData {
  title: string;
  data: MenuItem[];
}

const InventoryScreen = () => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { showDialog } = useDialog();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "instock" | "outofstock">("all");

  // --- Add Item State ---
  const [isModalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    // Category removed from state
    img: "", 
    isVeg: true,
  });
  const [adding, setAdding] = useState(false);

  const userId = "uMs7DQkbWE4jLLnUHxYQ"; 

  // --- Data Fetching ---
  const fetchMenu = async () => {
    try {
      const menuRef = collection(db, "shops", userId, "menu");
      const snapshot = await getDocs(menuRef);
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      
      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching menu:", error);
      showToast("Could not load menu items", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleStock = async (itemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setMenuItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, inStock: newStatus } : item
      )
    );

    try {
      const itemRef = doc(db, "shops", userId, "menu", itemId);
      await updateDoc(itemRef, { inStock: newStatus });
    } catch (error) {
      console.error("Error updating stock:", error);
      showToast("Failed to update stock status", "error");
      setMenuItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, inStock: currentStatus } : item
        )
      );
    }
  };

  // --- Image Picker Logic (Camera & Gallery) ---
  const showImageOptions = () => {
    showDialog({
        title: "Upload Photo",
        message: "Choose an option",
        buttons: [
            { text: "Camera", onPress: () => pickImage(true) },
            { text: "Gallery", onPress: () => pickImage(false) },
            { text: "Cancel", style: "cancel" }
        ]
    });
  };

  const pickImage = async (useCamera: boolean) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
    };

    if (useCamera) {
        // Request camera permission
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.granted === false) {
            showToast("Camera access is needed to take photos", "warning");
            return;
        }
        result = await ImagePicker.launchCameraAsync(options);
    } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setNewItem({ ...newItem, img: result.assets[0].uri });
    }
  };

  const uploadImageAsync = async () => {
    console.log("uploaded")
    return "hi"
  };

  // --- Add Item Logic ---
  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      showToast("Please enter Item Name and Price", "warning");
      return;
    }

    try {
      setAdding(true);
      
      let finalImageUrl = newItem.img;
      if (newItem.img && !newItem.img.startsWith('http')) {
          finalImageUrl = await uploadImageAsync() || "";
      }

      const payload = {
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: "General", // Default Category since input was removed
        img: finalImageUrl,
        isVeg: newItem.isVeg,
        inStock: true,
      };

      const docRef = await addDoc(collection(db, "shops", userId, "menu"), payload);
      const createdItem: MenuItem = { id: docRef.id, ...payload } as MenuItem;
      setMenuItems((prev) => [...prev, createdItem]);
      
      setModalVisible(false);
      setNewItem({ name: "", price: "", img: "", isVeg: true }); 
    } catch (error) {
      console.error("Error adding item:", error);
      showToast("Failed to add item. Check your connection", "error");
    } finally {
      setAdding(false);
    }
  };

  // --- Filtering ---
  const processedData = useMemo(() => {
    const filtered = menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        filterType === "all"
          ? true
          : filterType === "instock"
          ? item.inStock
          : !item.inStock;

      return matchesSearch && matchesType;
    });

    const grouped = filtered.reduce((acc, item) => {
      const category = item.category || "Others";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);

    return Object.keys(grouped).map((key) => ({
      title: key,
      data: grouped[key],
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [menuItems, searchQuery, filterType]);

  // --- Components ---
  const renderItem = ({ item }: { item: MenuItem }) => (
    <View 
      style={[
        styles.card, 
        { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
        !item.inStock && { opacity: 0.7, backgroundColor: theme.background }
      ]}
    >
      <View style={styles.cardContent}>
        <View style={[styles.imageContainer, { backgroundColor: theme.background }]}>
            {item.img ? (
                <Image 
                    source={{ uri: item.img }} 
                    style={[styles.itemImage, !item.inStock && { opacity: 0.5 }]} 
                />
            ) : (
                <View style={[styles.placeholderImage, !item.inStock && { opacity: 0.5 }]}>
                    <Ionicons name="fast-food" size={24} color={theme.placeholder} />
                </View>
            )}
        </View>

        <View style={styles.itemInfo}>
          <View style={styles.nameRow}>
            <View style={[styles.vegDot, { borderColor: item.isVeg === false ? "#EF4444" : "#10B981" }]}>
                <View style={[styles.vegInner, { backgroundColor: item.isVeg === false ? "#EF4444" : "#10B981" }]} />
            </View>
            <Text 
              style={[
                styles.itemName, 
                { color: theme.text }, 
                !item.inStock && { color: theme.placeholder, textDecorationLine: 'line-through' }
              ]} 
              numberOfLines={2}
            >
              {item.name}
            </Text>
          </View>
          <Text style={[styles.itemPrice, { color: theme.primaryText }]}>₹{item.price}</Text>
        </View>

        <View style={styles.controlContainer}>
            <Text style={[styles.stockLabel, { color: item.inStock ? "#10B981" : "#EF4444" }]}>
                {item.inStock ? "In Stock" : "Out of Stock"}
            </Text>
            <Switch
                trackColor={{ false: theme.inputBorder, true: "#A7F3D0" }}
                thumbColor={item.inStock ? "#10B981" : theme.placeholder}
                ios_backgroundColor={theme.inputBorder}
                onValueChange={() => toggleStock(item.id, item.inStock)}
                value={item.inStock}
            />
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.primaryText }]}>{title}</Text>
    </View>
  );

  return (
    <ThemedLayout>
      <ServiceLayout icon="list" title="Inventory">
        
        {/* --- Header Controls --- */}
        <View style={[styles.headerControls, { backgroundColor: theme.background }]}>
             {/* ... Search Bar (Same as before) ... */}
            <View style={[
              styles.searchBar, 
              { 
                backgroundColor: theme.inputBackground, 
                borderColor: theme.inputBorder 
              }
            ]}>
            <Ionicons name="search" size={20} color={theme.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search items..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color={theme.placeholder} />
                </TouchableOpacity>
            )}
          </View>
           {/* ... Filter Chips (Same as before) ... */}
           <View style={styles.filterRow}>
            {(["all", "instock", "outofstock"] as const).map((t) => {
              const isActive = filterType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.filterChip, 
                    { backgroundColor: isActive ? theme.text : theme.inputBorder }
                  ]}
                  onPress={() => setFilterType(t)}
                >
                  <Text style={[
                    styles.filterText, 
                    { color: isActive ? theme.background : theme.primaryText }
                  ]}>
                    {t === "all" ? "All" : t === "instock" ? "In Stock" : "Out of Stock"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* --- List --- */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : (
          <SectionList
            sections={processedData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={[styles.listContainer, { backgroundColor: theme.background }]}
            stickySectionHeadersEnabled={true}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Ionicons name="fast-food-outline" size={48} color={theme.placeholder} />
                    <Text style={[styles.emptyText, { color: theme.placeholder }]}>No items found</Text>
                </View>
            }
          />
        )}

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>

        {/* --- Add Item Modal --- */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: theme.inputBackground }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Item</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={theme.placeholder} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{maxHeight: 500}}>
                        
                        {/* 1. Image Upload Section (New) */}
                        <TouchableOpacity 
                            style={[
                                styles.uploadArea, 
                                { backgroundColor: theme.background, borderColor: theme.inputBorder }
                            ]}
                            onPress={showImageOptions}
                        >
                            {newItem.img ? (
                                <Image source={{ uri: newItem.img }} style={styles.uploadedImage} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="camera" size={32} color={theme.placeholder} />
                                    <Text style={{ color: theme.primaryText, marginTop: 8 }}>
                                        Tap to add photo
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.inputLabel, { color: theme.primaryText }]}>Item Name</Text>
                        <TextInput 
                            style={[
                                styles.input, 
                                { 
                                    backgroundColor: theme.background, 
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }
                            ]} 
                            placeholder="e.g. Cheese Burger"
                            placeholderTextColor={theme.placeholder}
                            value={newItem.name}
                            onChangeText={(t) => setNewItem({...newItem, name: t})}
                        />

                        {/* Price Input */}
                        <Text style={[styles.inputLabel, { color: theme.primaryText }]}>Price (₹)</Text>
                        <TextInput 
                            style={[
                                styles.input, 
                                { 
                                    backgroundColor: theme.background, 
                                    borderColor: theme.inputBorder,
                                    color: theme.text
                                }
                            ]} 
                            placeholder="99"
                            placeholderTextColor={theme.placeholder}
                            keyboardType="numeric"
                            value={newItem.price}
                            onChangeText={(t) => setNewItem({...newItem, price: t})}
                        />

                        {/* Veg Switch */}
                        <View style={styles.switchRow}>
                            <Text style={[styles.inputLabel, { color: theme.primaryText, marginTop: 0 }]}>Is Vegetarian?</Text>
                            <Switch 
                                trackColor={{ false: "#EF4444", true: "#10B981" }}
                                value={newItem.isVeg}
                                onValueChange={(v) => setNewItem({...newItem, isVeg: v})}
                            />
                        </View>
                    </ScrollView>

                    <TouchableOpacity 
                        style={styles.saveBtn} 
                        onPress={handleAddItem}
                        disabled={adding}
                    >
                        {adding ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveBtnText}>Save Item</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>

      </ServiceLayout>
    </ThemedLayout>
  );
};

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  headerControls: { paddingHorizontal: 16, paddingBottom: 16 },
  searchBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  filterText: { fontSize: 12, fontWeight: "600" },
  sectionHeader: { paddingVertical: 12, marginTop: 8, marginBottom: 4 },
  sectionHeaderText: { fontSize: 16, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  card: { borderRadius: 12, padding: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, borderWidth: 1 },
  cardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  imageContainer: { width: 60, height: 60, borderRadius: 8, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  vegDot: { width: 14, height: 14, borderWidth: 1, borderRadius: 2, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  vegInner: { width: 8, height: 8, borderRadius: 4 },
  itemName: { fontSize: 15, fontWeight: "600", flex: 1 },
  itemPrice: { fontSize: 14, marginLeft: 22 },
  controlContainer: { alignItems: "flex-end", minWidth: 80 },
  stockLabel: { fontSize: 10, fontWeight: "700", marginBottom: 4, textTransform: "uppercase" },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { marginTop: 10 },
  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF6B35',
    alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', borderRadius: 16, padding: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  
  // New Image Upload Styles
  uploadArea: { height: 150, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  saveBtn: { backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

export default InventoryScreen;