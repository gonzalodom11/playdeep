"use client"
import React from 'react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';


const Hero: React.FC = () => {


  return (
    <div className="relative min-h-[80vh] flex items-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1434648957308-5e6a859697e8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center">
        <div className="absolute inset-0 hero-gradient"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10 2xl:px-30">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex-1 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
              PlayDeep          
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-6 sm:mb-8 font-semibold">
            Deep Learning para detectar, analizar y visualizar cada jugada en todo detalle. 
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" className="bg-football-accent hover:bg-football-accent/90 text-football-dark text-base sm:text-lg w-full sm:w-auto">
                <Link href={"/videos"}>Ver Videos</Link>
              </Button>
            </div>
          </div>

          
          <div className="flex-shrink-0 order-first lg:order-last">
            <img 
              src="/playdeep-icon.png" 
              alt="PlayDeep Icon"
              className="h-28 w-auto sm:h-30 md:h-40 lg:h-48 xl:h-55 mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;