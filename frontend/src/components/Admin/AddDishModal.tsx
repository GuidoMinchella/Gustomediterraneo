import React, { useState, useEffect } from 'react';
import { useDish } from '../../context/DishContext';
import { X, Plus, Search, ChefHat, Loader2 } from 'lucide-react';
import Button from '../UI/Button';

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDish: (dishId: string) => void;
  menuType: 'daily' | 'fixed';
  title: string;
  excludeDishIds: string[];
}

const AddDishModal: React.FC<AddDishModalProps> = ({
  isOpen,
  onClose,
  onAddDish,
  menuType,
  title,
  excludeDishIds
}) => {
  const { dishes, loading, addingToMenu, fetchDishes } = useDish();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen && dishes.length === 0) {
      fetchDishes();
    }
  }, [isOpen, dishes.length, fetchDishes]);

  if (!isOpen) return null;

  // Filtra i piatti disponibili (escludendo quelli già nel menu)
  const availableDishes = dishes.filter(dish => !excludeDishIds.includes(dish.id));

  // Applica filtri di ricerca e categoria
  const filteredDishes = availableDishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dish.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Tutte le categorie' },
    { value: 'antipasti', label: 'Antipasti' },
    { value: 'primi', label: 'Primi Piatti' },
    { value: 'secondi', label: 'Secondi Piatti' },
    { value: 'contorni', label: 'Contorni' },
    { value: 'fritture', label: 'Fritture' },
    { value: 'panini', label: 'Panini' },
    { value: 'vini', label: 'Vini' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'antipasti': 'Antipasti',
      'primi': 'Primi Piatti',
      'secondi': 'Secondi Piatti',
      'contorni': 'Contorni',
      'fritture': 'Fritture',
      'panini': 'Panini',
      'vini': 'Vini'
    };
    return labels[category] || category;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filtri */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barra di ricerca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cerca piatti..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Filtro categoria */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contenuto */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <span className="ml-3 text-gray-600">Caricamento piatti...</span>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun piatto disponibile
              </h3>
              <p className="text-gray-600">
                {availableDishes.length === 0 
                  ? 'Tutti i piatti sono già stati aggiunti al menu.'
                  : 'Nessun piatto corrisponde ai criteri di ricerca.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {dish.image_url && (
                      <img
                        src={dish.image_url}
                        alt={dish.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {dish.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {dish.description}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {getCategoryLabel(dish.category)}
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {formatPrice(dish.price)}
                            </span>
                          </div>
                          {dish.allergens.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {dish.allergens.slice(0, 3).map((allergen, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                                >
                                  {allergen}
                                </span>
                              ))}
                              {dish.allergens.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{dish.allergens.length - 3} altri
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => onAddDish(dish.id)}
                          size="sm"
                          className="ml-2 flex-shrink-0"
                          disabled={addingToMenu}
                        >
                          {addingToMenu ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Chiudi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddDishModal;