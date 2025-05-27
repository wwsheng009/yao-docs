import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import { MarkdownTransform } from './.vitepress/plugins/markdownTransform';

// 添加ESM动态导入配置
export default defineConfig(async () => {
  const [UnoCSS, { default: pkgManagerDetector }] = await Promise.all([
    import('unocss/vite').then((m) => m.default),
    import('package-manager-detector') // 修复ESM模块导入问题
  ]);

  return {
    server: {
      hmr: {
        overlay: false
      },
      fs: {
        allow: [resolve(__dirname, '..')]
      }
    },
    plugins: [
      // custom
      MarkdownTransform(),
      // plugins
      Components({
        dirs: resolve(__dirname, '.vitepress/theme/components'),
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        resolvers: [
          IconsResolver({
            componentPrefix: ''
          })
        ],
        dts: './.vitepress/components.d.ts',
        transformer: 'vue3'
      }),
      Icons({
        compiler: 'vue3',
        autoInstall: true,
        defaultStyle: 'display: inline-block',
        // 添加浏览器polyfill配置
        customCollections: {
          core: {
            async loader() {
              return await pkgManagerDetector();
            }
          }
        }
      }),
      UnoCSS()
    ],
    // 添加ESM构建配置
    build: {
      target: 'esnext'
    }
  };
});
