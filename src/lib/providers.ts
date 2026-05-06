export type ProviderId = 'zai' | 'openai';

export type OpenAIModelId = 'gpt-image-1' | 'dall-e-3' | 'dall-e-2';

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
    id: 'gpt-image-1',
    name: 'GPT Image 1',
    description: 'Modelo más reciente de generación de imágenes de OpenAI. Alta calidad y comprensión avanzada del contexto.',
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    description: 'Generación de imágenes de alta calidad con excelente comprensión de prompts detallados.',
  },
  {
    id: 'dall-e-2',
    name: 'DALL·E 2',
    description: 'Modelo anterior, más rápido y económico. Buena calidad para transformaciones simples.',
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
    defaultModel: 'gpt-image-1',
  },
];

export function getProviderById(id: ProviderId): ProviderOption | undefined {
  return PROVIDER_OPTIONS.find((p) => p.id === id);
}
