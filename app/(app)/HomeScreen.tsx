import React from 'react';
import { ThemedLayout } from '../../components/ThemedLayout';
import { HomeContent } from '@/components/HomeContent';

const HomeScreen: React.FC = () => {
  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <HomeContent />
    </ThemedLayout>
  );
};

export default HomeScreen;
