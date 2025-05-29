"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from 'next/link';
import { getValidAccessToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

const Navbar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'accessToken') {
      setAccessToken(e.newValue);
      setIsLoggedIn(!!e.newValue);
    }
  };

  const handleAuthChange = () => {
    const token = localStorage.getItem('accessToken');
    setAccessToken(token);
    setIsLoggedIn(!!token);
  };

  // Update accessToken when localStorage changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getValidAccessToken();
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    };

    // Initial check
    checkAuth();
    
    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Add custom event listener for auth changes
    window.addEventListener('authStateChange', handleAuthChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, [accessToken]);

  const handleProfileClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await getValidAccessToken();
      router.push('/profile');
    } catch {
      setIsLoggedIn(false);
      router.push('/auth');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setIsLoggedIn(false);
    router.push('/auth');
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-football-dark/80 backdrop-blur-md z-50 border-b border-football-medium">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-11 h-11 flex items-center justify-center">
              <img src="/playdeep-icon.png" alt="Football Play Logo" className="h-11 w-auto" />
            </div>
            {!isMobile && (
              <span className="font-bold text-xl text-white">PlayDeep</span>
            )}
          </Link>
        </div>
        
        {!isMobile && <nav className="hidden md:flex items-center space-x-20 text-base font-bold">
          <Link href="/#features" className="text-gray-300 hover:text-green-500 transition-colors">Características</Link>
          <Link href="/videos" className="text-gray-300 hover:text-green-500 transition-colors duration-300">Videos</Link>
          {isLoggedIn && (
            <Link href="/upload" className="text-gray-300 hover:text-green-500 transition-colors">Upload</Link>
          )}
        </nav>}

        {isMobile && <nav className="sm:flex items-center space-x-12 font-bold">
          <Link href="/videos" className="text-gray-300 hover:text-football-accent transition-colors">Videos</Link>
          {isLoggedIn && (
            <Link href="/upload" className="text-gray-300 hover:text-football-accent transition-colors">Upload</Link>
          )}
        </nav>}
        
        <div className="flex sm:items-center space-x-2  md:space-x-4 lg:space-x-4 2xl:space-x-8">
            {!isLoggedIn ? (
              <Link href="/auth">
                <Button variant="outline" className="hidden sm:flex text-sm">Iniciar sesión</Button>
              </Link>
            ) : (
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="hidden sm:flex text-sm"
              >
                Cerrar sesión
              </Button>
            )}
          
            <Button 
              onClick={handleProfileClick}
              className="bg-football-accent hover:bg-football-accent/90 text-football-dark text-sm px-4 py-2"
            >
              <Users className="sm:font-bold lg:mr-2"></Users>
              <span className="hidden md:inline font-bold">Perfil</span>
            </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;