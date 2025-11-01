import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { router, Router } from 'expo-router';
import { useTheme } from './ThemeContext';

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
  const [showAll, setShowAll] = useState(false);
  const utilities: UtilityCard[] = [
    {
      id: '1',
      title: 'Night Delivery',
      description: 'Late-night food orders delivered to your hostel after mess hours',
      icon: require('../assets/images/icons/night-delivery.png'),
      color: '#2196F3',
      route: '/campus-utilities/NightDeliverySection'
    },
    {
      id: '2',
      title: 'Sports Section',
      description: 'Sports hub for complaints, equipment requests, and event updates.',
      icon: require('../assets/images/icons/sports.png'),
      color: '#4CAF50',
      route: '/campus-utilities/SportsSection'
    },
    {
      id: '3',
      title: 'Cycle Rental',
      description: 'Enjoy casual rides around campus',
      icon: require('../assets/images/icons/cycle-rental.png'),
      color: '#FFC107',
      route: '/campus-utilities/CycleSection'
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
    { id: '6', date: '13', tab: 'TECH', month: 'OCT', title: 'Inter-College Tech Cup', description: 'Tech events and hackathons' },
    { id: '7', date: '14', tab: 'CULT', month: 'OCT', title: 'Inter-College Dance Cup', description: 'City colleges compete in dance battles' },
  ];

  const filteredActivities = selectedTab === 'ALL' ? activities : activities.filter((a) => a.tab === selectedTab);
  const visibleActivities = showAll ? filteredActivities : filteredActivities.slice(0, 2);

  const services = [
    { id: '1', title: 'Administration', description: 'Find personnel details with contact info', icon: require('../assets/images/icons/administration.png'), color: '#2196F3' },
    { id: '2', title: 'Lost and Found', description: 'Report lost items and find your belongings', icon: require('../assets/images/icons/lost-and-found.png'), color: '#E84343' },
    { id: '3', title: 'FAQs', description: 'Quick help for everything', icon: require('../assets/images/icons/faq.png'), color: '#FFC107' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <View style={styles.searchContainer}>
        <View style={styles.searchIconContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }
          ]}
          placeholder="Search"
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Campus Utilities
        </Text>
        {utilities.map((utility) => (
          <Pressable
            key={utility.id}
            style={({ pressed }) => [
              styles.utilityCard,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                opacity: pressed ? 0.7 : 1,
              }
            ]}
            onPress={() => {
              if (utility.route) {
                router.push(utility.route);
              } else {
                alert('Coming soon 🚧');
              }
            }}
          >
            <View style={[styles.utilityBorder, { backgroundColor: utility.color }]} />
            <View>
              <Image source={utility.icon} style={styles.utilityImage} resizeMode='contain'/>
            </View>
            <View style={styles.utilityContent}>
              <Text style={[styles.utilityTitle, { color: utility.color }]}>
                {utility.title}
              </Text>
              <Text style={[styles.utilityDescription, { color: theme.placeholder }]}>
                {utility.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

    <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Upcoming Activity
        </Text>

        <View style={[
          styles.tabContainer,
          {
            backgroundColor: theme.inputBackground,
            borderColor: theme.inputBorder,
          }
        ]}>
          {['SPORTS', 'CULT', 'TECH', 'ALL'].map((tab) => (
            <Pressable
              key={tab}
              style={({ pressed }) => [
                styles.tab,
                selectedTab === tab && {
                  borderBottomWidth: 2,
                  borderBottomColor: tabColors[tab],
                },
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => {
                setSelectedTab(tab as typeof selectedTab);
                setShowAll(false); 
              }}
            >
            <Text
              style={[
                styles.tabText,
                { color: selectedTab === tab ? tabColors[tab] : theme.placeholder },
              ]}
            >
              {tab}
            </Text>
            </Pressable>
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
      {visibleActivities.length === 0 ? (
        <Text style={{ color: theme.placeholder, textAlign: 'center', padding: 16 }}>
          No upcoming {selectedTab.toLowerCase()} events.
        </Text>
      ) : (
        visibleActivities.map((activity, index) => (
          <View key={activity.id}>
            <Pressable
              style={({ pressed }) => [
                styles.activityItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View
                style={[
                  styles.dateBox,
                  { backgroundColor: tabColors[selectedTab] || '#5C9FD6' },
                ]}
              >
                <Text style={styles.dateNumber}>{activity.date}</Text>
                <Text style={styles.dateMonth}>{activity.month}</Text>
              </View>

              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityDescription, { color: theme.placeholder }]}>
                  {activity.description}
                </Text>
              </View>
            </Pressable>

            {index < visibleActivities.length - 1 && (
              <View style={[styles.divider, { backgroundColor: theme.inputBorder }]} />
              )}
              </View>
        ))
      )}
    </View>

    {filteredActivities.length > 2 && (
      <Pressable
        style={({ pressed }) => [
          styles.viewMoreButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={() => setShowAll(!showAll)}
      >
        <Text style={styles.viewMoreText}>
          {showAll ? 'View Less ∧' : 'View More ⌄'}
        </Text>
      </Pressable>
    )}
  </View>


      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Campus Services
        </Text>
        {services.map((service) => (
          <Pressable
            key={service.id}
            style={({ pressed }) => [
              styles.utilityCard,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                opacity: pressed ? 0.7 : 1,
              }
            ]}
          >
            <View style={[styles.utilityBorder, { backgroundColor: service.color }]} />
            <View>
              <Image source={service.icon} style={styles.utilityImage} resizeMode='contain'/>
            </View>
            <View style={styles.utilityContent}>
              <Text style={[styles.utilityTitle, { color: service.color }]}>
                {service.title}
              </Text>
              <Text style={[styles.utilityDescription, { color: theme.placeholder }]}>
                {service.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      </ScrollView>
      </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 28,
    marginTop: 20
  },
  searchIconContainer: {
    position: 'absolute',
    left: 36,
    zIndex: 1,
  },
  searchIcon: {
    fontSize: 18
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    paddingHorizontal: 48,
    fontSize: 16,
    borderWidth: 0.7,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  utilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.7,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  utilityBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
  },
  utilityImage:{
    height: 56,
    width: 56,
    marginLeft: 8,
    marginRight: 12,
  },
  utilityContent: {
    flex: 1,
  },
  utilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  utilityDescription: {
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 0.7,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityContainer: {
    borderRadius: 12,
    borderWidth: 0.7,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
  },
  dateBox: {
    width: 50,
    height: 50,
    backgroundColor: '#5C9FD6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginLeft: 78,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  }
});

