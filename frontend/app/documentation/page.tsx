"use client";
import { Card } from "@/components/ui/card";
import Image from "next/image";

const Documentation = () => {
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="video-detail mt-8 lg:max-h-[700px] overflow-auto">
          <h1 className="text-3xl font-bold text-white text-center mt-16 mb-8">
            Documentación PlayDeep
          </h1>

          <div className="px-4 pb-6 text-white space-y-4">
            <p className="whitespace-pre-line text-justify">
              PlayDeep es una plataforma de análisis de vídeos de fútbol diseñada para ayudar a entrenadores, analistas y jugadores a estudiar el juego con mayor profundidad. A través de técnicas de inteligencia artificial y visión por computador, la herramienta permite detectar jugadores, extraer patrones tácticos y generar informes inteligentes desde cualquier dispositivo.
            </p>

            <h2 className="text-2xl font-bold">Guía de uso</h2>
            <p>
              ▸ <strong>Subida de vídeos:</strong> Puedes subir vídeos en formato MP4 de hasta 300 MB. Una vez procesados, estarán disponibles en tu cuenta.
              <br />
              ▸ <strong>Navegación:</strong> Usa el reproductor para avanzar frame a frame, pausando en momentos clave del partido.
              <br />
              ▸ <strong>Detección de jugadores:</strong> Con un clic, el sistema identifica jugadores, porteros, árbitros y el balón.
              <br />
              ▸ <strong>Análisis con IA:</strong> Escribe una instrucción como “¿Qué está haciendo el jugador más adelantado?” y el sistema generará una descripción automática del frame.
            </p>

            <h2 className="text-2xl font-bold">Modelos de IA</h2>
            <p>
              Utilizamos modelos de detección entrenados con imágenes de partidos reales (Bundesliga), donde se anotaron manualmente las posiciones de jugadores y objetos clave. Para el análisis de imagen, se utiliza la API de OpenAI (GPT-4o) que interpreta visualmente los fotogramas en base al contexto futbolístico proporcionado.
            </p>

            <h2 className="text-2xl font-bold">Infraestructura</h2>
            <p>
            La infraestructura de PlayDeep sigue una arquitectura moderna basada en la separación entre frontend y backend, permitiendo escalabilidad y mantenibilidad. El backend está construido con Django 5.0 y Python 3.12, utilizando PostgreSQL como base de datos principal con conexiones SSL para mayor seguridad. Se utiliza Django Ninja Extra para la creación de APIs REST, junto con módulos especializados para el manejo de contenido multimedia. Además, el sistema está containerizado con Docker y utiliza Gunicorn como servidor WSGI para despliegue en producción.
            <br></br>
            <br></br>
            El frontend, desarrollado en Next.js con React 19 y TypeScript, ofrece una experiencia rápida y optimizada gracias al uso de Tailwind CSS para estilos y Radix UI para componentes accesibles. Se implementan librerías como SWR y TanStack React Query para el manejo eficiente de datos y estado. La comunicación con el backend se realiza mediante Axios, y el sistema está diseñado para desplegarse fácilmente en plataformas como Railway y Vercel. Todo ello está reforzado por una configuración de seguridad robusta basada en CORS, protección CSRF y gestión de variables de entorno.   
            </p>

            <h2 className="text-2xl font-bold">FAQ</h2>
            <ul className="list-disc ml-6">
              <li>¿Qué pasa si el modelo no detecta bien a un jugador? — Puedes ajustar el frame manualmente o intentar otro ángulo del vídeo.</li>
              <li>¿Cuántos vídeos puedo subir? — No hay límite si estás en la versión de pago.</li>
              <li>¿La IA reconoce equipos? — Sí, si se ha detectado el portero, puede inferir el equipo por colores.</li>
            </ul>

            <p className="text-sm text-white mt-8">
              Aprende más sobre cómo entrenamos los modelos:
              <a
                href="https://universe.roboflow.com/roboflow-jvuqo/football-players-detection-3zvbc"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400 hover:text-blue-300 ml-1"
              >
                Roboflow - football-players-detection
              </a>
            </p>
          </div>
        </Card>

        <div className="mb-20 lg:mt-8">
          <Image src="/api-docs.png" alt="Documentación" width={1000} height={1000} />
        </div>
      </div>
    </div>
  );
};

export default Documentation;
