import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePathname } from 'expo-router'; 

const SWIPE_THRESHOLD = 35;

interface DrawerContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  createSwipeHandler: () => any;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider');
  }
  return context;
};

interface DrawerProviderProps {
  children: ReactNode;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigation = useNavigation();
  const pathname = usePathname?.();

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const createSwipeHandler = () => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 10 && Math.abs(gestureState.dy) < 80;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD && gestureState.vx > 0) {
          openDrawer();
        }
      },
    });
  };

  useEffect(() => {
    if (pathname === undefined) return; 
    setIsDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navigation || typeof navigation.addListener !== 'function') return;
    const unsubscribe = navigation.addListener('state', () => {
      setIsDrawerOpen(false);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <DrawerContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        createSwipeHandler,
      }}
    >
      {children}
    </DrawerContext.Provider>
  );
};
