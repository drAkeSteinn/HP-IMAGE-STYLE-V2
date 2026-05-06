import { NextRequest, NextResponse } from 'next/server';
import { getStyleById, CUSTOM_PROMPT_PREFIX } from '@/lib/styles';
import type { StyleId } from '@/lib/styles';
import type { ProviderId, OpenAIModelId } from '@/lib/providers';

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
    const { image, styleId, customPrompt, provider, openaiApiKey, openaiModel } = body as {
      image: string;
      styleId: StyleId;
      customPrompt?: string;
      provider: ProviderId;
      openaiApiKey?: string;
      openaiModel?: OpenAIModelId;
    };

    // Validate inputs
    if (!image || !styleId || !provider) {
      return NextResponse.json(
        { error: 'Se requieren imagen, estilo y proveedor' },
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

    if (provider === 'openai' && !openaiApiKey) {
      return NextResponse.json(
        { error: 'Se requiere API Key de OpenAI' },
        { status: 400 }
      );
    }

    // Determine the effective prompt
    // For custom styles: prepend the preservation prefix + user's custom prompt
    // For preset styles: use the built-in prompt
    let effectivePrompt: string;
    if (style.isCustom && customPrompt?.trim()) {
      effectivePrompt = CUSTOM_PROMPT_PREFIX + customPrompt.trim() + ' Make the image high quality, detailed, and polished.';
    } else {
      effectivePrompt = style.prompt;
    }

    // Rescale the source image to 1080p on the shortest side before processing
    // Also returns the final dimensions so we can preserve the aspect ratio
    const rescaled = await rescaleImage(image);

    // Process with the selected provider
    let result: string;

    if (provider === 'zai') {
      result = await transformWithZai(rescaled.dataUrl, effectivePrompt, rescaled.dimensions);
    } else {
      const model = openaiModel || 'gpt-image-2';
      result = await transformWithOpenAI(rescaled.dataUrl, effectivePrompt, openaiApiKey!, model, rescaled.dimensions);
    }

    return NextResponse.json({
      success: true,
      image: result,
      style: style.isCustom ? 'Personalizado' : style.name,
      provider,
      model: provider === 'openai' ? (openaiModel || 'gpt-image-2') : 'zai-edit',
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
 * Returns the base64 data URL and the final dimensions.
 */
async function rescaleImage(imageDataUrl: string): Promise<RescaledResult> {
  try {
    const sharp = (await import('sharp')).default;

    // Extract base64 data from data URL
    const { base64 } = parseImageData(imageDataUrl);
    const inputBuffer = Buffer.from(base64, 'base64');

    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();
    const width = metadata.width || 1080;
    const height = metadata.height || 1080;

    // Determine if rescaling is needed
    const shortestSide = Math.min(width, height);
    const MAX_SHORT = 1080;

    let outputBuffer: Buffer;
    let finalWidth = width;
    let finalHeight = height;

    if (shortestSide > MAX_SHORT) {
      // Rescale: shortest side = 1080, maintain aspect ratio
      const scale = MAX_SHORT / shortestSide;
      finalWidth = Math.round(width * scale);
      finalHeight = Math.round(height * scale);

      outputBuffer = await sharp(inputBuffer)
        .resize(finalWidth, finalHeight, { fit: 'fill' })
        .png({ quality: 90 })
        .toBuffer();
    } else {
      // Image is already within limits, just convert to PNG for consistency
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
    // If sharp fails, return the original image unchanged
    console.warn('Image rescaling failed, using original:', err);
    return {
      dataUrl: imageDataUrl,
      dimensions: { width: 1080, height: 1080 },
    };
  }
}

/**
 * Extract the MIME type and raw base64 data from a data URL or raw base64 string.
 */
function parseImageData(dataUrl: string): { mime: string; base64: string } {
  if (dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/s);
    if (match) {
      return { mime: match[1], base64: match[2] };
    }
  }
  // Assume JPEG if no data URL prefix
  return { mime: 'image/jpeg', base64: dataUrl };
}

/**
 * Get file extension from MIME type.
 */
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
 * Get the closest supported output size for a given model that preserves
 * the original image's aspect ratio as closely as possible.
 *
 * gpt-image-2: supports arbitrary resolutions (e.g. "1920x1080")
 * gpt-image-1: supports 1024x1024, 1536x1024, 1024x1536
 * gpt-image-1-mini: supports 1024x1024, 1536x1024, 1024x1536
 * dall-e-3: supports 1024x1024, 1792x1024, 1024x1792
 * dall-e-2: supports 1024x1024 only
 */
function getModelSize(model: string, dims: ImageDimensions): string {
  const isLandscape = dims.width >= dims.height;
  const aspectRatio = dims.width / dims.height;

  // gpt-image-2 supports arbitrary resolutions — pass exact dimensions (up to 2K)
  if (model === 'gpt-image-2') {
    // Clamp to max 2048 on longest side for gpt-image-2 limits
    const longestSide = Math.max(dims.width, dims.height);
    if (longestSide > 2048) {
      const scale = 2048 / longestSide;
      const clampedWidth = Math.round(dims.width * scale);
      const clampedHeight = Math.round(dims.height * scale);
      return `${clampedWidth}x${clampedHeight}`;
    }
    return `${dims.width}x${dims.height}`;
  }

  // gpt-image-1 and gpt-image-1-mini: 1024x1024, 1536x1024, 1024x1536
  if (model === 'gpt-image-1' || model === 'gpt-image-1-mini') {
    if (aspectRatio > 1.2) {
      return '1536x1024'; // landscape
    } else if (aspectRatio < 0.8) {
      return '1024x1536'; // portrait
    } else {
      return '1024x1024'; // square-ish
    }
  }

  if (model === 'dall-e-3') {
    // dall-e-3: 1024x1024, 1792x1024, 1024x1792
    if (isLandscape) {
      return aspectRatio >= 1.4 ? '1792x1024' : '1024x1024';
    } else {
      return aspectRatio <= 0.7 ? '1024x1792' : '1024x1024';
    }
  }

  // dall-e-2 only supports square
  if (model === 'dall-e-2') {
    return '1024x1024';
  }

  // Default
  return isLandscape ? '1536x1024' : '1024x1536';
}

/**
 * Get the closest Z.ai supported size that preserves aspect ratio.
 * Z.ai supports various sizes; we pick the one closest to the input aspect ratio.
 */
function getZaiSize(dims: ImageDimensions): string {
  const isLandscape = dims.width >= dims.height;
  const aspectRatio = dims.width / dims.height;

  // Z.ai supported sizes (common options)
  if (aspectRatio > 1.5) {
    return '1792x1024'; // ~16:9 landscape
  } else if (aspectRatio > 1.1) {
    return '1536x1024'; // ~3:2 landscape
  } else if (aspectRatio < 0.67) {
    return '1024x1792'; // ~9:16 portrait
  } else if (aspectRatio < 0.9) {
    return '1024x1536'; // ~2:3 portrait
  } else {
    return '1024x1024'; // square
  }
}

async function transformWithZai(
  imageBase64: string,
  prompt: string,
  dims: ImageDimensions
): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  const zai = await ZAI.create();

  // Ensure the image is in proper data URL format
  let imageUrl = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  // Use size that preserves the original aspect ratio
  const size = getZaiSize(dims);

  const response = await zai.images.generations.edit({
    prompt: prompt,
    images: [{ url: imageUrl }],
    size: size,
  });

  const base64 = response?.data?.[0]?.base64;
  if (!base64) {
    throw new Error('No se recibió imagen del servicio Z.ai');
  }

  return base64;
}

async function transformWithOpenAI(
  imageBase64: string,
  prompt: string,
  apiKey: string,
  model: string,
  dims: ImageDimensions
): Promise<string> {
  const { mime, base64 } = parseImageData(imageBase64);

  // gpt-image-2, gpt-image-1, gpt-image-1-mini, and dall-e-2 support the /images/edits endpoint
  // which allows sending the source image for modification
  if (model === 'gpt-image-2' || model === 'gpt-image-1' || model === 'gpt-image-1-mini' || model === 'dall-e-2') {
    return await transformWithOpenAIEdits(base64, mime, prompt, apiKey, model, dims);
  }

  // dall-e-3 only supports /images/generations (text-to-image)
  // We enhance the prompt to describe the transformation more clearly
  return await transformWithOpenAIGenerations(prompt, apiKey, model, dims);
}

/**
 * Use OpenAI /images/edits endpoint — sends the source image along with the prompt.
 * This is the proper way to "transform" an image with gpt-image-1 and dall-e-2.
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

  // GPT Image models (gpt-image-2, gpt-image-1, gpt-image-1-mini) use "image[]" as the field name
  // dall-e-2 uses "image" as the field name
  // See: https://developers.openai.com/api/docs/guides/image-generation
  const isGptImageModel = model.startsWith('gpt-image');
  const imageFieldName = isGptImageModel ? 'image[]' : 'image';

  // GPT Image models accept png, webp, or jpg — use the original format
  // dall-e-2 requires PNG format
  let uploadBuffer = imageBuffer;
  let uploadMime = imageMime;
  let uploadFilename = `image.${mimeToExt(imageMime)}`;

  // For dall-e-2, convert to PNG if not already
  if (!isGptImageModel && imageMime !== 'image/png') {
    try {
      const sharp = (await import('sharp')).default;
      uploadBuffer = await sharp(imageBuffer).png().toBuffer();
      uploadMime = 'image/png';
      uploadFilename = 'image.png';
    } catch {
      // If conversion fails, use original (may cause API error)
    }
  }

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

  // n field — only for dall-e-2
  if (!isGptImageModel) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1\r\n`
      )
    );
  }

  // size field — preserve original aspect ratio
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size}\r\n`
    )
  );

  // image field (file upload) — use image[] for GPT Image models, image for dall-e-2
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${imageFieldName}"; filename="${uploadFilename}"\r\nContent-Type: ${uploadMime}\r\n\r\n`
    )
  );
  parts.push(uploadBuffer);
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

  // gpt-image-1 returns b64_json by default; dall-e-2 may return url or b64_json
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

/**
 * Use OpenAI /images/generations endpoint — text-to-image only (dall-e-3).
 * The source image cannot be sent, so we rely on a descriptive prompt.
 */
async function transformWithOpenAIGenerations(
  prompt: string,
  apiKey: string,
  model: string,
  dims: ImageDimensions
): Promise<string> {
  const size = getModelSize(model, dims);

  const requestBody: Record<string, unknown> = {
    model: model,
    prompt: prompt,
    n: 1,
    size: size,
    response_format: 'b64_json',
  };

  const response = await fetch(
    'https://api.openai.com/v1/images/generations',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData as { error?: { message?: string } })?.error?.message ||
      `Error de OpenAI: ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const imageData = data?.data?.[0];

  if (!imageData) {
    throw new Error('No se recibió imagen del servicio OpenAI');
  }

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
