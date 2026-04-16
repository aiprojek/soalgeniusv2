import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

type BuildMeta = {
  date: string;
  count: number;
};

const buildMetaPath = path.resolve(__dirname, '.build-meta.json');

const getBuildVersion = (command: 'serve' | 'build') => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const buildDate = `${dd}${mm}${yyyy}`;

  let meta: BuildMeta = { date: buildDate, count: 0 };

  if (fs.existsSync(buildMetaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(buildMetaPath, 'utf8')) as BuildMeta;
    } catch (error) {
      console.warn('Failed to read build metadata, resetting counter.', error);
    }
  }

  if (command === 'build') {
    meta = meta.date === buildDate
      ? { date: buildDate, count: meta.count + 1 }
      : { date: buildDate, count: 1 };

    fs.writeFileSync(buildMetaPath, JSON.stringify(meta, null, 2));
  } else if (meta.date !== buildDate) {
    meta = { date: buildDate, count: 1 };
  }

  return `${meta.date}.${String(meta.count).padStart(2, '0')}`;
};

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    const buildVersion = getBuildVersion(command);
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'import.meta.env.VITE_APP_BUILD_VERSION': JSON.stringify(buildVersion),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
