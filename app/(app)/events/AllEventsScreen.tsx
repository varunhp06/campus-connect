import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { AllEventsContent } from '@/components/AllEventsContent';

const AllEventsScreen: React.FC = () => {
  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <AllEventsContent />
    </ThemedLayout>
  );
};

export default AllEventsScreen;