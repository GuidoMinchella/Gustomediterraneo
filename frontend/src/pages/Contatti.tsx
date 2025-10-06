import React from 'react';
import { MapPin, Phone, Clock, Mail, Car, Bus, Train, Facebook, Instagram } from 'lucide-react';
import Card from '../components/UI/Card';

const Contatti: React.FC = () => {
  const faq = [
    {
      question: 'Come funziona il servizio take away?',
      answer: 'Puoi ordinare online attraverso il nostro sito, selezionando i piatti dal menù e scegliendo l\'orario di ritiro. Riceverai una conferma via email con tutti i dettagli.',
    },
    {
      question: 'Quali sono gli orari di ritiro disponibili?',
      answer: 'Gli orari di ritiro sono: martedì-sabato dalle 11:00 alle 15:30 e dalle 17:00 alle 22:00, domenica dalle 09:30 alle 15:00. Lunedì chiuso.',
    },
    {
      question: 'Posso richiedere informazioni sugli allergeni?',
      answer: 'Assolutamente sì. Ogni piatto ha indicati gli allergeni principali. Per informazioni dettagliate puoi contattarci telefonicamente o specificare allergie particolari nelle note dell\'ordine.',
    },
    {
      question: 'È possibile modificare o cancellare un ordine?',
      answer: 'Puoi modificare o cancellare il tuo ordine chiamandoci entro 30 minuti dalla conferma. Dopo questo termine, l\'ordine è già in preparazione.',
    },
    {
      question: 'Accettate prenotazioni per grandi gruppi?',
      answer: 'Per ordini superiori a 6 persone ti consigliamo di chiamarci direttamente per organizzare al meglio la preparazione e i tempi di ritiro.',
    },
    {
      question: 'Il pesce è sempre fresco?',
      answer: 'Il nostro pesce viene acquistato ogni mattina fresco dal mercato del pesce di Napoli. Non utilizziamo mai prodotti congelati per le nostre preparazioni.',
    },
  ];

  return (
    <div className="min-h-screen bg-mediterranean-beige py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-mediterranean-blu-scuro mb-4">
            Contatti e Informazioni
          </h1>
          <p className="text-lg text-mediterranean-blu-scuro max-w-2xl mx-auto">
            Tutte le informazioni per raggiungerci, contattarci e organizzare il tuo ordine take away.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-6">
                Informazioni di Contatto
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-mediterranean-marroncino mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro">Indirizzo</h4>
                <p className="text-mediterranean-blu-scuro">Viale Anicio Gallo, 49, 00174 Roma RM</p>
                <p className="text-mediterranean-blu-scuro">Roma (RM)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-mediterranean-marroncino mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro">Telefono</h4>
                    <a 
                      href="tel:+393313320411" 
                      className="text-mediterranean-marroncino hover:underline text-lg"
                    >
                      +39 331 332 0411
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-mediterranean-marroncino mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro">Email</h4>
                    <a 
                      href="mailto:info@gustomediterraneo.it" 
                      className="text-mediterranean-marroncino hover:underline"
                    >
                      info@gustomediterraneo.it
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-mediterranean-marroncino mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">Orari di Apertura</h4>
                    <div className="space-y-1 text-mediterranean-blu-scuro">
                      <p><span className="font-medium">Lunedì:</span> Chiuso</p>
                      <p><span className="font-medium">Mar - Sab:</span> 11:00 - 15:30 | 17:00 - 22:00</p>
                      <p><span className="font-medium">Domenica:</span> 09:30 - 15:00</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-mediterranean-beige">
                <a
                  href="tel:+393313320411"
                  className="w-full bg-mediterranean-marroncino hover:bg-opacity-90 text-mediterranean-bianco px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Chiama Ora
                </a>
              </div>
            </Card>

            {/* Transportation */}
            <Card>
              <h3 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-6">
                Come Raggiungerci
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Car className="w-6 h-6 text-mediterranean-marroncino mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro">In Auto</h4>
                    <p className="text-mediterranean-blu-scuro text-sm">
                      Parcheggio disponibile nelle vicinanze.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Bus className="w-6 h-6 text-mediterranean-marroncino mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro">Mezzi Pubblici</h4>
                    <p className="text-mediterranean-blu-scuro text-sm">
                      Autobus: linee ATAC 557 - Fermata "Anicio Gallo/Appio Claudio"<br />
                      Distanza: 50 metri dalla fermata
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Train className="w-6 h-6 text-mediterranean-marroncino mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-mediterranean-blu-scuro">Metro</h4>
                    <p className="text-mediterranean-blu-scuro text-sm">
                      Metro A: Fermata "Giulio Agricola" (400 metri)
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Map */}
          <div>
            <Card className="h-full">
              <h3 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-6">
                Dove Siamo
              </h3>
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-mediterranean-marroncino mx-auto mb-2" />
                  <p className="text-mediterranean-blu-scuro font-medium">Mappa Interattiva</p>
                  <p className="text-sm text-mediterranean-blu-scuro opacity-75">
                    Viale Anicio Gallo, 49, 00174 Roma RM
                  </p>
                  <button 
                    onClick={() => window.open('https://maps.google.com/?q=Viale+Anicio+Gallo+49+Roma', '_blank')}
                    className="mt-4 px-4 py-2 bg-mediterranean-marroncino text-mediterranean-bianco rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                  >
                    Apri in Google Maps
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Social Section */}
        <Card className="mt-8">
          <h3 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-6 text-center">
            Seguici sui nostri social
          </h3>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://www.facebook.com/gustomediterraneoroma/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-mediterranean-marroncino text-mediterranean-bianco rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </a>
            <a
              href="https://www.instagram.com/gustomediterraneoroma_/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-mediterranean-marroncino text-mediterranean-bianco rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span>Instagram</span>
            </a>
          </div>
        </Card>

        {/* FAQ Section */}
        <Card>
          <h3 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-8 text-center">
            Domande Frequenti
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faq.map((item, index) => (
              <div key={index} className="p-4 bg-mediterranean-beige rounded-lg">
                <h4 className="font-semibold text-mediterranean-blu-scuro mb-2">
                  {item.question}
                </h4>
                <p className="text-mediterranean-blu-scuro text-sm leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Sezione form contatti rimossa */}
      </div>
    </div>
  );
};

export default Contatti;