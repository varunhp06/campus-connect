import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { Ionicons } from '@expo/vector-icons';

// Example custom icon component for sports
export default function LostAndFoundSection() {
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
      id: 'lost',
      title: 'Lost Section',
      description: 'Report something you have lost',
      color: '#E84343',
      route: ''
    },
    {
      id: 'found',
      title: 'Found Section',
      description: 'Help return a found item',
      color: '#E84343',
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
        icon='cube'
        title="Lost and Found"
        buttons={serviceButtons}
        bottomImage={require('@/assets/images/backgrounds/lost-and-found.png')} // Replace with your image path
      />
    </ThemedLayout>
  );
};