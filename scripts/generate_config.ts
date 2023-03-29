import fs from 'node:fs';
import path from 'node:path';

export const BaseDocPath = path.resolve('./docs');

// const ignore_index = ['index', '_index'];

export const IgnoreIndexFiles = [`index.md`, '_index.md'];

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
 * @returns
 */
function getAllMdFiles(dir: string) {
  const filesall = [];

  const addFiles = (parent: folder[], d: string) => {
    let files = fs.readdirSync(d);

    files = sortFiles(d, files);

    files.forEach((file) => {
      const filePath = path.join(d, file);
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        const folder = {
          text: file,
          collapsed: true,
          items: [],
          link: `${filePath.replace(BaseDocPath, '')}/`, // ; + auto_created_index_file,
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
            link: getFileRelativePath(filePath),
          });
        }
      }
    });
  };
  addFiles(filesall, dir);
  return filesall;
}

/**
 *  Get files from a directory
 * @param {string} folderPath folder path
 * @param {string} fileExtensions array of file extensions
 * @returns array of filenames
 */
function GetFilesUnderFolder(folderPath: string, fileExtensions: string[]) {
  const files: FileItem[] = [];
  const items_list = fs
    .readdirSync(folderPath)
    .filter(
      (folder) =>
        !(
          folder.startsWith('.') ||
          folder.startsWith('_') ||
          folder.endsWith('index.md') ||
          folder.endsWith('.bak')
        ),
    );

  const containsMdFile = items_list.some((str) => str.endsWith('.md'));
  if (!containsMdFile) {
    console.log(`${folderPath} Don't cantain any md file!`);
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
 * @returns array of folder list
 */
function rootFolderList(basePath: string) {
  const folders = fs
    .readdirSync(basePath)
    .filter(
      (folder) =>
        !(
          folder.startsWith('.') ||
          folder.startsWith('..') ||
          folder.startsWith('_') ||
          folder === 'public'
        ),
    );

  // Filter out non-directories
  const subfolders = folders.filter((file) => {
    return fs.statSync(path.join(basePath, file)).isDirectory();
  });
  const fileExtensions = ['.md']; // replace with your desired file extensions

  const noempty = subfolders.reduce((total, folder) => {
    return GetFilesUnderFolder(path.join(basePath, folder), fileExtensions)
      .length
      ? total.concat(folder)
      : total;
  }, [] as string[]);

  return noempty;
}

function rootFileList(basePath: fs.PathLike) {
  const fileList = fs
    .readdirSync(basePath)
    .filter((file) => file.endsWith('.md') && file !== 'index.md');

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

function CreateVitePressConfig() {
  const sidebar = {};

  // let files = rootFileList(basePath);
  const files = rootFileList(BaseDocPath);
  const items = files.reduce(
    (total, file) =>
      total.concat({
        text: file.slice(0, -3),
        link: getFileRelativePath(file),
      }),
    [] as NavItem[],
  );
  sidebar['/'] = items;

  const folders = rootFolderList(BaseDocPath);
  const nav = folders.reduce(
    (total, item) => total.concat({ text: item, link: `/${item}/index` }), // }
    [] as NavItem[],
  );

  folders.forEach((item) => {
    const files = getAllMdFiles(path.join(BaseDocPath, item));
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
    prepend + JSON.stringify(sidebar, null, 2),
  );
  console.log(
    `Generated vitepress config:${path.join(
      BaseDocPath,
      '/.vitepress/config.js',
    )}`,
  );

  // syntax needed by vitepress
  prepend = `// nav.ts generated by script,don't edit manually
  export default
  `;
  fs.writeFileSync(
    path.join(BaseDocPath, '/.vitepress/nav.ts'),
    prepend + JSON.stringify(nav, null, 2),
  );
}

// 调用删除函数

export { CreateVitePressConfig, GetFilesUnderFolder };
