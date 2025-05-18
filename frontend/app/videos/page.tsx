"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, User} from "lucide-react";
import React from "react";
import useSWR from "swr";
import Link from "next/link";

// get requests to the Django API
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());

const VideoScreen = () => {
  

  return (
    <div className="container mx-auto px-8 py-12 bg-football-dark">
    <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white bg-football-dark">
      Lista de Videos
    </h1>
    <VideoList />
  </div>
  );
};
const VideoList = () => {
  const {data, error, isLoading} = useSWR(apiUrl, fetcher);
  if (isLoading)  return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-white">Error loading videos</div>
  return (
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 bg-football-dark">
      {data.map((video: Video) => (
      <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

interface Video {
  id: number;
  caption: string;
  publish: string;
  slug: string;
  video: string;
  video_url: string;
  user: {
    username: string;
  };
}




const VideoCard = ({ video }: { video: Video }) => {
  const date_video = new Date(video.publish).toLocaleDateString()
  const year = date_video.split("/")[2]
  const month = date_video.split("/")[1]
  const day = date_video.split("/")[0]
  return (
  
  <Card className="overflow-style">

      {/* Imagen 16:9 con overlay */}
      <div className="relative h-full aspect-video w-full rounded-xl mb-3">
        <video
          src={video.video}
          controls
          className="w-full h-full object-cover mb-3"
        /> 
      </div>
    {/* Bottom info section */}
    <div className="flex flex-col justify-between flex-grow px-4 py-3 text-white">
      <h3 className="flex items-center text-lg z-10 font-semibold">{video.caption}</h3>
      <Link href={`/videos/${year}/${month}/${day}/${video.slug}`} className="w-full">
        <Button size="lg" className="bg-football-accent mt-2 hover:bg-football-accent/90 text-football-dark text-lg">
          Ver Video
        </Button>
      </Link>
      <div className="flex items-center justify-between text-sm text-gray-300  mt-2">
        <div className="flex items-center">
          <Calendar size={14} className="mr-4" />
          <span>{date_video}</span>
        </div>
        <div className="flex items-center">
          <User size={14} className="mr-4" />
          <span>User: {video.user.username}</span>
        </div>
        
      </div>
    </div>
    
  
</Card>


  );
};

export default VideoScreen;
