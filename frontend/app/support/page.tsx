'use client';

import { HelpCircle, Mail, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Soporte</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ¡Estamos aquí para ayudarte! Elige una de las siguientes opciones para obtener el soporte que necesitas.
            Nuestro equipo está comprometido a ofrecerte la mejor asistencia posible.
          </p>
        </div>

        {/* Opciones de Soporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Tarjeta de FAQ */}
          <Link href="/support/faq" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <HelpCircle className="h-8 w-8 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 ml-3">Preguntas Frecuentes</h2>
              </div>
              <p className="text-gray-600">
                Encuentra respuestas a las preguntas más comunes sobre nuestros servicios y funcionalidades.
              </p>
            </div>
          </Link>

          {/* Tarjeta de Contacto */}
          <Link href="/support/contact" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <Mail className="h-8 w-8 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 ml-3">Contáctanos</h2>
              </div>
              <p className="text-gray-600">
                Ponte en contacto con nuestro equipo de soporte para recibir asistencia personalizada.
              </p>
            </div>
          </Link>

          {/* Tarjeta de Guía del Usuario */}
          <Link href="/support/guide" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900 ml-3">Guía del Usuario</h2>
              </div>
              <p className="text-gray-600">
                Accede a documentación completa y tutoriales para ayudarte a comenzar.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
