// app/ProfilePage.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { AdministrationMember } from '@/components/data/administration';
import { useTheme } from '@/components/ThemeContext';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ServiceLayout } from '@/components/ServiceLayout';

export default function ProfilePage() {
  const params = useLocalSearchParams();
  const member = JSON.parse(params.member as string) as AdministrationMember;
  const { theme } = useTheme();

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
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Profile Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: member.image }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>

          {/* Name */}
          <Text style={[styles.name, { color: theme.text }]}>{member.name}</Text>

          {/* Department */}
          {member.department && (
            <Text style={[styles.department, { color: theme.text }]}>
              {member.department}
            </Text>
          )}

          {/* Description */}
          {member.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
              <Text style={[styles.description, { color: theme.text }]}>
                {member.description}
              </Text>
            </View>
          )}

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
            
            {/* Email */}
            <TouchableOpacity 
              style={[styles.contactItem, { backgroundColor: theme.inputBackground }]}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <View style={styles.contactHeader}>
                <Ionicons name="mail-outline" size={20} color={theme.text} />
                <Text style={[styles.contactLabel, { color: theme.text }]}>Email</Text>
              </View>
              <Text style={[styles.contactValue, { color: '#2196F3' }]}>{member.email}</Text>
            </TouchableOpacity>

            {/* Phone */}
            {member.phone && (
              <TouchableOpacity 
                style={[styles.contactItem, { backgroundColor: theme.inputBackground }]}
                onPress={handlePhone}
                activeOpacity={0.7}
              >
                <View style={styles.contactHeader}>
                  <Ionicons name="call-outline" size={20} color={theme.text} />
                  <Text style={[styles.contactLabel, { color: theme.text }]}>Phone</Text>
                </View>
                <Text style={[styles.contactValue, { color: '#2196F3' }]}>{member.phone}</Text>
              </TouchableOpacity>
            )}

            {/* Office */}
            {member.office && (
              <View style={[styles.contactItem, { backgroundColor: theme.inputBackground }]}>
                <View style={styles.contactHeader}>
                  <Ionicons name="location-outline" size={20} color={theme.text} />
                  <Text style={[styles.contactLabel, { color: theme.text }]}>Office</Text>
                </View>
                <Text style={[styles.contactValue, { color: theme.text }]}>{member.office}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      </ServiceLayout>
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderWidth: 0.75,
    borderColor: '#fff',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  department: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  contactItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  contactLabel: {
    fontSize: 14,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 28,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
});