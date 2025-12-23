// app/ProfilePage.tsx
import { useDialog } from "@/components/DialogContext";
import { ServiceLayout } from "@/components/ServiceLayout";
import { useTheme } from "@/components/ThemeContext";
import { ThemedLayout } from "@/components/ThemedLayout";
import { auth } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function ProfilePage() {
  const { isDarkMode, theme } = useTheme();
  const { showDialog } = useDialog();
  const router = useRouter();

  // Replace with actual Firebase user + profile info
  const user = {
    name: "Manas Yadav",
    email: "23ucs637@lnmiit.ac.in",
    hostel: "BH3",
    year: "3rd",
    phone: "+91 8303155087",
    parentName: "Vinod Yadav",
    parentPhone: "+91 7081002135",
    roomNo: "D622",
  };

  const handleLogout = async () => {
    showDialog({
      title: 'Log Out',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut(auth);
            router.replace("/LoginScreen");
          },
        },
      ],
    });
  };

  return (
    <ThemedLayout showNavbar>
      <ServiceLayout icon="person-circle-outline" title="Profile" showTitle>
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: "#06B6D4",
                    shadowColor: isDarkMode ? "#000" : "#06B6D4",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDarkMode ? 0.3 : 0.2,
                    shadowRadius: 8,
                  },
                ]}
              >
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.editButton,
                  {
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    borderWidth: 2,
                    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                  },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={isDarkMode ? "#60A5FA" : "#3B82F6"}
                />
              </TouchableOpacity>
            </View>

            {/* Name & Email */}
            <Text
              style={[
                styles.name,
                { color: isDarkMode ? "#F3F4F6" : "#1F2937" },
              ]}
            >
              {user.name}
            </Text>
            <Text
              style={[
                styles.email,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {user.email}
            </Text>

            {/* Quick Info Section */}
            <View style={styles.quickRow}>
              <View style={[styles.quickCard]}>
                <Ionicons
                  name="home-outline"
                  size={28}
                  color={isDarkMode ? "#60A5FA" : "#3B82F6"}
                />
                <Text
                  style={[
                    styles.quickTitle,
                    { color: isDarkMode ? "#F3F4F6" : "#1F2937" },
                  ]}
                >
                  {user.hostel}
                </Text>
                <Text
                  style={[
                    styles.quickSubtitle,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Hostel
                </Text>
              </View>

              <View style={[styles.quickCard]}>
                <Ionicons
                  name="school-outline"
                  size={28}
                  color={isDarkMode ? "#60A5FA" : "#3B82F6"}
                />
                <Text
                  style={[
                    styles.quickTitle,
                    { color: isDarkMode ? "#F3F4F6" : "#1F2937" },
                  ]}
                >
                  {user.year}
                </Text>
                <Text
                  style={[
                    styles.quickSubtitle,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Year
                </Text>
              </View>
            </View>

            {/* Detailed Info */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <InfoRow
                label="Phone No"
                value={user.phone}
                isDarkMode={isDarkMode}
              />
              <InfoRow
                label="Parent's Name"
                value={user.parentName}
                isDarkMode={isDarkMode}
              />
              <InfoRow
                label="Parent's Phone"
                value={user.parentPhone}
                isDarkMode={isDarkMode}
              />
              <InfoRow
                label="Room No"
                value={user.roomNo}
                isDarkMode={isDarkMode}
                isLast
              />
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(220, 38, 38, 0.08)",
                  borderColor: "#DC2626",
                },
              ]}
              onPress={() => handleLogout()}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#DC2626"
                style={styles.logoutIcon}
              />
              <Text style={styles.logoutText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ServiceLayout>
    </ThemedLayout>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  isDarkMode: boolean;
  isLast?: boolean;
}

const InfoRow = ({ label, value, isDarkMode, isLast }: InfoRowProps) => (
  <View
    style={[
      styles.infoRow,
      isLast && styles.infoRowLast,
      !isLast && {
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? "#374151" : "#F3F4F6",
      },
    ]}
  >
    <Text
      style={[styles.infoLabel, { color: isDarkMode ? "#9CA3AF" : "#6B7280" }]}
    >
      {label}
    </Text>
    <Text
      style={[styles.infoValue, { color: isDarkMode ? "#F3F4F6" : "#1F2937" }]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  avatarWrapper: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "#06B6D430",
    borderRadius: 100,
    height: 105,
    width: 105,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  avatarText: {
    color: "white",
    fontWeight: "800",
    fontSize: 50,
  },

  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  name: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 3,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginVertical: 15,
    width: "100%",
  },
  quickCard: {
    flex: 1,
    maxWidth: 160,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  quickSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoCard: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoRowLast: {
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
  },

  logoutBtn: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    gap: 8,
  },
  logoutIcon: {
    marginRight: -4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#DC2626",
    letterSpacing: 0.5,
  },
});
