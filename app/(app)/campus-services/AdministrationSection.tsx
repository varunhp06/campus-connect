import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { Ionicons } from '@expo/vector-icons';

// Example custom icon component for sports
export default function AdministrationSection() {
  const handleRentEquipment = () => {
    console.log('Navigate to Rent Equipment');
    // Add your navigation logic here
  };

  const handleReturnEquipment = () => {
    console.log('Navigate to Return Equipment');
    // Add your navigation logic here
  };

  const handleComplaint = () => {
    console.log('Navigate to Complaint Form');
    // Add your navigation logic here
  };

  const serviceButtons = [
    {
      id: 'academic',
      title: 'Academic Affairs',
      description: 'Find all personnel related to academic affairs',
      color: '#2196F3',
      route: ''
    },
    {
      id: 'student',
      title: 'Student Affairs',
      description: 'Connect with officials handling student affairs and support',
      color: '#2196F3',
      route: ''
    },
    {
      id: 'sports',
      title: 'Sports Affairs',
      description: 'Discover everyone managing campus sports',
      color: '#2196F3',
      route: ''
    },
    {
      id: 'medical',
      title: 'Medical Affairs',
      description: 'Locate staff responsible for campus health and medical care',
      color: '#2196F3',
      route: ''
    },
    {
      id: 'departments',
      title: 'Departments',
      description: 'Find all faculty in respective departments',
      color: '#2196F3',
      route: ''
    },
    
    
  ];

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
        title="Administration"
        buttons={serviceButtons}
        bottomImage={require('@/assets/images/backgrounds/administration.png')} // Replace with your image path
      />
    </ThemedLayout>
  );
};