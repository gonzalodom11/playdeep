"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import useSWR from 'swr';
import { getValidAccessToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const fetcher = (...args: [RequestInfo | URL, RequestInit?]) => fetch(...args).then((res) => res.json());

interface Video {
  id: number;
  caption: string;
  video: string;
  publish: string;
  slug: string;
  user: {
    username: string;
    email: string;
  };
}

const ProfileScreen = () => {
  const [userData, setUserData] = useState<{ username: string; is_authenticated: boolean; email: string; id: number } | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const {data: videos, error, isLoading} = useSWR(
    userData ? `${apiUrl}user/${userData.username}` : null,
    fetcher
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const accessToken = await getValidAccessToken();
        const response = await axios.get(`${apiUrl}auth/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setUserData(response.data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "An error occurred while fetching user data",
        });
        router.push('/auth');
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUserData(null);
    // Dispatch custom event for auth state change
    window.dispatchEvent(new Event('authStateChange'));
    router.push('/auth');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  if (!userData) {
    return <div className="text-white"><Image 
    src="/blocks-shuffle-4.svg" 
    alt="Loading..." 
    width={60} 
    height={60} 
    className="mb-4"
  />Loading user data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Card className="bg-football-dark border-football-medium">
        <CardHeader>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-6">
              <img
                src="/user-profile.png"
                alt="Profile Picture"
                className="w-32 h-32 rounded-full object-cover border-4 border-football-medium"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-300">Username</h2>
              <p className="text-white">{userData.username}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-300">Email</h2>
              <p className="text-white">{userData.email}</p>
            </div>
            <div className="pt-4">
              
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cerrar sesión
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-white mt-8">Loading videos...</div>
      ) : error ? (
        <div className="text-red-500 mt-8">Error loading videos</div>
      ) : (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos?.map((video: Video) => (
              <Card key={video.id} className="bg-football-dark border-football-medium">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{video.caption}</h3>
                  <video
                    src={video.video}
                    controls
                    className="w-full rounded-lg"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen; 