import React from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { EventsManagementContent } from '@/components/EventsManagementContent';

const EventsManagementScreen: React.FC = () => {
  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: true,
        showTitle: true,
        showThemeToggle: true,
      }}
    >
      <EventsManagementContent />
    </ThemedLayout>
  );
};

export default EventsManagementScreen;
