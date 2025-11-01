import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { Ionicons } from '@expo/vector-icons';

// Example custom icon component for sports
export default function SportsSection() {
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
      id: 'rent',
      title: 'Rent Equipment',
      description: 'Rent gear, fast and easy.',
      color: '#4CAF50',
      route: ''
    },
    {
      id: 'return',
      title: 'Return Equipment',
      description: 'Quick and easy equipment returns',
      color: '#4CAF50',
      route: ''
    },
    {
      id: 'complaint',
      title: 'Complaint',
      description: 'Report issues and get quick support',
      color: '#4CAF50',
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
        icon='basketball'
        title="Sports Service"
        buttons={serviceButtons}
        bottomImage={require('@/assets/images/backgrounds/sports.png')} // Replace with your image path
      />
    </ThemedLayout>
  );
};