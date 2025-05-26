"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import React, { Suspense } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// get requests to the Django API
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const fetcher = (...args: [RequestInfo | URL, RequestInit?]) =>
  fetch(...args).then((res) => res.json());

const VideoScreen = () => {
  return (
    <div className="container mx-auto px-8 py-12 bg-football-dark">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white bg-football-dark">
        Lista de Videos
      </h1>
      <Suspense>
        <VideoList />
      </Suspense>
    </div>
  );
};
const VideoList = () => {
  const { data, error, isLoading } = useSWR(apiUrl, fetcher);

  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const videosPerPage = 6;

  if (isLoading) return <div className="text-white">Cargando...</div>;
  if (error) return <div className="text-white">Error cargando los videos</div>;

  const startIndex = (currentPage - 1) * videosPerPage;
  const endIndex = startIndex + videosPerPage;
  const currentVideos = data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.length / videosPerPage);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 bg-football-dark">
        {currentVideos.map((video: Video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-8 text-white">
        <Link
          href={`?page=${currentPage - 1}`}
          className={`px-3 py-1 border rounded ${
            currentPage === 1 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Previous
        </Link>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Link
            key={page}
            href={`?page=${page}`}
            className={`px-3 py-1 border rounded ${
              currentPage === page
                ? "bg-football-accent text-football-dark"
                : ""
            }`}
          >
            {page}
          </Link>
        ))}
        <Link
          href={`?page=${currentPage + 1}`}
          className={`px-3 py-1 border rounded ${
            currentPage === totalPages ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Next
        </Link>
      </div>
    </>
  );
};

interface Video {
  id: number;
  caption: string;
  publish: string;
  slug: string;
  video: string;
  user: {
    username: string;
  };
}

const VideoCard = ({ video }: { video: Video }) => {
  const date_video = new Date(video.publish).toLocaleDateString();
  const year = date_video.split("/")[2];
  const month = date_video.split("/")[1];
  const day = date_video.split("/")[0];
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
        <h3 className="flex items-center text-lg z-10 font-semibold">
          {video.caption}
        </h3>
        <Link
          href={`/videos/${year}/${month}/${day}/${video.slug}`}
          className="w-full"
        >
          <Button className="bg-football-accent mt-2 hover:bg-football-accent/90 text-football-dark text-lg">
            Detectar jugadores
          </Button>
        </Link>
        <div className="flex items-center justify-between text-sm text-gray-300  mt-2 mb-2">
          <div className="flex items-center">
            <Calendar size={14} className="mr-4 text-football-accent" />
            <span>{date_video}</span>
          </div>
          <div className="flex items-center">
            <User size={14} className="mr-4 text-football-accent" />
            <span>{video.user.username}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VideoScreen;
