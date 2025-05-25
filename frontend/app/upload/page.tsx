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
          title: "Upload Cancelled",
          description: "The upload was cancelled",
        });
      } else {
        const axiosError = error as { code?: string; response?: { data?: { detail?: string } } };
        let errorMessage = "Failed to upload video. Please try again.";
        if (axiosError.code === 'ECONNABORTED') {
          errorMessage = 
          "Upload timed out. Please try again with a smaller file or check your internet connection.";
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
          <h1 className="text-2xl font-bold text-white">Upload Video</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="video" className="text-white">Video File</Label>
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
              <Label htmlFor="caption" className="text-white">Caption</Label>
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
                  Uploading... {uploadProgress}%
                </p>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancel Upload
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
    });
  } catch (error) {
    console.error('Azure upload error:', error);
    throw error;
  }
}


export default UploadScreen;