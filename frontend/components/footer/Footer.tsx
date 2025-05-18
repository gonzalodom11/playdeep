import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-football-medium py-12 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-football-accent flex items-center justify-center">
                <span className="text-football-dark font-bold text-lg">PD</span>
              </div>
              <span className="font-bold text-xl">PlayDeep</span>
            </div>
            <p className="text-gray-300">
              Plataforma de análisis de videos de futbol para entrenadores, analistas y clubes.
            </p>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-semibold text-lg mb-4">Producto</h4>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-gray-300 hover:text-football-accent">Características</Link></li>
              <li><a href="#" className="text-gray-300 hover:text-football-accent">Monetización</a></li>
              <li><a href="#" className="text-gray-300 hover:text-football-accent">Investigación</a></li>
              <li><a href="#" className="text-gray-300 hover:text-football-accent">Opiniones</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-semibold text-lg mb-4">Recursos</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-football-accent">Documentación</a></li>
              <li><a href="#" className="text-gray-300 hover:text-football-accent">Tutoriales</a></li>
              {/*<li><a href="#" className="text-gray-300 hover:text-football-accent">Blog</a></li>*/}
              <li><a href="#" className="text-gray-300 hover:text-football-accent">Support</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-semibold text-lg mb-4">Equipo</h4>
            <ul className="space-y-2">
              <li><a href="https://gonzalodom11.github.io/" className="text-gray-300 hover:text-football-accent">Acerca del autor</a></li>
              {/*<li><a href="#" className="text-gray-300 hover:text-football-accent">Trabajos</a></li>*/}
              <li><a href="https://www.linkedin.com/in/gonzalodm9/" className="text-gray-300 hover:text-football-accent">Contacto</a></li>
              <li><Link href="/privacyPolicy" className="text-gray-300 hover:text-football-accent">Política de privacidad</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-football-light/30 mt-10 pt-6">
          <p className="text-gray-400 text-center text-sm">
            © {new Date().getFullYear()} PlayDeep Insights. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;