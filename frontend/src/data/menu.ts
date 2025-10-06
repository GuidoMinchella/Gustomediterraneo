export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'antipasti' | 'primi' | 'secondi' | 'contorni' | 'fritture' | 'panini' | 'vini';
  allergens: string[];
  tags: string[];
  image?: string;
  available?: boolean;
  limitedQuantity?: boolean;
}

export const menuItems: MenuItem[] = [
  // Antipasti
  {
    id: 'antipasto-1',
    name: 'Crudo di Ricciola',
    description: 'Ricciola freschissima marinata con limoni di Sorrento, olio EVO e pepe rosa',
    price: 16,
    category: 'antipasti',
    allergens: ['pesce'],
    tags: ['crudo', 'fresco'],
    available: true,
  },
  {
    id: 'antipasto-2',
    name: 'Polpo alla Griglia',
    description: 'Polpo del Golfo grigliato con patate, olive taggiasche e pomodorini',
    price: 14,
    category: 'antipasti',
    allergens: ['molluschi'],
    tags: ['grigliato', 'mediterraneo'],
    available: true,
  },
  {
    id: 'antipasto-3',
    name: 'Baccalà Mantecato',
    description: 'Baccalà mantecato servito con crostini di pane pugliese tostato',
    price: 12,
    category: 'antipasti',
    allergens: ['pesce', 'glutine'],
    tags: ['tradizionale'],
    available: true,
  },

  // Primi
  {
    id: 'primo-1',
    name: 'Spaghetti alle Vongole',
    description: 'Spaghetti di Gragnano con vongole veraci, aglio, prezzemolo e vino bianco',
    price: 18,
    category: 'primi',
    allergens: ['glutine', 'molluschi'],
    tags: ['pasta', 'classico'],
    available: true,
  },
  {
    id: 'primo-2',
    name: 'Risotto ai Frutti di Mare',
    description: 'Risotto Carnaroli con mazzancolle, vongole, cozze e calamari',
    price: 20,
    category: 'primi',
    allergens: ['molluschi', 'crostacei'],
    tags: ['risotto', 'mare'],
    available: true,
  },
  {
    id: 'primo-3',
    name: 'Paccheri con Ricotta e Baccalà',
    description: 'Paccheri artigianali con ricotta di bufala, baccalà e pomodorini del piennolo',
    price: 16,
    category: 'primi',
    allergens: ['glutine', 'pesce', 'latte'],
    tags: ['pasta', 'ricotta'],
    available: true,
  },

  // Secondi
  {
    id: 'secondo-1',
    name: 'Branzino in Crosta di Sale',
    description: 'Branzino fresco del Golfo cotto in crosta di sale grosso con erbe aromatiche',
    price: 25,
    category: 'secondi',
    allergens: ['pesce'],
    tags: ['pesce intero', 'tradizionale'],
    available: true,
  },
  {
    id: 'secondo-2',
    name: 'Frittura Mista',
    description: 'Calamari, gamberi e alici fresche fritte in pastella leggera',
    price: 22,
    category: 'fritture',
    allergens: ['pesce', 'molluschi', 'crostacei', 'glutine'],
    tags: ['fritto', 'misto mare'],
    available: true,
  },
  {
    id: 'secondo-3',
    name: 'Salmone alla Griglia',
    description: 'Filetto di salmone norvegese grigliato con rucola e pomodorini',
    price: 20,
    category: 'secondi',
    allergens: ['pesce'],
    tags: ['grigliato', 'light'],
    available: true,
  },

  // Contorni
  {
    id: 'contorno-1',
    name: 'Insalata di Mare',
    description: 'Polpo, calamari e mazzancolle con sedano, carote e olive',
    price: 12,
    category: 'contorni',
    allergens: ['molluschi', 'crostacei'],
    tags: ['fresco', 'estivo'],
    available: true,
  },
  {
    id: 'contorno-2',
    name: 'Verdure Grigliate',
    description: 'Zucchine, melanzane, peperoni e pomodori grigliati con basilico',
    price: 8,
    category: 'contorni',
    allergens: [],
    tags: ['vegetariano', 'grigliato'],
    available: true,
  },

  // Bevande
  {
    id: 'bevanda-1',
    name: 'Falanghina del Sannio',
    description: 'Vino bianco campano, fresco e minerale - bottiglia 750ml',
    price: 18,
    category: 'vini',
    allergens: ['solfiti'],
    tags: ['vino', 'locale'],
    available: true,
  },
  {
    id: 'bevanda-2',
    name: 'Acqua Naturale',
    description: 'Acqua minerale naturale - bottiglia 750ml',
    price: 2,
    category: 'contorni',
    allergens: [],
    tags: ['acqua'],
    available: true,
  },
];

export const todaySpecials: MenuItem[] = [
  {
    id: 'special-1',
    name: 'Zuppa di Pesce del Golfo',
    description: 'Zuppa ricca con pesci locali, molluschi e crostacei del giorno',
    price: 24,
    category: 'primi',
    allergens: ['pesce', 'molluschi', 'crostacei'],
    tags: ['special', 'limitato'],
    available: true,
    limitedQuantity: true,
  },
  {
    id: 'special-2',
    name: 'Crudo di Tonno Siciliano',
    description: 'Tonno rosso siciliano con pistacchi, agrumi e olio EVO al basilico',
    price: 22,
    category: 'antipasti',
    allergens: ['pesce', 'frutta a guscio'],
    tags: ['special', 'crudo'],
    available: true,
    limitedQuantity: true,
  },
  {
    id: 'special-3',
    name: 'Rombo Chiodato al Sale',
    description: 'Rombo chiodato fresco cotto in crosta di sale con erbe del mediterraneo',
    price: 28,
    category: 'secondi',
    allergens: ['pesce'],
    tags: ['special', 'pesce pregiato'],
    available: true,
    limitedQuantity: true,
  },
];