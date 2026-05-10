'use client';

import { PROVIDER_OPTIONS, type ProviderId } from '@/lib/providers';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ProviderSelectorProps {
  selectedProvider: ProviderId;
  onSelect: (providerId: ProviderId) => void;
  openaiApiKey: string;
  onApiKeyChange: (key: string) => void;
  disabled?: boolean;
}

export function ProviderSelector({
  selectedProvider,
  onSelect,
  openaiApiKey,
  onApiKeyChange,
  disabled,
}: ProviderSelectorProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="space-y-3">
      {/* Provider cards */}
      <div className="grid grid-cols-2 gap-3">
        {PROVIDER_OPTIONS.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          return (
            <button
              key={provider.id}
              onClick={() => onSelect(provider.id)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]'
                  : 'border-muted bg-card hover:border-muted-foreground/30 hover:bg-muted/50'
              )}
            >
              <span className="text-2xl">{provider.icon}</span>
              <span className="font-semibold text-sm">{provider.name}</span>
              <span className="text-[11px] text-muted-foreground text-center leading-tight">
                {provider.description}
              </span>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* OpenAI API Key input */}
      {selectedProvider === 'openai' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Label htmlFor="openai-key" className="text-sm font-medium">
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
            Tu API Key se usa directamente con OpenAI y no se almacena en nuestros servidores.
          </p>
        </div>
      )}
    </div>
  );
}
