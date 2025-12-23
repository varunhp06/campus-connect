import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { ThemedLayout } from '../components/ThemedLayout';

const LoginScreen: React.FC = () => {

  

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: false,
        showTitle: false,
        showThemeToggle: true,
      }}
    >
      <LoginForm />
    </ThemedLayout>
  );
};

export default LoginScreen;