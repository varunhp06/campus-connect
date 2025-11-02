import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';

export default function NightDeliverySection() {
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
      status: 'online'
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
        bottomImage={require('@/assets/images/backgrounds/night-delivery.png')} 
      />
    </ThemedLayout>
  );
};