import { NextRequest, NextResponse } from 'next/server';
import { getStyleById, CUSTOM_PROMPT_PREFIX } from '@/lib/styles';
import type { StyleId } from '@/lib/styles';
import type { OpenAIModelId } from '@/lib/providers';

interface ImageDimensions {
  width: number;
  height: number;
}

interface RescaledResult {
  dataUrl: string;
  dimensions: ImageDimensions;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, styleId, customPrompt, openaiApiKey, openaiModel } = body as {
      image: string;
      styleId: StyleId;
      customPrompt?: string;
      openaiApiKey?: string;
      openaiModel?: OpenAIModelId;
    };

    // Validate inputs
    if (!image || !styleId) {
      return NextResponse.json(
        { error: 'Se requieren imagen y estilo' },
        { status: 400 }
      );
    }

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'Se requiere API Key de OpenAI' },
        { status: 400 }
      );
    }

    const style = getStyleById(styleId);
    if (!style) {
      return NextResponse.json(
        { error: 'Estilo no válido' },
        { status: 400 }
      );
    }

    // Validate custom prompt
    if (style.isCustom && !customPrompt?.trim()) {
      return NextResponse.json(
        { error: 'Se requiere un prompt personalizado para el estilo Personalizado' },
        { status: 400 }
      );
    }

    // Determine the effective prompt
    let effectivePrompt: string;
    if (style.isCustom && customPrompt?.trim()) {
      effectivePrompt = CUSTOM_PROMPT_PREFIX + customPrompt.trim() + ' Make the image high quality, detailed, and polished.';
    } else {
      effectivePrompt = style.prompt;
    }

    // Rescale the source image to 1080p on the shortest side before processing
    const rescaled = await rescaleImage(image);

    // Process with OpenAI
    const model = openaiModel || 'gpt-image-1';
    const result = await transformWithOpenAI(rescaled.dataUrl, effectivePrompt, openaiApiKey, model, rescaled.dimensions);

    return NextResponse.json({
      success: true,
      image: result,
      style: style.isCustom ? 'Personalizado' : style.name,
      model: openaiModel || 'gpt-image-1',
    });
  } catch (error: unknown) {
    console.error('Transform error:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido en la transformación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Rescale image so the shortest side is 1080px, maintaining aspect ratio.
 * Uses sharp for server-side image processing.
 */
async function rescaleImage(imageDataUrl: string): Promise<RescaledResult> {
  try {
    const sharp = (await import('sharp')).default;

    const { base64 } = parseImageData(imageDataUrl);
    const inputBuffer = Buffer.from(base64, 'base64');

    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 1080;
    const height = metadata.height || 1080;

    const shortestSide = Math.min(width, height);
    const MAX_SHORT = 1080;

    let outputBuffer: Buffer;
    let finalWidth = width;
    let finalHeight = height;

    if (shortestSide > MAX_SHORT) {
      const scale = MAX_SHORT / shortestSide;
      finalWidth = Math.round(width * scale);
      finalHeight = Math.round(height * scale);

      outputBuffer = await sharp(inputBuffer)
        .resize(finalWidth, finalHeight, { fit: 'fill' })
        .png({ quality: 90 })
        .toBuffer();
    } else {
      outputBuffer = await sharp(inputBuffer)
        .png({ quality: 90 })
        .toBuffer();
    }

    const outputBase64 = outputBuffer.toString('base64');
    return {
      dataUrl: `data:image/png;base64,${outputBase64}`,
      dimensions: { width: finalWidth, height: finalHeight },
    };
  } catch (err) {
    console.warn('Image rescaling failed, using original:', err);
    return {
      dataUrl: imageDataUrl,
      dimensions: { width: 1080, height: 1080 },
    };
  }
}

function parseImageData(dataUrl: string): { mime: string; base64: string } {
  if (dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/s);
    if (match) {
      return { mime: match[1], base64: match[2] };
    }
  }
  return { mime: 'image/jpeg', base64: dataUrl };
}

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mime] || 'png';
}

/**
 * Get the output size for gpt-image-1 that best preserves the aspect ratio.
 * Supported: 1024x1024, 1536x1024, 1024x1536
 */
function getModelSize(model: string, dims: ImageDimensions): string {
  const aspectRatio = dims.width / dims.height;

  // gpt-image-1: 1024x1024, 1536x1024, 1024x1536
  if (model === 'gpt-image-1' || model === 'gpt-image-1-mini') {
    if (aspectRatio > 1.2) {
      return '1536x1024'; // landscape
    } else if (aspectRatio < 0.8) {
      return '1024x1536'; // portrait
    } else {
      return '1024x1024'; // square-ish
    }
  }

  // Default fallback
  return aspectRatio > 1.2 ? '1536x1024' : aspectRatio < 0.8 ? '1024x1536' : '1024x1024';
}

async function transformWithOpenAI(
  imageBase64: string,
  prompt: string,
  apiKey: string,
  model: string,
  dims: ImageDimensions
): Promise<string> {
  const { mime, base64 } = parseImageData(imageBase64);

  // gpt-image-1 uses the /images/edits endpoint
  return await transformWithOpenAIEdits(base64, mime, prompt, apiKey, model, dims);
}

/**
 * Use OpenAI /images/edits endpoint — sends the source image along with the prompt.
 */
async function transformWithOpenAIEdits(
  imageBase64Raw: string,
  imageMime: string,
  prompt: string,
  apiKey: string,
  model: string,
  dims: ImageDimensions
): Promise<string> {
  const imageBuffer = Buffer.from(imageBase64Raw, 'base64');
  const size = getModelSize(model, dims);
  const uploadFilename = `image.${mimeToExt(imageMime)}`;

  // Build multipart/form-data body
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  const parts: Buffer[] = [];

  // model field
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${model}\r\n`
    )
  );

  // prompt field
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}\r\n`
    )
  );

  // size field
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size}\r\n`
    )
  );

  // image field — GPT Image models use "image[]"
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="${uploadFilename}"\r\nContent-Type: ${imageMime}\r\n\r\n`
    )
  );
  parts.push(imageBuffer);
  parts.push(Buffer.from('\r\n'));

  // End boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData as { error?: { message?: string } })?.error?.message ||
      `Error de OpenAI (${response.status}): No se pudo editar la imagen`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const imageData = data?.data?.[0];

  if (!imageData) {
    throw new Error('No se recibió imagen del servicio OpenAI');
  }

  // gpt-image-1 returns b64_json by default
  if (imageData.b64_json) {
    return imageData.b64_json;
  }

  if (imageData.url) {
    const imgResponse = await fetch(imageData.url);
    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  }

  throw new Error('Formato de respuesta OpenAI no soportado');
}
