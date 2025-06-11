"use client";
import { Card } from "@/components/ui/card";
import Image from "next/image";

const research = () => {
  return (
    <div className="container mx-auto px-4" >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="video-detail mt-8 lg:max-h-[700px] overflow-auto">
        <h1 className="text-3xl font-bold text-white text-center mt-16 mb-8">Investigación Playdeep</h1>
        

  <div className="px-4 pb-6 text-white space-y-4">
    <p className="whitespace-pre-line text-justify">
    La propuesta tiene como objetivo principal analizar, a través de vídeos de partidos de fútbol, los diferentes eventos que ocurren durante el desarrollo del juego. Este análisis se enfoca en momentos clave de la acción, como pases, tiros, movimientos tácticos, posicionamiento de los jugadores o posibles jugadas destacadas. Para lograrlo, se utilizan técnicas de visión por computador y modelos de inteligencia artificial que permiten interpretar el contenido visual del vídeo fotograma a fotograma.
    </p>
      <h1 className="text-2xl font-bold text-white">Detección de objetos</h1>  
    <p>
    Uno de los métodos más comunes en la tarea de detección de múltiples objetos (MOT, por sus siglas en inglés) consiste el localizar los objetos de interés en cada instante y vincular los objetos detectados a través de los siguientes fotogramas. Consecuentemente, se obtienen secuencias de seguimiento o tracklets (Zheng Zhang 2018) encontrando las relaciones entre los diferentes instantes del video.  
    </p>
    En nuestra investigación los objetos a detectar pertenecen a las siguientes clases: jugador, portero, árbitro y balón. Entonces, en cada fotograma, se identificarán algunos jugadores, uno o dos porteros, el balón, todo depende de la parte del campo enfocada. A excepción del balón que se mueve con mucha más rapidez, la posición de los jugadores no cambia tanto de un fotograma a otro. Al ser detectados en un fotograma, un objeto que se encuentre en una posición similar al siguiente instante, será más fácil de detectar que es un jugador. Siempre que se formen estas secuencias de seguimiento.
    <h1 className="text-lg font-bold text-white text-center mt-4">Entrenamiento de un modelo de detección de objetos</h1>
    <p>
    Para entrenar un modelo de estas características es necesario encontrar un dataset de datos lo suficientemente grande y diverso, para obtener resultados de una precisión óptima. En este proyecto se utiliza un dataset (Roboflow 2024) de unas 400 imágenes sacadas de partidos de fútbol de la Bundesliga. Estas imágenes tienen anotaciones dónde quedan identificados los jugadores, el balón, los árbitros y los porteros que se tratan como una clase diferente al llevar colores diferentes que los de sus compañeros. La localización de los porteros servirá más tarde para que el modelo pueda identicar el equipo de cada jugador.
    </p>  
    <p>
    Uno de los retos principales, es la localización de la pelota, al ser un objeto pequeño y con tanta rapidez. En algunos fotogramas, puede aparecer borrosa haciendo que sea difícil su detección por parte del modelo. Hay también situaciones que hacen aún más compleja esta tarea como cuando la pelota se encuentra en el aire y se solapa con el público o cuando hay más objetos tirados en el campo como botellas, bolsas, globos…
    </p>
    <p className="text-sm text-white mt-8">
    Zheng Zhang, Dazhi Cheng, Xizhou Zhu, Stephen Lin. 2018. «Integrated Object Detection and Tracking with Tracklet-Conditioned Detection.» Cornell University 1-12..{" "}
        <a
            href="https://arxiv.org/abs/1811.11167?context=cs.CV"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400 hover:text-blue-300"
        >
            https://arxiv.org/abs/1811.11167?context=cs.CV
        </a>
    </p>
    <p className="text-sm text-white">
        Roboflow. 2024. «football-players-detection Computer Vision Project.» Universe Roboflow.{" "}
        <a
            href="https://universe.roboflow.com/roboflow-jvuqo/football-players-detection-3zvbc"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-400 hover:text-blue-300"
        >
            https://universe.roboflow.com/roboflow-jvuqo/football-players-detection-3zvbc
        </a>
    </p>
  </div>
        </Card>


          
           
        <div className="mb-20 lg:mt-30">
        <Image src="/scoutingfeed.png" alt="Research" width={1000} height={1000} />
        </div>
            
            


        </div>
      </div>
  );
};

export default research;
