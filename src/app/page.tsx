'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraCapture } from '@/components/camera-capture';
import { ImageUpload } from '@/components/image-upload';
import { StyleSelector } from '@/components/style-selector';
import { SettingsPanel } from '@/components/settings-panel';
import { ImageCompare } from '@/components/image-compare';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Upload,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Settings2,
} from 'lucide-react';
import { getDefaultEnabledStyles, STYLE_OPTIONS, type StyleId } from '@/lib/styles';
import { OPENAI_MODELS } from '@/lib/providers';

type ImageSource = 'camera' | 'upload';
type AppStep = 1 | 2 | 3;

export default function Home() {
  const { toast } = useToast();

  // Step flow
  const [step, setStep] = useState<AppStep>(1);

  // Image source
  const [imageSource, setImageSource] = useState<ImageSource>('camera');
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  // Style
  const [selectedStyle, setSelectedStyle] = useState<StyleId | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  // Settings (API key, model)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [enabledStyles, setEnabledStyles] = useState<Record<StyleId, boolean>>(getDefaultEnabledStyles());

  // Config persistence — track if initial load is done
  const configLoadedRef = useRef(false);

  // Load config from server on mount (with retry for initial compilation)
  useEffect(() => {
    async function loadConfig(retries = 3) {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const res = await fetch('/api/config?XTransformPort=3002');

          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json') || !res.ok) {
            if (attempt < retries - 1) {
              await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
              continue;
            }
            break;
          }

          const data = await res.json();
          if (data.success && data.config) {
            setOpenaiApiKey(data.config.openaiApiKey || '');
            if (data.config.enabledStyles) {
              setEnabledStyles({
                ...getDefaultEnabledStyles(),
                ...data.config.enabledStyles,
              });
            }
          }
          break;
        } catch (err) {
          console.error('Error loading config:', err);
          if (attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          }
        } finally {
          if (attempt === retries - 1) {
            configLoadedRef.current = true;
          }
        }
      }
      configLoadedRef.current = true;
    }
    loadConfig();
  }, []);

  // Save config to server whenever settings change (after initial load)
  useEffect(() => {
    if (!configLoadedRef.current) return;

    async function saveConfig() {
      try {
        const res = await fetch('/api/config?XTransformPort=3002', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'openai',
            openaiApiKey,
            openaiModel: 'gpt-image-1',
            enabledStyles,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          await res.json();
        }
      } catch (err) {
        console.error('Error saving config:', err);
      }
    }
    saveConfig();
  }, [openaiApiKey, enabledStyles]);

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
  }, []);

  const handleUpload = useCallback((imageDataUrl: string) => {
    setSourceImage(imageDataUrl);
  }, []);

  const handleClearSource = useCallback(() => {
    setSourceImage(null);
  }, []);

  const handleStyleSelect = useCallback((styleId: StyleId) => {
    setSelectedStyle(styleId);
  }, []);

  // Step navigation
  const goToStep2 = useCallback(() => {
    if (!sourceImage) return;
    setStep(2);
  }, [sourceImage]);

  const goToStep1 = useCallback(() => {
    setStep(1);
    setResult(null);
  }, []);

  const handleTransform = useCallback(async () => {
    if (!sourceImage || !selectedStyle) return;

    if (selectedStyle === 'custom' && !customPrompt.trim()) {
      toast({
        title: 'Prompt requerido',
        description: 'Por favor escribe un prompt para el estilo personalizado',
        variant: 'destructive',
      });
      return;
    }

    if (!openaiApiKey.trim()) {
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
    setStep(3);

    try {
      const response = await fetch('/api/transform?XTransformPort=3002', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: sourceImage,
          styleId: selectedStyle,
          customPrompt: selectedStyle === 'custom' ? customPrompt.trim() : undefined,
          provider: 'openai',
          openaiApiKey: openaiApiKey.trim(),
          openaiModel: 'gpt-image-1',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error en la transformación');
      }

      const modelLabel = OPENAI_MODELS[0]?.name || 'GPT Image 1';

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
      setStep(2);
    } finally {
      setIsTransforming(false);
    }
  }, [sourceImage, selectedStyle, customPrompt, openaiApiKey, toast]);

  const handleReset = useCallback(() => {
    setResult(null);
    setStep(1);
    setSourceImage(null);
    setSelectedStyle(null);
    setCustomPrompt('');
  }, []);

  // Helper for provider display
  const providerLabel = OPENAI_MODELS[0]?.name || 'GPT Image 1';

  // Selected style name
  const selectedStyleName = selectedStyle
    ? STYLE_OPTIONS.find((s) => s.id === selectedStyle)?.nameEs || ''
    : '';

  // Show floating action bar on steps 1 and 2 (not during transform on step 3)
  const showFloatingBar = step === 1 || (step === 2 && !isTransforming);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header — Banner */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <img
            src="/banner.png"
            alt="HP — Transforma tu forma de usar tus nuevos equipos HP"
            className="w-full h-auto object-contain"
          />
        </div>
      </header>

      {/* Step indicator bar */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {[
              { n: 1, label: 'Imagen' },
              { n: 2, label: 'Estilo' },
              { n: 3, label: 'Resultado' },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-2 sm:gap-4">
                {i > 0 && (
                  <div
                    className={`w-6 sm:w-12 h-0.5 rounded transition-colors duration-300 ${
                      step >= s.n ? 'bg-hp-blue' : 'bg-muted'
                    }`}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-colors duration-300 ${
                      step === s.n
                        ? 'bg-hp-blue text-white'
                        : step > s.n
                          ? 'bg-hp-blue/20 text-hp-blue'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                      step === s.n
                        ? 'text-hp-blue'
                        : step > s.n
                          ? 'text-hp-blue/70'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content — extra bottom padding when floating bar is visible */}
      <main className={`flex-1 max-w-5xl mx-auto w-full px-4 py-6 ${showFloatingBar ? 'pb-28' : ''}`}>
        {/* ─── STEP 1: Select Image ─── */}
        {step === 1 && (
          <section className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold text-lg">Selecciona tu imagen</h2>
            </div>

            <Tabs
              value={imageSource}
              onValueChange={(v) => {
                setImageSource(v as ImageSource);
                setSourceImage(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="camera" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Cámara web
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Subir imagen
                </TabsTrigger>
              </TabsList>

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

              <TabsContent value="upload">
                <ImageUpload
                  onUpload={handleUpload}
                  uploadedImage={imageSource === 'upload' ? sourceImage : null}
                  onClear={handleClearSource}
                />
              </TabsContent>
            </Tabs>
          </section>
        )}

        {/* ─── STEP 2: Choose Style ─── */}
        {step === 2 && (
          <section className="space-y-5 animate-in fade-in duration-300">
            {/* Back + title row */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToStep1}
                className="gap-1 text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
              <h2 className="font-semibold text-lg">Elige un estilo</h2>
            </div>

            {/* Source image thumbnail */}
            {sourceImage && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                <img
                  src={sourceImage}
                  alt="Imagen seleccionada"
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Tu imagen</p>
                  <p className="text-xs text-muted-foreground">
                    {imageSource === 'camera' ? 'Capturada con cámara' : 'Imagen subida'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToStep1}
                  className="shrink-0"
                >
                  Cambiar
                </Button>
              </div>
            )}

            {/* Style selector */}
            <StyleSelector
              selectedStyle={selectedStyle}
              onSelect={handleStyleSelect}
              enabledStyles={enabledStyles}
              disabled={isTransforming}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
            />
          </section>
        )}

        {/* ─── STEP 3: Result ─── */}
        {step === 3 && (
          <section className="space-y-5 animate-in fade-in duration-300">
            {isTransforming && (
              <div className="flex flex-col items-center py-8">
                {/* Loop video animation — 600x600, no frames */}
                <video
                  src="/hp-loading.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-[600px] h-[600px] max-w-full object-contain"
                />

                <p className="mt-6 text-center text-sm text-muted-foreground max-w-md">
                  Transformando la imagen con Inteligencia Artificial potenciada por equipos HP
                </p>
              </div>
            )}

            {!isTransforming && result && (
              <div className="space-y-5">
                <ImageCompare
                  originalImage={result.original}
                  transformedImage={result.transformed}
                  styleName={result.styleName}
                  onReset={handleReset}
                />

                {/* Action buttons after result */}
                <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 gap-2"
                    onClick={goToStep1}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Nueva transformación
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 gap-2"
                    onClick={goToStep2}
                  >
                    Probar otro estilo
                  </Button>
                </div>
              </div>
            )}
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

      {/* Floating Action Bar — visible on steps 1 & 2 */}
      {showFloatingBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col items-center gap-2">
            {step === 1 && (
              <>
                <Button
                  size="lg"
                  className="w-full max-w-md h-14 text-lg font-semibold gap-2 rounded-xl bg-hp-blue hover:bg-hp-blue/90 text-white shadow-lg"
                  disabled={!sourceImage}
                  onClick={goToStep2}
                >
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </Button>
                {!sourceImage && (
                  <p className="text-xs text-muted-foreground">
                    Captura o sube una imagen para continuar
                  </p>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <Button
                  size="lg"
                  className="w-full max-w-md h-14 text-lg font-semibold gap-2 rounded-xl bg-hp-blue hover:bg-hp-blue/90 text-white shadow-lg"
                  disabled={!selectedStyle || (selectedStyle === 'custom' && !customPrompt.trim())}
                  onClick={handleTransform}
                >
                  <Sparkles className="h-5 w-5" />
                  Transformar imagen
                </Button>
                {!selectedStyle && (
                  <p className="text-xs text-muted-foreground">
                    Selecciona un estilo para tu transformación
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Settings Button — repositioned when floating bar is visible */}
      <button
        onClick={() => setSettingsOpen(true)}
        disabled={isTransforming}
        className={`fixed z-50 w-11 h-11 rounded-full bg-hp-blue text-white shadow-lg hover:bg-hp-blue/90 active:scale-95 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
          showFloatingBar ? 'bottom-[88px] right-6' : 'bottom-6 right-6'
        }`}
        aria-label="Configuración"
      >
        <Settings2 className="h-5 w-5" />
      </button>

      {/* Settings Panel (Side Drawer) */}
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        openaiApiKey={openaiApiKey}
        onApiKeyChange={setOpenaiApiKey}
        enabledStyles={enabledStyles}
        onEnabledStylesChange={setEnabledStyles}
        disabled={isTransforming}
      />
    </div>
  );
}
