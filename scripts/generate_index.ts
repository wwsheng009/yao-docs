import fs from 'node:fs';
import path from 'node:path';
import {
  BaseDocPath,
  GetFilesUnderFolder,
  IgnoreIndexFiles,
  loadExcludeConfig,
  ExcludeRuleMatcher,
  type ExcludeConfig
} from './generate_config';

export function CreateIndexMd(baseDir: string, excludeConfig?: ExcludeConfig) {
  const config = excludeConfig || loadExcludeConfig();
  checkAndCreateIndex(baseDir, config);

  const checkFolder = (d: string) => {
    // 检查目录是否应该被排除
    if (ExcludeRuleMatcher.shouldExcludeDirectory(d, config, baseDir)) {
      console.log(`目录已排除: ${d}`);
      return;
    }

    const files = fs.readdirSync(d);
    files.forEach((file) => {
      const filePath = path.join(d, file);
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        checkFolder(filePath);
        checkAndCreateIndex(filePath, config);
      }
    });
  };
  checkFolder(baseDir);
}
/**
 * check and create index.md file under folder
 * @param {string} folderp folder path
 * @param {ExcludeConfig} excludeConfig 排除配置
 * @returns
 */
function checkAndCreateIndex(folderp: string, excludeConfig: ExcludeConfig) {
  const folder = path.resolve(folderp);

  if (BaseDocPath === folder) {
    return;
  }
  const FileExtensions = ['.md']; //

  const files = GetFilesUnderFolder(
    folder,
    FileExtensions,
    excludeConfig,
    BaseDocPath
  );
  // create markdown links for each file
  const fileLinks = files
    .map((file_obj) => {
      const file = file_obj.path;
      const fileName = path.basename(file);
      if (file_obj.type === 'folder') {
        const files = GetFilesUnderFolder(
          file,
          FileExtensions,
          excludeConfig,
          BaseDocPath
        );
        if (files.length === 0) {
          return null;
        }

        if (IgnoreIndexFiles.includes(fileName)) {
          return null;
        }
        const f = path.join(folderp, fileName, 'index.md');
        if (!fs.existsSync(f)) {
          return null;
        }
        // 对文件名中的特殊字符进行URL编码，保留中文字符
        const encodedFileName = fileName.replace(
          /[\s\(\)\[\]\{\}\'\"\`\~\!\@\#\$\%\^\&\*\+\=\|\\\<\>\?\,\.\;\/]/g,
          (match) => encodeURIComponent(match)
        );
        return `- [${fileName}](${encodedFileName}/index)`;
      } else {
        if (IgnoreIndexFiles.includes(fileName)) {
          return null;
        }

        const nameWithoutExt = path.parse(fileName).name;
        const fileExt = path.extname(file);
        if (FileExtensions.includes(fileExt)) {
          // 对文件名中的特殊字符进行URL编码，保留中文字符
          const encodedFileName = fileName.replace(
            /[\s\(\)\[\]\{\}\'\"\`\~\!\@\#\$\%\^\&\*\+\=\|\\\<\>\?\,\.\;\/]/g,
            (match) => encodeURIComponent(match)
          );
          return `- [${nameWithoutExt}](${encodedFileName})`;
        }
      }
      return null;
    })
    .filter((link) => link != null); // filter out undefined links

  const folerBase = path.basename(folder);
  if (fileLinks.length === 0) {
    return;
  }

  // create README markdown content
  const linksContent = `<!-- links begin -->
${fileLinks.join('\n')}
<!-- links end -->`;

  const readmeContent = `# ${folerBase}

${linksContent}`;

  const indexFile1 = 'index.md';
  const indexPath = path.join(folder, indexFile1); // replace with your desired README path

  // 如果已经存在，判断是否相同
  if (fs.existsSync(indexPath)) {
    const existingContent = fs.readFileSync(indexPath, 'utf-8');
    const linkPattern = /<!-- links begin -->([\s\S]*?)<!-- links end -->/;
    const hasLinks = linkPattern.test(existingContent);

    let newContent = '';
    if (hasLinks) {
      // 替换已存在的链接部分
      newContent = existingContent.replace(linkPattern, linksContent);
    } else {
      // 在文件末尾添加链接
      newContent = existingContent.trim() + '\n\n' + linksContent;
    }

    if (newContent === existingContent) {
      return;
    }

    fs.writeFileSync(indexPath, newContent);
    console.log(`${indexFile1} file updated at ${folder}`);
    return;
  }
  // write README file
  fs.writeFile(indexPath, readmeContent, (err) => {
    if (err) {
      throw err;
    }
    console.log(`${indexFile1} file created at ${folder}`);
  });
}

CreateIndexMd(BaseDocPath);
