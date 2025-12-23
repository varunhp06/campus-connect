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

export default function SettingsPage() {
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const { showDialog } = useDialog();
  const router = useRouter();

  const user = {
    name: "Manas Yadav",
    email: "23ucs637@lnmiit.ac.in",
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
      <ServiceLayout icon="settings-outline" title="Settings" showTitle>
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
                  },
                ]}
              >
                <Text style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Name & Email */}
            <Text style={[styles.name, { color: theme.text }]}>
              {user.name}
            </Text>
            <Text style={[styles.email, { color: theme.placeholder }]}>
              {user.email}
            </Text>

            {/* Preferences Section */}
            <Text style={[styles.sectionTitle, { color: theme.placeholder }]}>
              Preferences
            </Text>

            <SettingRow
              icon="language-outline"
              title="Language"
              value="English"
              onPress={() => console.log("Change Language")}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            <SettingRow
              icon="color-palette-outline"
              title="Theme"
              value={isDarkMode ? "Dark" : "Light"}
              onPress={() => toggleTheme()}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            <SettingRow
              icon="notifications-outline"
              title="Notifications"
              value="Allowed"
              onPress={() => console.log("Notifications")}
              theme={theme}
              isDarkMode={isDarkMode}
            />

            {/* Content Section */}
            <Text style={[styles.sectionTitle, { color: theme.placeholder }]}>
              Content
            </Text>

            <SettingRow
              icon="time-outline"
              title="Order History"
              value="View"
              onPress={() =>
                router.push("/campus-utilities/Canteen/User/OrderHistory")
              }
              theme={theme}
              isDarkMode={isDarkMode}
            />

            <SettingRow
              icon="chatbox-ellipses-outline"
              title="Complaints"
              value="View"
              onPress={() => router.push("/campus-utilities/Sports/Complaints")}
              theme={theme}
              isDarkMode={isDarkMode}
              isLast
            />

            {/* Logout */}
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
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={[styles.logoutText]}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ServiceLayout>
    </ThemedLayout>
  );
}

interface RowProps {
  icon: any;
  title: string;
  value: string;
  theme: any;
  isDarkMode: boolean;
  onPress: () => void;
  isLast?: boolean;
}

const SettingRow = ({
  icon,
  title,
  value,
  theme,
  isDarkMode,
  onPress,
  isLast,
}: RowProps) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.row,
      {
        backgroundColor: theme.card,
      },
    ]}
  >
    <View style={styles.rowLeft}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9",
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
    </View>
    <Text style={[styles.rowValue, { color: theme.placeholder }]}>{value}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  container: { alignItems: "center", paddingHorizontal: 20 },

  avatarWrapper: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    backgroundColor: "#06B6D430",
    borderRadius: 100,
    height: 95,
    width: 95,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  avatarText: { color: "white", fontWeight: "800", fontSize: 50 },

  name: { fontSize: 20, fontWeight: "800", marginTop: 5 },
  email: { fontSize: 12, fontWeight: "500", marginTop: 3 },

  sectionTitle: {
    width: "100%",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 10,
    letterSpacing: 0.5,
  },

  row: {
    width: "100%",
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  logoutBtn: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#DC2626",
    marginLeft: 6,
  },
});
