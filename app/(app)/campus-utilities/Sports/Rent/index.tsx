import HapticPressable from "@/components/HapticPressable";
import { ServiceLayout } from "@/components/ServiceLayout";
import { ThemedLayout } from "@/components/ThemedLayout";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const icon = "football";
const title = "Sports Services";

const sports = [
  "Football",
  "Basketball",
  "Tennis",
  "Cricket",
  "Badminton",
  "Swimming",
  "Volleyball",
  "Table Tennis",
  "Hockey",
  "Athletics",
];

export default function Page() {
  const [selectedSport, setSelectedSport] = useState("Select a sport");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        <ScrollView style={styles.container}>

          
          {/* Dropdown */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Text style={styles.dropdownButtonText}>{selectedSport}</Text>
              <Ionicons
                name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color="#22c55e"
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                {sports.map((sport, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownItem,
                      selectedSport === sport && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedSport(sport);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedSport === sport &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {sport}
                    </Text>

                    {selectedSport === sport && (
                      <Ionicons name="checkmark" size={20} color="#22c55e" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Rent Button */}
        <HapticPressable onPress={() => alert("Rent Equipment Pressed")}>
          <View style={styles.rentButton}>
            <Text style={styles.rentButtonText}>Rent Equipment</Text>
          </View>
        </HapticPressable>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    height: 1000,
  },

  // Search Bar
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIconContainer: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },

  // Dropdown
  dropdownContainer: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#22c55e",
    elevation: 3,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#22c55e",
    maxHeight: 300,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#f0fdf4",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#22c55e",
    fontWeight: "600",
  },

  // Rent Button
  rentButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    margin: 16,
    elevation: 5,
  },
  rentButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
