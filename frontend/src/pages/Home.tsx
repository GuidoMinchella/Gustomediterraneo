import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, Users, Award, ChefHat, Utensils, Fish, Timer, Leaf, MapPin, Phone, ShoppingBag } from 'lucide-react';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import { useDish } from '../context/DishContext';

const Home: React.FC = () => {
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const quickSectionRef = useRef<HTMLElement | null>(null);
  const [quickInView, setQuickInView] = useState(false);
  const cucinaSectionRef = useRef<HTMLElement | null>(null);
  const [cucinaAnimated, setCucinaAnimated] = useState(false);
  const takeAwayRef = useRef<HTMLElement | null>(null);
  const [takeAwayAnimated, setTakeAwayAnimated] = useState(false);
  const menuGiornoRef = useRef<HTMLElement | null>(null);
  const [menuGiornoAnimated, setMenuGiornoAnimated] = useState(false);
  const menuFissoRef = useRef<HTMLElement | null>(null);
  const [menuFissoAnimated, setMenuFissoAnimated] = useState(false);

  // Dati dal Menu Fisso (DishContext)
  const { fixedMenuDishes, dailyMenuDishes, fetchMenuDishes, loading } = useDish();

  // Carica menu fisso e del giorno all'avvio
  useEffect(() => {
    fetchMenuDishes('fixed');
    fetchMenuDishes('daily');
  }, [fetchMenuDishes]);

  // Seleziona 3 piatti casuali dal menu fisso
  // Selezione 3 piatti casuali con duplicazione se < 3
  const pickThree = (items: any[]) => {
    const available = (items || []).filter((m: any) => m.is_available && m.dish);
    if (available.length === 0) return [];
    if (available.length === 1) return [available[0], available[0], available[0]];
    if (available.length === 2) {
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const duplicate = shuffled[Math.floor(Math.random() * 2)];
      return [shuffled[0], shuffled[1], duplicate];
    }
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  const randomFixedItems = React.useMemo(() => pickThree(fixedMenuDishes), [fixedMenuDishes]);
  const randomDailyItems = React.useMemo(() => pickThree(dailyMenuDishes), [dailyMenuDishes]);

  // Mobile-only image animations for "La Nostra Cucina"
  const cucinaImg1Ref = useRef<HTMLElement | null>(null);
  const cucinaImg2Ref = useRef<HTMLElement | null>(null);
  const cucinaImgMainRef = useRef<HTMLElement | null>(null);
  const [cucinaImg1Visible, setCucinaImg1Visible] = useState(false);
  const [cucinaImg2Visible, setCucinaImg2Visible] = useState(false);
  const [cucinaImgMainVisible, setCucinaImgMainVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const el = quickSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setQuickInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animazioni per "La Nostra Cucina" – esegue all'arrivo sezione e solo una volta per caricamento
  useEffect(() => {
    const el = cucinaSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setCucinaAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Detect mobile viewport (<= md breakpoint ~ 768px)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // On mobile, animate images only when they individually enter viewport
  useEffect(() => {
    if (!isMobile) return;
    const observers: IntersectionObserver[] = [];

    const observeOnce = (
      el: Element | null,
      setter: (v: boolean) => void,
      threshold: number = 0.25
    ) => {
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setter(true);
          obs.disconnect();
        }
      }, { threshold });
      obs.observe(el);
      observers.push(obs);
    };

    observeOnce(cucinaImg1Ref.current, setCucinaImg1Visible, 0.25);
    observeOnce(cucinaImg2Ref.current, setCucinaImg2Visible, 0.25);
    observeOnce(cucinaImgMainRef.current, setCucinaImgMainVisible, 0.2);

    return () => {
      observers.forEach(o => o.disconnect());
    };
  }, [isMobile]);

  // Animazioni per "Come Funziona il Take Away" – swipe up sequenziale 1,2,3
  useEffect(() => {
    const el = takeAwayRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setTakeAwayAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animazione per "Menu del Giorno" – intera sezione swipe up
  useEffect(() => {
    const el = menuGiornoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setMenuGiornoAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animazione per "Menu Fisso" – intera sezione swipe up
  useEffect(() => {
    const el = menuFissoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setMenuFissoAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Funzione per formattare il prezzo
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Funzione per associare le immagini ai piatti
  function getImageForDish(dishName: string): string {
    const imageMap: { [key: string]: string } = {
      'Crudo di Ricciola': 'img1.jpg',
      'Polpo alla Griglia': 'polpo.patate.jpg',
      'Spaghetti alle Vongole': 'img2.jpg',
      'Spaghetti alla Carbonara': 'img2.jpg',
      'Risotto ai Frutti di Mare': 'insalata.di.mare.jpg',
      'Branzino in Crosta di Sale': 'salmone.crosta.di.pistacchio.mandorle.jpg',
      'Frittura Mista': 'calamari.gratinati.alforno.jpg',
      'Antipasto della Casa': 'img3.jpg',
      'Tiramisù della Nonna': 'img4.jpg'
    };
    return imageMap[dishName] || 'img3.jpg';
  }

  const testimonials = [
    {
      name: 'Marco R.',
      text: 'Pesce freschissimo e preparazioni impeccabili. Il crudo di ricciola è sublime!',
      rating: 5,
    },
    {
      name: 'Elena S.',
      text: 'Servizio take away perfetto, ordino sempre qui quando voglio il meglio del mare.',
      rating: 5,
    },
    {
      name: 'Giuseppe M.',
      text: 'Qualità eccellente e rispetto della tradizione mediterannea. Consigliatissimo!',
      rating: 5,
    },
    {
      name: 'Anna F.',
      text: 'Il branzino in crosta di sale è una poesia. Proprietari cortesi e competenti.',
      rating: 5,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Fixed Action Buttons - Bottom Left */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        {/* Phone Button */}
        <a href="tel:+393313320411" className="group">
          <div className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110">
            <Phone className="w-6 h-6 text-white" />
          </div>
        </a>

        {/* Delivery Button */}
         <div className="relative">
           <button 
             onClick={() => setShowDeliveryOptions(!showDeliveryOptions)}
             className="group"
           >
             <div className="w-14 h-14 bg-white hover:bg-gray-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110">
                <img 
                   src="/images/justeat.jpg" 
                   alt="Ordina Online" 
                   className="w-12 h-12 object-cover rounded-full"
                 />
             </div>
           </button>

          {/* Delivery Options */}
          {showDeliveryOptions && (
            <div className="absolute bottom-0 left-16 flex gap-2 mb-2">
              {/* JustEat */}
              <a 
                href="https://www.justeat.it/restaurants-gusto-mediterraneo-da-andrea-roma/menu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <div className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110 fade-slide-in" style={{ animationDelay: '0ms' }}>
                  <img 
                    src="/images/justeat.jpg" 
                    alt="JustEat" 
                    className="w-10 h-10 object-cover rounded-full"
                  />
                </div>
              </a>

              {/* Glovo */}
              <a 
                href="https://glovoapp.com/it/it/roma/search?q=gusto+mediterraneo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <div className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110 fade-slide-in" style={{ animationDelay: '200ms' }}>
                  <img 
                    src="/images/glovo.png" 
                    alt="Glovo" 
                    className="w-11 h-11 object-cover rounded-full"
                  />
                </div>
              </a>

              {/* Deliveroo */}
              <a 
                href="https://deliveroo.it/it/menu/roma/roma-tuscolano/gusto-mediterraneo-da-andrea" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group"
              >
                <div className="w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group-hover:scale-110 fade-slide-in" style={{ animationDelay: '400ms' }}>
                  <img 
                    src="/images/deliveroo.jpg" 
                    alt="Deliveroo" 
                    className="w-10 h-10 object-cover rounded-full"
                  />
                </div>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-r from-mediterranean-blu-scuro/20 to-mediterranean-marroncino/20">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/8753656/pexels-photo-8753656.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-mediterranean-blu-scuro/40" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-mediterranean-bianco mb-6 animate-slide-up">
            Gusto Mediterraneo
          </h1>
          <p className="font-serif text-2xl md:text-3xl text-mediterranean-beige mb-8 animate-slide-up">
            Fish Take Away
          </p>
          <p className="text-lg md:text-xl text-mediterranean-bianco mb-12 max-w-2xl mx-auto animate-slide-up">
            Pesce fresco di prima qualità, preparato secondo la tradizione mediterranea. 
            Ordina e ritira il tuo piatto preferito.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/prenota">
              <Button size="lg" className="text-lg px-8 py-4">
                Prenota il Tuo Ordine
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/menu-fisso">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-mediterranean-bianco/10 backdrop-blur-sm border-mediterranean-bianco text-mediterranean-bianco hover:bg-mediterranean-bianco hover:text-mediterranean-blu-scuro">
                Scopri il Menù
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-mediterranean-beige" ref={quickSectionRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className={quickInView ? 'animate-slide-in-up' : 'opacity-0'}
              style={quickInView ? { animationDelay: '0ms', animationDuration: '600ms', animationFillMode: 'both' } : undefined}
            >
              <Link to="/menu-fisso" className="group">
                <Card className="text-center h-full hover:bg-mediterranean-bianco group-hover:shadow-xl transition-all">
                <ChefHat className="w-12 h-12 text-mediterranean-marroncino mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-2">
                  Menù Fisso
                </h3>
                <p className="text-mediterranean-blu-scuro">
                  Scopri la nostra selezione permanente di piatti della tradizione mediterranea
                </p>
                </Card>
              </Link>
            </div>
            
            <div
              className={quickInView ? 'animate-slide-in-up' : 'opacity-0'}
              style={quickInView ? { animationDelay: '200ms', animationDuration: '600ms', animationFillMode: 'both' } : undefined}
            >
              <Link to="/menu-del-giorno" className="group">
                <Card className="text-center h-full hover:bg-mediterranean-bianco group-hover:shadow-xl transition-all">
                <ChefHat className="w-12 h-12 text-mediterranean-marroncino mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-2">
                  Menù del Giorno
                </h3>
                <p className="text-mediterranean-blu-scuro">
                  Specialità quotidiane con il pescato fresco del giorno
                </p>
                </Card>
              </Link>
            </div>
            
            <div
              className={quickInView ? 'animate-slide-in-up' : 'opacity-0'}
              style={quickInView ? { animationDelay: '400ms', animationDuration: '600ms', animationFillMode: 'both' } : undefined}
            >
              <Link to="/prenota" className="group">
                <Card className="text-center h-full hover:bg-mediterranean-bianco group-hover:shadow-xl transition-all">
                <Clock className="w-12 h-12 text-mediterranean-marroncino mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-2">
                  Prenota Ordine
                </h3>
                <p className="text-mediterranean-blu-scuro">
                  Ordina online e ritira comodamente il tuo piatto preferito
                </p>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* La Nostra Cucina */}
      <section ref={cucinaSectionRef} className="py-20 bg-gradient-to-br from-mediterranean-bianco via-mediterranean-beige/30 to-mediterranean-bianco relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 opacity-10">
          <ChefHat className="w-32 h-32 text-mediterranean-marrone" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-10">
          <Utensils className="w-28 h-28 text-mediterranean-marrone" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {/* Header with decorative line */}
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-4">
                  <div className="h-px bg-mediterranean-marrone w-12 mr-4"></div>
                  <Fish className="w-8 h-8 text-mediterranean-marrone" />
                  <div className="h-px bg-mediterranean-marrone w-12 ml-4"></div>
                </div>
                <h2
                  className={`font-serif text-5xl font-bold text-mediterranean-blu-scuro mb-3 leading-tight ${cucinaAnimated ? 'animate-slide-in-left' : 'opacity-0'}`}
                  style={cucinaAnimated ? { animationDelay: '0ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
                >
                  La Nostra Cucina
                </h2>
                <p
                  className={`text-mediterranean-marrone font-medium italic text-lg ${cucinaAnimated ? 'animate-slide-in-left' : 'opacity-0'}`}
                  style={cucinaAnimated ? { animationDelay: '150ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
                >
                  Tradizione, Passione e Autenticità
                </p>
              </div>

              {/* Content with enhanced styling */}
              <div
                className={`bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-mediterranean-beige/50 ${cucinaAnimated ? 'animate-slide-in-up' : 'opacity-0'}`}
                style={cucinaAnimated ? { animationDelay: '300ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
              >
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-mediterranean-marrone/10 rounded-full flex items-center justify-center">
                      <Timer className="w-6 h-6 text-mediterranean-marrone" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-2">
                        Selezione Quotidiana
                      </h3>
                      <p className="text-mediterranean-blu-scuro leading-relaxed">
                        Nel cuore di Roma, portiamo avanti una tradizione culinaria che affonda le radici 
                        nel rispetto per il mare e i suoi frutti. Ogni giorno selezioniamo personalmente 
                        il pesce più fresco lavorandolo con tecniche che preservano sapori autentici e genuini.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-mediterranean-marrone/10 rounded-full flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-mediterranean-marrone" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-2">
                        Filosofia Mediterranea
                      </h3>
                      <p className="text-mediterranean-blu-scuro leading-relaxed">
                        La nostra filosofia è semplice: ingredienti di qualità superiore, preparazioni rispettose 
                        della tradizione mediterranea e l'amore per il buon cibo che si tramanda di generazione 
                        in generazione.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Small images section */}
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div
                  ref={cucinaImg1Ref as React.MutableRefObject<HTMLElement | null>}
                  className={`relative group ${((isMobile ? cucinaImg1Visible : cucinaAnimated)) ? 'animate-slide-in-left' : 'opacity-0'}`}
                  style={((isMobile ? cucinaImg1Visible : cucinaAnimated)) ? { animationDelay: '450ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
                >
                  <img
                    src="/images/img3.jpg"
                    alt="Specialità della casa"
                    className="rounded-xl shadow-lg w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-serif text-sm font-semibold">Specialità</p>
                  </div>
                </div>
                <div
                  ref={cucinaImg2Ref as React.MutableRefObject<HTMLElement | null>}
                  className={`relative group ${((isMobile ? cucinaImg2Visible : cucinaAnimated)) ? 'animate-slide-in-right' : 'opacity-0'}`}
                  style={((isMobile ? cucinaImg2Visible : cucinaAnimated)) ? { animationDelay: '600ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
                >
                  <img
                    src="/images/panino.polpo.rosticciato.jpg"
                    alt="Panino polpo rosticciato"
                    className="rounded-xl shadow-lg w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-xl"></div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <p className="font-serif text-sm font-semibold">Polpo Rosticciato</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced main image */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-br from-mediterranean-marrone/30 via-mediterranean-blu-scuro/25 to-mediterranean-beige/20 rounded-3xl blur-2xl shadow-2xl"></div>
              <img
                ref={cucinaImgMainRef as React.MutableRefObject<HTMLImageElement | null>}
                src="/images/img2.jpg"
                alt="La nostra cucina"
                className={`relative rounded-xl w-full h-104 object-cover ${((isMobile ? cucinaImgMainVisible : cucinaAnimated)) ? 'animate-slide-in-up' : 'opacity-0'}`}
                style={((isMobile ? cucinaImgMainVisible : cucinaAnimated)) ? { animationDelay: '750ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
              />
            </div>
          </div>
        </div>
      </section>

      {/* I Nostri Menu */}
      <section className="py-20 bg-mediterranean-beige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Menu del Giorno */}
          <div
            ref={menuGiornoRef}
            className={`mb-16 ${menuGiornoAnimated ? 'animate-slide-in-up' : 'opacity-0'}`}
            style={menuGiornoAnimated ? { animationDelay: '0ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
          >
            <div className="text-center mb-8">
              <h1 className="font-serif text-4xl font-bold text-mediterranean-blu-scuro mb-4">
                Menu del Giorno
              </h1>
              <button
                 onClick={() => window.location.href = '/menu-del-giorno'}
                 className="bg-mediterranean-marroncino hover:bg-mediterranean-marroncino/90 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center"
               >
                 Vedi Tutto
                 <ArrowRight className="w-4 h-4 ml-2" />
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading && (
                <div className="col-span-1 md:col-span-3 text-center text-mediterranean-blu-scuro">
                  Caricamento menu del giorno...
                </div>
              )}
              {randomDailyItems.length === 0 ? (
                <div className="col-span-1 md:col-span-3 text-center text-mediterranean-blu-scuro">
                  Piatti in aggiornamento
                </div>
              ) : (
                randomDailyItems.map((item, idx) => {
                  const dish = item.dish!;
                  const imageSrc = dish.image_url || `/images/${getImageForDish(dish.name)}`;
                  return (
                    <div key={`${item.id}-${idx}`} className="group cursor-pointer">
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={imageSrc}
                            alt={dish.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-serif text-xl font-bold text-mediterranean-blu-scuro group-hover:text-mediterranean-marroncino transition-colors durata-300">
                              {dish.name}
                            </h4>
                            <span className="text-2xl font-bold text-mediterranean-marroncino">
                              {formatPrice(dish.price)}
                            </span>
                          </div>
                          
                          <p className="text-mediterranean-blu-scuro/80 mb-4">
                            {dish.description}
                          </p>
                          
                          {Array.isArray(dish.tags) && dish.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {dish.tags.slice(0, 2).map((tag: string, tIdx: number) => (
                                <span key={tIdx} className="px-2 py-1 bg-mediterranean-beige text-mediterranean-blu-scuro text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Menu Fisso */}
          <div
            ref={menuFissoRef}
            className={menuFissoAnimated ? 'animate-slide-in-up' : 'opacity-0'}
            style={menuFissoAnimated ? { animationDelay: '0ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
          >
            <div className="text-center mb-8">
              <h1 className="font-serif text-4xl font-bold text-mediterranean-blu-scuro mb-4">
                Menu Fisso
              </h1>
              <button
                 onClick={() => window.location.href = '/menu-fisso'}
                 className="bg-mediterranean-marroncino hover:bg-mediterranean-marroncino/90 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center"
               >
                 Vedi Tutto
                 <ArrowRight className="w-4 h-4 ml-2" />
               </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading && (
                <div className="col-span-1 md:col-span-3 text-center text-mediterranean-blu-scuro">
                  Caricamento menu fisso...
                </div>
              )}
              {randomFixedItems.map((item) => {
                const dish = item.dish!;
                const imageSrc = dish.image_url || `/images/${getImageForDish(dish.name)}`;
                return (
                  <div key={item.id} className="group cursor-pointer">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-serif text-xl font-bold text-mediterranean-blu-scuro group-hover:text-mediterranean-marroncino transition-colors duration-300">
                            {dish.name}
                          </h4>
                          <span className="text-2xl font-bold text-mediterranean-marroncino">
                            {formatPrice(dish.price)}
                          </span>
                        </div>
                        
                        <p className="text-mediterranean-blu-scuro/80 mb-4">
                          {dish.description}
                        </p>
                        
                        {Array.isArray(dish.tags) && dish.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {dish.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-mediterranean-beige text-mediterranean-blu-scuro text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Come Funziona */}
      <section ref={takeAwayRef} className="py-20 bg-mediterranean-bianco">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className={`font-serif text-4xl font-bold text-mediterranean-blu-scuro mb-4 ${isMobile ? (takeAwayAnimated ? 'animate-slide-in-up' : 'opacity-0') : ''}`}
              style={isMobile && takeAwayAnimated ? { animationDelay: '0ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
            >
              Come Funziona il Take Away
            </h2>
            <p
              className={`text-lg text-mediterranean-blu-scuro max-w-2xl mx-auto ${isMobile ? (takeAwayAnimated ? 'animate-slide-in-up' : 'opacity-0') : ''}`}
              style={isMobile && takeAwayAnimated ? { animationDelay: '120ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
            >
              Tre semplici passi per gustare i sapori del mare direttamente a casa tua.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className={`text-center ${takeAwayAnimated ? 'animate-slide-in-up' : 'opacity-0'}`}
              style={takeAwayAnimated ? { animationDelay: '0ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
            >
              <div className="w-16 h-16 bg-mediterranean-marroncino rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-mediterranean-bianco">1</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4">
                Scegli i Tuoi Piatti
              </h3>
              <p className="text-mediterranean-blu-scuro">
                Esplora il nostro menù e seleziona i piatti che preferisci dal nostro catalogo 
                di specialità di mare.
              </p>
            </div>
            
            <div
              className={`text-center ${takeAwayAnimated ? 'animate-slide-in-up' : 'opacity-0'}`}
              style={takeAwayAnimated ? { animationDelay: '200ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
            >
              <div className="w-16 h-16 bg-mediterranean-marroncino rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-mediterranean-bianco">2</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4">
                Effettua l'Ordine
              </h3>
              <p className="text-mediterranean-blu-scuro">
                Compila il modulo di prenotazione con i tuoi dati e seleziona l'orario 
                di ritiro più comodo per te.
              </p>
            </div>
            
            <div
              className={`text-center ${takeAwayAnimated ? 'animate-slide-in-up' : 'opacity-0'}`}
              style={takeAwayAnimated ? { animationDelay: '400ms', animationDuration: '700ms', animationFillMode: 'both' } : undefined}
            >
              <div className="w-16 h-16 bg-mediterranean-marroncino rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-mediterranean-bianco">3</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-mediterranean-blu-scuro mb-4">
                Ritira e Gusta
              </h3>
              <p className="text-mediterranean-blu-scuro">
                Vieni a ritirare il tuo ordine all'orario prestabilito. Tutto sarà 
                pronto e confezionato con cura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Da dove viene il nostro pescato */}
      <section className="py-20 bg-gradient-to-br from-mediterranean-blu-scuro to-mediterranean-marroncino text-mediterranean-bianco">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-6">
                Pescheria Mediterraneo da Andrea
              </h2>
              <p className="text-base mb-6 leading-relaxed opacity-90">
                Il nostro pesce fresco proviene direttamente dalla nostra "Pescheria Mediterraneo", 
                di proprietà di Andrea, lo stesso proprietario del ristorante. Questa integrazione verticale 
                ci permette di garantire la massima qualità e freschezza del pescato che serviamo.
              </p>
              <p className="text-base mb-8 leading-relaxed opacity-90">
                Avendo il controllo diretto su tutta la filiera, dalla selezione del pesce fresco alla 
                preparazione dei piatti, possiamo assicurare ai nostri clienti solo il meglio del mare, 
                nel rispetto della tradizione e della sostenibilità.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-mediterranean-beige flex-shrink-0" />
                  <span>Pescato selezionato quotidianamente</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Leaf className="w-5 h-5 text-mediterranean-beige flex-shrink-0" />
                  <span>Filiera corta e sostenibile</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Fish className="w-5 h-5 text-mediterranean-beige flex-shrink-0" />
                  <span>Controllo diretto della qualità</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="/images/img.webp"
                alt="Pesca sostenibile"
                className="rounded-lg shadow-2xl w-full h-96 object-cover"
              />
              {/* Card sovrapposta all'immagine */}
              <div className="absolute -top-4 -left-6 bg-mediterranean-beige text-mediterranean-blu-scuro p-8 rounded-lg shadow-xl border-4 border-mediterranean-marroncino max-w-sm transform rotate-[-2deg] z-10">
                <div className="font-serif">
                  <h3 className="font-bold text-xl mb-4 text-mediterranean-blu-scuro flex items-center">
                    <Fish className="w-6 h-6 mr-2" />
                    Pescheria Mediterraneo
                  </h3>
                  <div className="space-y-3 text-base font-medium">
                    <p className="flex items-start">
                      <span className="font-bold mr-2 text-lg">📍</span>
                      <span>Largo Giulio Capitolino, 3<br />00174 Roma RM</span>
                    </p>
                    <p className="text-sm italic mt-4 text-mediterranean-marroncino">
                      "La nostra pescheria di famiglia"
                    </p>
                    <button
                      onClick={() => window.open('https://www.google.com/maps/place/Pescheria+Mediterraneo+da+Andrea/@41.853832,12.5640474,17z/data=!3m1!4b1!4m6!3m5!1s0x1325899419f31b5d:0xa589d6165921c428!8m2!3d41.853832!4d12.5640474!16s%2Fg%2F11nrvly_6k?hl=it&entry=ttu&g_ep=EgoyMDI1MDkyOC4wIKXMDSoASAFQAw%3D%3D', '_blank')}
                      className="mt-4 w-full bg-mediterranean-marroncino hover:bg-mediterranean-blu-scuro text-mediterranean-beige font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Vedi su Google Maps</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recensioni Google */}
      <section className="py-20 bg-mediterranean-beige overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-mediterranean-blu-scuro mb-4">
              Cosa Dicono i Nostri Clienti
            </h2>
            <p className="text-lg text-mediterranean-blu-scuro max-w-2xl mx-auto mb-6">
              Le recensioni autentiche dei nostri clienti su Google.
            </p>
            
            {/* Rating Summary */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-6 h-6 ${i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
              </div>
              <div className="text-2xl font-bold text-mediterranean-blu-scuro">4.8/5</div>
              <div className="text-mediterranean-marroncino font-medium">(22 recensioni)</div>
            </div>
          </div>
          
          {/* Scrolling Reviews */}
          <div className="space-y-6">
            {/* First Row - Left to Right */}
            <div className="relative">
              <div className="flex gap-6 animate-scroll-left">
                {/* First set of reviews */}
                <div className="flex gap-6 min-w-max">
                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">3 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Alessandro Falso</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "I sapori di ogni piatto erano perfettamente bilanciati e gli ingredienti incredibilmente freschi. Il servizio è stato impeccabile. Ottimo rapporto qualità-prezzo!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">3 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Nicole La Torraca</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Un piccolo ristorantino take away di pesce che merita davvero! La frittura di calamari era deliziosa: leggera, croccante e per nulla unta. Tornerò sicuramente!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Pranzo | 10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">1 mese fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Alexandra Marinescu</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Ottima qualità di pesce fresco, tutto veramente buono. Grande cura per i dettagli anche nella consegna. Lo consiglio ad amici e parenti!"
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">2 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Ludovico Pronesti</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Meraviglioso. Una gemma inaspettata in zona Tuscolana. Pesce fantastico, panini squisiti, economico, personale cordiale. Stra-consigliato!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">8 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Cinzia P</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Finalmente cibo di qualità! Frittura di paranza e polipetti alla Luciana eccellenti! La frittura è espressa, leggera e fatta con olio pulito."
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">11 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Elisa</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Ho provato due volte la frittura di calamari… viene preparata espressa ed è davvero buona e leggera. Tornerò e sono curiosa di assaggiare altre cose!"
                    </p>
                  </div>
                </div>
                
                {/* Duplicate for seamless loop */}
                <div className="flex gap-6 min-w-max">
                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">3 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Alessandro Falso</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "I sapori di ogni piatto erano perfettamente bilanciati e gli ingredienti incredibilmente freschi. Il servizio è stato impeccabile. Ottimo rapporto qualità-prezzo!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">3 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Nicole La Torraca</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Un piccolo ristorantino take away di pesce che merita davvero! La frittura di calamari era deliziosa: leggera, croccante e per nulla unta. Tornerò sicuramente!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Pranzo | 10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">1 mese fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Alexandra Marinescu</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Ottima qualità di pesce fresco, tutto veramente buono. Grande cura per i dettagli anche nella consegna. Lo consiglio ad amici e parenti!"
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">2 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Ludovico Pronesti</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Meraviglioso. Una gemma inaspettata in zona Tuscolana. Pesce fantastico, panini squisiti, economico, personale cordiale. Stra-consigliato!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">8 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Cinzia P</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Finalmente cibo di qualità! Frittura di paranza e polipetti alla Luciana eccellenti! La frittura è espressa, leggera e fatta con olio pulito."
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">11 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Elisa</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Ho provato due volte la frittura di calamari… viene preparata espressa ed è davvero buona e leggera. Tornerò e sono curiosa di assaggiare altre cose!"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row - Right to Left */}
            <div className="relative">
              <div className="flex gap-6 animate-scroll-right">
                {/* Second set of reviews */}
                <div className="flex gap-6 min-w-max">
                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">9 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Simona Bastuanelli</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Abbiamo fatto un aperifish con amici. Anche se l'ambiente è piccolo, l'ospitalità del titolare è molto alta. Personale cordiale e veloce."
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">4 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Sonia Terrinoni</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Seconda volta abbiamo preso lasagna con misto pesce..buonissimo, porzione abbondante nessuno fastidio digestivo. Pagato 12 euro a porzione."
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Sul posto | 10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">6 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Manuela Amendola</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Pesce freschissimo cucinato in maniera creativa e leggera. Fritto fantastico! Le ragazze sono gentilissime."
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Da asporto</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <span className="ml-2 text-sm text-gray-500">9 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">MONS smons</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Frittura buona, polpo e patate buonissimo. Si sente che c'è cura nel preparare le cose e il fatto che ti infarinano la frittura davanti è un punto in più."
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Da asporto | Pranzo | 10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">2 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Domenico</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Frittura di Calamari ECCEZIONALE"
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">3 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Piera Lucia</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Cibo di ottima qualità, titolare squisitamente accogliente… lo consiglio vivamente!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Cena | 10-20 €</div>
                  </div>
                </div>
                
                {/* Duplicate for seamless loop */}
                <div className="flex gap-6 min-w-max">
                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">9 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Simona Bastuanelli</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Abbiamo fatto un aperifish con amici. Anche se l'ambiente è piccolo, l'ospitalità del titolare è molto alta. Personale cordiale e veloce."
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">4 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Sonia Terrinoni</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Seconda volta abbiamo preso lasagna con misto pesce..buonissimo, porzione abbondante nessuno fastidio digestivo. Pagato 12 euro a porzione."
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Sul posto | 10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">6 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Manuela Amendola</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Pesce freschissimo cucinato in maniera creativa e leggera. Fritto fantastico! Le ragazze sono gentilissime."
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Da asporto</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(4)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <Star className="w-4 h-4 text-gray-300" />
                      </div>
                      <span className="ml-2 text-sm text-gray-500">9 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">MONS smons</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Frittura buona, polpo e patate buonissimo. Si sente che c'è cura nel preparare le cose e il fatto che ti infarinano la frittura davanti è un punto in più."
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Da asporto | Pranzo | 10-20 €</div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">2 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Domenico</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Frittura di Calamari ECCEZIONALE"
                    </p>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 w-80 flex-shrink-0">
                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">3 mesi fa</span>
                    </div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Piera Lucia</h4>
                    <p className="text-sm text-mediterranean-blu-scuro leading-relaxed">
                      "Cibo di ottima qualità, titolare squisitamente accogliente… lo consiglio vivamente!"
                    </p>
                    <div className="mt-3 text-xs text-mediterranean-marroncino">Cena | 10-20 €</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
             <a 
               href="https://www.google.com/search?sa=X&sca_esv=db06df8ffc1e69f4&rlz=1C1FHFK_enIT1120IT1120&biw=1536&bih=695&tbm=lcl&sxsrf=AE3TifNs-hcrJ6mdSjsE0pfVRpP_gHyCmw:1759312672336&q=recensioni%20di%20gusto%20mediterraneo&rflfq=1&num=20&stick=H4sIAAAAAAAAAONgkxIxNDA1MLc0MLI0MTc1NzK2NDYxt9jAyPiKUaEoNTk1rzgzPy9TISVTIb20uCRfITc1JbMktagoMS81fxErQSUAEn8mq2EAAAA&rldimm=10507902947572393478&hl=it-IT&ved=0CAcQ5foLahcKEwj4tte33oKQAxUAAAAAHQAAAAAQCg#arid=ChZDSUhNMG9nS0VOcVQ4TGlZbU9xekdREAE&lkt=LocalPoiReviews"
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center px-6 py-3 bg-mediterranean-blu-scuro text-mediterranean-bianco rounded-lg hover:bg-opacity-90 transition-colors duration-200 font-semibold"
             >
               <Star className="w-5 h-5 mr-2 text-yellow-400 fill-current" />
               Vedi Tutte le Recensioni su Google
             </a>
           </div>
        </div>
      </section>

      
    </div>
  );
};

export default Home;