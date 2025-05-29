"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Star, Briefcase } from "lucide-react";

export default function MonetizationScreen() {
  return (
    <div className="min-h-screen bg-football-dark flex items-center justify-center p-4">
      <Card className="backdrop-blur-md bg-white/10 shadow-xl border border-white/20 text-white p-4 sm:p-6 rounded-2xl w-[95%] sm:w-[90%] max-w-4xl mx-auto">
        <CardHeader className="text-center mb-4 sm:mb-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-green-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Modelo de Monetización</h2>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 text-white/90 text-sm sm:text-base leading-relaxed">
          <p className="text-base sm:text-lg">
            PlayDeep ha sido diseñado como una plataforma accesible para jugadores, entrenadores y analistas del mundo del fútbol. Para garantizar su sostenibilidad y crecimiento, se ha definido un modelo de monetización escalable que combina servicios gratuitos y funcionalidades premium.
          </p>

          <ol className="list-decimal list-inside space-y-3 sm:space-y-4">
            <li className="flex items-start gap-2 sm:gap-3">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-sky-400 mt-1 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base lg:text-lg">
                <strong>Acceso Gratuito:</strong> Los usuarios pueden registrarse de forma gratuita y acceder a funcionalidades básicas como la subida de vídeos, visualización y gestión de sus propios contenidos.
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 mt-1 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base lg:text-lg">
                <strong>Planes Premium:</strong> Se ofrecerán suscripciones mensuales o anuales que desbloquean herramientas avanzadas de análisis, acceso anticipado a nuevas funciones y mayor capacidad de almacenamiento.
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-pink-400 mt-1 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base lg:text-lg">
                <strong>Espacios Patrocinados:</strong> Integración de marcas deportivas o tecnológicas mediante banners no invasivos o contenidos patrocinados dentro del área pública de la plataforma.
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400 mt-1 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base lg:text-lg">
                <strong>Servicios Personalizados:</strong> Los equipos o academias podrán contratar planes personalizados con funcionalidades específicas, integración de modelos de IA o soporte técnico dedicado.
              </span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400 mt-1 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base lg:text-lg">
                <strong>Colaboraciones con entidades deportivas:</strong> Se podrán establecer acuerdos con clubes, federaciones o escuelas deportivas para brindar licencias colectivas.
              </span>
            </li>
          </ol>

          <p className="text-base sm:text-lg">
            Este enfoque mixto busca mantener el acceso gratuito para la mayoría de usuarios, mientras se generan ingresos que permitan mantener la infraestructura, ampliar el equipo de desarrollo y seguir incorporando mejoras al sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
