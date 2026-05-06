'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import { ImageUpload } from '@/components/image-upload';
import { StyleSelector } from '@/components/style-selector';
import { SettingsPanel } from '@/components/settings-panel';
import { ImageCompare } from '@/components/image-compare';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Upload,
  Sparkles,
  Loader2,
  Settings2,
} from 'lucide-react';
import type { StyleId } from '@/lib/styles';
import type { ProviderId, OpenAIModelId } from '@/lib/providers';
import { OPENAI_MODELS } from '@/lib/providers';

type ImageSource = 'camera' | 'upload';

export default function Home() {
  const { toast } = useToast();

  // Image source
  const [imageSource, setImageSource] = useState<ImageSource>('upload');
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  // Style
  const [selectedStyle, setSelectedStyle] = useState<StyleId | null>(null);

  // Settings (provider, API key, model)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('zai');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState<OpenAIModelId>('gpt-image-1');

  // Config persistence — track if initial load is done
  const configLoadedRef = useRef(false);

  // Load config from server on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data.success && data.config) {
          setSelectedProvider((data.config.provider as ProviderId) || 'zai');
          setOpenaiApiKey(data.config.openaiApiKey || '');
          setOpenaiModel((data.config.openaiModel as OpenAIModelId) || 'gpt-image-1');
        }
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        configLoadedRef.current = true;
      }
    }
    loadConfig();
  }, []);

  // Save config to server whenever settings change (after initial load)
  useEffect(() => {
    if (!configLoadedRef.current) return;

    async function saveConfig() {
      try {
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: selectedProvider,
            openaiApiKey,
            openaiModel,
          }),
        });
      } catch (err) {
        console.error('Error saving config:', err);
      }
    }
    saveConfig();
  }, [selectedProvider, openaiApiKey, openaiModel]);

  // Transform state
  const [isTransforming, setIsTransforming] = useState(false);
  const [result, setResult] = useState<{
    original: string;
    transformed: string;
    styleName: string;
  } | null>(null);

  // Handlers
  const handleCapture = useCallback((imageDataUrl: string) => {
    setSourceImage(imageDataUrl);
    setResult(null);
  }, []);

  const handleUpload = useCallback((imageDataUrl: string) => {
    setSourceImage(imageDataUrl);
    setResult(null);
  }, []);

  const handleClearSource = useCallback(() => {
    setSourceImage(null);
    setResult(null);
  }, []);

  const handleTransform = useCallback(async () => {
    if (!sourceImage || !selectedStyle) return;

    if (selectedProvider === 'openai' && !openaiApiKey.trim()) {
      toast({
        title: 'API Key requerida',
        description:
          'Por favor configura tu API Key de OpenAI en el panel de Configuración',
        variant: 'destructive',
      });
      setSettingsOpen(true);
      return;
    }

    setIsTransforming(true);
    setResult(null);

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceImage,
          styleId: selectedStyle,
          provider: selectedProvider,
          openaiApiKey:
            selectedProvider === 'openai' ? openaiApiKey.trim() : undefined,
          openaiModel:
            selectedProvider === 'openai' ? openaiModel : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error en la transformación');
      }

      const modelLabel =
        selectedProvider === 'openai'
          ? OPENAI_MODELS.find((m) => m.id === openaiModel)?.name || openaiModel
          : 'Z.ai';

      setResult({
        original: sourceImage,
        transformed: data.image,
        styleName: data.style,
      });

      toast({
        title: '¡Transformación exitosa!',
        description: `Estilo ${data.style} aplicado con ${modelLabel}`,
      });
    } catch (error) {
      console.error('Transform error:', error);
      toast({
        title: 'Error en la transformación',
        description:
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsTransforming(false);
    }
  }, [sourceImage, selectedStyle, selectedProvider, openaiApiKey, openaiModel, toast]);

  const handleReset = useCallback(() => {
    setResult(null);
  }, []);

  // Helper for provider display
  const providerLabel =
    selectedProvider === 'zai'
      ? 'Z.ai'
      : OPENAI_MODELS.find((m) => m.id === openaiModel)?.name || 'OpenAI';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — Banner only, no controls */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <img
            src="/banner.png"
            alt="HP — Transforma tu forma de usar tus nuevos equipos HP"
            className="w-full h-auto object-contain"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Step 1: Image Source */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-hp-blue text-white text-sm font-bold">
              1
            </div>
            <h2 className="font-semibold text-lg">Selecciona tu imagen</h2>
          </div>

          <Tabs
            value={imageSource}
            onValueChange={(v) => {
              setImageSource(v as ImageSource);
              setSourceImage(null);
              setResult(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Subir imagen
              </TabsTrigger>
              <TabsTrigger value="camera" className="gap-2">
                <Camera className="h-4 w-4" />
                Cámara web
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <ImageUpload
                onUpload={handleUpload}
                uploadedImage={imageSource === 'upload' ? sourceImage : null}
                onClear={handleClearSource}
              />
            </TabsContent>

            <TabsContent value="camera">
              <CameraCapture
                onCapture={(img) => {
                  setImageSource('camera');
                  handleCapture(img);
                }}
                capturedImage={imageSource === 'camera' ? sourceImage : null}
                onClear={handleClearSource}
              />
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* Step 2: Choose Style */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-hp-blue text-white text-sm font-bold">
              2
            </div>
            <h2 className="font-semibold text-lg">Elige un estilo</h2>
          </div>
          <StyleSelector
            selectedStyle={selectedStyle}
            onSelect={setSelectedStyle}
            disabled={isTransforming}
          />
        </section>

        <Separator />

        {/* Transform Button */}
        <section className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="w-full max-w-md h-14 text-lg font-semibold gap-2 rounded-xl bg-hp-blue hover:bg-hp-blue/90 text-white shadow-lg"
            disabled={!sourceImage || !selectedStyle || isTransforming}
            onClick={handleTransform}
          >
            {isTransforming ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Transformando...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Transformar imagen
              </>
            )}
          </Button>

          {!sourceImage && (
            <p className="text-sm text-muted-foreground">
              Sube o captura una imagen para comenzar
            </p>
          )}
          {sourceImage && !selectedStyle && (
            <p className="text-sm text-muted-foreground">
              Selecciona un estilo para tu transformación
            </p>
          )}
        </section>

        {/* Loading animation */}
        {isTransforming && (
          <Card className="border-hp-blue/20 bg-hp-blue/5">
            <CardContent className="p-8 flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-hp-blue" />
                <Sparkles className="h-5 w-5 absolute -top-1 -right-1 text-hp-blue animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold">
                  Aplicando transformación con IA...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esto puede tardar unos segundos. La IA está recreando tu
                  imagen en el estilo seleccionado usando {providerLabel}.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <section>
            <ImageCompare
              originalImage={result.original}
              transformedImage={result.transformed}
              styleName={result.styleName}
              onReset={handleReset}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>
            Powered by HP México | 2026
          </p>
        </div>
      </footer>

      {/* Floating Settings Button */}
      <button
        onClick={() => setSettingsOpen(true)}
        disabled={isTransforming}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-hp-blue text-white shadow-lg hover:bg-hp-blue/90 active:scale-95 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Configuración"
      >
        <Settings2 className="h-5 w-5" />
      </button>

      {/* Settings Panel (Side Drawer) */}
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        openaiApiKey={openaiApiKey}
        onApiKeyChange={setOpenaiApiKey}
        openaiModel={openaiModel}
        onModelChange={setOpenaiModel}
        disabled={isTransforming}
      />
    </div>
  );
}
