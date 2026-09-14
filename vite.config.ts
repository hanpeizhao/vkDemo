import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

function handleModuleDirectivesPlugin() {
  return {
    name: 'handle-module-directives-plugin',
    transform(code: string, id: string) {
      if (id.includes('@vkontakte/icons')) {
        code = code.replace(/"use-client";?/g, '');
      }
      return { code };
    },
  };
}

/**
 * 某些代码块可能较大，但不会影响网站的加载速度。
 * 我们会根据浏览器版本收集并应用多个脚本版本，
 * 以确保代码在网站和按需资源环境中都能正常运行。
 * 详情请参考：https://dev.vk.ru/mini-apps/development/on-demand-resources。
 */
export default defineConfig({
  base: './',

  plugins: [
    react(),
    handleModuleDirectivesPlugin(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],

  server: {
    allowedHosts: ['.trycloudflare.com']
  },
  
  build: {
    outDir: 'build',
  },
});
