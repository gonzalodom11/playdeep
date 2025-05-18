"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getValidAccessToken } from '@/utils/auth';
import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const UploadScreen = () => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

    setIsUploading(true);
    try {
      const accessToken = await getValidAccessToken();
      const formData = new FormData();
      formData.append('video', file);
      formData.append('caption', caption);

      console.log("Sending data:", {
        file: file.name,
        fileType: file.type,
        caption: caption
      });

      const response = await axios.post(`${apiUrl}videos/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          console.log(`Upload Progress: ${percentCompleted}%`);
        },
      });

      console.log("Response from posting video:", response);
      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
      router.push('/profile');
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error details:', error.response?.data);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
              />
            </div>

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

export default UploadScreen; 