import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  notes?: string;
}

export interface DiscountInfo {
  original_amount: number;
  discount_type: 'first_order' | 'amount_threshold' | 'none';
  discount_percentage: number;
  discount_amount: number;
  final_amount: number;
  savings: number;
  discount_description: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemsCount: number;
  discountInfo: DiscountInfo | null;
  discountLoading: boolean;
  refreshDiscount: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountInfo, setDiscountInfo] = useState<DiscountInfo | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const { user } = useAuth();

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.id === newItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(id);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscountInfo(null);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Funzione per calcolare lo sconto in tempo reale
  const refreshDiscount = async () => {
    if (!user || total === 0) {
      setDiscountInfo(null);
      return;
    }

    try {
      setDiscountLoading(true);
      
      const { data, error } = await supabase.rpc('preview_discount', {
        user_uuid: user.id,
        cart_total: total
      });

      if (error) {
        console.error('Errore nel calcolo dello sconto:', error);
        setDiscountInfo(null);
      } else {
        setDiscountInfo(data);
      }
    } catch (error) {
      console.error('Errore nella chiamata preview_discount:', error);
      setDiscountInfo(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  // Effetto per ricalcolare lo sconto quando cambiano gli items o l'utente
  useEffect(() => {
    if (user && total > 0) {
      refreshDiscount();
    } else {
      setDiscountInfo(null);
    }
  }, [user, total]);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemsCount,
      discountInfo,
      discountLoading,
      refreshDiscount
    }}>
      {children}
    </CartContext.Provider>
  );
};