"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const ProfileScreen = () => {
  const [userData, setUserData] = useState<{ username: string; is_authenticated: boolean; email: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Retrieve the access token from local storage
        const accessToken = localStorage.getItem('accessToken');
        console.log("Access token:"+accessToken);
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
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div className="text-white">Loading user data...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-football-dark to-football-medium p-4">
      <Card className="backdrop-blur-md bg-white/10 shadow-xl border border-white/20 text-white p-6 rounded-2xl w-[90%] max-w-md mx-auto mt-20">
        <CardHeader className="text-center">
          <h2 className="text-3xl font-bold">Perfil de Usuario</h2>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-4">
          <img
            src="/user-profile.png"
            alt="Profile"
            className="w-28 h-28 rounded-full border-4 border-white shadow-md"
          />

          <div className="text-center">
            <p className="text-lg">
              <span className="font-semibold text-white/80">Username:</span> {userData.username}
            </p>
            <p className="text-lg">
              <span className="font-semibold text-white/80">Email:</span> {userData.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileScreen; 