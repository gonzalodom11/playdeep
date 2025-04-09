import React from 'react';
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-[80vh] flex items-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1893&auto=format&fit=crop&ixlib=rb-4.0.3')] bg-cover bg-center">
        <div className="absolute inset-0 hero-gradient"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            PlayDeep          
          </h1>
          <p className="text-xl text-gray-200 mb-8">
          Deep Learning para detectar, analizar y visualizar cada jugada en todo detalle. 
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="bg-football-accent hover:bg-football-accent/90 text-football-dark text-lg">
              Prueba gratis
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 flex items-center">
              <Play size={16} className="mr-2" />
              Ver Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;