import React from 'react';
import { Video, Zap, Users, Layers, Shield, Settings } from 'lucide-react';

const features = [
  {
    icon: <Video className="h-10 w-10 text-football-accent" />,
    title: "Análisis frame por frame",
    description: "Desglosa cada jugada con controles de tiempo precisos y vistas de múltiples ángulos."
  },
  {
    icon: <Zap className="h-10 w-10 text-football-accent" />,
    title: "Registrate y comienza a analizar",
    description: "Analiza tus videos de futbol en minutos."+ 
    " Tras iniciar sesión, puedes subir tus propios partidos y obtener un análisis detallado." 
  },
  {
    icon: <Users className="h-10 w-10 text-football-accent" />,
    title: "Consulta a otros usuarios",
    description: "Puedes acceder a los videos públicos de otros usuarios. Haz tu propio estudio sobre sus partidos." 
  },
  {
    icon: <Layers className="h-10 w-10 text-football-accent" />,
    title: "Cuenta personalizada",
    description: "Crea tu cuenta, gestiona tus vídeos, y mantén un historial de tus análisis y subidas recientes."
  },
  {
    icon: <Shield className="h-10 w-10 text-football-accent" />,
    title: "Análisis de oponentes",
    description: "Identifica patrones de juego y debilidades en los oponentes para preparar estrategias efectivas." 
  },
  {
    icon: <Settings className="h-10 w-10 text-football-accent" />,
    title: "Plataforma en desarrollo",
    description: "La aplicación se encuentra en constante evolución, incorporando nuevas funciones y mejoras sugeridas por los usuarios."
  }
  
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-football-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Herramientas potentes para el análisis de partidos
          </h2>
          <p className="max-w-2xl mx-auto text-gray-300 text-lg mt-8">
            Todo lo que necesitas para transformar el metraje de partidos en información útil
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-lg">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;