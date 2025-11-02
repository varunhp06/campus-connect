import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';

export default function CycleSection() {
  const serviceButtons = [
    {
      id: 'rent',
      title: 'Rent Cycles',
      description: 'Rent cycles, fast and easy.',
      color: '#FFC107',
      route: ''
    },
    {
      id: 'return',
      title: 'Return Cycles',
      description: 'Quick and easy cycle returns',
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
        icon='bicycle'
        title="Cycle Service"
        buttons={serviceButtons}
        bottomImage={require('@/assets/images/backgrounds/cycle.png')} 
      />
    </ThemedLayout>
  );
};