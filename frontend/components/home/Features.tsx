import React from 'react';
import { Video, Zap, Users, Layers, LineChart, Shield } from 'lucide-react';

const features = [
  {
    icon: <Video className="h-10 w-10 text-football-accent" />,
    title: "Frame-by-Frame Analysis",
    description: "Break down every play with precision timing controls and multi-angle views."
  },
  {
    icon: <Zap className="h-10 w-10 text-football-accent" />,
    title: "Real-Time Annotations",
    description: "Draw directly on footage to highlight player positioning, tactical formations, and movement patterns."
  },
  {
    icon: <Users className="h-10 w-10 text-football-accent" />,
    title: "Team Collaboration",
    description: "Share analyses with coaching staff and players with customized access levels."
  },
  {
    icon: <Layers className="h-10 w-10 text-football-accent" />,
    title: "Formation Tracking",
    description: "Analyze team shapes and positional play with automated tracking tools."
  },
  {
    icon: <LineChart className="h-10 w-10 text-football-accent" />,
    title: "Performance Metrics",
    description: "Track key statistics and visualize trends over multiple matches and training sessions."
  },
  {
    icon: <Shield className="h-10 w-10 text-football-accent" />,
    title: "Opponent Analysis",
    description: "Scout competitors and develop game plans based on detailed breakdowns of their play style."
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-football-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-football-dark dark:text-white mb-4">
            Powerful Analysis Tools
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            Everything you need to transform raw match footage into actionable insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-football-dark dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
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