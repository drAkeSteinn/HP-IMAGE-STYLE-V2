export type ProviderId = 'openai';

export type OpenAIModelId = 'gpt-image-1';

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
    description: 'Alta calidad y comprensión avanzada del contexto. Soporta edición directa de imágenes con excelente preservación de identidad.',
  },
];

export const PROVIDER_OPTIONS: ProviderOption[] = [
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
