import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { AdministrationMember } from '@/components/data/administration';
import { useTheme } from '@/components/ThemeContext';
import { useLocalSearchParams } from 'expo-router';
import { useDepartments } from '@/components/DepartmentContext';

export default function DepartmentMembers() {
  const [members, setMembers] = useState<AdministrationMember[]>([]);
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const department = params.department as string;
  const { departmentsWithMembers } = useDepartments();

  useEffect(() => {
    if (department && departmentsWithMembers[department]) {
      setMembers(departmentsWithMembers[department]);
    }
  }, [department, departmentsWithMembers]);


  const serviceButtons = members.map((member) => ({
    id: member.id,
    title: member.name,
    description: member.responsibility,
    color: '#2196F3',
    route: '/(app)/campus-services/administration/profile',
    params: { member: JSON.stringify(member) }
  }));

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
            No members found in this department
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
        title={department}
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
  emptyText: {
    fontSize: 16,
  },
});