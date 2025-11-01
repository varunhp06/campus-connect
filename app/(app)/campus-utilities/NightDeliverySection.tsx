import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { Ionicons } from '@expo/vector-icons';

// Example custom icon component for sports
export default function NightDeliverySection() {
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
      id: 'amul',
      title: 'Amul Parlour',
      description: 'Order food from Amul Parlour',
      color: '#2196F3',
      route: '',
      status: 'Online'
    },
    {
      id: 'vinayak',
      title: 'Vinayak',
      description: 'Order food from Vinayak',
      color: '#2196F3',
      route: '',
      status: 'Offline'
    },
    {
      id: 'nescafe',
      title: 'Nescafe',
      description: 'Order food from Nescafe',
      color: '#2196F3',
      route: '',
      status: 'Online'
    },
    {
      id: 'ccd',
      title: 'Cafe Coffee Delight',
      description: 'Order food from CCD',
      color: '#2196F3',
      route: '',
      status: 'Online'
    },
    {
      id: 'kravers',
      title: 'Kravers Kitchen',
      description: 'Order food from Kravers Kitchen',
      color: '#2196F3',
      route: '',
      status: 'Offline'
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
        icon='pizza'
        title="Night Delivery"
        buttons={serviceButtons}
        bottomImage={require('@/assets/images/backgrounds/night-delivery.png')} // Replace with your image path
      />
    </ThemedLayout>
  );
};