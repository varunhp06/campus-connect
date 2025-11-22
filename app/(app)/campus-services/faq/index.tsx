import React, { useState, useEffect } from 'react';
import { ThemedLayout } from '@/components/ThemedLayout';
import { ServiceContent } from '@/components/ServiceContent';
import { auth } from '@/firebaseConfig';
import { User } from 'firebase/auth';

export default function FAQSection() {
  const [isFaqAdmin, setIsFaqAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setIsFaqAdmin(tokenResult.claims.faqAdmin === true);
      }
      setLoading(false);
    };

    checkAdminStatus();

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdminStatus();
      } else {
        setIsFaqAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const adminButtons = [
    {
      id: 'view-faqs',
      title: 'View FAQs',
      description: 'View and edit all FAQs',
      color: '#FFC107',
      route: '/(app)/campus-services/faq/view-faqs'
    },
    {
      id: 'add-faq',
      title: 'Add New FAQ',
      description: 'Create a new FAQ entry',
      color: '#FFC107',
      route: '/(app)/campus-services/faq/add'
    },
    {
      id: 'view-requests',
      title: 'FAQ Requests',
      description: 'View and answer user requests',
      color: '#FFC107',
      route: '/(app)/campus-services/faq/view-requests'
    },
  ];

  const userButtons = [
    {
      id: 'view-faqs',
      title: 'View FAQs',
      description: 'Browse frequently asked questions',
      color: '#FFC107',
      route: '/(app)/campus-services/faq/view-faqs'
    },
    {
      id: 'request-faq',
      title: 'Request FAQ',
      description: 'Submit a new question',
      color: '#FFC107',
      route: '/(app)/campus-services/faq/request'
    },
  ];

  const serviceButtons = isFaqAdmin ? adminButtons : userButtons;

  if (loading) {
    return (
      <ThemedLayout 
        showNavbar={true}
        navbarConfig={{
          showHamburger: true,
          showTitle: true,
          showThemeToggle: true,
        }}
      >
        <></>
      </ThemedLayout>
    );
  }

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
}