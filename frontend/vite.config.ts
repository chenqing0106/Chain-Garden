import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env from root directory (parent directory)
    const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // 显式暴露 VITE_ 开头的环境变量给客户端（通过 define 确保在浏览器中可用）
        'import.meta.env.VITE_PINATA_JWT': JSON.stringify(env.VITE_PINATA_JWT || ''),
        'import.meta.env.VITE_PINATA_API_BASE': JSON.stringify(env.VITE_PINATA_API_BASE || 'https://api.pinata.cloud'),
        'import.meta.env.VITE_PINATA_GATEWAY': JSON.stringify(env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
