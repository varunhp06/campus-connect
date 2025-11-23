// app/ProfilePage.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
} from "react-native";
import { ThemedLayout } from "@/components/ThemedLayout";
import { AdministrationMember } from "@/components/data/administration";
import { useTheme } from "@/components/ThemeContext";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ServiceLayout } from "@/components/ServiceLayout";

export default function ProfilePage() {
  const params = useLocalSearchParams();
  const member = JSON.parse(params.member as string) as AdministrationMember;
  const { theme, isDarkMode } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleEmail = () => {
    if (member.email) {
      Linking.openURL(`mailto:${member.email}`);
    }
  };

  const handlePhone = () => {
    if (member.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };

  const toggleDescription = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const shouldShowReadMore = member.description && member.description.length > 120;

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <ServiceLayout>
        <Animated.ScrollView
          style={[styles.container, { opacity: fadeAnim }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Header Section */}
            <View style={[
              styles.headerSection,
              {
                backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.7)" : "rgba(255, 255, 255, 0.8)",
              }
            ]}>
              <Animated.View
                style={[
                  styles.imageContainer,
                  {
                    transform: [
                      {
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={[
                  styles.avatarContainer,
                  { 
                    backgroundColor: isDarkMode ? "rgba(34, 143, 22, 0.1)" : "rgba(34, 143, 22, 0.05)",
                    borderColor: isDarkMode ? "rgba(34, 143, 22, 0.3)" : "rgba(34, 143, 22, 0.1)",
                  }
                ]}>
                  {member.image ? (
                    <Image
                      source={{ uri: member.image }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={[
                      styles.initialsContainer,
                      { backgroundColor: "#228f16ff" }
                    ]}>
                      <Text style={styles.initialsText}>
                        {getInitials(member.name)}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Name + Title */}
              <View style={styles.titleContainer}>
                <Text style={[styles.name, { color: theme.text }]}>
                  {member.name}
                </Text>
                {member.department && (
                  <Text
                    style={[
                      styles.department,
                      { color: isDarkMode ? "#94A3B8" : "#64748B" },
                    ]}
                  >
                    {member.department}
                  </Text>
                )}
              </View>

              {/* Quick Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: isDarkMode ? "rgba(34, 143, 22, 0.15)" : "rgba(34, 143, 22, 0.08)" }
                  ]}
                  onPress={handleEmail}
                >
                  <Ionicons name="mail-outline" size={20} color="#228f16ff" />
                </TouchableOpacity>
                {member.phone && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.08)" }
                    ]}
                    onPress={handlePhone}
                  >
                    <Ionicons name="call-outline" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Description Section */}
            {member.description && (
              <View style={[
                styles.section,
                {
                  backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.6)",
                }
              ]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#228f16ff"
                  />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    About
                  </Text>
                </View>
                <Text
                  style={[
                    styles.description,
                    { color: isDarkMode ? "#94A3B8" : "#64748B" },
                  ]}
                  numberOfLines={isExpanded ? undefined : 3}
                >
                  {member.description}
                </Text>
                {shouldShowReadMore && (
                  <TouchableOpacity onPress={toggleDescription} style={styles.readMoreButton}>
                    <Text style={[
                      styles.readMoreText,
                      { color: "#228f16ff" }
                    ]}>
                      {isExpanded ? "Read Less" : "Read More"}
                    </Text>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#228f16ff" 
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Contact Information */}
            <View style={[
              styles.section,
              {
                backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.6)",
              }
            ]}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="at-circle-outline"
                  size={18}
                  color="#228f16ff"
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Contact
                </Text>
              </View>

              {/* Email */}
              <TouchableOpacity
                style={[
                  styles.contactItem,
                  {
                    backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "rgba(248, 250, 252, 0.8)",
                  },
                ]}
                onPress={handleEmail}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconContainer}>
                  <Ionicons name="mail-outline" size={18} color="#228f16ff" />
                </View>
                <View style={styles.contactContent}>
                  <Text style={[styles.contactValue, { color: theme.text }]}>
                    {member.email}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Phone */}
              {member.phone && (
                <TouchableOpacity
                  style={[
                    styles.contactItem,
                    {
                      backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "rgba(248, 250, 252, 0.8)",
                    },
                  ]}
                  onPress={handlePhone}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactIconContainer}>
                    <Ionicons name="call-outline" size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={[styles.contactValue, { color: theme.text }]}>
                      {member.phone}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Office */}
              {member.office && (
                <View
                  style={[
                    styles.contactItem,
                    {
                      backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.4)" : "rgba(248, 250, 252, 0.8)",
                    },
                  ]}
                >
                  <View style={styles.contactIconContainer}>
                    <Ionicons name="business-outline" size={18} color="#A855F7" />
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={[styles.contactValue, { color: theme.text }]}>
                      {member.office}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.ScrollView>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    marginBottom: 8,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  initialsContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  initialsText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  department: {
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 20,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "left",
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(34, 143, 22, 0.1)",
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
});