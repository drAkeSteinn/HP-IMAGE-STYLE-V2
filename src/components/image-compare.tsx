'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, X } from 'lucide-react';

interface ImageCompareProps {
  originalImage: string;
  transformedImage: string;
  styleName: string;
  onReset: () => void;
}

export function ImageCompare({
  originalImage,
  transformedImage,
  styleName,
  onReset,
}: ImageCompareProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenTarget, setFullscreenTarget] = useState<
    'original' | 'transformed'
  >('transformed');

  const handleDownload = (imageData: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageData.startsWith('data:')
      ? imageData
      : `data:image/png;base64,${imageData}`;
    link.download = filename;
    link.click();
  };

  const getDisplaySrc = (imageData: string) => {
    if (imageData.startsWith('data:')) return imageData;
    return `data:image/png;base64,${imageData}`;
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              Resultado: Estilo {styleName}
            </h3>
            <Button variant="outline" size="sm" onClick={onReset}>
              <X className="h-4 w-4 mr-1" />
              Nueva transformación
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Original
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setFullscreenTarget('original');
                    setShowFullscreen(true);
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={getDisplaySrc(originalImage)}
                  alt="Imagen original"
                  className="w-full object-contain max-h-[400px]"
                />
              </div>
            </div>

            {/* Transformed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Estilo {styleName}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setFullscreenTarget('transformed');
                      setShowFullscreen(true);
                    }}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      handleDownload(
                        transformedImage,
                        `transformed-${styleName.toLowerCase()}.png`
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={getDisplaySrc(transformedImage)}
                  alt={`Imagen con estilo ${styleName}`}
                  className="w-full object-contain max-h-[400px]"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen overlay */}
      {showFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowFullscreen(false)}
        >
          <img
            src={getDisplaySrc(
              fullscreenTarget === 'original'
                ? originalImage
                : transformedImage
            )}
            alt={
              fullscreenTarget === 'original'
                ? 'Imagen original'
                : `Imagen con estilo ${styleName}`
            }
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="outline"
            className="absolute top-4 right-4"
            onClick={() => setShowFullscreen(false)}
          >
            <X className="h-4 w-4 mr-1" />
            Cerrar
          </Button>
        </div>
      )}
    </>
  );
}
