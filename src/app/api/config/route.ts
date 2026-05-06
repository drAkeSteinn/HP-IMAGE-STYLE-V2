import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const CONFIG_PATH = join(process.cwd(), 'data', 'config.json');

interface AppConfig {
  provider: string;
  openaiApiKey: string;
  openaiModel: string;
}

const DEFAULT_CONFIG: AppConfig = {
  provider: 'zai',
  openaiApiKey: '',
  openaiModel: 'gpt-image-1',
};

async function readConfig(): Promise<AppConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw) as Partial<AppConfig>;
    return { ...DEFAULT_CONFIG, ...config };
  } catch {
    // If file doesn't exist or is invalid, return defaults
    return { ...DEFAULT_CONFIG };
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
      { success: true, config: DEFAULT_CONFIG }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, openaiApiKey, openaiModel } = body as Partial<AppConfig>;

    const config: AppConfig = {
      provider: provider || DEFAULT_CONFIG.provider,
      openaiApiKey: openaiApiKey ?? DEFAULT_CONFIG.openaiApiKey,
      openaiModel: openaiModel || DEFAULT_CONFIG.openaiModel,
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
