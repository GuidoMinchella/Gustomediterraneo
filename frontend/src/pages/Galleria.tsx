import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const Galleria: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const images = [
    {
      src: 'https://images.pexels.com/photos/8753656/pexels-photo-8753656.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Interno del ristorante',
      tag: 'sala',
    },
    {
      src: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Spaghetti alle vongole',
      tag: 'piatti',
    },
    {
      src: 'https://images.pexels.com/photos/12737268/pexels-photo-12737268.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Branzino fresco',
      tag: 'pescato',
    },
    {
      src: 'https://images.pexels.com/photos/5410400/pexels-photo-5410400.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Frittura di pesce',
      tag: 'piatti',
    },
    {
      src: 'https://images.pexels.com/photos/8753790/pexels-photo-8753790.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Cucina a vista',
      tag: 'cucina',
    },
    {
      src: 'https://images.pexels.com/photos/3662189/pexels-photo-3662189.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Crudo di pesce',
      tag: 'piatti',
    },
    {
      src: 'https://images.pexels.com/photos/7218637/pexels-photo-7218637.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Risotto ai frutti di mare',
      tag: 'piatti',
    },
    {
      src: 'https://images.pexels.com/photos/5487474/pexels-photo-5487474.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Polpo grigliato',
      tag: 'piatti',
    },
    {
      src: 'https://images.pexels.com/photos/5543346/pexels-photo-5543346.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Pescatori al lavoro',
      tag: 'pescato',
    },
    {
      src: 'https://images.pexels.com/photos/4197439/pexels-photo-4197439.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Pesce fresco del giorno',
      tag: 'pescato',
    },
    {
      src: 'https://images.pexels.com/photos/6479607/pexels-photo-6479607.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Chef al lavoro',
      tag: 'cucina',
    },
    {
      src: 'https://images.pexels.com/photos/5746034/pexels-photo-5746034.jpeg?auto=compress&cs=tinysrgb&w=800',
      alt: 'Vista del mare',
      tag: 'sala',
    },
  ];

  const tags = [
    { id: 'all', label: 'Tutte le Foto' },
    { id: 'piatti', label: 'I Nostri Piatti' },
    { id: 'pescato', label: 'Pesce Fresco' },
    { id: 'cucina', label: 'La Cucina' },
    { id: 'sala', label: 'Ambiente' },
  ];

  const filteredImages = selectedTag === 'all' 
    ? images 
    : images.filter(img => img.tag === selectedTag);

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % filteredImages.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? filteredImages.length - 1 : selectedImage - 1);
    }
  };

  return (
    <div className="min-h-screen bg-mediterranean-beige py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-mediterranean-blu-scuro mb-4">
            Galleria Fotografica
          </h1>
          <p className="text-lg text-mediterranean-blu-scuro max-w-2xl mx-auto">
            Scopri attraverso le immagini l'atmosfera del nostro ristorante, 
            la qualità dei nostri piatti e la freschezza del nostro pescato.
          </p>
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedTag === tag.id
                  ? 'bg-mediterranean-marroncino text-mediterranean-bianco shadow-md'
                  : 'bg-mediterranean-bianco text-mediterranean-blu-scuro hover:bg-mediterranean-marroncino hover:text-mediterranean-bianco'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {filteredImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity text-center px-4">
                  {image.alt}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Image */}
              <img
                src={filteredImages[selectedImage].src}
                alt={filteredImages[selectedImage].alt}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Image Info */}
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
                <p className="text-lg font-medium">{filteredImages[selectedImage].alt}</p>
                <p className="text-sm opacity-75">
                  {selectedImage + 1} di {filteredImages.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-mediterranean-bianco rounded-lg p-8 shadow-lg">
            <h3 className="font-serif text-2xl font-semibold text-mediterranean-blu-scuro mb-4">
              Vieni a Trovarci
            </h3>
            <p className="text-mediterranean-blu-scuro mb-6">
              Vieni a scoprire di persona l'atmosfera accogliente del nostro ristorante 
              e gusta i sapori autentici del mediterraneo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/prenota"
                className="inline-flex items-center justify-center px-6 py-3 bg-mediterranean-marroncino text-mediterranean-bianco rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Prenota il Tuo Ordine
              </a>
              <a
                href="/contatti"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-mediterranean-marroncino text-mediterranean-marroncino rounded-lg hover:bg-mediterranean-marroncino hover:text-mediterranean-bianco transition-colors font-medium"
              >
                Come Raggiungerci
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Galleria;