import React from 'react';
import { Alert } from 'react-native';
import { ThemedLayout } from '../components/ThemedLayout';
import { LoginForm } from '../components/LoginForm';

const LoginScreen: React.FC = () => {
  const handleMenuPress = () => {
    Alert.alert('Menu', 'Navigation menu opened');
  };

  

  return (
    <ThemedLayout
      showNavbar={true}
      navbarConfig={{
        showHamburger: false,
        showTitle: false,
        showThemeToggle: true,
        onHamburgerPress: handleMenuPress,
      }}
    >
      <LoginForm />
    </ThemedLayout>
  );
};

export default LoginScreen;