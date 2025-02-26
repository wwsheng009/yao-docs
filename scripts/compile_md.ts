import * as fs from 'fs';
import * as path from 'path';

// 常量定义
const CONSTANTS = {
  PROCESSED_MARKER: '<!-- YAO-DOC-MERGE-PROCESSED -->',
  FILE_ENCODING: 'utf-8',
  MARKDOWN_EXT: '.md',
  SPECIAL_CHARS_PATTERN: /[\s%?#[\]{}|\\^~:<>]/g,
  EXTERNAL_LINK_PREFIXES: ['http://', 'https://']
} as const;

// 类型定义
interface SingleCompileConfig {
  sourceDir: string;
  outputDir: string;
  outputFileName: string;
  ignoreFiles: string[];
}

interface CompileConfig {
  configs: SingleCompileConfig[];
}

interface ProcessedResult {
  content: string | null;
  error?: Error;
}

// 默认配置
const defaultConfig: CompileConfig = {
  configs: [
    {
      sourceDir: path.join(__dirname, '../docs/YaoDSL'),
      outputDir: path.join(__dirname, '../knowledge-base'),
      outputFileName: 'yao-dsl.md',
      ignoreFiles: ['index.md']
    },
    {
      sourceDir: path.join(__dirname, '../docs/入门指南'),
      outputDir: path.join(__dirname, '../knowledge-base'),
      outputFileName: '入门指南.md',
      ignoreFiles: ['index.md']
    }
  ]
};

// 工具函数
class MarkdownUtils {
  static isExternalLink(linkPath: string): boolean {
    return CONSTANTS.EXTERNAL_LINK_PREFIXES.some((prefix) =>
      linkPath.startsWith(prefix)
    );
  }

  static needsEncoding(filePath: string): boolean {
    return CONSTANTS.SPECIAL_CHARS_PATTERN.test(path.basename(filePath));
  }

  static encodePath(relativePath: string): string {
    return relativePath
      .split('/')
      .map((part, index, arr) => {
        return index === arr.length - 1 ? encodeURIComponent(part) : part;
      })
      .join('/');
  }
}

// 递归获取所有 md 文件
function getAllMdFiles(dir: string, ignoreFiles: string[]): string[] {
  try {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...getAllMdFiles(fullPath, ignoreFiles));
      } else if (
        stat.isFile() &&
        item.endsWith(CONSTANTS.MARKDOWN_EXT) &&
        !ignoreFiles.includes(item)
      ) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return [];
  }
}

function minifyMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  return lines
    .map((line) => line.trimEnd())
    .filter((line, index, arr) => !(line === '' && arr[index - 1] === ''))
    .join('\n');
}

function optimizeMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  return lines
    .map((line, index, arr) => {
      if (line.match(/^=+$/) && arr[index - 1]) {
        arr[index - 1] = `# ${arr[index - 1]}`;
        return null;
      }
      return line.match(/^[-+]\s/) ? line.replace(/^[-+]/, '*') : line;
    })
    .filter((line): line is string => line !== null)
    .join('\n');
}

// 处理文件内容
function processContent(
  content: string,
  fileName: string,
  filePath: string,
  targetPath: string
): ProcessedResult {
  try {
    if (content.includes(CONSTANTS.PROCESSED_MARKER)) {
      return { content: null };
    }

    console.log(`开始处理文件内容: ${fileName}`);
    let processedContent = content.replace(/^(#{1,6})\s/gm, '#$1 ');
    processedContent = minifyMarkdown(processedContent);

    const sourceDir = path.dirname(filePath);
    const targetDir = path.dirname(targetPath);

    processedContent = processedContent.replace(
      /(!\[([^\]]*?)\]|\[([^\]]+)\])\((.*?)\)/g,
      (match, imgPrefix, imgAlt, text, linkPath) => {
        if (
          MarkdownUtils.isExternalLink(linkPath) ||
          linkPath.startsWith('#')
        ) {
          console.log(`跳过外部链接或页内链接: ${linkPath}`);
          return match;
        }

        const decodedLinkPath = decodeURIComponent(linkPath);
        const absolutePath = path.resolve(sourceDir, decodedLinkPath);

        // 检查原始路径是否存在
        let finalAbsolutePath = absolutePath;
        if (!fs.existsSync(absolutePath)) {
          // 如果路径以 /index 结尾，尝试查找 index.md
          if (
            absolutePath.endsWith('/index') ||
            absolutePath.endsWith('\\index')
          ) {
            const indexMdPath = absolutePath + '.md';
            if (fs.existsSync(indexMdPath)) {
              finalAbsolutePath = indexMdPath;
            } else {
              console.log(`警告: 文件不存在 [${linkPath}]/${absolutePath}`);
              return match;
            }
          } else {
            console.log(`警告: 文件不存在 [${linkPath}]/${absolutePath}`);
            return match;
          }
        }

        const relativePath = path.relative(targetDir, absolutePath);
        const finalPath = MarkdownUtils.needsEncoding(absolutePath)
          ? MarkdownUtils.encodePath(relativePath)
          : relativePath;

        console.log(`处理链接: ${linkPath} -> ${finalPath}`);
        return imgPrefix
          ? `![${imgAlt || ''}](${finalPath.replace(/\\/g, '/')})`
          : `[${text}](${finalPath.replace(/\\/g, '/')})`;
      }
    );

    return { content: processedContent };
  } catch (error) {
    console.error(`处理文件 ${fileName} 时发生错误:`, error);
    return { content: null, error: error as Error };
  }
}

// 主编译函数
async function compileMdFiles(
  config: CompileConfig = defaultConfig
): Promise<void> {
  console.log('开始处理 Markdown 文件合并任务...');
  for (const singleConfig of config.configs) {
    try {
      console.log(
        `\n处理配置: ${singleConfig.sourceDir} -> ${singleConfig.outputFileName}`
      );
      const allContent: string[] = [];
      const targetPath = path.join(
        singleConfig.outputDir,
        singleConfig.outputFileName
      );

      const mdFiles = getAllMdFiles(
        singleConfig.sourceDir,
        singleConfig.ignoreFiles
      );
      console.log(`找到 ${mdFiles.length} 个 Markdown 文件待处理`);

      for (const file of mdFiles) {
        console.log(`处理文件: ${path.basename(file)}`);
        const content = fs.readFileSync(file, CONSTANTS.FILE_ENCODING);
        const fileName = path.basename(file);
        const result = processContent(content, fileName, file, targetPath);

        if (result.error) {
          console.error(`Error processing file ${fileName}:`, result.error);
          continue;
        }

        if (result.content) {
          console.log(`文件 ${fileName} 处理成功`);
          allContent.push(result.content);
        } else {
          console.log(`文件 ${fileName} 已处理过，跳过`);
        }
      }

      await ensureDirectoryExists(singleConfig.outputDir);
      await writeOutputFile(singleConfig, allContent);
      console.log(`成功写入合并文件: ${singleConfig.outputFileName}`);
    } catch (error) {
      console.error(`Error processing config:`, error);
    }
  }
  console.log('\nMarkdown 文件合并任务完成!');
}

// 辅助函数
async function ensureDirectoryExists(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}

async function writeOutputFile(
  config: SingleCompileConfig,
  content: string[]
): Promise<void> {
  const targetPath = path.join(config.outputDir, config.outputFileName);
  const title = `# ${config.outputFileName.replace(new RegExp(`${CONSTANTS.MARKDOWN_EXT}$`), '')}\n\n`;
  const mergedContent = `${CONSTANTS.PROCESSED_MARKER}\n${content.join('\n\n')}`;

  if (fs.existsSync(targetPath)) {
    await fs.promises.unlink(targetPath);
  }

  await fs.promises.writeFile(
    targetPath,
    `${title}${mergedContent}`,
    CONSTANTS.FILE_ENCODING
  );
}

// 导出函数
export { compileMdFiles, CompileConfig };

// 如果直接运行脚本
if (require.main === module) {
  compileMdFiles().catch(console.error);
}
