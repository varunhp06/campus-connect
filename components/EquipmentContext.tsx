import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EquipmentItem {
  id: string;
  name: string;
  stock: number;
  sport: string;
}

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  sport: string;
  addedAt: number;
}

interface EquipmentContextType {
  cart: Record<string, CartItem>;
  addToCart: (item: EquipmentItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getCartItems: () => CartItem[];
  isLoading: boolean;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@sports_equipment_cart';

export const useEquipment = () => {
  const context = useContext(EquipmentContext);
  if (!context) {
    throw new Error('useEquipment must be used within EquipmentProvider');
  }
  return context;
};

interface EquipmentProviderProps {
  children: ReactNode;
}

export const EquipmentProvider: React.FC<EquipmentProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart !== null) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async (newCart: Record<string, CartItem>) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (item: EquipmentItem, quantity: number) => {
    if (quantity <= 0) return;

    const newCart = {
      ...cart,
      [item.id]: {
        id: item.id,
        name: item.name,
        quantity: Math.min(quantity, item.stock),
        sport: item.sport,
        addedAt: Date.now(),
      },
    };

    setCart(newCart);
    saveCart(newCart);
  };

  const removeFromCart = (itemId: string) => {
    const { [itemId]: removed, ...newCart } = cart;
    setCart(newCart);
    saveCart(newCart);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const newCart = {
      ...cart,
      [itemId]: {
        ...cart[itemId],
        quantity,
      },
    };

    setCart(newCart);
    saveCart(newCart);
  };

  const clearCart = () => {
    setCart({});
    saveCart({});
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartItems = () => {
    return Object.values(cart).sort((a, b) => b.addedAt - a.addedAt);
  };

  return (
    <EquipmentContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getCartItems,
        isLoading,
      }}
    >
      {children}
    </EquipmentContext.Provider>
  );
};