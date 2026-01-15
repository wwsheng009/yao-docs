import fs from 'node:fs';
import path from 'node:path';

export const BaseDocPath = path.resolve('./docs');

// const ignore_index = ['index', '_index'];

export const IgnoreIndexFiles = [`index.md`, '_index.md'];

// 排除配置接口
export interface ExcludeRule {
  // 排除模式，支持通配符、正则表达式等
  pattern: string;
  // 匹配类型：'wildcard' | 'regex' | 'exact'
  type: 'wildcard' | 'regex' | 'exact';
  // 规则描述
  description?: string;
  // 是否启用
  enabled?: boolean;
}

// 排除配置
export interface ExcludeConfig {
  // 需要排除的目录规则
  directories: ExcludeRule[];
  // 需要排除的文件规则
  files: ExcludeRule[];
}

// 默认排除配置
export const DefaultExcludeConfig: ExcludeConfig = {
  directories: [
    {
      pattern: 'node_modules',
      type: 'exact',
      description: 'Node.js 依赖目录',
      enabled: true
    },
    {
      pattern: '.git',
      type: 'exact',
      description: 'Git 版本控制目录',
      enabled: true
    },
    {
      pattern: '.vitepress',
      type: 'exact',
      description: 'VitePress 配置目录',
      enabled: true
    },
    {
      pattern: 'dist',
      type: 'exact',
      description: '构建输出目录',
      enabled: true
    },
    {
      pattern: '__pycache__',
      type: 'exact',
      description: 'Python 缓存目录',
      enabled: true
    },
    {
      pattern: 'test_*',
      type: 'wildcard',
      description: '测试目录（通配符匹配）',
      enabled: true
    },
    {
      pattern: '.*_backup',
      type: 'regex',
      description: '备份目录（正则匹配）',
      enabled: true
    }
  ],
  files: [
    {
      pattern: '*.bak',
      type: 'wildcard',
      description: '备份文件（通配符匹配）',
      enabled: true
    },
    {
      pattern: '.DS_Store',
      type: 'exact',
      description: 'macOS 系统文件',
      enabled: true
    },
    {
      pattern: 'Thumbs.db',
      type: 'exact',
      description: 'Windows 缩略图文件',
      enabled: true
    },
    {
      pattern: '.*\\.tmp$',
      type: 'regex',
      description: '临时文件（正则匹配）',
      enabled: true
    },
    {
      pattern: '*.log',
      type: 'wildcard',
      description: '日志文件（通配符匹配）',
      enabled: true
    }
  ]
};

// 排除规则匹配工具类
export class ExcludeRuleMatcher {
  /**
   * 检查路径是否匹配排除规则
   * @param path 要检查的路径
   * @param rules 排除规则列表
   * @returns 是否匹配
   */
  static matchesRules(path: string, rules: ExcludeRule[]): boolean {
    return rules.some((rule) => this.matchesRule(path, rule));
  }

  /**
   * 检查路径是否匹配单个排除规则
   * @param path 要检查的路径
   * @param rule 排除规则
   * @returns 是否匹配
   */
  static matchesRule(path: string, rule: ExcludeRule): boolean {
    if (rule.enabled === false) {
      return false;
    }

    const targetPath = path.replace(/\\/g, '/'); // 统一使用正斜杠
    const pattern = rule.pattern;

    switch (rule.type) {
      case 'exact':
        return targetPath === pattern || targetPath.endsWith('/' + pattern);

      case 'wildcard':
        return this.wildcardMatch(targetPath, pattern);

      case 'regex':
        try {
          const regex = new RegExp(pattern);
          return regex.test(targetPath);
        } catch (error) {
          console.warn(`无效的正则表达式: ${pattern}`, error);
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * 通配符匹配（支持 * 和 **）
   * @param str 要匹配的字符串
   * @param pattern 通配符模式
   * @returns 是否匹配
   */
  static wildcardMatch(str: string, pattern: string): boolean {
    // 转换通配符为正则表达式
    let regexPattern = pattern
      // 转义正则特殊字符
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      // 转换通配符
      .replace(/\*/g, '[^/]*')
      .replace(/\*\*/g, '.*')
      // 确保匹配整个路径或路径段
      .replace(/\\\./g, '\\.');

    // 如果模式不包含路径分隔符，则匹配任意段
    if (!pattern.includes('/')) {
      regexPattern = `(^|/)${regexPattern}($|/)`;
    } else {
      regexPattern = `^${regexPattern}$`;
    }

    try {
      const regex = new RegExp(regexPattern);
      return regex.test(str);
    } catch (error) {
      console.warn(`通配符转换失败: ${pattern}`, error);
      return false;
    }
  }

  /**
   * 检查目录路径是否应该被排除
   * @param dirPath 目录路径
   * @param config 排除配置
   * @param baseDir 基础目录路径（用于计算相对路径）
   * @returns 是否应该排除
   */
  static shouldExcludeDirectory(
    dirPath: string,
    config: ExcludeConfig = DefaultExcludeConfig,
    baseDir?: string
  ): boolean {
    const targetPath = baseDir
      ? path.relative(baseDir, dirPath)
      : path.basename(dirPath);
    return this.matchesRules(targetPath, config.directories);
  }

  /**
   * 检查文件路径是否应该被排除
   * @param filePath 文件路径
   * @param config 排除配置
   * @param baseDir 基础目录路径（用于计算相对路径）
   * @returns 是否应该排除
   */
  static shouldExcludeFile(
    filePath: string,
    config: ExcludeConfig = DefaultExcludeConfig,
    baseDir?: string
  ): boolean {
    const targetPath = baseDir
      ? path.relative(baseDir, filePath)
      : path.basename(filePath);
    return this.matchesRules(targetPath, config.files);
  }
}

// 加载排除配置的函数
export function loadExcludeConfig(configPath?: string): ExcludeConfig {
  if (!configPath) {
    // 尝试从项目根目录加载配置文件
    const possiblePaths = [
      path.resolve(process.cwd(), 'exclude.config.json'),
      path.resolve(process.cwd(), 'docs', 'exclude.config.json'),
      path.resolve(BaseDocPath, 'exclude.config.json')
    ];

    for (const configFilePath of possiblePaths) {
      if (fs.existsSync(configFilePath)) {
        try {
          const configContent = fs.readFileSync(configFilePath, 'utf-8');
          const config = JSON.parse(configContent) as ExcludeConfig;
          console.log(`已加载排除配置文件: ${configFilePath}`);
          return config;
        } catch (error) {
          console.warn(`加载排除配置文件失败: ${configFilePath}`, error);
        }
      }
    }

    console.log('使用默认排除配置');
    return DefaultExcludeConfig;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent) as ExcludeConfig;
    console.log(`已加载排除配置文件: ${configPath}`);
    return config;
  } catch (error) {
    console.warn(`加载排除配置文件失败: ${configPath}`, error);
    console.log('使用默认排除配置');
    return DefaultExcludeConfig;
  }
}

interface NavItem {
  text: string;
  link: string;
}

interface FileItem {
  type: string;
  path: string;
}

// const configTemplate = {
//   title: 'Yao学习笔记',
//   base: '/yao-docs/',
//   themeConfig: {
//     siteTitle: 'Yao学习笔记',
//     nav: [
//       // {
//       //   text: 'Dropdown Menu',
//       //   items: [
//       //     { text: 'Item A', link: '/item-1' },
//       //     { text: 'Item B', link: '/item-2' },
//       //     { text: 'Item C', link: '/item-3' }
//       //   ]
//       // },
//     ] as NavItem[],

//     socialLinks: [
//       { icon: 'github', link: 'https://github.com/wwsheng009/yao-docs' },
//     ],

//     sidebar: {},

//     footer: {
//       message: 'Released under the MIT License.',
//     },
//   },
// };
/**
 * check  is the index.md ?
 * @param {string} filePath file name
 * @returns boolean
 */
function checkIsIndexFile(filePath: string) {
  const base = path.basename(filePath).toLowerCase();
  return IgnoreIndexFiles.includes(base);
}
/**
 * check is md file?
 * @param {string} filePath file path
 * @returns boolean
 */
function checkIsMdFile(filePath: string) {
  const ext = path.extname(filePath);
  return ext === '.md';
}
// This function takes in a filepath as a string input and returns the relative path of the file (without extension)
function getFileRelativePath(filepath: string) {
  // Replace any base path that may exist in the filepath with an empty string
  filepath = filepath.replace(BaseDocPath, '');

  // Get the extension of the file using Node.js' built-in path module
  const fileExt = path.extname(filepath);

  // Remove the extension from the filepath by taking a slice of the string from the beginning up to the length of the extension (i.e. removing the last few characters of the string)
  filepath = filepath.slice(0, 0 - fileExt.length); // remove extension

  // Return the modified filepath (relative path without extension)
  return filepath;
}
function sortFiles(d: string, files: string[]) {
  const folder_list: string[] = [];
  const file_list: string[] = [];

  files.forEach((file: string) => {
    const filePath = `${d}/${file}`;
    const fileStat = fs.lstatSync(filePath);

    if (fileStat.isDirectory()) {
      folder_list.push(file);
    } else file_list.push(file);
  });

  file_list.sort((a, b) => a[0].localeCompare(b[0]));
  folder_list.sort((a, b) => a[0].localeCompare(b[0]));

  return file_list.concat(folder_list);
}
export interface folder {
  text: string;
  collapsed?: boolean;
  items?: never[];
  link: string;
}

/**
 * 读取一个目录下所有的md文件
 * @param dir 目录
 * @param {ExcludeConfig} excludeConfig 排除配置，可选
 * @param {string} baseDir 基础目录，用于计算相对路径，可选
 * @returns
 */
function getAllMdFiles(
  dir: string,
  excludeConfig?: ExcludeConfig,
  baseDir?: string
) {
  const filesall = [];
  const config = excludeConfig || DefaultExcludeConfig;
  const effectiveBaseDir = baseDir || BaseDocPath;

  // 检查当前目录是否应该被排除
  if (
    ExcludeRuleMatcher.shouldExcludeDirectory(dir, config, effectiveBaseDir)
  ) {
    console.log(`目录已排除: ${dir}`);
    return [];
  }

  const addFiles = (parent: folder[], d: string) => {
    let files = fs.readdirSync(d);

    // 过滤掉应该排除的项目
    files = files.filter((file) => {
      const filePath = path.join(d, file);

      if (fs.statSync(filePath).isDirectory()) {
        return !ExcludeRuleMatcher.shouldExcludeDirectory(
          filePath,
          config,
          effectiveBaseDir
        );
      } else {
        return !ExcludeRuleMatcher.shouldExcludeFile(
          filePath,
          config,
          effectiveBaseDir
        );
      }
    });

    files = sortFiles(d, files);

    files.forEach((file) => {
      const filePath = path.join(d, file);
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        const folder = {
          text: file,
          collapsed: true,
          items: [],
          link: `${filePath.replace(BaseDocPath, '').replaceAll('\\', '/')}/` // ; + auto_created_index_file,
          // should end with "/"
        };
        addFiles(folder.items, filePath);
        if (folder.items.length > 0) {
          // empty folder
          parent.push(folder);
        }
        // create index.md under the folder
      } else {
        if (checkIsMdFile(filePath) && !checkIsIndexFile(file)) {
          parent.push({
            text: file.slice(0, -3),
            link: getFileRelativePath(filePath).replaceAll('\\', '/')
          });
        }
      }
    });
  };
  addFiles(filesall, dir);
  return filesall;
}

function getSubfolderCount(path: string) {
  let count = 0;
  const files = fs.readdirSync(path);
  files.forEach((file) => {
    const stats = fs.statSync(`${path}/${file}`);
    if (stats.isDirectory()) {
      count++;
    }
  });
  return count;
}

/**
 *  Get files from a directory
 * @param {string} folderPath folder path
 * @param {string} fileExtensions array of file extensions
 * @param {ExcludeConfig} excludeConfig 排除配置，可选
 * @param {string} baseDir 基础目录，用于计算相对路径，可选
 * @returns array of filenames
 */
function GetFilesUnderFolder(
  folderPath: string,
  fileExtensions: string[],
  excludeConfig?: ExcludeConfig,
  baseDir?: string
) {
  const files: FileItem[] = [];
  const config = excludeConfig || DefaultExcludeConfig;
  const effectiveBaseDir = baseDir || BaseDocPath;

  // 检查当前目录是否应该被排除
  if (
    ExcludeRuleMatcher.shouldExcludeDirectory(
      folderPath,
      config,
      effectiveBaseDir
    )
  ) {
    console.log(`目录已排除: ${folderPath}`);
    return [];
  }

  const items_list = fs
    .readdirSync(folderPath)
    .filter((item) => {
      const itemPath = path.join(folderPath, item);

      // 使用排除规则进行过滤
      if (fs.statSync(itemPath).isDirectory()) {
        return !ExcludeRuleMatcher.shouldExcludeDirectory(
          itemPath,
          config,
          effectiveBaseDir
        );
      } else {
        return !ExcludeRuleMatcher.shouldExcludeFile(
          itemPath,
          config,
          effectiveBaseDir
        );
      }
    })
    .filter(
      (folder) =>
        !(
          folder.startsWith('.') ||
          folder.startsWith('_') ||
          folder.endsWith('index.md')
        )
    );
  const subfolderCount = getSubfolderCount(folderPath);

  const containsMdFile = items_list.some((str) => str.endsWith('.md'));
  if (!containsMdFile && !subfolderCount) {
    // console.log(`${folderPath} Don't cantain any folder or md file!`);
    return [];
  }

  const items = sortFiles(folderPath, items_list);

  items.forEach((item) => {
    const itemPath = path.join(folderPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      files.push({ type: 'folder', path: itemPath });
    } else {
      const fileExt = path.extname(itemPath);
      if (fileExtensions.includes(fileExt))
        files.push({ type: 'file', path: itemPath });
    }
  });
  return files;
}

/**
 * Get folder list under path
 * @param {string} basePath base path
 * @param {ExcludeConfig} excludeConfig 排除配置，可选
 * @returns array of folder list
 */
function rootFolderList(basePath: string, excludeConfig?: ExcludeConfig) {
  const config = excludeConfig || DefaultExcludeConfig;
  const folders = fs.readdirSync(basePath).filter((folder) => {
    const folderPath = path.join(basePath, folder);

    // 使用排除规则进行过滤
    if (
      fs.statSync(folderPath).isDirectory() &&
      ExcludeRuleMatcher.shouldExcludeDirectory(folderPath, config, basePath)
    ) {
      return false;
    }

    return !(
      folder.startsWith('.') ||
      folder.startsWith('..') ||
      folder.startsWith('_') ||
      folder === 'public'
    );
  });

  // Filter out non-directories
  const subfolders = folders.filter((file) => {
    return fs.statSync(path.join(basePath, file)).isDirectory();
  });
  const fileExtensions = ['.md']; // replace with your desired file extensions

  const noempty = subfolders.reduce((total, folder) => {
    return GetFilesUnderFolder(
      path.join(basePath, folder),
      fileExtensions,
      config,
      basePath
    ).length
      ? total.concat(folder)
      : total;
  }, [] as string[]);

  return noempty;
}

function rootFileList(basePath: fs.PathLike, excludeConfig?: ExcludeConfig) {
  const config = excludeConfig || DefaultExcludeConfig;
  const fileList = fs.readdirSync(basePath).filter((file) => {
    const filePath = path.join(basePath.toString(), file);

    // 使用排除规则过滤文件
    if (
      ExcludeRuleMatcher.shouldExcludeFile(
        filePath,
        config,
        basePath.toString()
      )
    ) {
      return false;
    }

    return file.endsWith('.md') && file !== 'index.md';
  });

  return fileList;
}

/**
 * Generate the vitepress config.js file under /docs folder
 */
// function _CreateVitePressConfigFile(): void {
//   // return CreateVitePressConfigNav()
//   const folders = rootFolderList(basePath);

//   const nav = folders.reduce(
//     (total: NavItem[], item) =>
//       total.concat({ text: item, link: `/${item}/index` }), // }
//     [] as NavItem[],
//   );
//   const sidebar = {};
//   folders.map(
//     (item) => (sidebar[`/${item}/`] = getAllMdFiles(path.join(basePath, item))),
//   );

//   configTemplate.themeConfig.nav = nav;
//   configTemplate.themeConfig.sidebar = sidebar;

//   // syntax needed by vitepress
//   const prepend = `//config.js generated by script,don't edit manually
//   export default
//   `;
//   fs.writeFileSync(
//     path.join(basePath, '/.vitepress/config.js'),
//     prepend + JSON.stringify(configTemplate, null, 4),
//   );
//   console.log(
//     `Generated vitepress config:${path.join(
//       basePath,
//       '/.vitepress/config.js',
//     )}`,
//   );
// }

function CreateVitePressConfig(excludeConfig?: ExcludeConfig) {
  const config = excludeConfig || loadExcludeConfig();
  const sidebar = {};

  // let files = rootFileList(basePath);
  const files = rootFileList(BaseDocPath);
  const items = files.reduce(
    (total, file) =>
      total.concat({
        text: file.slice(0, -3),
        link: getFileRelativePath(file)
      }),
    [] as NavItem[]
  );
  sidebar['/'] = items;

  const folders = rootFolderList(BaseDocPath);
  const nav = folders.reduce(
    (total, item) => total.concat({ text: item, link: `/${item}/index` }), // }
    [] as NavItem[]
  );

  folders.forEach((item) => {
    const files = getAllMdFiles(
      path.join(BaseDocPath, item),
      config,
      BaseDocPath
    );
    if (files.length > 0) {
      sidebar[`/${item}/`] = files;
    }
  });

  // syntax needed by vitepress
  let prepend = `// sidebar.ts generated by script,don't edit manually
  export default
  `;
  fs.writeFileSync(
    path.join(BaseDocPath, '/.vitepress/sidebar.ts'),
    prepend + JSON.stringify(sidebar, null, 2)
  );
  console.log(
    `Generated vitepress sidebar config:${path.join(
      BaseDocPath,
      '.vitepress/sidebar.ts'
    )}`
  );

  // syntax needed by vitepress
  prepend = `// nav.ts generated by script,don't edit manually
  export default
  `;
  fs.writeFileSync(
    path.join(BaseDocPath, '/.vitepress/nav.ts'),
    prepend + JSON.stringify(nav, null, 2)
  );
}

// 调用删除函数

export { CreateVitePressConfig, GetFilesUnderFolder };

// 如果直接运行脚本，生成配置文件
if (import.meta.url === `file://${process.argv[1]}`) {
  CreateVitePressConfig();
  console.log('VitePress 配置文件生成完成！');
}
