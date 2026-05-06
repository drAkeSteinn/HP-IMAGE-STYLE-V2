'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PROVIDER_OPTIONS, OPENAI_MODELS, type ProviderId, type OpenAIModelId } from '@/lib/providers';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProvider: ProviderId;
  onProviderChange: (providerId: ProviderId) => void;
  openaiApiKey: string;
  onApiKeyChange: (key: string) => void;
  openaiModel: OpenAIModelId;
  onModelChange: (model: OpenAIModelId) => void;
  disabled?: boolean;
}

export function SettingsPanel({
  open,
  onOpenChange,
  selectedProvider,
  onProviderChange,
  openaiApiKey,
  onApiKeyChange,
  openaiModel,
  onModelChange,
  disabled,
}: SettingsPanelProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const currentProvider = PROVIDER_OPTIONS.find((p) => p.id === selectedProvider);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuración
          </SheetTitle>
          <SheetDescription>
            Configura el proveedor de IA y las opciones de generación
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Proveedor de IA</Label>
            <div className="grid grid-cols-1 gap-2">
              {PROVIDER_OPTIONS.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => {
                      if (!disabled) onProviderChange(provider.id);
                    }}
                    disabled={disabled}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left',
                      'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-2xl shrink-0">{provider.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{provider.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {provider.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* OpenAI specific settings */}
          {selectedProvider === 'openai' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <Separator />

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm font-semibold">
                  API Key de OpenAI
                </Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
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
                  Tu API Key se usa directamente con OpenAI. La configuración se
                  guarda automáticamente en el servidor para que persista entre
                  sesiones.
                </p>
              </div>

              <Separator />

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="openai-model" className="text-sm font-semibold">
                  Modelo de OpenAI
                </Label>
                <Select
                  value={openaiModel}
                  onValueChange={(v) => onModelChange(v as OpenAIModelId)}
                  disabled={disabled}
                >
                  <SelectTrigger id="openai-model">
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENAI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Model description */}
                {currentProvider?.models && (
                  <p className="text-xs text-muted-foreground">
                    {currentProvider.models.find((m) => m.id === openaiModel)
                      ?.description || ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Z.ai info */}
          {selectedProvider === 'zai' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <Separator />
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">Z.ai — Proveedor integrado</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El motor de Z.ai está integrado directamente en la aplicación.
                  No requiere configuración adicional ni API Key. Utiliza el
                  modelo de edición de imágenes más avanzado de Z.ai para
                  transformar tus fotos.
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Resumen de configuración</p>
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                Guardado
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-muted-foreground">Proveedor:</span>
              <span className="font-medium">
                {currentProvider?.icon} {currentProvider?.name}
              </span>
              {selectedProvider === 'openai' && (
                <>
                  <span className="text-muted-foreground">Modelo:</span>
                  <span className="font-medium">
                    {OPENAI_MODELS.find((m) => m.id === openaiModel)?.name}
                  </span>
                  <span className="text-muted-foreground">API Key:</span>
                  <span className="font-medium">
                    {openaiApiKey
                      ? `${openaiApiKey.slice(0, 6)}...${openaiApiKey.slice(-4)}`
                      : 'No configurada'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
