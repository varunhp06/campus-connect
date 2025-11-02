import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { Ionicons } from '@expo/vector-icons';

// Example custom icon component for sports
export default function FAQSection() {
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
      id: 'view',
      title: 'View Questions',
      description: 'View all questions answered by experts',
      color: '#FFC107',
      route: ''
    },
    {
      id: 'ask',
      title: 'Ask a Question',
      description: 'Request a question to be answered',
      color: '#FFC107',
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
        icon='help'
        title="Frequently Asked Questions"
        buttons={serviceButtons}
        bottomImage={require('@/assets/images/backgrounds/cycle.png')} // Replace with your image path
      />
    </ThemedLayout>
  );
};