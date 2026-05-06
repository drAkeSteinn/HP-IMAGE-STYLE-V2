export type ProviderId = 'zai' | 'openai';

export type OpenAIModelId = 'gpt-image-2' | 'gpt-image-1' | 'gpt-image-1-mini' | 'dall-e-3' | 'dall-e-2';

export interface OpenAIModelOption {
  id: OpenAIModelId;
  name: string;
  description: string;
}

export interface ProviderOption {
  id: ProviderId;
  name: string;
  description: string;
  icon: string;
  requiresApiKey: boolean;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  models?: OpenAIModelOption[];
  defaultModel?: string;
}

export const OPENAI_MODELS: OpenAIModelOption[] = [
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    description: 'El modelo más avanzado de OpenAI. Calidad superior, soporta resoluciones arbitrarias y excelente preservación de identidad.',
  },
  {
    id: 'gpt-image-1',
    name: 'GPT Image 1',
    description: 'Alta calidad y comprensión avanzada del contexto. Soporta edición directa de imágenes.',
  },
  {
    id: 'gpt-image-1-mini',
    name: 'GPT Image 1 Mini',
    description: 'Versión eficiente y económica de GPT Image 1. Más rápida y con menor costo, ideal para transformaciones simples.',
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    description: 'Generación de imágenes de alta calidad con excelente comprensión de prompts detallados.',
  },
  {
    id: 'dall-e-2',
    name: 'DALL·E 2',
    description: 'Modelo anterior, más rápido y económico. Soporta edición directa de imágenes.',
  },
];

export const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: 'zai',
    name: 'Z.ai',
    description: 'Motor de IA de Z.ai integrado (sin configuración adicional)',
    icon: '🤖',
    requiresApiKey: false,
    apiKeyLabel: '',
    apiKeyPlaceholder: '',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'API de OpenAI (requiere API Key propia)',
    icon: '🧠',
    requiresApiKey: true,
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-...',
    models: OPENAI_MODELS,
    defaultModel: 'gpt-image-2',
  },
];

export function getProviderById(id: ProviderId): ProviderOption | undefined {
  return PROVIDER_OPTIONS.find((p) => p.id === id);
}
