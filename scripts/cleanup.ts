import fs from 'node:fs';
import path from 'node:path';
import {
  BaseDocPath,
  loadExcludeConfig,
  ExcludeRuleMatcher,
  type ExcludeConfig
} from './generate_config';

function CleanUp(suffix: string, excludeConfig?: ExcludeConfig) {
  const config = excludeConfig || loadExcludeConfig();
  deleteFilesWithBakSuffix(BaseDocPath, suffix, config);
}

// 检查目录及其子目录是否包含 .md 文件
function hasMarkdownFiles(dirPath: string): boolean {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (hasMarkdownFiles(filePath)) {
        return true;
      }
    } else if (file.endsWith('.md') && file !== 'index.md') {
      return true;
    }
  }

  return false;
}

// 定义删除函数
function deleteFilesWithBakSuffix(
  dirPath: string,
  suffix: string,
  excludeConfig: ExcludeConfig
) {
  if (dirPath.startsWith('.vitepress')) {
    return;
  }

  // 检查目录是否应该被排除
  if (
    ExcludeRuleMatcher.shouldExcludeDirectory(
      dirPath,
      excludeConfig,
      BaseDocPath
    )
  ) {
    console.log(`目录已排除: ${dirPath}`);
    return;
  }

  const match = suffix || '.bak';
  const files = fs.readdirSync(dirPath);

  // 检查目录是否只包含 index.md
  const hasOnlyIndexMd = files.length === 1 && files[0] === 'index.md';
  const indexMdPath = path.join(dirPath, 'index.md');

  // 遍历处理文件和目录
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 递归处理子目录
      deleteFilesWithBakSuffix(filePath, suffix, excludeConfig);

      // 检查子目录是否为空
      const subFiles = fs.readdirSync(filePath);
      if (subFiles.length === 0) {
        fs.rmdirSync(filePath);
      }
    }
  });

  // 如果目录中只有 index.md，且匹配删除条件，则删除它
  // 或者如果目录及其子目录中没有其他 .md 文件，也删除 index.md
  if (
    (hasOnlyIndexMd && match === 'index.md') ||
    (match === 'index.md' &&
      !hasMarkdownFiles(dirPath) &&
      fs.existsSync(indexMdPath))
  ) {
    fs.unlinkSync(indexMdPath);
  }
}

// CleanUp();
CleanUp('index.md');
