import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';

export default function AdministrationSection() {
  const serviceButtons = [
    {
      id: 'academic',
      title: 'Academic Affairs',
      description: 'Find all personnel related to academic affairs',
      color: '#2196F3',
      route: '/(app)/campus-services/administration/academic-affairs'
    },
    {
      id: 'student',
      title: 'Student Affairs',
      description: 'Connect with officials handling student affairs and support',
      color: '#2196F3',
      route: '/(app)/campus-services/administration/student-affairs'
    },
    {
      id: 'sports',
      title: 'Sports Affairs',
      description: 'Discover everyone managing campus sports',
      color: '#2196F3',
      route: '/(app)/campus-services/administration/sports-affairs'
    },
    {
      id: 'medical',
      title: 'Medical Affairs',
      description: 'Locate staff responsible for campus health and medical care',
      color: '#2196F3',
      route: '/(app)/campus-services/administration/medical-affairs'
    },
    {
      id: 'departments',
      title: 'Departments',
      description: 'Find all faculty in respective departments',
      color: '#2196F3',
      route: '/(app)/campus-services/administration/departments'
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
        bottomImage={require('@/assets/images/backgrounds/administration.png')} 
      />
    </ThemedLayout>
  );
};