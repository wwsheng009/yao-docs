// Use async IIFE to handle dynamic imports
export default (async () => {
  const { defineConfig } = await import('vitepress');
  const { withPwa } = await import('@vite-pwa/vitepress');
  const { generateSitemap: sitemap } = await import('sitemap-ts');
  const { description, github, keywords, name, site } = await import(
    './meta.js'
  );
  const { pwa } = await import('./plugins/pwa.js');
  const sidebar = await import('./sidebar.js').then((m) => m.default);
  const nav = await import('./nav.js').then((m) => m.default);
  const socialLinks = await import('./link.js').then((m) => m.default);
  const algolia = await import('./algolia.js').then((m) => m.default);

  const base = '/yao-docs/';

  return withPwa(
    defineConfig({
      base: base,
      lang: 'zh-CN',
      pwa,
      outDir: '../dist/yao-docs',
      title: name,
      description,
      lastUpdated: true,
      useWebFonts: false,
      markdown: {
        lineNumbers: true
      },
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' }
      },
      themeConfig: {
        outline: 'deep',
        docFooter: {
          prev: '上一篇',
          next: '下一篇'
        },
        returnToTopLabel: '返回顶部',
        outlineTitle: '导航栏',
        darkModeSwitchLabel: '外观',
        sidebarMenuLabel: '归档',
        editLink: {
          pattern: `${github}/tree/main/docs/:path`,
          text: '在 GitHub 上编辑此页'
        },
        lastUpdatedText: '最后一次更新于',
        footer: {
          message: `用心去分享知识，欢迎 <a target="_blank" style="color: var(--vp-c-brand)" href="${github}">star ⭐</a> 让更多人发现`,
          copyright: `<a target="_blank" href="${github}/blob/main/LICENSE">MIT License</a> | 版权所有 © 2022-${new Date().getFullYear()} <a target="_blank" href="${github}">Yao contributors</a>`
        },
        nav,
        algolia,
        sidebar,
        socialLinks
      },
      head: [
        ['meta', { name: 'referrer', content: 'no-referrer-when-downgrade' }],
        ['meta', { name: 'keywords', content: keywords }],
        ['meta', { name: 'author', content: 'wwsheng009' }],
        ['meta', { property: 'og:type', content: 'article' }],
        ['meta', { name: 'application-name', content: name }],
        ['meta', { name: 'apple-mobile-web-app-title', content: name }],
        [
          'meta',
          { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
        ],

        // 添加更多 SEO 相关 meta 标签
        ['meta', { name: 'robots', content: 'index,follow' }],
        ['meta', { name: 'googlebot', content: 'index,follow' }],
        ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
        ['meta', { property: 'og:title', content: name }],
        ['meta', { property: 'og:site_name', content: name }],
        ['meta', { property: 'og:image', content: `${site}/og-image.png` }],
        ['meta', { name: 'twitter:image', content: `${site}/og-image.png` }],
        ['meta', { name: 'twitter:title', content: name }],
        ['meta', { name: 'twitter:description', content: description }],

        // 添加结构化数据
        [
          'script',
          { type: 'application/ld+json' },
          JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: name,
            description: description,
            url: site
          })
        ],

        ['link', { rel: 'shortcut icon', href: '/favicon.ico' }],
        ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
        ['link', { rel: 'mask-icon', href: '/logo.svg', color: '#06f' }],
        ['meta', { name: 'theme-color', content: '#06f' }],

        [
          'link',
          {
            rel: 'apple-touch-icon',
            sizes: '120x120',
            href: '/images/icons/apple-touch-icon.png'
          }
        ],

        // webfont
        ['link', { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' }],
        [
          'link',
          {
            rel: 'preconnect',
            crossorigin: 'anonymous',
            href: 'https://fonts.googleapis.com'
          }
        ],
        [
          'link',
          {
            rel: 'preconnect',
            crossorigin: 'anonymous',
            href: 'https://fonts.gstatic.com'
          }
        ],
        // og
        ['meta', { property: 'og:description', content: description }],
        ['meta', { property: 'og:url', content: site }],
        ['meta', { property: 'og:locale', content: 'zh_CN' }]
      ],
      async buildEnd() {
        await sitemap({
          hostname: site,
          changefreq: 'weekly',
          priority: 0.8,
          lastmod: new Date(),
          outDir: 'dist/yao-docs',
          robots: [{ userAgent: '*', allow: '/' }]
        });
      }
    })
  );
})();
