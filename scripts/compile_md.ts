import * as fs from 'fs';
import * as path from 'path';

// 递归获取所有 md 文件
interface CompileConfig {
  sourceDir: string;
  outputDir: string;
  outputFileName: string;
  ignoreFiles: string[];
}

const defaultConfig: CompileConfig = {
  sourceDir: path.join(__dirname, '../docs/YaoDSL'),
  outputDir: path.join(__dirname, '../docs/AI'),
  outputFileName: 'merged.md',
  ignoreFiles: ['index.md']
};

function getAllMdFiles(dir: string, ignoreFiles: string[]): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllMdFiles(fullPath, ignoreFiles));
    } else if (
      stat.isFile() &&
      item.endsWith('.md') &&
      !ignoreFiles.includes(item)
    ) {
      files.push(fullPath);
    }
  }

  return files;
}
function minifyMarkdown(markdown: string): string {
  // 分割成行
  let lines = markdown.split('\n');
  // 去除每行末尾空格，并过滤掉多余空行
  lines = lines
    .map((line) => line.trimEnd()) // 去除行尾空格
    .filter((line, index, arr) => {
      // 保留必要的空行，避免全部删除
      if (line === '' && arr[index - 1] === '') return false;
      return true;
    });
  // 重新组合
  return lines.join('\n');
}

function optimizeMarkdown(markdown: string): string {
  let lines = markdown.split('\n');
  lines = lines
    .map((line) => {
      // 将 "Title\n====" 转为 "# Title"
      if (line.match(/^=+$/) && lines[lines.indexOf(line) - 1]) {
        const title = lines[lines.indexOf(line) - 1];
        lines[lines.indexOf(line) - 1] = `# ${title}`;
        return null; // 标记删除该行
      }
      // 将 - 或 + 开头的列表转为 *
      if (line.match(/^[-+]\s/)) return line.replace(/^[-+]/, '*');
      return line;
    })
    .filter((line): line is string => line !== null);
  return lines.join('\n');
}

// 处理文件内容，移除相对路径链接并调整标题层级
function processContent(
  content: string,
  fileName: string,
  filePath: string,
  targetPath: string
): null | string {
  // 检查是否已经处理过
  if (content.includes('<!-- YAO-DOC-MERGE-PROCESSED -->')) {
    return null;
  }

  // 将原有的标题级别全部下调一级（增加一个#）
  let processedContent = content.replace(/^(#{1,6})\s/gm, '#$1 ');
  processedContent = minifyMarkdown(processedContent);
  // 计算源文件目录与目标文件的相对路径
  const sourceDir = path.dirname(filePath);
  const targetDir = path.dirname(targetPath);

  // 修正所有类型的文件链接（包括普通链接和图片链接）
  processedContent = processedContent.replace(
    /(!\[([^\]]*?)\]|\[([^\]]+)\])\((.*?)\)/g,
    (match, imgPrefix, imgAlt, text, linkPath) => {
      // 如果是外部链接（以http或https开头），保持原样
      if (linkPath.startsWith('http://') || linkPath.startsWith('https://')) {
        return match;
      }

      // 对于其他路径，先进行 URL 解码，然后使用 path.resolve
      const decodedLinkPath = decodeURIComponent(linkPath);
      const absolutePath = path.resolve(sourceDir, decodedLinkPath);

      // 检查文件是否存在，如果不存在则保持原始链接
      if (!fs.existsSync(absolutePath)) {
        return match;
      }

      // 检查文件名是否包含需要编码的特殊字符
      const needsEncoding = /[\s%?#\[\]{}|\\^~:<>]/g.test(
        path.basename(absolutePath)
      );

      // 计算从目标文件到链接文件的相对路径
      const relativePath = path.relative(targetDir, absolutePath);
      // 如果文件名包含特殊字符，对文件名部分进行 URL 编码
      const finalPath = needsEncoding
        ? relativePath
            .split('/')
            .map((part, index, arr) => {
              return index === arr.length - 1 ? encodeURIComponent(part) : part;
            })
            .join('/')
        : relativePath;
      // 使用修正后的相对路径，根据是否为图片链接返回不同格式
      return imgPrefix
        ? `![${imgAlt || ''}](${finalPath.replace(/\\/g, '/')})`
        : `[${text}](${finalPath.replace(/\\/g, '/')})`;
    }
  );

  return processedContent;
}

function compileMdFiles(config: CompileConfig = defaultConfig): string {
  const allContent: string[] = [];
  const targetPath = path.join(config.outputDir, config.outputFileName);

  // 获取所有 md 文件
  const mdFiles = getAllMdFiles(config.sourceDir, config.ignoreFiles);

  // 处理每个文件
  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const fileName = path.basename(file);
    // 处理文件内容并添加到数组中，传入文件路径和目标路径
    const processedContent = processContent(
      content,
      fileName,
      file,
      targetPath
    );
    if (processedContent) {
      allContent.push(processedContent);
    }
  }

  // 合并所有内容并添加处理标记
  return `<!-- YAO-DOC-MERGE-PROCESSED -->\n${allContent.join('\n\n')}`;
}

// 使用示例
const mergedContent = compileMdFiles();
const targetFilePath = path.join(
  defaultConfig.outputDir,
  defaultConfig.outputFileName
);

// 确保输出目录存在
const outputDirPath = defaultConfig.outputDir;
if (!fs.existsSync(outputDirPath)) {
  fs.mkdirSync(outputDirPath, { recursive: true });
}

// 如果文件存在，先删除它
if (fs.existsSync(targetFilePath)) {
  fs.unlinkSync(targetFilePath);
}
// 添加新的一级标题（使用文件名，去掉.md后缀）
const title = `# ${defaultConfig.outputFileName.replace(/.md$/, '')}\n\n`;

// 写入新的内容
fs.writeFileSync(targetFilePath, `${title}${mergedContent}`, 'utf-8');
