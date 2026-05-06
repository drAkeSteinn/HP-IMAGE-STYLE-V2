import { NextRequest, NextResponse } from 'next/server';
import { getStyleById } from '@/lib/styles';
import type { StyleId } from '@/lib/styles';
import type { ProviderId, OpenAIModelId } from '@/lib/providers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, styleId, provider, openaiApiKey, openaiModel } = body as {
      image: string;
      styleId: StyleId;
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

    if (provider === 'openai' && !openaiApiKey) {
      return NextResponse.json(
        { error: 'Se requiere API Key de OpenAI' },
        { status: 400 }
      );
    }

    // Process with the selected provider
    let result: string;

    if (provider === 'zai') {
      result = await transformWithZai(image, style.prompt);
    } else {
      const model = openaiModel || 'gpt-image-1';
      result = await transformWithOpenAI(image, style.prompt, openaiApiKey!, model);
    }

    return NextResponse.json({
      success: true,
      image: result,
      style: style.name,
      provider,
      model: provider === 'openai' ? (openaiModel || 'gpt-image-1') : 'zai-edit',
    });
  } catch (error: unknown) {
    console.error('Transform error:', error);
    const message =
      error instanceof Error ? error.message : 'Error desconocido en la transformación';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function transformWithZai(
  imageBase64: string,
  prompt: string
): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  const zai = await ZAI.create();

  // Ensure the image is in proper data URL format
  let imageUrl = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  const response = await zai.images.generations.edit({
    prompt: prompt,
    images: [{ url: imageUrl }],
    size: '1024x1024',
  });

  const base64 = response?.data?.[0]?.base64;
  if (!base64) {
    throw new Error('No se recibió imagen del servicio Z.ai');
  }

  return base64;
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

async function transformWithOpenAI(
  imageBase64: string,
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const { mime, base64 } = parseImageData(imageBase64);

  // gpt-image-1 and dall-e-2 support the /images/edits endpoint
  // which allows sending the source image for modification
  if (model === 'gpt-image-1' || model === 'dall-e-2') {
    return await transformWithOpenAIEdits(base64, mime, prompt, apiKey, model);
  }

  // dall-e-3 only supports /images/generations (text-to-image)
  // We enhance the prompt to describe the transformation more clearly
  return await transformWithOpenAIGenerations(prompt, apiKey, model);
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
  model: string
): Promise<string> {
  const imageBuffer = Buffer.from(imageBase64Raw, 'base64');
  const ext = mimeToExt(imageMime);
  const filename = `image.${ext}`;

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

  // n field
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1\r\n`
    )
  );

  // size field — dall-e-2 edits only supports 256x256, 512x512, or 1024x1024
  if (model === 'dall-e-2') {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024\r\n`
      )
    );
  } else {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024\r\n`
      )
    );
  }

  // image field (file upload)
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: ${imageMime}\r\n\r\n`
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
  model: string
): Promise<string> {
  const requestBody: Record<string, unknown> = {
    model: model,
    prompt: prompt,
    n: 1,
    size: '1024x1024',
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
