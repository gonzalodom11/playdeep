"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Search, User } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-football-dark/80 backdrop-blur-md z-50 border-b border-football-medium">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <a className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-football-accent flex items-center justify-center">
              <span className="text-football-dark font-bold text-lg">PD</span>
            </div>
            {!isMobile && (
              <span className="font-bold text-xl text-white">PlayDeep</span>
            )}
          </a>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-gray-300 hover:text-football-accent transition-colors">Características</a>
          <a href="#demo" className="text-gray-300 hover:text-football-accent transition-colors">Demo</a>
          <a href="#pricing" className="text-gray-300 hover:text-football-accent transition-colors">Precio</a>
        </nav>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-football-medium dark:text-gray-300">
            <Search size={20} />
          </Button>
          <Button variant="outline" className="hidden md:flex">Sign In</Button>
          <Button className="bg-football-accent hover:bg-football-accent/90 text-football-dark">
            <span className="hidden md:inline">Comenzar</span>
            <User size={18} className="md:hidden" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;