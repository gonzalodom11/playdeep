"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, Brain} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { useParams } from 'next/navigation'
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';


// get requests to the Django API
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());
const imageFetcher = (...args: [RequestInfo | URL, RequestInit?]) =>
  fetch(...args).then(res => res.blob()).then(blob => URL.createObjectURL(blob));

const VideoDetail = () => {
  const [detectedPress, setDetectedPress] = useState<boolean | null>(false);
  const [analyzePress, setAnalyzePress] = useState<boolean | null>(false);
  const [frameNumber, setFrameNumber] = useState<number>(5);
  const [outputFrame, setOutputFrame] = useState<string | null>("5");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  // New states for AI analysis
  const [userPrompt, setUserPrompt] = useState<string>("¿Qué ves en esta imagen?");
  const videoRef = useRef<HTMLVideoElement>(null);

  const params = useParams();
  const { year, month, day, slug } = params as { year: string; month: string; day: string; slug: string };    
  const { data: video, error, isLoading } = useSWR(`${apiUrl}${year}/${month}/${day}/${slug}`, fetcher);
  // Usar frameNumber como query param
  const { data: detectPlayer } = useSWR(
    detectedPress ? `${apiUrl}${year}/${month}/${day}/${slug}/detect-players?frame=${frameNumber}` : null,
    imageFetcher,
    { revalidateOnFocus: false }
  );


  useEffect(() => {  
    setDetectedPress(false); // reset automatically after loading
    setAnalyzePress(false);
  }, [frameNumber]);



  useEffect(() => {
    if ((analyzePress || detectedPress) && !analysis) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
      }, 3000); // every 3 seconds
  
      return () => clearInterval(interval); // cleanup on unmount or when condition changes
    }
  }, [analyzePress, analysis, detectedPress]);
  

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">
      <Image 
        src="/blocks-shuffle-4.svg" 
        alt="Loading..." 
        width={80} 
        height={80} 
        className="mb-4"
      />
      <div className="text-white text-lg">Loading video...</div>
    </div>
  );
  if (error) return <div className="text-white">Error loading video</div>;
  
  

  const handleDetectPlayer = () => {
    // For demonstration, we'll use a placeholder image
    setAnalyzePress(false);
    setDetectedPress(true); 
  };

  const handleAnalyzeWithLLM = async () => {
    setAnalyzePress(true);
    setDetectedPress(false);
    try {
      const response = await fetch(`${apiUrl}${year}/${month}/${day}/${slug}/analyze-llm`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: userPrompt,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
  
      const result = await response.json();
      setAnalysis(result.analysis); // set this in state
    } catch (error) {
      console.error('Analyze LLM error:', error);
      toast({
        title: "Error al analizar",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };


const loadingMessages = [
  "Analizando imagenes con IA...",
  "Detectando patrones tácticos...",
  "Consultando al modelo LLM...",
  "Generando análisis futbolistico...",
  "Procesando jugadas clave...",
];


  if (!video) {
    return <div className="container mx-auto px-4 py-8">Video not found</div>;
  }

  return (
    <div className="container mx-auto px-4" >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="video-detail mt-8 lg:min-h-[700px]">
          <div className="relative aspect-video w-full rounded-xl mb-3">
          <video
            ref={videoRef}
            src={video.video}
            controls
            className="w-full h-full object-cover mb-3"
          /> 
          </div>
    {/* Bottom info section */}
          <div className="flex flex-col justify-between flex-grow px-4 py-3 text-white space-y-4">
            <h1 className="flex items-center text-lg z-10 font-semibold">{video.caption}</h1>
            <label className="text-white mb-2">
              <div className="flex items-center space-x-2">
                <span>Tiempo (segundos) :</span>
                <input 
                  type="number"
                  className="p-1 rounded text-black bg-white"
                  value={outputFrame ?? ""}
                  min={0}
                  onChange={(e) => {
                    setDetectedPress(false); // reset automatically after loading
                    const value = e.target.value;
                    setFrameNumber(value === '' ? 5 : parseInt(value));
                    setOutputFrame(value);
                  }}
                />
                <span className="text-sm text-gray-300">(30 frames = 1 s)</span>
              </div>
            </label>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {video && <Button 
                    onClick={handleDetectPlayer}
                    className="bg-football-accent hover:bg-football-accent/90 text-football-dark text-lg"
                  >
                    <Camera className="mr-2" />
                    Detectar jugadores
                  </Button>}
              
              <Button 
                onClick={handleAnalyzeWithLLM}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg"
              >
                <Brain className="mr-2" />
                Analizar con IA
              </Button>
            </div>

            {/* AI Analysis Section */}
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-white mb-2">
                  Pregunta o instrucción para la IA:
                </label>
                                 <div className="flex gap-2">
                   <Input
                     id="prompt"
                     value={userPrompt}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserPrompt(e.target.value)}
                     placeholder="Escribe tu pregunta aquí..."
                     className="flex-1 text-black bg-white"
                   />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Analysis Results */}
        {/* Existing player detection results */}
        {!detectPlayer && detectedPress && (
            <Card className="video-detail mt-8">
              <div className="aspect-video relative flex flex-col items-center justify-center">
                <Image 
                  src="/blocks-shuffle-4.svg" 
                  alt="Loading..." 
                  width={60} 
                  height={60} 
                  className="mt-4 mb-4"
                />
                 <span className="text-white text-lg mt-4">{loadingMessages[loadingMessageIndex]}</span>
                 </div>
            </Card>
          )}
          {detectPlayer && detectedPress && (
            <Card className="video-detail mt-8 max-h-[350px] lg:max-h-[500px] overflow-auto">
              <div className="aspect-video relative">
                <img 
                  src={detectPlayer} 
                  alt="Detected player"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between flex-grow px-4 py-3 text-white">
                <h1 className="flex items-center text-lg z-10 font-semibold">Detección de los jugadores, los árbitros y el balón. Nivel de fiabilidad mínimo 0.3.</h1>  
                <h1 className="flex items-center text-lg z-10 font-semibold">Segundo: {frameNumber ?? "N/A"}</h1> 
              </div>
            </Card>
            
          )}

          {analyzePress && !analysis && !detectedPress && (
            <Card className="video-detail mt-8">
              <div className="aspect-video relative flex flex-col items-center justify-center">
                <Image 
                  src="/blocks-shuffle-4.svg" 
                  alt="Loading..." 
                  width={60} 
                  height={60} 
                  className="mt-4 mb-4"
                />
                 <span className="text-white text-lg mt-4">{loadingMessages[loadingMessageIndex]}</span>

                </div>
            </Card>
            
          )}

          {analysis && (
            <Card className="video-detail bg-gray-800 mt-8 lg:max-h-[700px] overflow-auto">
              <div className="mt-4">
                <h2 className="text-xl font-bold bg-football-accent text-football-dark mb-4 flex items-center">
                  <Brain className="bg-football-accent text-football-dark ml-8 mr-4" />
                  Respuesta de la IA:
                </h2>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-white whitespace-pre-wrap">{analysis}</p>
                </div>
              </div>
            </Card>
            
          )}


        </div>
      </div>
  );
};

export default VideoDetail;
