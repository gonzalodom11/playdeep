"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Camera, Brain, Loader2} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { useParams } from 'next/navigation'
import Image from 'next/image';


// get requests to the Django API
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());
const imageFetcher = (...args: [RequestInfo | URL, RequestInit?]) =>
  fetch(...args).then(res => res.blob()).then(blob => URL.createObjectURL(blob));

const VideoDetail = () => {
  const [detectedPress, setDetectedPress] = useState<boolean | null>(false);
  const [frameNumber, setFrameNumber] = useState<number>(10);
  const [outputFrame, setOutputFrame] = useState<string | null>("10");
  
  // New states for AI analysis
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>("¿Qué ves en esta imagen?");
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
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
    
  }, [frameNumber]);

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
    setDetectedPress(true); 
  };

  const captureFrame = () => {
    if (!videoRef.current) {
      console.error('Video element not found');
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return null;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    return dataURL;
  };

  const handleAiAnalysis = async () => {
    if (!userPrompt.trim()) {
      alert('Por favor, escribe una pregunta o instrucción.');
      return;
    }

    const frameData = captureFrame();
    if (!frameData) {
      alert('Error al capturar el frame del video.');
      return;
    }

    setCapturedFrame(frameData);
    setAiAnalyzing(true);
    setAiAnalysis(null);

    try {
      const response = await fetch(`${apiUrl}analyze-llm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: frameData,
          prompt: userPrompt
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error analyzing frame:', error);
      setAiAnalysis(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setAiAnalyzing(false);
    }
  };

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
                <span>Frame Number:</span>
                <input 
                  type="number"
                  className="p-1 rounded text-black bg-white"
                  value={outputFrame ?? ""}
                  min={0}
                  onChange={(e) => {
                    setDetectedPress(false); // reset automatically after loading
                    const value = e.target.value;
                    setFrameNumber(value === '' ? 1 : parseInt(value));
                    setOutputFrame(value);
                  }}
                />
                <span className="text-sm text-gray-300">(Frame 30 = 1 s)</span>
              </div>
            </label>
            
            <div className="flex gap-2">
              {video && <Button 
                    onClick={handleDetectPlayer}
                    className="bg-football-accent hover:bg-football-accent/90 text-football-dark text-lg"
                  >
                    <Camera className="mr-2" />
                    Detectar jugadores
                  </Button>}
              
              <Button 
                onClick={handleAiAnalysis}
                disabled={aiAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg"
              >
                {aiAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="mr-2" />
                )}
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
                     className="flex-1 text-black"
                   />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Analysis Results */}
        
          <Card className="video-detail mt-8">
            <div className="p-4">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Brain className="mr-2" />
                Análisis con IA
              </h2>
              
              {capturedFrame && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-white mb-2">Frame capturado:</h3>
                  <div className="aspect-video relative rounded-lg overflow-hidden">
                    <img 
                      src={capturedFrame} 
                      alt="Frame capturado"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

             
            </div>
          </Card>

        {/* Existing player detection results */}
        {!detectPlayer && detectedPress && (
            <Card className="video-detail mt-8">
              <div className="aspect-video relative flex flex-col items-center justify-center">
                <Image 
                  src="/blocks-shuffle-4.svg" 
                  alt="Loading..." 
                  width={60} 
                  height={60} 
                  className="mb-4"
                />
                <div className="text-white">Loading detected players image...</div>
              </div>
            </Card>
          )}
          {detectPlayer && detectedPress && (
            <Card className="video-detail mt-8">
              <div className="aspect-video relative">
                <img 
                  src={detectPlayer} 
                  alt="Detected player"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-between flex-grow px-4 py-3 text-white">
                <h1 className="flex items-center text-lg z-10 font-semibold">Detección de los jugadores, los árbitros y el balón. Nivel de fiabilidad mínimo 0.3.</h1>  
                <h1 className="flex items-center text-lg z-10 font-semibold">Frame Number: {frameNumber ?? "N/A"}</h1> 
              </div>
            </Card>
            
          )}

          {aiAnalyzing && (
            <Card className="video-detail mt-8">
              <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
                  <span className="text-white">Analizando imagen con IA...</span>
                </div>
            </Card>
            
          )}

          {aiAnalysis && (
            <Card className="video-detail mt-8">
              <div className="mt-4">
                  <h3 className="text-sm font-medium text-white mb-2">Respuesta de la IA:</h3>
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-white whitespace-pre-wrap">{aiAnalysis}</p>
                  </div>
                </div>
            </Card>
            
          )}


        </div>
      </div>
  );
};

export default VideoDetail;
