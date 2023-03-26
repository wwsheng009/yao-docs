import { version } from '../../package.json';

// base info
export const name = 'YaoDocs';
export const site = 'https://github.com/wwsheng009/yao-docs';
export const logo = '';
export const keywords = 'yao、lowercode、coding、github';
export const description = 'Yao应用学习分享';

// social link
export const bilibili = '';
export const github = 'https://github.com/wwsheng009/yao-docs';

// docs version
export const docsVersion = version;

/* PWA runtime caching urlPattern regular expressions */
/* eslint-disable prefer-regex-literals */
export const githubSourceContentRegex = new RegExp(
  '^https://(((raw|user-images|camo).githubusercontent.com))/.*',
  'i',
);
export const googleFontRegex = new RegExp(
  '^https://fonts.googleapis.com/.*',
  'i',
);
export const googleStaticFontRegex = new RegExp(
  '^https://fonts.gstatic.com/.*',
  'i',
);
export const jsdelivrCDNRegex = new RegExp('^https://cdn.jsdelivr.net/.*', 'i');
