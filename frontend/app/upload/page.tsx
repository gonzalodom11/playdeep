"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getValidAccessToken } from '@/utils/auth';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// Global upload state
const globalUploadState = {
  isUploading: false,
  progress: 0,
  abortController: null as AbortController | null,
};

const UploadScreen = () => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  // Sync with global upload state
  useEffect(() => {
    setIsUploading(globalUploadState.isUploading);
    setUploadProgress(globalUploadState.progress);

    // Listen for upload progress updates
    const handleUploadProgress = (event: CustomEvent) => {
      setUploadProgress(event.detail);
    };

    window.addEventListener('uploadProgress', handleUploadProgress as EventListener);

    return () => {
      window.removeEventListener('uploadProgress', handleUploadProgress as EventListener);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    if (globalUploadState.isUploading) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for the current upload to complete",
      });
      return;
    }

    globalUploadState.isUploading = true;
    globalUploadState.progress = 0;
    const controller = new AbortController();
    globalUploadState.abortController = controller;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const accessToken = await getValidAccessToken();
      const blobName = `${Date.now()}_${file.name}`; // Nombre único para el blob

      // Solicita la URL SAS al backend
      const sasRes = await axios.post(
        `${apiUrl}videos/sas-upload-url?blob_name=${encodeURIComponent(blobName)}`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const uploadUrl = sasRes.data.upload_url;

      // Upload to Azure
      await uploadToAzure(file, uploadUrl);

      // Confirm upload
      await axios.post(
        `${apiUrl}videos/confirm-upload`,
        { caption: caption, uploadUrl: uploadUrl },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
      router.push('/profile');
    } catch (error: unknown) {
      if (axios.isCancel(error)) {
        toast({
          title: "Subida cancelada",
          description: "La subida fue cancelada",
        });
      } else {
        const axiosError = error as { code?: string; response?: { data?: { detail?: string } } };
        let errorMessage = "Error al subir el video. Por favor, inténtalo de nuevo.";
        if (axiosError.code === 'ECONNABORTED') {
          errorMessage = 
          "Tiempo de espera agotado. Por favor, inténtalo de nuevo con un archivo más pequeño o verifica tu conexión a internet.";
        } else if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      globalUploadState.isUploading = false;
      globalUploadState.progress = 0;
      globalUploadState.abortController = null;
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    if (globalUploadState.abortController) {
      globalUploadState.abortController.abort();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Card className="bg-football-dark border-football-medium max-w-2xl mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-bold text-white">Subir Video</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="video" className="text-white">Archivo de video</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="bg-football-dark/30 text-white border-football-medium/50"
                disabled={isUploading}
              />
              <p className="text-sm text-gray-400">
                Supported formats: MP4, WebM, MOV
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption" className="text-white">Título</Label>
              <Input
                id="caption"
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Enter a caption for your video"
                className="bg-football-dark/30 text-white border-football-medium/50"
                required
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-football-dark/30 rounded-full h-2.5">
                  <div 
                    className="bg-football-accent h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Subiendo... {uploadProgress}%
                </p>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancelar
                </Button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-football-accent hover:bg-football-accent/90 text-football-dark"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Video"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Función para cargar archivos a Azure
async function uploadToAzure(file: File, uploadUrl: string) {
  try {
    await axios.put(uploadUrl, file, {
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          globalUploadState.progress = progress;
          // Update local state as well
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('uploadProgress', { detail: progress }));
          }
        }
      },
      timeout: 300000, // 5 minutes timeout
      transformRequest: [(data) => data], // Pass file as-is
    });
  } catch (error: unknown) {
    console.error('Azure upload error:', error);
    
    // Provide more specific error messages
    const axiosError = error as { code?: string; message?: string; response?: { status?: number } };
    if (axiosError.code === 'ERR_NETWORK' || axiosError.message?.includes('CORS')) {
      throw new Error('CORS error: Azure Blob Storage is not configured to allow uploads from this domain. Please configure CORS settings in your Azure Storage account.');
    } else if (axiosError.response?.status === 403) {
      throw new Error('Access denied: The SAS token may be invalid or expired.');
    } else if (axiosError.response?.status === 404) {
      throw new Error('Storage container not found. Please check your Azure configuration.');
    }
    
    throw error;
  }
}


export default UploadScreen;