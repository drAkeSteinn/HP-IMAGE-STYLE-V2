'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, SwitchCamera, X, Video, VideoOff } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  capturedImage: string | null;
  onClear: () => void;
}

export function CameraCapture({
  onCapture,
  capturedImage,
  onClear,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Enumerate available video devices
  const refreshDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(
        (device) => device.kind === 'videoinput'
      );
      setDevices(videoDevices);
      return videoDevices;
    } catch (err) {
      console.error('Error enumerating devices:', err);
      return [];
    }
  }, []);

  // Start camera stream
  const startStream = useCallback(
    async (deviceId?: string) => {
      try {
        setError(null);
        // Stop any existing stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
        };

        const newStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        setIsStreaming(true);

        // Refresh device list after getting permissions
        const videoDevices = await refreshDevices();
        if (!deviceId && videoDevices.length > 0) {
          const track = newStream.getVideoTracks()[0];
          const settings = track?.getSettings();
          if (settings?.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError(
          'No se pudo acceder a la cámara. Verifica los permisos del navegador.'
        );
        setIsStreaming(false);
      }
    },
    [refreshDevices]
  );

  // Stop camera stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the image horizontally (selfie mode)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(dataUrl);
  }, [onCapture]);

  // Handle device change
  const handleDeviceChange = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (isStreaming) {
        startStream(deviceId);
      }
    },
    [isStreaming, startStream]
  );

  // Refresh devices when dropdown is opened
  const handleSelectOpen = useCallback(
    (open: boolean) => {
      if (open) {
        refreshDevices();
      }
    },
    [refreshDevices]
  );

  // Listen for device changes via event (callback only, no direct setState in effect)
  useEffect(() => {
    const handler = () => {
      refreshDevices();
    };
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handler);
    };
  }, [refreshDevices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // If we have a captured image, show preview
  if (capturedImage) {
    return (
      <Card className="border-2 border-dashed border-hp-blue/30 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative group">
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="w-full rounded-lg object-contain max-h-[400px]"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-80 group-hover:opacity-100 transition-opacity"
              onClick={onClear}
            >
              <X className="h-4 w-4 mr-1" />
              Descartar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Foto capturada correctamente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-hp-blue/30 overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Camera selector */}
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select
            value={selectedDeviceId}
            onValueChange={handleDeviceChange}
            onOpenChange={handleSelectOpen}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent>
              {devices.length === 0 ? (
                <SelectItem value="none" disabled>
                  No se encontraron cámaras
                </SelectItem>
              ) : (
                devices.map((device, index) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Cámara ${index + 1}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {isStreaming && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => startStream(selectedDeviceId)}
              title="Cambiar cámara"
            >
              <SwitchCamera className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Video preview */}
        <div className="relative bg-black/5 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isStreaming ? 'scale-x-[-1]' : ''}`}
          />
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Camera className="h-12 w-12 opacity-30" />
              <p className="text-sm">
                Presiona &quot;Iniciar cámara&quot; para comenzar
              </p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
              <p className="text-sm text-destructive text-center px-4">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isStreaming ? (
            <Button
              onClick={() => startStream(selectedDeviceId)}
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              Iniciar cámara
            </Button>
          ) : (
            <>
              <Button
                onClick={capturePhoto}
                className="flex-1"
                variant="default"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar foto
              </Button>
              <Button onClick={stopStream} variant="outline">
                <VideoOff className="h-4 w-4 mr-2" />
                Detener
              </Button>
            </>
          )}
        </div>

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
