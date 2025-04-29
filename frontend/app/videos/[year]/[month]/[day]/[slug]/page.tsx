"use client";
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Camera} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { useParams } from 'next/navigation'


// get requests to the Django API
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());
const imageFetcher = (...args: [RequestInfo | URL, RequestInit?]) =>
  fetch(...args).then(res => res.blob()).then(blob => URL.createObjectURL(blob));

const VideoDetail = () => {
  const [detectedPressDetect, setDetectedImage] = useState<boolean | null>(false);
  const params = useParams();
  const { year, month, day, slug } = params as { year: string; month: string; day: string; slug: string };    
  const { data: video, error, isLoading } = useSWR(`${apiUrl}${year}/${month}/${day}/${slug}`, fetcher);
  const { data: detectPlayer } = 
    useSWR(video ? `${apiUrl}${year}/${month}/${day}/${slug}/detect-players`:null, 
    imageFetcher, {revalidateOnFocus: false});

  
  if (isLoading)  return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-white">Error loading video</div>;
  

  const handleDetectPlayer = () => {
    // For demonstration, we'll use a placeholder image

    setDetectedImage(true); 
  };

  if (!video) {
    return <div className="container mx-auto px-4 py-8">Video not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8" >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
        <Card className="video-detail mt-10">
        <div className="relative h-full aspect-video w-full rounded-xl mb-3">
        <video
          src={video.video_url}
          controls
          className="w-full h-full object-cover rounded-xl mb-3"
        /> 
      </div>
    {/* Bottom info section */}
    <div className="flex flex-col justify-between flex-grow px-4 py-3 text-white">
      <h1 className="flex items-center text-lg z-10 font-semibold">{video.caption}</h1>
      {video && <Button 
            onClick={handleDetectPlayer}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Camera className="mr-2" />
            Detect Player
          </Button>}
    </div>
        </Card>
        {!detectPlayer && detectedPressDetect && (
            <Card className="video-detail">
              <div className="aspect-video relative">
                Loading detected player image...
              </div>
            </Card>
          )}
          {detectPlayer && detectedPressDetect && (
            <Card className="video-detail">
              <div className="aspect-video relative">
                <img 
                  src={detectPlayer} 
                  alt="Detected player"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </Card>
          )}
        </div>
      </div>
  );
};

export default VideoDetail;
