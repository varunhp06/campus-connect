// app/SportsAffairs.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { AdministrationMember } from '@/components/data/administration';
import { db } from '@/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '@/components/ThemeContext';

export default function SportsAffairs() {
  const [members, setMembers] = useState<AdministrationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'administration'),
        where('roles', 'array-contains', 'sportsAffairs')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedMembers: AdministrationMember[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedMembers.push({
          id: doc.id,
          ...doc.data()
        } as AdministrationMember);
      });
      
      setMembers(fetchedMembers);
    } catch (error) {
      console.error('Error fetching sports affairs members:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceButtons = members.map((member) => ({
    id: member.id,
    title: member.name,
    description: member.responsibility || '',
    color: '#2196F3',
    route: '/(app)/campus-services/administration/profile',
    params: { member: JSON.stringify(member) }
  }));

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
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
        </View>
      </ThemedLayout>
    );
  }

  if (members.length === 0) {
    return (
      <ThemedLayout
        showNavbar={true}
        navbarConfig={{
          showHamburger: true,
          showTitle: true,
          showThemeToggle: true,
        }}
      >
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: theme.text }]}>
            No members found
          </Text>
        </View>
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
      <ServiceContent
        icon='business'
        title="Sports Affairs"
        buttons={serviceButtons}
        bottomImage={require('@/assets/images/backgrounds/administration.png')}
      />
    </ThemedLayout>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});