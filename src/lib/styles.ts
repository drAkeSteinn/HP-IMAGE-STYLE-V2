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
  /** If true, this style uses a user-provided custom prompt instead of the built-in one */
  isCustom?: boolean;
}

/**
 * Base prefix automatically prepended to custom prompts to ensure
 * identity/pose/gender/age preservation in all transformations.
 */
export const CUSTOM_PROMPT_PREFIX =
  'Edit Image A, which is the direct edit target. Preserve the overall composition, camera angle, and arrangement of the people and objects in the photo. Strictly preserve each person\'s gender, age, ethnicity, body type, pose, facial expression, and clothing identity — they must remain completely recognizable as themselves. ';

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'amigurumi',
    name: 'Amigurumi',
    nameEs: 'Amigurumi',
    description: 'Tejido crochet estilo muñeco adorable con textura de hilo visible',
    prompt:
      'Edit Image A, which is the direct edit target. Transform the entire image into an adorable amigurumi crochet doll scene while preserving the overall composition, camera angle, and arrangement of the people and objects in the photo. Convert each person into a cute handmade amigurumi-style plush doll version of themselves, strictly preserving their gender, age, ethnicity, body type, pose, facial expression, and clothing identity. Add visible crochet stitching, yarn texture, soft wool fibers, button eyes, simplified cute facial features, rounded plush proportions, and a charming handcrafted knitted toy appearance. Use soft pastel colors overall while keeping the scene recognizable. Preserve the background structure and setting in a stylized way, but render everything with a plushie, cozy, crocheted aesthetic. Do NOT alter any person\'s identity, gender, age, pose, or physical characteristics — they must remain recognizable as amigurumi versions of themselves. Make the image high quality, detailed, soft, cute, and polished, with clear wool texture and an adorable handmade toy look.',
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
      'Edit Image A, which is the direct edit target. Transform the entire image into a Japanese anime style illustration while preserving the overall composition, camera angle, and arrangement of the people and objects in the photo. Convert each person into an anime-style version of themselves, strictly preserving their gender, age, ethnicity, body type, pose, facial expression, and clothing identity. Apply bold clean outlines, vibrant saturated colors, dramatic cel shading, expressive eyes in anime style, smooth gradient hair, and dynamic studio-quality anime art. Each person must remain clearly recognizable — same face shape, same body proportions, same pose, same clothing — just rendered in anime art style. Preserve the background structure and setting in a stylized way, rendered with anime backgrounds and atmospheric effects. Do NOT alter any person\'s identity, gender, age, pose, or physical characteristics. Make the image high quality, detailed, with clean linework, vivid colors, and polished anime production quality.',
    icon: '⚡',
    color: 'text-hp-blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    previewGradient: 'from-blue-500 to-sky-300',
  },
  {
    id: 'mundial',
    name: 'Estilo Mundial',
    nameEs: 'Estilo Mundial',
    description: 'Aspecto de Mundial de Fútbol México 2026 con la selección mexicana',
    prompt:
      'Edit Image A, which is the direct edit target. Transform the entire image into a FIFA World Cup 2026 Mexico celebration scene while preserving the overall composition, camera angle, and arrangement of the people in the photo. Strictly preserve each person\'s gender, age, ethnicity, body type, pose, and facial expression — they must remain completely recognizable as themselves. Dress each person in or surround them with Mexican national football team (Selección Mexicana) elements: the iconic green jersey, white and red flag colors, Mexican face paint (green, white, red stripes on cheeks), and World Cup 2026 Mexico branding. Transform the background into an exciting soccer stadium atmosphere with Estadio Azteca vibes, FIFA World Cup 2026 banners, confetti, passionate crowd energy, and celebratory soccer ambiance. Apply a dynamic sports photography style with vivid colors and dramatic lighting. Do NOT alter any person\'s identity, gender, age, pose, or physical characteristics — they must remain exactly as they are, just immersed in the World Cup 2026 Mexico celebration. Make the image high quality, detailed, vibrant, energetic, and polished with a professional sports photography aesthetic.',
    icon: '⚽',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    previewGradient: 'from-green-500 to-red-400',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    nameEs: 'Personalizado',
    description: 'Escribe tu propio prompt para transformar la imagen',
    prompt: '', // Custom prompt is provided by the user at runtime
    icon: '✏️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    previewGradient: 'from-purple-400 to-violet-300',
    isCustom: true,
  },
];

export type StyleId = (typeof STYLE_OPTIONS)[number]['id'];

export function getStyleById(id: StyleId): StyleOption | undefined {
  return STYLE_OPTIONS.find((s) => s.id === id);
}

/** Default: all styles enabled */
export function getDefaultEnabledStyles(): Record<StyleId, boolean> {
  const result = {} as Record<StyleId, boolean>;
  for (const style of STYLE_OPTIONS) {
    result[style.id] = true;
  }
  return result;
}
