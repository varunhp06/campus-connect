import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from './ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import HapticPressable  from './HapticPressable'

interface UtilityCard {
  id: string;
  title: string;
  description: string;
  icon: ImageSourcePropType;
  color: string;
  route: string;
}

interface ActivityItem {
  id: string;
  date: string;
  tab: string;
  month: string;
  title: string;
  description: string;
}

export const HomeContent: React.FC = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'SPORTS' | 'CULT' | 'TECH' | 'ALL'>('SPORTS');

  const utilities: UtilityCard[] = [
    {
      id: '1',
      title: 'Night Delivery',
      description: 'Late-night food orders delivered to your hostel after mess hours',
      icon: require('../assets/images/icons/night-delivery.png'),
      color: '#2196F3',
      route: '/campus-utilities/NightDeliverySection',
    },
    {
      id: '2',
      title: 'Sports Section',
      description: 'Sports hub for complaints, equipment requests, and event updates.',
      icon: require('../assets/images/icons/sports.png'),
      color: '#4CAF50',
      route: '/campus-utilities/SportsSection',
    },
    {
      id: '3',
      title: 'Cycle Rental',
      description: 'Enjoy casual rides around campus',
      icon: require('../assets/images/icons/cycle-rental.png'),
      color: '#FFC107',
      route: '/campus-utilities/CycleSection',
    },
  ];

  const tabColors: Record<string, string> = {
    SPORTS: '#4CAF50',
    CULT: '#E91E63',
    TECH: '#2196F3',
    ALL: '#FF9800',
  };

  const activities: ActivityItem[] = [
    { id: '1', date: '25', tab: 'SPORTS', month: 'SEP', title: 'Annual Sports Meet', description: 'Inter-department athletics, track & field, and team games' },
    { id: '2', date: '30', tab: 'SPORTS', month: 'SEP', title: 'College Marathon Run', description: 'A 5K/10K run event for all students and faculty' },
    { id: '3', date: '10', tab: 'SPORTS', month: 'OCT', title: 'Indoor Sports Festival', description: 'Badminton, Table Tennis, Chess, and Carrom competitions' },
    { id: '5', date: '12', tab: 'CULT', month: 'OCT', title: 'Inter-College Cult Cup', description: 'Watch top city colleges for a knockout-style tournament' },
   // { id: '6', date: '13', tab: 'TECH', month: 'OCT', title: 'Inter-College Tech Cup', description: 'Tech events and hackathons' },
    { id: '7', date: '14', tab: 'CULT', month: 'OCT', title: 'Inter-College Dance Cup', description: 'City colleges compete in dance battles' },
  ];

  const filteredActivities =
    selectedTab === 'ALL' ? activities : activities.filter((a) => a.tab === selectedTab);

  const services = [
    {
      id: '1',
      title: 'Administration',
      description: 'Find personnel details with contact info',
      icon: require('../assets/images/icons/administration.png'),
      color: '#2196F3',
      route: '/campus-services/AdministrationSection',
    },
    {
      id: '2',
      title: 'Lost and Found',
      description: 'Report lost items and find your belongings',
      icon: require('../assets/images/icons/lost-and-found.png'),
      color: '#E84343',
      route: '/campus-services/LostAndFoundSection',
    },
    {
      id: '3',
      title: 'FAQs',
      description: 'Quick help for everything',
      icon: require('../assets/images/icons/faq.png'),
      color: '#FFC107',
      route: '/campus-services/FAQSection',
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.searchContainer}>
        <View style={styles.searchIconContainer}>
          <Ionicons name="search" color={theme.text} size={20} />
        </View>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            },
          ]}
          placeholder="Search"
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Campus Utilities</Text>
        {utilities.map((utility) => (
          <HapticPressable
            key={utility.id}
            style={({ pressed }) => [
              styles.utilityCard,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() =>
              utility.route ? router.push(utility.route) : alert('Coming soon 🚧')
            }
          >
            <View style={[styles.utilityBorder, { backgroundColor: utility.color }]} />
            <Image source={utility.icon} style={styles.utilityImage} resizeMode="contain" />
            <View style={styles.utilityContent}>
              <Text style={[styles.utilityTitle, { color: utility.color }]}>{utility.title}</Text>
              <Text style={[styles.utilityDescription, { color: theme.placeholder }]}>
                {utility.description}
              </Text>
            </View>
          </HapticPressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Activity</Text>

        <View
          style={[
            styles.tabContainer,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          {['SPORTS', 'CULT', 'TECH', 'ALL'].map((tab) => (
            <HapticPressable
              key={tab}
              style={({ pressed }) => [
                styles.tab,
                selectedTab === tab && {
                  borderBottomWidth: 2,
                  borderBottomColor: tabColors[tab],
                },
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setSelectedTab(tab as typeof selectedTab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedTab === tab ? tabColors[tab] : theme.placeholder },
                ]}
              >
                {tab}
              </Text>
            </HapticPressable>
          ))}
        </View>

        <View
          style={[
            styles.activityContainer,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          {filteredActivities.length === 0 ? (
            <ScrollView
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              style={{ minHeight: 300, maxHeight: 300 }}
              contentContainerStyle={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.placeholder, textAlign: 'center' }}>
                No upcoming {selectedTab.toLowerCase()} events.
              </Text>
            </ScrollView>

          ) : (
            <ScrollView
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              style={{ minHeight: 300, maxHeight: 300 }}
            >
              {filteredActivities.map((item, index) => (
                <View key={item.id}>
                  <HapticPressable
                    style={({ pressed }) => [
                      styles.activityItem,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.dateBox,
                        { backgroundColor: tabColors[item.tab] || '#5C9FD6' },
                      ]}
                    >
                      <Text style={styles.dateNumber}>{item.date}</Text>
                      <Text style={styles.dateMonth}>{item.month}</Text>
                    </View>

                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: theme.text }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.activityDescription, { color: theme.placeholder }]}>
                        {item.description}
                      </Text>
                    </View>
                  </HapticPressable>
                  {index < filteredActivities.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <HapticPressable
          style={({ pressed }) => [
            styles.viewMoreButton,
            { opacity: pressed ? 0.7 : 1 },
            { backgroundColor: theme.inputBackground}
          ]}
          onPress={() => alert('Show all activities coming soon 🚧')}
        >
          <Text style={styles.viewMoreText}>View All</Text>
        </HapticPressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Campus Services</Text>
        {services.map((service) => (
          <HapticPressable
            key={service.id}
            style={({ pressed }) => [
              styles.utilityCard,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() =>
              service.route ? router.push(service.route) : alert('Coming soon 🚧')
            }
          >
            <View style={[styles.utilityBorder, { backgroundColor: service.color }]} />
            <Image source={service.icon} style={styles.utilityImage} resizeMode="contain" />
            <View style={styles.utilityContent}>
              <Text style={[styles.utilityTitle, { color: service.color }]}>{service.title}</Text>
              <Text style={[styles.utilityDescription, { color: theme.placeholder }]}>
                {service.description}
              </Text>
            </View>
          </HapticPressable>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 28,
    marginTop: 20,
  },
  searchIconContainer: {
    position: 'absolute',
    left: 36,
    zIndex: 1,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    paddingHorizontal: 48,
    fontSize: 16,
    borderWidth: 0.7,
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  utilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.7,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  utilityBorder: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 10 },
  utilityImage: { height: 56, width: 56, marginLeft: 8, marginRight: 12 },
  utilityContent: { flex: 1 },
  utilityTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  utilityDescription: { fontSize: 12 },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 0.7,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  activityContainer: { borderRadius: 12, borderWidth: 0.7, overflow: 'hidden' },
  activityItem: { flexDirection: 'row', padding: 16 },
  dateBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateNumber: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  dateMonth: { fontSize: 10, fontWeight: '600', color: '#fff' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  activityDescription: { fontSize: 12 },
  divider: { height: 1, marginLeft: 78 },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#FF9800',
    borderWidth: 2
  },
  viewMoreText: { color: '#FF9800', fontSize: 16, fontWeight: '600' },
});