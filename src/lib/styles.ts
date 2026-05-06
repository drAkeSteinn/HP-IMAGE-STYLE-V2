export interface StyleOption {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  previewGradient: string;
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'amigurumi',
    name: 'Amigurumi',
    nameEs: 'Amigurumi',
    description: 'Tejido crochet estilo muñeco adorable con textura de hilo visible',
    prompt:
      'Transform this image into an adorable amigurumi crochet doll style, with visible yarn texture, soft pastel colors, button eyes, cute handmade knitted toy appearance, wool texture, plushie look, high quality, detailed',
    icon: '🧶',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    previewGradient: 'from-rose-400 to-pink-300',
  },
  {
    id: 'anime',
    name: 'Anime',
    nameEs: 'Anime',
    description: 'Estilo anime japonés con contornos audaces y colores vibrantes',
    prompt:
      'Transform this image into Japanese anime style, with bold outlines, vibrant saturated colors, dramatic cel shading, big expressive eyes, dynamic anime art style, clean linework, studio quality, detailed',
    icon: '⚡',
    color: 'text-hp-blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    previewGradient: 'from-blue-500 to-sky-300',
  },
  {
    id: 'ghibli',
    name: 'Ghibli',
    nameEs: 'Ghibli',
    description: 'Estilo Studio Ghibli con tonos cálidos nostálgicos y atmósfera mágica',
    prompt:
      'Transform this image into Studio Ghibli style, with soft watercolor backgrounds, warm nostalgic tones, whimsical magical atmosphere, hand-painted look, Miyazaki-inspired art style, lush nature elements, gentle lighting, high quality, detailed',
    icon: '🌿',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    previewGradient: 'from-emerald-400 to-teal-300',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    nameEs: 'Cyberpunk',
    description: 'Estilo cyberpunk futurista con neón y atmósfera distópica',
    prompt:
      'Transform this image into cyberpunk style, with neon lights glowing in pink and cyan, dark futuristic atmosphere, holographic elements, techwear clothing, dystopian sci-fi aesthetic, rain-slicked streets, chrome reflections, high quality, detailed',
    icon: '🌃',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    previewGradient: 'from-cyan-400 to-blue-300',
  },
];

export type StyleId = (typeof STYLE_OPTIONS)[number]['id'];

export function getStyleById(id: StyleId): StyleOption | undefined {
  return STYLE_OPTIONS.find((s) => s.id === id);
}
