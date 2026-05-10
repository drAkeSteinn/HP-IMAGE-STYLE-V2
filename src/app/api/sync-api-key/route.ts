import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { getDefaultEnabledStyles, type StyleId } from '@/lib/styles';

const CONFIG_PATH = join(process.cwd(), 'data', 'config.json');

// Google Drive file ID for the API key
const GDRIVE_FILE_ID = '16WrMjxOMw8lF3Kl6QJxYL6Wa1smtJd2b';
// Use the direct download URL (drive.usercontent.google.com) to avoid redirect issues
const GDRIVE_DOWNLOAD_URL = `https://drive.usercontent.google.com/download?id=${GDRIVE_FILE_ID}&export=download`;

interface AppConfig {
  provider: string;
  openaiApiKey: string;
  openaiModel: string;
  enabledStyles: Record<StyleId, boolean>;
}

async function readConfig(): Promise<AppConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw) as Partial<AppConfig>;
    return {
      provider: 'openai',
      openaiApiKey: '',
      openaiModel: 'gpt-image-1',
      enabledStyles: getDefaultEnabledStyles(),
      ...config,
      enabledStyles: {
        ...getDefaultEnabledStyles(),
        ...(config.enabledStyles || {}),
      },
    };
  } catch {
    return {
      provider: 'openai',
      openaiApiKey: '',
      openaiModel: 'gpt-image-1',
      enabledStyles: getDefaultEnabledStyles(),
    };
  }
}

async function writeConfig(config: AppConfig): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export async function POST() {
  try {
    // Fetch the API key from Google Drive using the direct download URL
    // (avoids 303 redirect issues with the /uc?export=download URL)
    const response = await fetch(GDRIVE_DOWNLOAD_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `No se pudo descargar el archivo de Google Drive (status: ${response.status})`,
        },
        { status: 502 }
      );
    }

    const text = (await response.text()).trim();

    // Validate it looks like an OpenAI API key
    if (!text || !text.startsWith('sk-')) {
      return NextResponse.json(
        {
          success: false,
          error: 'El archivo no contiene una API Key de OpenAI válida',
        },
        { status: 400 }
      );
    }

    // Read current config and update the API key
    const config = await readConfig();
    config.openaiApiKey = text;
    await writeConfig(config);

    // Return masked key for display
    const maskedKey = `${text.slice(0, 6)}...${text.slice(-4)}`;

    return NextResponse.json({
      success: true,
      maskedKey,
      message: 'API Key sincronizada correctamente',
    });
  } catch (error) {
    console.error('Sync API key error:', error);
    const message =
      error instanceof Error ? error.message : 'Error al sincronizar la API Key';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
