import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'antipasti' | 'primi' | 'secondi' | 'contorni' | 'fritture' | 'panini' | 'vini';
  allergens: string[];
  tags: string[];
  image_url?: string;
  available: boolean;
  limited_quantity: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuAssignment {
  id: string;
  dish_id: string;
  menu_type: 'daily' | 'fixed';
  is_available: boolean;
  created_at: string;
  dish?: Dish; // Populated when joining with dishes table
}

interface DishContextType {
  dishes: Dish[];
  dailyMenuDishes: MenuAssignment[];
  fixedMenuDishes: MenuAssignment[];
  loading: boolean;
  addingToMenu: boolean;
  error: string | null;
  fetchDishes: () => Promise<void>;
  fetchMenuDishes: (menuType: 'daily' | 'fixed') => Promise<void>;
  addDish: (dish: Omit<Dish, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateDish: (id: string, dish: Partial<Dish>) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
  addDishToMenu: (dishId: string, menuType: 'daily' | 'fixed') => Promise<void>;
  removeDishFromMenu: (dishId: string, menuType: 'daily' | 'fixed') => Promise<void>;
  getDishesByCategory: (category: string) => Dish[];
  getAvailableDishes: () => Dish[];
  initializeSampleDishes: () => Promise<void>;
}

const DishContext = createContext<DishContextType | undefined>(undefined);

export const useDish = () => {
  const context = useContext(DishContext);
  if (context === undefined) {
    throw new Error('useDish must be used within a DishProvider');
  }
  return context;
};

interface DishProviderProps {
  children: ReactNode;
}

export const DishProvider: React.FC<DishProviderProps> = ({ children }) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dailyMenuDishes, setDailyMenuDishes] = useState<MenuAssignment[]>([]);
  const [fixedMenuDishes, setFixedMenuDishes] = useState<MenuAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToMenu, setAddingToMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funzione per inizializzare piatti di esempio
  const initializeSampleDishes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Controlla se ci sono già piatti
      const { data: existingDishes } = await supabase
        .from('dishes')
        .select('id')
        .limit(1);
      
      if (existingDishes && existingDishes.length > 0) {
        return; // Ci sono già piatti, non aggiungere esempi
      }

      // Piatti di esempio per il ristorante mediterraneo
      const sampleDishes: Omit<Dish, 'id' | 'created_at' | 'updated_at'>[] = [
        {
          name: 'Spaghetti alla Carbonara',
          description: 'Pasta tradizionale romana con guanciale, uova, pecorino e pepe nero',
          price: 12.50,
          category: 'primi' as const,
          allergens: ['glutine', 'uova', 'latte'],
          tags: ['tradizionale', 'romano'],
          available: true,
          limited_quantity: false,
          image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400'
        },
        {
          name: 'Risotto ai Funghi Porcini',
          description: 'Cremoso risotto con funghi porcini freschi e parmigiano reggiano',
          price: 14.00,
          category: 'primi' as const,
          allergens: ['latte'],
          tags: ['vegetariano', 'stagionale'],
          available: true,
          limited_quantity: true,
          image_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400'
        },
        {
          name: 'Branzino in Crosta di Sale',
          description: 'Branzino fresco cotto in crosta di sale con erbe mediterranee',
          price: 18.00,
          category: 'secondi' as const,
          allergens: ['pesce'],
          tags: ['fresco', 'mediterraneo'],
          available: true,
          limited_quantity: false,
          image_url: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400'
        },
        {
          name: 'Antipasto della Casa',
          description: 'Selezione di salumi, formaggi, olive e verdure grigliate',
          price: 16.00,
          category: 'antipasti' as const,
          allergens: ['latte'],
          tags: ['condivisione', 'tradizionale'],
          available: true,
          limited_quantity: false,
          image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400'
        },
        {
          name: 'Tiramisù della Nonna',
          description: 'Dolce tradizionale con mascarpone, caffè e cacao amaro',
          price: 6.50,
          category: 'contorni' as const,
          allergens: ['glutine', 'uova', 'latte'],
          tags: ['tradizionale', 'fatto in casa'],
          available: true,
          limited_quantity: false,
          image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'
        }
      ];

      // Inserisci i piatti di esempio
      const { data: insertedDishes, error } = await supabase
        .from('dishes')
        .insert(sampleDishes)
        .select();

      if (error) {
        console.error('Errore nell\'inserimento dei piatti di esempio:', error);
        // Se la tabella non esiste, crea piatti mock localmente
        const mockDishes = sampleDishes.map((dish, index) => ({
          ...dish,
          id: `mock-${index}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setDishes(mockDishes);
        
        // Crea anche assegnazioni mock per il menu fisso
        const mockAssignments = mockDishes.map(dish => ({
          id: `assignment-${dish.id}`,
          dish_id: dish.id,
          is_available: true,
          created_at: new Date().toISOString(),
          dish: dish
        }));
        setFixedMenuDishes(mockAssignments);
      } else {
        // Ricarica i piatti dal database
        await fetchDishes();
        
        // Assegna automaticamente tutti i piatti di esempio al menu fisso
        if (insertedDishes && insertedDishes.length > 0) {
          const menuAssignments = insertedDishes.map(dish => ({
            dish_id: dish.id,
            is_available: true
          }));
          
          const { error: menuError } = await supabase
            .from('menu_fisso')
            .insert(menuAssignments);
            
          if (menuError) {
            console.error('Errore nell\'assegnazione al menu fisso:', menuError);
          } else {
            // Ricarica il menu fisso
            await fetchMenuDishes('fixed');
          }
        }
      }
    } catch (error) {
      console.error('Errore nell\'inizializzazione:', error);
      // Fallback: usa piatti mock
      const mockDishes = [
        {
          id: 'mock-1',
          name: 'Spaghetti alla Carbonara',
          description: 'Pasta tradizionale romana con guanciale, uova, pecorino e pepe nero',
          price: 12.50,
          category: 'primi' as const,
          allergens: ['glutine', 'uova', 'latte'],
          tags: ['tradizionale', 'romano'],
          available: true,
          limited_quantity: false,
          image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          name: 'Antipasto della Casa',
          description: 'Selezione di salumi, formaggi, olive e verdure grigliate',
          price: 16.00,
          category: 'antipasti' as const,
          allergens: ['latte'],
          tags: ['condivisione', 'tradizionale'],
          available: true,
          limited_quantity: false,
          image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setDishes(mockDishes);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDishes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Errore nel caricamento dei piatti:', error);
        // Se c'è un errore (es. tabella non esiste), inizializza con piatti di esempio
        await initializeSampleDishes();
        return;
      }

      if (!data || data.length === 0) {
        // Se non ci sono piatti, inizializza con esempi
        await initializeSampleDishes();
        return;
      }

      setDishes(data);
    } catch (error) {
      console.error('Errore nella fetch:', error);
      setError('Errore nel caricamento dei piatti');
      // Fallback con piatti mock
      await initializeSampleDishes();
    } finally {
      setLoading(false);
    }
  }, [initializeSampleDishes]);

  const addDish = useCallback(async (dishData: Omit<Dish, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Adding dish with data:', dishData);
      
      const { data, error } = await supabase
        .from('dishes')
        .insert([dishData])
        .select()
        .single();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database');
      }

      setDishes(prev => [...prev, data]);
      console.log('Dish added successfully:', data);
    } catch (err: any) {
      console.error('Error adding dish:', err);
      throw err; // Re-throw the error so the component can handle it
    }
  }, []);

  const updateDish = useCallback(async (id: string, dishData: Partial<Dish>) => {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .update({ ...dishData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setDishes(prev => prev.map(dish => dish.id === id ? data : dish));
    } catch (err: any) {
      console.error('Error updating dish:', err);
      throw err;
    }
  }, []);

  const deleteDish = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setDishes(prev => prev.filter(dish => dish.id !== id));
    } catch (err: any) {
      console.error('Error deleting dish:', err);
      throw err;
    }
  }, []);

  const getDishesByCategory = useCallback((category: string) => {
    return dishes.filter(dish => dish.category === category);
  }, [dishes]);

  const getAvailableDishes = useCallback(() => {
    return dishes.filter(dish => dish.available !== false);
  }, [dishes]);

  // Fetch dishes assigned to a specific menu type
  const fetchMenuDishes = useCallback(async (menuType: 'daily' | 'fixed') => {
    try {
      setLoading(true);
      setError(null);

      const tableName = menuType === 'daily' ? 'menu_del_giorno' : 'menu_fisso';

      // Fetch menu assignments from the appropriate table
      let selectQuery = `
        id,
        dish_id,
        is_available,
        created_at,
        dish:dishes(*)
      `;
      
      if (menuType === 'daily') {
        selectQuery = `
          id,
          dish_id,
          is_available,
          created_at,
          date,
          dish:dishes(*)
        `;
      }

      const { data: assignments, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
          console.log(`Table ${tableName} does not exist yet`);
          if (menuType === 'daily') {
            setDailyMenuDishes([]);
          } else {
            setFixedMenuDishes([]);
          }
          return;
        }
        throw error;
      }

      if (assignments) {
        if (menuType === 'daily') {
          setDailyMenuDishes(assignments);
        } else {
          setFixedMenuDishes(assignments);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${menuType} menu dishes:`, error);
      setError(`Errore nel caricamento del menu ${menuType === 'daily' ? 'del giorno' : 'fisso'}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a dish to a specific menu
  const addDishToMenu = useCallback(async (dishId: string, menuType: 'daily' | 'fixed') => {
    try {
      setAddingToMenu(true);
      setError(null);
      console.log(`Adding dish ${dishId} to ${menuType} menu`);
      
      const tableName = menuType === 'daily' ? 'menu_del_giorno' : 'menu_fisso';
      
      // Prepare assignment data
      const assignmentData = {
        dish_id: dishId,
        is_available: true,
        ...(menuType === 'daily' && { date: new Date().toISOString().split('T')[0] })
      };
      
      // Insert the menu assignment
      let insertSelectQuery = `
        id,
        dish_id,
        is_available,
        created_at,
        dish:dishes(*)
      `;
      
      if (menuType === 'daily') {
        insertSelectQuery = `
          id,
          dish_id,
          is_available,
          created_at,
          date,
          dish:dishes(*)
        `;
      }

      const { data: assignment, error } = await supabase
        .from(tableName)
        .insert(assignmentData)
        .select(insertSelectQuery)
        .single();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Assignment created successfully:', assignment);

      if (assignment) {
        // Update the corresponding state
        if (menuType === 'daily') {
          setDailyMenuDishes(prev => [...prev, assignment]);
        } else {
          setFixedMenuDishes(prev => [...prev, assignment]);
        }
        console.log(`Dish added to ${menuType} menu state`);
      }
    } catch (error) {
      console.error(`Error adding dish to ${menuType} menu:`, error);
      setError(`Errore nell'aggiunta del piatto al menu ${menuType === 'daily' ? 'del giorno' : 'fisso'}: ${error.message}`);
    } finally {
      setAddingToMenu(false);
    }
  }, []);

  // Remove a dish from a specific menu
  const removeDishFromMenu = useCallback(async (dishId: string, menuType: 'daily' | 'fixed') => {
    try {
      const tableName = menuType === 'daily' ? 'menu_del_giorno' : 'menu_fisso';
      
      // Remove the menu assignment from the appropriate table
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('dish_id', dishId);

      if (error) {
        throw error;
      }

      // Update the corresponding state
      if (menuType === 'daily') {
        setDailyMenuDishes(prev => prev.filter(assignment => assignment.dish_id !== dishId));
      } else {
        setFixedMenuDishes(prev => prev.filter(assignment => assignment.dish_id !== dishId));
      }
    } catch (error) {
      console.error(`Error removing dish from ${menuType} menu:`, error);
      setError(`Errore nella rimozione del piatto dal menu ${menuType === 'daily' ? 'del giorno' : 'fisso'}`);
    }
  }, []);

  // Load dishes on component mount
  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const value: DishContextType = {
    dishes,
    dailyMenuDishes,
    fixedMenuDishes,
    loading,
    addingToMenu,
    error,
    fetchDishes,
    fetchMenuDishes,
    addDish,
    updateDish,
    deleteDish,
    addDishToMenu,
    removeDishFromMenu,
    getDishesByCategory,
    getAvailableDishes,
    initializeSampleDishes,
  };

  return (
    <DishContext.Provider value={value}>
      {children}
    </DishContext.Provider>
  );
};

export default DishProvider;