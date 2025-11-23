import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { db } from '@/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useTheme } from '@/components/ThemeContext';
import { AdministrationMember } from '@/components/data/administration';
import { useDepartments } from '@/components/DepartmentContext';

export default function DepartmentsList() {
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { departmentsWithMembers, setDepartmentsWithMembers } = useDepartments();

  useEffect(() => {
    fetchDepartments();
  }, []);
  

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'administration'));
      const departmentMap: {[key: string]: AdministrationMember[]} = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const member = {
          id: doc.id,
          ...data
        } as AdministrationMember;
        
        if (data.department && data.department.trim() !== '') {
          if (!departmentMap[data.department]) {
            departmentMap[data.department] = [];
          }
          departmentMap[data.department].push(member);
        }
      });
      
      setDepartmentsWithMembers(departmentMap);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const serviceButtons = Object.keys(departmentsWithMembers)
    .sort()
    .map((department) => ({
      id: department.toLowerCase().replace(/\s+/g, '-'),
      title: department,
      description: `View all members in ${department}`,
      color: '#2196F3',
      route: '/(app)/campus-services/administration/departments/members',
      params: { department }
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
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading departments...</Text>
        </View>
      </ThemedLayout>
    );
  }

  if (Object.keys(departmentsWithMembers).length === 0) {
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
            No departments found
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
        title="Departments"
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