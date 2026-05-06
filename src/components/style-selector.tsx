'use client';

import { STYLE_OPTIONS, type StyleId } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { Check, Pencil } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface StyleSelectorProps {
  selectedStyle: StyleId | null;
  onSelect: (styleId: StyleId) => void;
  enabledStyles: Record<StyleId, boolean>;
  disabled?: boolean;
  /** Custom prompt text (only used when custom style is selected) */
  customPrompt: string;
  /** Callback when custom prompt changes */
  onCustomPromptChange: (prompt: string) => void;
}

export function StyleSelector({
  selectedStyle,
  onSelect,
  enabledStyles,
  disabled,
  customPrompt,
  onCustomPromptChange,
}: StyleSelectorProps) {
  const visibleStyles = STYLE_OPTIONS.filter((s) => enabledStyles[s.id]);
  const colCount = Math.min(visibleStyles.length, 4);

  if (visibleStyles.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No hay estilos habilitados. Configúralos en el panel de Configuración.
      </div>
    );
  }

  const isCustomSelected = selectedStyle === 'custom';
  const customStyle = STYLE_OPTIONS.find((s) => s.id === 'custom');

  return (
    <div className="space-y-3">
      <div className={cn('grid gap-3', colCount <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
        {visibleStyles.map((style) => {
          const isSelected = selectedStyle === style.id;
          const isCustom = style.isCustom;
          return (
            <button
              key={style.id}
              onClick={() => onSelect(style.id)}
              disabled={disabled}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hp-blue/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'aspect-[2/1]',
                isSelected
                  ? isCustom
                    ? 'border-purple-500 bg-purple-50 shadow-sm scale-[1.02]'
                    : 'border-hp-blue bg-hp-blue/5 shadow-sm scale-[1.02]'
                  : 'border-muted bg-card hover:border-hp-blue/40 hover:bg-hp-blue/[0.02]'
              )}
            >
              {/* Accent line on top */}
              <div
                className={cn(
                  'absolute top-0 left-0 right-0 h-1 transition-colors duration-200',
                  isSelected
                    ? isCustom ? 'bg-purple-500' : 'bg-hp-blue'
                    : 'bg-hp-blue/20'
                )}
              />

              {/* Icon */}
              <span className="text-xl sm:text-2xl mt-1">{style.icon}</span>

              {/* Name */}
              <span
                className={cn(
                  'font-semibold text-xs sm:text-sm mt-1',
                  isSelected
                    ? isCustom ? 'text-purple-600' : 'text-hp-blue'
                    : 'text-foreground'
                )}
              >
                {style.nameEs}
              </span>

              {/* Selected checkmark */}
              {isSelected && (
                <div className={cn(
                  'absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center',
                  isCustom ? 'bg-purple-500' : 'bg-hp-blue'
                )}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom prompt textarea — shown when "Personalizado" is selected */}
      {isCustomSelected && customStyle && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-purple-500" />
            <label htmlFor="custom-prompt" className="text-sm font-medium text-purple-700">
              Escribe tu prompt de transformación
            </label>
          </div>
          <Textarea
            id="custom-prompt"
            placeholder="Ejemplo: Transform the image into a watercolor painting style with soft brush strokes and pastel colors..."
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            disabled={disabled}
            className="min-h-[120px] resize-y border-purple-200 focus-visible:ring-purple-400 bg-purple-50/30 placeholder:text-muted-foreground/60"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Se añadirá automáticamente una instrucción para preservar la identidad, género, edad, pose y características físicas de las personas en la imagen. Solo describe el estilo visual que deseas aplicar.
          </p>
        </div>
      )}
    </div>
  );
}
