import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  shopId: string;
  img?: string;
}

export interface CanteenCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  shopId: string;      // ensures cart filters per shop if needed
  addedAt: number;
}

interface CanteenContextType {
  cart: Record<string, CanteenCartItem>;
  addToCart: (item: FoodItem, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartItems: () => CanteenCartItem[];
  isLoading: boolean;
}

const CanteenContext = createContext<CanteenContextType | undefined>(undefined);

const CART_STORAGE_KEY = "@canteen_food_cart";

export const useCanteen = () => {
  const context = useContext(CanteenContext);
  if (!context) {
    throw new Error("useCanteen must be used within CanteenProvider");
  }
  return context;
};

interface CanteenProviderProps {
  children: ReactNode;
}

export const CanteenProvider: React.FC<CanteenProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Record<string, CanteenCartItem>>({});
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
      console.error("Error loading canteen cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async (newCart: Record<string, CanteenCartItem>) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    } catch (error) {
      console.error("Error saving canteen cart:", error);
    }
  };

  const addToCart = (item: FoodItem, quantity: number) => {
    if (quantity <= 0) return;

    const newCart = {
      ...cart,
      [item.id]: {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity,
        shopId: item.shopId,
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

  const getTotalPrice = () => {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartItems = () => {
    return Object.values(cart).sort((a, b) => b.addedAt - a.addedAt);
  };

  return (
    <CanteenContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getCartItems,
        isLoading,
      }}
    >
      {children}
    </CanteenContext.Provider>
  );
};
