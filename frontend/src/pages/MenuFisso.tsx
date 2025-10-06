import React, { useState, useEffect } from 'react';
import { Plus, Filter, X, ChefHat, Phone } from 'lucide-react';
import { useDish } from '../context/DishContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import LoginModal from '../components/Auth/LoginModal';
import RegisterModal from '../components/Auth/RegisterModal';
import { animateToCart } from '../utils/animateToCart';

const MenuFisso: React.FC = () => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { fixedMenuDishes, loading, fetchMenuDishes, initializeSampleDishes } = useDish();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isFritturaModalOpen, setIsFritturaModalOpen] = useState(false);
  const [selectedFrittura, setSelectedFrittura] = useState<string[]>([]);
  const [fritturaError, setFritturaError] = useState<string | null>(null);

  const fritturaOptions = ['calamari', 'gamberi', 'alici', 'moscardini', 'paranza'];

  useEffect(() => {
    fetchMenuDishes('fixed');
  }, [fetchMenuDishes]);

  // Funzione per inizializzare i piatti di esempio
  const handleInitializeSampleDishes = async () => {
    await initializeSampleDishes();
    await fetchMenuDishes('fixed');
  };

  const categories = [
    { id: 'all', label: 'Tutte le categorie' },
    { id: 'antipasti', label: 'Antipasti' },
    { id: 'primi', label: 'Primi Piatti' },
    { id: 'secondi', label: 'Secondi Piatti' },
    { id: 'contorni', label: 'Contorni e Insalate' },
    { id: 'fritture', label: 'Fritture' },
    { id: 'panini', label: 'Panini' },
    { id: 'vini', label: 'Vini' },
  ];

  const filters = [
    { id: 'senza-glutine', label: 'Senza Glutine' },
    { id: 'senza-lattosio', label: 'Senza Lattosio' },
    { id: 'crudo', label: 'Crudi' },
    { id: 'grigliato', label: 'Grigliati' },
    { id: 'vegetariano', label: 'Vegetariano' },
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

  // Convert dish assignments to dishes for filtering, keeping assignment info
  const dishesWithAssignments = fixedMenuDishes.map(assignment => ({
    ...assignment.dish,
    assignmentAvailable: assignment.is_available
  })).filter(dish => dish !== null);

  const filteredItems = dishesWithAssignments.filter(dish => {
    if (!dish) return false;
    
    const categoryMatch = selectedCategory === 'all' || dish.category === selectedCategory;
    
    const filterMatch = activeFilters.length === 0 || activeFilters.some(filter => {
      switch (filter) {
        case 'senza-glutine':
          return !dish.allergens.includes('glutine');
        case 'senza-lattosio':
          return !dish.allergens.includes('latte');
        case 'crudo':
          return dish.tags?.includes('crudo') || false;
        case 'grigliato':
          return dish.tags?.includes('grigliato') || false;
        case 'vegetariano':
          return !dish.allergens.includes('pesce') && !dish.allergens.includes('molluschi') && !dish.allergens.includes('crostacei');
        default:
          return true;
      }
    });
    
    return categoryMatch && filterMatch;
  });

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>, dish: any) => {
    // Verifica se l'utente è autenticato
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    await animateToCart(e.currentTarget as HTMLElement, dish?.image_url);

    addItem({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      category: dish.category,
    });
  };

  const openFritturaModal = () => {
    setSelectedFrittura([]);
    setIsFritturaModalOpen(true);
  };

  const toggleFritturaIngredient = (ingredient: string) => {
    setSelectedFrittura(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
    // Pulisce l'errore se l'utente seleziona almeno un ingrediente
    setFritturaError(null);
  };

  const handleAddCustomFrittura = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    // Richiedi almeno un ingrediente selezionato
    if (selectedFrittura.length === 0) {
      setFritturaError('Seleziona almeno un ingrediente della frittura');
      return;
    }

    const sorted = [...selectedFrittura].sort();
    const idSuffix = sorted.length > 0 ? sorted.join('|') : 'base';
    const itemId = `custom-frittura:${idSuffix}`;
    const details = sorted.length > 0 ? ` – ${sorted.join(', ')}` : '';
    const itemName = `Componi la tua frittura${details}`;

    await animateToCart(e.currentTarget as HTMLElement);

    addItem({
      id: itemId,
      name: itemName,
      price: 10,
      category: 'fritture',
    });

    setIsFritturaModalOpen(false);
  };

  const getItemsByCategory = () => {
    const grouped: { [key: string]: any[] } = {};
    
    if (selectedCategory === 'all') {
      categories.slice(1).forEach(category => {
        grouped[category.id] = dishesWithAssignments.filter(dish => 
          dish && dish.category === category.id && 
          (activeFilters.length === 0 || activeFilters.some(filter => {
            switch (filter) {
              case 'senza-glutine':
                return !dish.allergens.includes('glutine');
              case 'senza-lattosio':
                return !dish.allergens.includes('latte');
              case 'crudo':
                return dish.tags?.includes('crudo') || false;
              case 'grigliato':
                return dish.tags?.includes('grigliato') || false;
              case 'vegetariano':
                return !dish.allergens.includes('pesce') && !dish.allergens.includes('molluschi') && !dish.allergens.includes('crostacei');
              default:
                return true;
            }
          }))
        );
      });
    } else {
      grouped[selectedCategory] = filteredItems;
    }
    
    return grouped;
  };

  const groupedItems = getItemsByCategory();

  if (loading) {
    return (
      <div className="min-h-screen bg-mediterranean-beige py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediterranean-marroncino"></div>
            <span className="ml-3 text-mediterranean-blu-scuro">Caricamento menu fisso...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mediterranean-beige py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-mediterranean-blu-scuro mb-4">
            Menù Fisso
          </h1>
          <p className="text-lg text-mediterranean-blu-scuro max-w-2xl mx-auto">
            La nostra selezione permanente di specialità mediterranee preparate con pesce fresco di prima qualità.
          </p>
        </div>

        {/* Crudo su Ordinazione */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-mediterranean-blu-scuro to-mediterranean-blu-medio text-white">
            <div className="text-center py-3 md:py-4">
              <ChefHat className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-2 md:mb-3 text-mediterranean-bianco" />
              <h3 className="font-serif text-lg md:text-xl font-bold mb-2">
                Crudo di Pesce Fresco
              </h3>
              <p className="text-mediterranean-bianco/90 mb-3 max-w-2xl mx-auto text-sm md:text-base px-4">
                Su ordinazione è possibile gustare il nostro crudo di pesce freschissimo, 
                preparato con il pescato del giorno. <strong>Prenotazione richiesta almeno un giorno prima.</strong>
              </p>
              <Button
                onClick={() => window.open('tel:+393123456789', '_self')}
                className="bg-mediterranean-marroncino hover:bg-mediterranean-marroncino/90 text-white font-semibold py-2 px-4 md:py-3 md:px-6 rounded-lg transition-colors duration-200 inline-flex items-center text-sm md:text-base"
              >
                <Phone className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Chiama per Prenotare
              </Button>
            </div>
          </Card>
        </div>

        {fixedMenuDishes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="w-24 h-24 text-mediterranean-marroncino mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-serif font-semibold text-mediterranean-blu-scuro mb-4">
              Menu Fisso in Preparazione
            </h3>
            <p className="text-lg text-mediterranean-blu-scuro max-w-md mx-auto">
              Il nostro chef sta preparando la selezione permanente di specialità. 
              Torna presto per scoprire i nostri piatti fissi!
            </p>
          </div>
        ) : (
          <>
            {/* Filters and Categories */}
            <div className="mb-8">
              {/* Category Tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-mediterranean-marroncino text-mediterranean-bianco shadow-md'
                        : 'bg-mediterranean-bianco text-mediterranean-blu-scuro hover:bg-mediterranean-marroncino hover:text-mediterranean-bianco'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="text-center">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-mediterranean-bianco rounded-lg text-mediterranean-blu-scuro hover:bg-mediterranean-marroncino hover:text-mediterranean-bianco transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filtri</span>
                  {activeFilters.length > 0 && (
                    <span className="bg-mediterranean-marroncino text-mediterranean-bianco px-2 py-1 rounded-full text-xs">
                      {activeFilters.length}
                    </span>
                  )}
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 p-4 bg-mediterranean-bianco rounded-lg">
                  <div className="flex flex-wrap justify-center gap-2">
                    {filters.map(filter => (
                      <button
                        key={filter.id}
                        onClick={() => toggleFilter(filter.id)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          activeFilters.includes(filter.id)
                            ? 'bg-mediterranean-marroncino text-mediterranean-bianco'
                            : 'bg-mediterranean-beige text-mediterranean-blu-scuro hover:bg-mediterranean-marroncino hover:text-mediterranean-bianco'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                    {activeFilters.length > 0 && (
                      <button
                        onClick={() => setActiveFilters([])}
                        className="px-3 py-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="space-y-12">
              {Object.entries(groupedItems).map(([categoryId, items]) => {
                if (items.length === 0) return null;
                
                const categoryLabel = categories.find(c => c.id === categoryId)?.label || categoryId;
                
                return (
                  <div key={categoryId}>
                    {selectedCategory === 'all' && (
                      <h2 className="font-serif text-3xl font-bold text-mediterranean-blu-scuro mb-6 text-center">
                        {categoryLabel}
                      </h2>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryId === 'fritture' && (
                        <Card className="h-full flex flex-col border-2 border-mediterranean-marroncino/40">
                          {/* Immagine illustrativa di frittura sulla card */}
                          <div className="w-full h-40 overflow-hidden rounded-t-lg">
                            <img
                              src="/images/img.webp"
                              alt="Frittura mista"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro">
                                Componi la tua frittura
                              </h3>
                              <span className="text-xl font-bold text-mediterranean-marroncino ml-4">
                                {formatPrice(10)}
                              </span>
                            </div>
                            <p className="text-mediterranean-blu-scuro mb-4 leading-relaxed">
                              Scegli liberamente tra calamari, gamberi, alici, moscardini e paranza. Il prezzo resta fisso.
                            </p>
                            <div className="mb-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mediterranean-beige text-mediterranean-blu-scuro">
                                Fritture
                              </span>
                            </div>
                            <p className="text-sm font-medium text-mediterranean-blu-scuro mb-2">
                              Personalizza la tua frittura:
                            </p>
                            {/* Tag ingredienti con icone/mini immagini */}
                            <div className="flex flex-wrap gap-2">
                              {fritturaOptions.map(opt => {
                                const selected = selectedFrittura.includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => toggleFritturaIngredient(opt)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm capitalize transition-colors ${selected ? 'bg-mediterranean-marroncino text-white border-mediterranean-marroncino' : 'bg-white text-mediterranean-blu-scuro border-mediterranean-beige hover:bg-mediterranean-beige'}`}
                                  >
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-mediterranean-beige text-mediterranean-blu-scuro font-semibold">
                                      +
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {fritturaError && (
                              <p className="mt-3 text-sm text-red-600">
                                {fritturaError}
                              </p>
                            )}
                          </div>
                          <div className="p-6 pt-0">
                            <Button onClick={(e) => handleAddCustomFrittura(e)} className="w-full" disabled={selectedFrittura.length === 0} title={selectedFrittura.length === 0 ? 'Seleziona almeno un ingrediente' : undefined}>
                              <Plus className="w-4 h-4 mr-2" />
                              Aggiungi al Carrello
                            </Button>
                          </div>
                        </Card>
                      )}
                      {items.map(dish => (
                        <Card key={dish.id} className="h-full flex flex-col">
                          {/* Image */}
                          {dish.image_url && (
                            <div className="w-full h-48 overflow-hidden rounded-t-lg">
                              <img
                                src={dish.image_url}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro">
                                {dish.name}
                              </h3>
                              <span className="text-xl font-bold text-mediterranean-marroncino ml-4">
                                {formatPrice(dish.price)}
                              </span>
                            </div>
                            
                            <p className="text-mediterranean-blu-scuro mb-4 leading-relaxed">
                              {dish.description}
                            </p>

                            {/* Category */}
                            <div className="mb-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mediterranean-beige text-mediterranean-blu-scuro">
                                {getCategoryLabel(dish.category)}
                              </span>
                            </div>

                            {/* Allergens */}
                            {dish.allergens.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs text-mediterranean-blu-scuro opacity-75 mb-1">
                                  Allergeni:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {dish.allergens.map((allergen: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"
                                    >
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tags */}
                            {dish.tags && dish.tags.length > 0 && (
                              <div className="mb-4">
                                <div className="flex flex-wrap gap-1">
                                  {dish.tags.map((tag: string, index: number) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-mediterranean-beige text-mediterranean-blu-scuro text-xs rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-6 pt-0">
                            <Button
                              onClick={(e) => handleAddToCart(e, dish)}
                              className="w-full"
                              disabled={!dish.assignmentAvailable || !dish.available}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {(dish.assignmentAvailable && dish.available) ? 'Aggiungi al Carrello' : 'Non Disponibile'}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-mediterranean-blu-scuro mb-4">
                  Nessun piatto trovato con i filtri selezionati.
                </p>
                {fixedMenuDishes.length === 0 && (
                  <Button
                    onClick={handleInitializeSampleDishes}
                    className="bg-mediterranean-marroncino hover:bg-mediterranean-marroncino/90 text-white"
                  >
                    Inizializza Piatti di Esempio
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modali di Autenticazione */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Modale Componi la tua frittura */}
      {isFritturaModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4">
              Componi la tua frittura
            </h3>
            <p className="text-sm text-mediterranean-blu-scuro mb-4">
              Seleziona gli ingredienti desiderati. Il prezzo resta fisso a {formatPrice(10)}.
            </p>
            {/* Tag ingredienti con + anche nella modale */}
            <div className="flex flex-wrap gap-2 mb-6">
              {fritturaOptions.map(opt => {
                const selected = selectedFrittura.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleFritturaIngredient(opt)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm capitalize transition-colors ${selected ? 'bg-mediterranean-marroncino text-white border-mediterranean-marroncino' : 'bg-white text-mediterranean-blu-scuro border-mediterranean-beige hover:bg-mediterranean-beige'}`}
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-mediterranean-beige text-mediterranean-blu-scuro font-semibold">+</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {fritturaError && (
              <p className="-mt-4 mb-6 text-sm text-red-600">
                {fritturaError}
              </p>
            )}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsFritturaModalOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleAddCustomFrittura} disabled={selectedFrittura.length === 0} title={selectedFrittura.length === 0 ? 'Seleziona almeno un ingrediente' : undefined}>
                Aggiungi al Carrello
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuFisso;