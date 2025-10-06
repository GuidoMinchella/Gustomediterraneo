import React from 'react';
import { MapPin, Phone, Clock, Mail, Facebook, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-mediterranean-blu-scuro text-mediterranean-bianco">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Contatti */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">Contatti</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm">Viale Anicio Gallo, 49, 00174 Roma RM</p>
                <p className="text-sm">Roma (RM)</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">+39 331 332 0411</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">info@gustomediterraneo.it</p>
              </div>
            </div>
          </div>

          {/* Orari */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">Orari di Apertura</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Lunedì:</span>
                <span>Chiuso</span>
              </div>
              <div className="flex justify-between">
                <span>Mar - Sab:</span>
                <span>11:00 - 15:30<br />17:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Domenica:</span>
                <span>09:30 - 15:00</span>
              </div>
            </div>
          </div>

          {/* Link Utili */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">Link Utili</h3>
            <div className="space-y-2">
              <a href="/" className="block text-sm hover:text-mediterranean-beige transition-colors">
                Home
              </a>
              <a href="/menu-fisso" className="block text-sm hover:text-mediterranean-beige transition-colors">
                Menu Fisso
              </a>
              <a href="/menu-del-giorno" className="block text-sm hover:text-mediterranean-beige transition-colors">
                Menu del Giorno
              </a>
              <a href="/galleria" className="block text-sm hover:text-mediterranean-beige transition-colors">
                Galleria
              </a>
              <a href="/contatti" className="block text-sm hover:text-mediterranean-beige transition-colors">
                Contatti
              </a>
            </div>
          </div>

          {/* Social e Newsletter */}
          <div>
            <h3 className="font-serif text-xl font-semibold mb-4">Seguici</h3>
            <div className="flex space-x-4 mb-4">
              <a
                href="https://www.facebook.com/gustomediterraneoroma/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-mediterranean-marroncino rounded-full hover:bg-opacity-80 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/gustomediterraneoroma_/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-mediterranean-marroncino rounded-full hover:bg-opacity-80 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div>
              <p className="text-sm mb-2">Iscriviti alla newsletter</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="La tua email"
                  className="flex-1 px-3 py-2 bg-mediterranean-beige text-mediterranean-blu-scuro text-sm rounded-l-md focus:outline-none focus:ring-2 focus:ring-mediterranean-marroncino"
                />
                <button className="px-4 py-2 bg-mediterranean-marroncino text-sm rounded-r-md hover:bg-opacity-80 transition-colors">
                  Iscriviti
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-mediterranean-marroncino mt-8 pt-8 text-center">
          <p className="text-sm text-mediterranean-beige">
            © 2024 Gusto Mediterraneo - Fish Take Away. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;