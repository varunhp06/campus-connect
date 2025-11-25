import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';

export default function LostAndFoundSection() {
  const serviceButtons = [
    {
      id: 'lost',
      title: 'Lost Section',
      description: 'Report something you have lost',
      color: '#E84343',
      route: '/(app)/campus-services/lost-and-found/lost'
    },
    {
      id: 'found',
      title: 'Found Section',
      description: 'Help return a found item',
      color: '#E84343',
      route: '/(app)/campus-services/lost-and-found/found'
    },
    {
      id: 'my-items',
      title: 'My Items',
      description: 'Items you have posted, claimed or found',
      color: '#E84343',
      route: '/(app)/campus-services/lost-and-found/my-items'
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
        bottomImage={require('@/assets/images/backgrounds/lost-and-found.png')} 
      />
    </ThemedLayout>
  );
};