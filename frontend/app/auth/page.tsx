"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { UserRound, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useRouter } from 'next/navigation'; // Import useRouter




const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;


const AuthScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Initialize the router
  const { toast } = useToast();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = e.target as HTMLFormElement;
      const response = await axios.post(`${apiUrl}token/pair`, {
        username: form.username.value,
        password: form.password.value,
      });
      

      if (response.data) {
        toast({
          title: "Iniciado sesión correctamente",
          description: "Bienvenido de nuevo a Playdeep",
        });
        const accessToken = response.data.access;
        const refreshToken = response.data.refresh;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        // Dispatch custom event for auth state change
        window.dispatchEvent(new Event('authStateChange'));
        router.push('/profile'); // Redirect to profile screen
      } else {
        toast({
          title: "Inicio de sesión fallido",
          description: response.data.message,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Un error ocurrió durante el inicio de sesión",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Mock registration process - replace with actual authentication
    try {
      const form = e.target as HTMLFormElement;
      const response = await axios.post(`${apiUrl}auth/register`, {
        username: form["register-username"].value,
        password: form["register-password"].value,
        email: form["register-email"].value,
      });

      if (response.data.success) {
        toast({
          title: "Registro completado correctamente",
          description: "Bienvenido a Playdeep",
        });
      } else {
        toast({
          title: "El registro falló",
          description: response.data.message,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Un error ocurrió durante el registro",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-football-dark to-football-medium p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-football-medium shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-football-accent flex items-center justify-center">
            <span className="text-football-dark font-bold text-2xl">PD</span>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Bienvenido a Playdeep</CardTitle>
          <CardDescription className="text-gray-300">
            Inicia sesión para acceder a las herramientas de análisis de partidos
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="login" className="px-6">
          <TabsList className="grid w-full grid-cols-2 bg-football-medium/50">
            <TabsTrigger value="login" className="data-[state=active]:bg-football-accent data-[state=active]:text-football-dark">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-football-accent data-[state=active]:text-football-dark">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Nombre de usuario</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="username" 
                      type="username" 
                      placeholder="coach10" 
                      className="pl-10 bg-football-dark/30 text-white border-football-medium/50 focus-visible:ring-football-accent"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white">Contraseña</Label>
                    <a href="#" className="text-xs text-football-accent hover:text-football-accent/80">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 bg-football-dark/30 text-white border-football-medium/50 focus-visible:ring-football-accent"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mantener sesión iniciada
                  </label>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-football-accent hover:bg-football-accent/90 text-football-dark"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Iniciar sesión"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="text-white">Nombre de usuario</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="register-username" 
                      type="text" 
                      placeholder="coach10" 
                      className="pl-10 bg-football-dark/30 text-white border-football-medium/50 focus-visible:ring-football-accent"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-white">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="coach@example.com" 
                      className="pl-10 bg-football-dark/30 text-white border-football-medium/50 focus-visible:ring-football-accent"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-white">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 bg-football-dark/30 text-white border-football-medium/50 focus-visible:ring-football-accent"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" required />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Estoy de acuerdo con los <a href="/termsService" className="text-football-accent hover:text-football-accent/80" target="_blank" rel="noopener noreferrer">
                    Términos de Servicio</a>
                  </label>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-football-accent hover:bg-football-accent/90 text-football-dark"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Crear cuenta"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AuthScreen;