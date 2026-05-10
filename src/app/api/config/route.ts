import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { getDefaultEnabledStyles, type StyleId } from '@/lib/styles';

const CONFIG_PATH = join(process.cwd(), 'data', 'config.json');

interface AppConfig {
  provider: string;
  openaiApiKey: string;
  openaiModel: string;
  enabledStyles: Record<StyleId, boolean>;
}

const DEFAULT_CONFIG: AppConfig = {
  provider: 'openai',
  openaiApiKey: '',
  openaiModel: 'gpt-image-1',
  enabledStyles: getDefaultEnabledStyles(),
};

async function readConfig(): Promise<AppConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw) as Partial<AppConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...config,
      // Merge enabledStyles with defaults so new styles get enabled automatically
      enabledStyles: {
        ...getDefaultEnabledStyles(),
        ...(config.enabledStyles || {}),
      },
    };
  } catch {
    // If file doesn't exist or is invalid, return defaults
    return { ...DEFAULT_CONFIG, enabledStyles: getDefaultEnabledStyles() };
  }
}

async function writeConfig(config: AppConfig): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const config = await readConfig();
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error reading config:', error);
    return NextResponse.json(
      { success: true, config: { ...DEFAULT_CONFIG, enabledStyles: getDefaultEnabledStyles() } }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, openaiApiKey, openaiModel, enabledStyles } = body as Partial<AppConfig>;

    const config: AppConfig = {
      provider: provider || DEFAULT_CONFIG.provider,
      openaiApiKey: openaiApiKey ?? DEFAULT_CONFIG.openaiApiKey,
      openaiModel: openaiModel || DEFAULT_CONFIG.openaiModel,
      enabledStyles: {
        ...getDefaultEnabledStyles(),
        ...(enabledStyles || {}),
      },
    };

    await writeConfig(config);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error writing config:', error);
    const message =
      error instanceof Error ? error.message : 'Error al guardar la configuración';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
