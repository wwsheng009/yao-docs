import fs from 'node:fs';
import path from 'node:path';
import { BaseDocPath } from './generate_config';

function CleanUp(suffix: string) {
  deleteFilesWithBakSuffix(BaseDocPath, suffix);
}

// 定义删除函数
function deleteFilesWithBakSuffix(dirPath: string, suffix: string) {
  if (dirPath.startsWith('.vitepress')) {
    return;
  }

  const match = suffix || '.bak';
  // console.log(extension, ext);
  // 获取目录下的所有文件和子目录
  const files = fs.readdirSync(dirPath);
  // 循环遍历每个文件和子目录
  files
    .filter(
      (file) => path.join(dirPath, file) !== path.join(BaseDocPath, 'index.md'),
    )
    .forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      // 如果是目录，则递归删除子目录中的文件
      if (stat.isDirectory()) {
        deleteFilesWithBakSuffix(filePath, suffix);
      } else {
        // 如果是后缀为.bak的文件，则删除
        if (file.endsWith(match)) {
          fs.unlinkSync(filePath);
        }
        // console.log(`Deleted file: ${filePath}`)
      }
    });
  // // 删除空目录
  // fs.rmdirSync(dirPath);
  // console.log(`Deleted directory: ${dirPath}`);
}

// CleanUp();
CleanUp('index.md');
