'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { resizeImageToMaxSize } from '@/lib/image-utils';

interface ImageUploadProps {
  onUpload: (imageDataUrl: string) => void;
  uploadedImage: string | null;
  onClear: () => void;
}

export function ImageUpload({
  onUpload,
  uploadedImage,
  onClear,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        if (result) {
          // Resize to 600px max on longest side for display
          const resized = await resizeImageToMaxSize(result, 600);
          onUpload(resized);
        }
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  // If we have an uploaded image, show preview
  if (uploadedImage) {
    return (
      <Card className="border-2 border-dashed border-hp-blue/30 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative group">
            <img
              src={uploadedImage}
              alt="Imagen subida"
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
            Imagen cargada correctamente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
        isDragOver
          ? 'border-hp-blue bg-hp-blue/5'
          : 'border-hp-blue/30 hover:border-hp-blue/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
          <div className="rounded-full bg-muted p-4">
            {isDragOver ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <ImageIcon className="h-8 w-8 opacity-50" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragOver
                ? 'Suelta la imagen aquí'
                : 'Arrastra una imagen o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP (máx. 10MB)
            </p>
          </div>
          <Button variant="outline" size="sm" type="button">
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar archivo
          </Button>
        </div>
      </CardContent>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </Card>
  );
}
