import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';

export default function FAQSection() {
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
        bottomImage={require('@/assets/images/backgrounds/cycle.png')} 
      />
    </ThemedLayout>
  );
};