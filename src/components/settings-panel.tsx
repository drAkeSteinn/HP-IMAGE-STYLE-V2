'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { OPENAI_MODELS } from '@/lib/providers';
import { STYLE_OPTIONS, type StyleId } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Settings2, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openaiApiKey: string;
  onApiKeyChange: (key: string) => void;
  enabledStyles: Record<StyleId, boolean>;
  onEnabledStylesChange: (enabledStyles: Record<StyleId, boolean>) => void;
  disabled?: boolean;
}

export function SettingsPanel({
  open,
  onOpenChange,
  openaiApiKey,
  onApiKeyChange,
  enabledStyles,
  onEnabledStylesChange,
  disabled,
}: SettingsPanelProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const hasApiKey = openaiApiKey.trim().length > 0;
  const currentModel = OPENAI_MODELS[0];

  const handleStyleToggle = (styleId: StyleId, checked: boolean) => {
    onEnabledStylesChange({
      ...enabledStyles,
      [styleId]: checked,
    });
  };

  const enabledCount = Object.values(enabledStyles).filter(Boolean).length;

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const res = await fetch('/api/sync-api-key?XTransformPort=3002', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSyncStatus('error');
        toast({
          title: 'Error al sincronizar',
          description: data.error || 'No se pudo obtener la API Key',
          variant: 'destructive',
        });
        return;
      }

      // The sync endpoint updated the config file, now reload config
      const configRes = await fetch('/api/config?XTransformPort=3002');
      const configData = await configRes.json();

      if (configData.success && configData.config?.openaiApiKey) {
        onApiKeyChange(configData.config.openaiApiKey);
      }

      setSyncStatus('success');
      toast({
        title: 'API Key sincronizada',
        description: 'La API Key se obtuvo correctamente desde el archivo remoto',
      });

      // Reset success indicator after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000);
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con el servidor para sincronizar',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuración
          </SheetTitle>
          <SheetDescription>
            Configura la API Key de OpenAI y los estilos disponibles
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* OpenAI API Key */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="text-sm font-semibold">
                API Key de OpenAI
              </Label>

              {/* Sync button row */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'flex-1 gap-2 h-9 transition-all',
                    syncStatus === 'success' && 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-700',
                    syncStatus === 'error' && 'border-red-400 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-600',
                    syncStatus === 'idle' && 'border-hp-blue/30 text-hp-blue hover:bg-hp-blue/5',
                  )}
                  onClick={handleSync}
                  disabled={isSyncing || disabled}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : syncStatus === 'success' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Sincronizada
                    </>
                  ) : syncStatus === 'error' ? (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Error — Reintentar
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Sincronizar
                    </>
                  )}
                </Button>
              </div>

              {/* Sync status indicator */}
              {hasApiKey && !isSyncing && (
                <div className={cn(
                  'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                  'bg-green-50 text-green-700 border border-green-200'
                )}>
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>API Key configurada y lista para usar</span>
                </div>
              )}

              {!hasApiKey && !isSyncing && syncStatus !== 'error' && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Sin API Key — Presiona Sincronizar para obtenerla</span>
                </div>
              )}

              {/* API Key input (read-only display, synced from file) */}
              <div className="relative">
                <Input
                  id="openai-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Sin configurar"
                  value={openaiApiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  disabled={disabled}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                La API Key se sincroniza desde un archivo remoto seguro.
                También puedes escribirla manualmente si lo prefieres.
              </p>
            </div>

            {/* Model info (static, only one model) */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">🧠 {currentModel.name}</span>
                <span className="text-[10px] bg-hp-blue/10 text-hp-blue px-1.5 py-0.5 rounded-full font-medium">
                  Modelo activo
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentModel.description}
              </p>
            </div>
          </div>

          <Separator />

          {/* Style Visibility */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Estilos visibles</Label>
              <span className="text-xs text-muted-foreground">
                {enabledCount} de {STYLE_OPTIONS.length} activos
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecciona qué estilos estarán disponibles para los usuarios en la pantalla principal.
            </p>
            <div className="space-y-2">
              {STYLE_OPTIONS.map((style) => (
                <label
                  key={style.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer',
                    enabledStyles[style.id]
                      ? 'border-hp-blue/30 bg-hp-blue/[0.02]'
                      : 'border-muted bg-muted/30 opacity-60'
                  )}
                >
                  <Checkbox
                    checked={enabledStyles[style.id]}
                    onCheckedChange={(checked) =>
                      handleStyleToggle(style.id, checked === true)
                    }
                    disabled={disabled}
                    className="shrink-0"
                  />
                  <span className="text-xl shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{style.nameEs}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {style.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Resumen de configuración</p>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                hasApiKey
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              )}>
                {hasApiKey ? 'Listo' : 'Sin API Key'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Proveedor:</span>
              <span className="font-medium">🧠 OpenAI</span>
              <span className="text-muted-foreground">Modelo:</span>
              <span className="font-medium">{currentModel.name}</span>
              <span className="text-muted-foreground">API Key:</span>
              <span className="font-medium flex items-center gap-1">
                {hasApiKey ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    {openaiApiKey.slice(0, 6)}...{openaiApiKey.slice(-4)}
                  </>
                ) : (
                  'No configurada'
                )}
              </span>
              <span className="text-muted-foreground">Estilos activos:</span>
              <span className="font-medium">
                {STYLE_OPTIONS.filter((s) => enabledStyles[s.id]).map((s) => s.nameEs).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
