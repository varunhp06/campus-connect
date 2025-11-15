import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';

export default function SportsSection() {
  const serviceButtons = [
    {
      id: 'rent',
      title: 'Rent Equipment',
      description: 'Rent gear, fast and easy.',
      color: '#4CAF50',
      route: '/(app)/campus-utilities/Sports/Rent'
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
        bottomImage={require('@/assets/images/backgrounds/sports.png')} 
      />
    </ThemedLayout>
  );
};