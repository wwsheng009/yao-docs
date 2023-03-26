import fs from 'node:fs';
import path from 'node:path';

const basePath = path.resolve('./docs');

const auto_created_index_file = 'index';

const auto_created_index_file_name = `${auto_created_index_file}.md`;

interface NavItem {
  text: string;
  link: string;
}

interface FileItem {
  type: string;
  path: string;
}

const configTemplate = {
  title: 'Yao学习笔记',
  base: '/yao-docs/',
  themeConfig: {
    siteTitle: 'Yao学习笔记',
    nav: [
      // {
      //   text: 'Dropdown Menu',
      //   items: [
      //     { text: 'Item A', link: '/item-1' },
      //     { text: 'Item B', link: '/item-2' },
      //     { text: 'Item C', link: '/item-3' }
      //   ]
      // },
    ] as NavItem[],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wwsheng009/yao-docs' },
    ],

    sidebar: {},

    footer: {
      message: 'Released under the MIT License.',
    },
  },
};
/**
 * check  is the index.md ?
 * @param {string} filePath file name
 * @returns boolean
 */
function checkIsIndexFile(filePath: string) {
  const base = path.basename(filePath).toLowerCase();
  return base === auto_created_index_file_name;
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
  filepath = filepath.replace(basePath, '');

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
/**
 * 读取一个目录下所有的md文件
 * @param dir 目录
 * @returns
 */
function getAllMdFiles(dir: string) {
  const filesall = [];

  checkAndCreateIndex(dir);
  const addFiles = (
    parent: {
      text: string;
      collapsed?: boolean;
      items?: never[];
      link: string;
    }[],
    d: string,
  ) => {
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
          link: `${filePath.replace(basePath, '')}/`, // ; + auto_created_index_file,
          // should end with "/"
        };
        addFiles(folder.items, filePath);
        if (folder.items.length > 0) {
          // empty folder
          parent.push(folder);
        }
        // create index.md under the folder
        checkAndCreateIndex(filePath);
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
function getFilesUnderFolder(
  folderPath: string,
  fileExtensions: string[] = [],
) {
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
 * check and create index.md file under folder
 * @param {string} folderp folder path
 * @returns
 */
function checkAndCreateIndex(folderp: string) {
  const folder = path.resolve(folderp);

  // if (basePath === folder) {
  //   console.log("root index.md should not be overwite!!,return!");
  //   return;
  // }
  const fileExtensions = ['.md']; // replace with your desired file extensions

  const files = getFilesUnderFolder(folder, fileExtensions);

  // create markdown links for each file
  const fileLinks = files
    .map((file_obj) => {
      const file = file_obj.path;
      const fileName = path.basename(file);

      if (file_obj.type === 'folder') {
        const files = getFilesUnderFolder(file, fileExtensions);
        if (files.length === 0) {
          return null;
        }

        if (fileName === auto_created_index_file) {
          return null;
        }

        return `- [${fileName}](${encodeURIComponent(
          `${fileName}/${auto_created_index_file}`,
        )})`;
      } else {
        if (fileName === auto_created_index_file_name) {
          return null;
        }

        const nameWithoutExt = path.parse(fileName).name;
        const fileExt = path.extname(file);
        if (fileExtensions.includes(fileExt))
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

  let indexPath = path.join(folder, auto_created_index_file_name); // replace with your desired README path

  // 如果已经存在，判断是否相同
  if (fs.existsSync(indexPath)) {
    const file2 = fs.readFileSync(indexPath, 'utf-8');
    if (readmeContent === file2) {
      return;
    } else indexPath = path.join(folder, `_${auto_created_index_file_name}`);
  }
  // write README file
  fs.writeFile(indexPath, readmeContent, (err) => {
    if (err) {
      throw err;
    }
    console.log(`${auto_created_index_file_name} file created at ${indexPath}`);
  });
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

  const noempty = subfolders.reduce((total, folder) => {
    return getFilesUnderFolder(path.join(basePath, folder)).length
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
function _CreateVitePressConfigFile(): void {
  // return CreateVitePressConfigNav()
  const folders = rootFolderList(basePath);

  const nav = folders.reduce(
    (total: NavItem[], item) =>
      total.concat({ text: item, link: `/${item}/${auto_created_index_file}` }), // }
    [] as NavItem[],
  );
  const sidebar = {};
  folders.map(
    (item) => (sidebar[`/${item}/`] = getAllMdFiles(path.join(basePath, item))),
  );

  configTemplate.themeConfig.nav = nav;
  configTemplate.themeConfig.sidebar = sidebar;

  // syntax needed by vitepress
  const prepend = `//config.js generated by script,don't edit manually
  export default
  `;
  fs.writeFileSync(
    path.join(basePath, '/.vitepress/config.js'),
    prepend + JSON.stringify(configTemplate, null, 4),
  );
  console.log(
    `Generated vitepress config:${path.join(
      basePath,
      '/.vitepress/config.js',
    )}`,
  );
}

function CreateVitePressConfig() {
  const sidebar = {};

  // let files = rootFileList(basePath);
  const files = rootFileList(basePath);
  const items = files.reduce(
    (total, file) =>
      total.concat({
        text: file.slice(0, -3),
        link: getFileRelativePath(file),
      }),
    [] as NavItem[],
  );
  sidebar['/'] = items;

  const folders = rootFolderList(basePath);
  const nav = folders.reduce(
    (total, item) =>
      total.concat({ text: item, link: `/${item}/${auto_created_index_file}` }), // }
    [] as NavItem[],
  );

  folders.forEach((item) => {
    const files = getAllMdFiles(path.join(basePath, item));
    if (files.length > 0) {
      sidebar[`/${item}/`] = files;
    }
  });

  // syntax needed by vitepress
  let prepend = `//sidebar.ts generated by script,don't edit manually
  export default
  `;
  fs.writeFileSync(
    path.join(basePath, '/.vitepress/sidebar.ts'),
    prepend + JSON.stringify(sidebar, null, 2),
  );
  console.log(
    `Generated vitepress config:${path.join(
      basePath,
      '/.vitepress/config.js',
    )}`,
  );

  // syntax needed by vitepress
  prepend = `//nav.ts generated by script,don't edit manually
  export default
  `;
  fs.writeFileSync(
    path.join(basePath, '/.vitepress/nav.ts'),
    prepend + JSON.stringify(nav, null, 2),
  );
}

// 定义删除函数
function deleteFilesWithBakSuffix(dirPath: string, extension: string) {
  if (dirPath.startsWith('.vitepress')) {
    return;
  }

  const ext = extension || '.bak';
  // console.log(extension, ext);
  // 获取目录下的所有文件和子目录
  const files = fs.readdirSync(dirPath);
  // 循环遍历每个文件和子目录
  files
    .filter(
      (file) => path.join(dirPath, file) !== path.join(basePath, 'index.md'),
    )
    .forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      // 如果是目录，则递归删除子目录中的文件
      if (stat.isDirectory()) {
        deleteFilesWithBakSuffix(filePath, extension);
      } else {
        // 如果是后缀为.bak的文件，则删除
        if (file.endsWith(ext)) {
          fs.unlinkSync(filePath);
        }
        // console.log(`Deleted file: ${filePath}`)
      }
    });
  // // 删除空目录
  // fs.rmdirSync(dirPath);
  // console.log(`Deleted directory: ${dirPath}`);
}

function CleanUp(extension: string) {
  deleteFilesWithBakSuffix(basePath, extension);
}
// 调用删除函数

export { CreateVitePressConfig, CleanUp };
