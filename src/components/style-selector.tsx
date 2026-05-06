'use client';

import { STYLE_OPTIONS, type StyleId } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: StyleId | null;
  onSelect: (styleId: StyleId) => void;
  disabled?: boolean;
}

export function StyleSelector({
  selectedStyle,
  onSelect,
  disabled,
}: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STYLE_OPTIONS.map((style) => {
        const isSelected = selectedStyle === style.id;
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
                ? 'border-hp-blue bg-hp-blue/5 shadow-sm scale-[1.02]'
                : 'border-muted bg-card hover:border-hp-blue/40 hover:bg-hp-blue/[0.02]'
            )}
          >
            {/* Blue accent line on top */}
            <div
              className={cn(
                'absolute top-0 left-0 right-0 h-1 transition-colors duration-200',
                isSelected ? 'bg-hp-blue' : 'bg-hp-blue/20'
              )}
            />

            {/* Icon */}
            <span className="text-xl sm:text-2xl mt-1">{style.icon}</span>

            {/* Name */}
            <span
              className={cn(
                'font-semibold text-xs sm:text-sm mt-1',
                isSelected ? 'text-hp-blue' : 'text-foreground'
              )}
            >
              {style.nameEs}
            </span>

            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-hp-blue flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
