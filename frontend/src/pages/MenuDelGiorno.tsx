import React, { useEffect, useState } from 'react';
import { Clock, Plus, AlertCircle, ChefHat, Phone } from 'lucide-react';
import { useDish } from '../context/DishContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import LoginModal from '../components/Auth/LoginModal';
import RegisterModal from '../components/Auth/RegisterModal';
import { animateToCart } from '../utils/animateToCart';

const MenuDelGiorno: React.FC = () => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { dailyMenuDishes, loading, fetchMenuDishes } = useDish();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    fetchMenuDishes('daily');
  }, [fetchMenuDishes]);

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

  // Ordine e label delle categorie come nel Menu Fisso
  const categories = [
    { id: 'antipasti', label: 'Antipasti' },
    { id: 'primi', label: 'Primi Piatti' },
    { id: 'secondi', label: 'Secondi Piatti' },
    { id: 'contorni', label: 'Contorni e Insalate' },
    { id: 'fritture', label: 'Fritture' },
    { id: 'panini', label: 'Panini' },
    { id: 'vini', label: 'Vini' },
  ];

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-mediterranean-beige py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mediterranean-marroncino"></div>
            <span className="ml-3 text-mediterranean-blu-scuro">Caricamento menu del giorno...</span>
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
            Menù del Giorno
          </h1>
          <p className="text-lg text-mediterranean-marroncino mb-2">
            {today}
          </p>
          <p className="text-lg text-mediterranean-blu-scuro max-w-2xl mx-auto">
            Le nostre specialità quotidiane preparate con il pescato fresco del giorno.
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

        {/* Today's Specials raggruppati per categoria */}
        {dailyMenuDishes.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="w-24 h-24 text-mediterranean-marroncino mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-serif font-semibold text-mediterranean-blu-scuro mb-4">
              Menu del Giorno in Preparazione
            </h3>
            <p className="text-lg text-mediterranean-blu-scuro max-w-md mx-auto">
              Il nostro chef sta preparando le specialità del giorno. 
              Torna presto per scoprire le delizie fresche di oggi!
            </p>
          </div>
        ) : (
          <div className="space-y-12 mb-12">
            {categories.map(category => {
              const items = dailyMenuDishes.filter(a => a.dish && a.dish.category === category.id);
              if (items.length === 0) return null;

              return (
                <div key={category.id}>
                  <h2 className="font-serif text-3xl font-bold text-mediterranean-blu-scuro mb-6 text-center">
                    {category.label}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(assignment => {
                      const dish = assignment.dish!;
                      return (
                        <Card key={assignment.id} className="h-full flex flex-col relative overflow-hidden">
                          {/* Special Badge */}
                          <div className="absolute top-4 right-4 z-10">
                            <span className="bg-mediterranean-marroncino text-mediterranean-bianco px-3 py-1 rounded-full text-sm font-medium">
                              Speciale
                            </span>
                          </div>

                          {/* Image */}
                          {dish.image_url && (
                            <div className="w-full h-48 overflow-hidden">
                              <img
                                src={dish.image_url}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro pr-4">
                                {dish.name}
                              </h3>
                              <span className="text-xl font-bold text-mediterranean-marroncino">
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
                                  {dish.allergens.map((allergen, index) => (
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
                          </div>

                          <div className="p-6 pt-0">
                            <Button
                              onClick={(e) => handleAddToCart(e, dish)}
                              className="w-full"
                              disabled={!assignment.is_available || !dish.available}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {(assignment.is_available && dish.available) ? 'Aggiungi al Carrello' : 'Non Disponibile'}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sezioni informative e CTA rimosse su richiesta */}
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
    </div>
  );
};

export default MenuDelGiorno;