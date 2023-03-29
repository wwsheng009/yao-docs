import fs from 'node:fs';
import path from 'node:path';
import {
  BaseDocPath,
  GetFilesUnderFolder,
  IgnoreIndexFiles,
} from './generate_config';

export function CreateIndexMd(baseDir: string) {
  checkAndCreateIndex(baseDir);

  const checkFolder = (d: string) => {
    const files = fs.readdirSync(d);
    files.forEach((file) => {
      const filePath = path.join(d, file);
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        checkFolder(filePath);
        checkAndCreateIndex(filePath);
      }
    });
  };
  checkFolder(baseDir);
}
/**
 * check and create index.md file under folder
 * @param {string} folderp folder path
 * @returns
 */
function checkAndCreateIndex(folderp: string) {
  const folder = path.resolve(folderp);

  if (BaseDocPath === folder) {
    return;
  }
  const FileExtensions = ['.md']; //

  const files = GetFilesUnderFolder(folder, FileExtensions);
  // create markdown links for each file
  const fileLinks = files
    .map((file_obj) => {
      const file = file_obj.path;
      const fileName = path.basename(file);

      if (file_obj.type === 'folder') {
        const files = GetFilesUnderFolder(file, FileExtensions);
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
        return `- [${fileName}](${encodeURIComponent(fileName)}/index)`;
      } else {
        if (IgnoreIndexFiles.includes(fileName)) {
          return null;
        }

        const nameWithoutExt = path.parse(fileName).name;
        const fileExt = path.extname(file);
        if (FileExtensions.includes(fileExt))
          return `- [${nameWithoutExt}](${encodeURIComponent(fileName)})`;
      }
      return null;
    })
    .filter((link) => link); // filter out undefined links

  const folerBase = path.basename(folder);
  if (fileLinks.length === 0) {
    return;
  }

  // create README markdown content
  const readmeContent = `# ${folerBase}\n\n${fileLinks.join('\n')}`;

  let indexFile1 = 'index.md';
  let indexPath = path.join(folder, indexFile1); // replace with your desired README path

  // 如果已经存在，判断是否相同
  if (fs.existsSync(indexPath)) {
    const file2 = fs.readFileSync(indexPath, 'utf-8');
    if (readmeContent === file2) {
      return;
    } else {
      indexFile1 = `_index.md`;
      indexPath = path.join(folder, indexFile1);
    }
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
