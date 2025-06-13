'use client';

import { HelpCircle, Mail, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-football-dark py-12 px-4 sm:px-6 lg:px-8">
      <Card className="backdrop-blur-md bg-white/10 shadow-xl border border-white/20 text-white p-6 rounded-2xl w-[100%] max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-football-accent mb-4">Soporte</h1>
          <p className="text-lg max-w-2xl mx-auto">
            ¡Estamos aquí para ayudarte! Elige una de las siguientes opciones para obtener el soporte que necesitas.
            Nuestro equipo está comprometido a ofrecerte la mejor asistencia posible.
          </p>
        </div>

        {/* Opciones de Soporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Tarjeta de FAQ */}
          <Link href="/documentation" className="block">
          <div className="border-2 border-blue-500 hover:border-green-500 transition-colors duration-500 rounded-lg p-4">
          <div className="flex items-center mb-4 bg-football-accent p-2 rounded-lg">
                <HelpCircle className="h-8 w-8 text-blue-600 ml-4" />
                <h2 className="text-xl font-semibold text-gray-900 text-center">Preguntas Frecuentes</h2>
              </div>
              <p className="text-white">
                Encuentra respuestas a las preguntas más comunes sobre nuestros servicios y funcionalidades.
              </p>
            </div>
          </Link>

          {/* Tarjeta de Contacto */}
          <Link href="https://www.linkedin.com/in/gonzalodm9/" className="block">
          <div className="border-2 border-blue-500 hover:border-green-500 transition-colors duration-500 rounded-lg p-4">
            <div className="flex items-center mb-4 bg-football-accent p-2 rounded-lg">
                <Mail className="h-8 w-8 text-orange-600 ml-4" />
                <h2 className="text-xl font-semibold text-gray-900 text-center ml-3">Contáctanos</h2>
              </div>
              <p className="text-white">
                Ponte en contacto con nuestro equipo de soporte para recibir asistencia personalizada.
              </p>
            </div>
          </Link>

          {/* Tarjeta de Guía del Usuario */}
          <Link href="/documentation" className="block">
          <div className="border-2 border-blue-500 hover:border-green-500 transition-colors duration-500 rounded-lg p-4">
              <div className="flex items-center mb-4 bg-football-accent p-4 rounded-lg">
                <BookOpen className="h-8 w-8 text-purple-600 ml-3" />
                <h2 className="text-xl font-semibold text-gray-900 text-center ml-3">Guía del Usuario</h2>
              </div>
              <p className="text-white">
                Accede a documentación completa y tutoriales para ayudarte a comenzar.
              </p>
            </div>
          </Link>
          </div>
      </Card>
    </div>
  );
}
