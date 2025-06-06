"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  if (!video) {
    return <div className="container mx-auto px-4 py-8">Video not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8" >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
        <Card className="video-detail mt-8">
          <div className="relative h-full aspect-video w-full rounded-xl mb-3">
          <video
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
            
            {video && <Button 
                  onClick={handleDetectPlayer}
                  className="bg-football-accent mx-auto mt-2 w-fit px-4 hover:bg-football-accent/90 text-football-dark text-lg"
                >
                  <Camera className="mr-2" />
                  Detectar jugadores
                </Button>}
          </div>
        </Card>
        {!detectPlayer && detectedPress && (
            <Card className="video-detail">
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
            <Card className="video-detail">
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
        </div>
      </div>
  );
};

export default VideoDetail;
