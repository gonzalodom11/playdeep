import React from 'react';
import { Video, Zap, Users, Layers, LineChart, Shield } from 'lucide-react';

const features = [
  {
    icon: <Video className="h-10 w-10 text-football-accent" />,
    title: "Análisis frame por frame",
    description: "Desglosa cada jugada con controles de tiempo precisos y vistas de múltiples ángulos."
  },
  {
    icon: <Zap className="h-10 w-10 text-football-accent" />,
    title: "Anotaciones en tiempo real",
    description: "Crea anotaciones y comentarios mientras ves el partido para una revisión posterior." 
  },
  {
    icon: <Users className="h-10 w-10 text-football-accent" />,
    title: "Colaboración en equipo",
    description: "Comparte análisis con el personal técnico y los jugadores con niveles de acceso personalizados." 
  },
  {
    icon: <Layers className="h-10 w-10 text-football-accent" />,
    title: "Detección de formaciones",
    description: "Analiza las formaciones y el juego posicional con herramientas de seguimiento automatizadas."
  },
  {
    icon: <LineChart className="h-10 w-10 text-football-accent" />,
    title: "Métricas de rendimiento",
    description: "Sigue estadísticas clave y visualiza tendencias a lo largo de múltiples partidos y sesiones de entrenamiento." 
  },
  {
    icon: <Shield className="h-10 w-10 text-football-accent" />,
    title: "Análisis de oponentes",
    description: "Identifica patrones de juego y debilidades en los oponentes para preparar estrategias efectivas." 
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
          <p className="max-w-2xl mx-auto text-gray-300">
            Todo lo que necesitas para transformar el metraje de partidos en información útil
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-300">
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