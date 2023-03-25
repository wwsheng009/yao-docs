const fs = require("fs");
const path = require("path");
const { stringify } = require("querystring");

const basePath = path.resolve("./docs");

const auto_created_index_file = "index";

const auto_created_index_file_name = auto_created_index_file + ".md";

const configTemplate = {
  title: "Yao学习笔记",
  base: "/yao-docs/",
  themeConfig: {
    siteTitle: "Yao学习笔记",
    nav: [
      // {
      //   text: 'Dropdown Menu',
      //   items: [
      //     { text: 'Item A', link: '/item-1' },
      //     { text: 'Item B', link: '/item-2' },
      //     { text: 'Item C', link: '/item-3' }
      //   ]
      // },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/wwsheng009/yao-docs" },
    ],

    sidebar: {},

    footer: {
      message: "Released under the MIT License.",
    },
  },
};
/**
 * check  is the index.md ?
 * @param {string} filePath file name
 * @returns boolean
 */
function checkIsIndexFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  return base == auto_created_index_file_name;
}
/**
 * check is md file?
 * @param {string} filePath file path
 * @returns boolean
 */
function checkIsMdFile(filePath) {
  const ext = path.extname(filePath);
  return ext === ".md";
}
function getFileRelativePath(filepath) {
  filepath = filepath.replace(basePath, "");
  const fileExt = path.extname(filepath);
  filepath = filepath.slice(0, 0 - fileExt.length); //remove extension
  return filepath;
}

function sortFiles(d, files) {
  folder_list = [];
  file_list = [];

  files.forEach(function (file) {
    const filePath = d + "/" + file;
    const fileStat = fs.lstatSync(filePath);

    if (fileStat.isDirectory()) {
      folder_list.push(file);
    } else {
      file_list.push(file);
    }
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
function getAllMdFiles(dir) {
  let filesall = [];

  checkAndCreateIndex(dir);
  let addFiles = (parent, d) => {
    let files = fs.readdirSync(d);

    files = sortFiles(d, files);

    files.forEach(function (file) {
      const filePath = path.join(d, file);
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        let folder = {
          text: file,
          collapsed: true,
          items: [],
          link: filePath.replace(basePath, "") + "/", //; + auto_created_index_file,
          //should end with "/"
        };
        addFiles(folder.items, filePath);
        if (folder.items.length > 0) {
          //empty folder
          parent.push(folder);
        }
        //create index.md under the folder
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
function getFilesUnderFolder(folderPath, fileExtensions = []) {
  let files = [];
  const items_list = fs
    .readdirSync(folderPath)
    .filter(
      (folder) =>
        !(
          folder.startsWith(".") ||
          folder.startsWith("_") ||
          folder.endsWith("index.md") ||
          folder.endsWith(".bak")
        )
    );

  const containsMdFile = items_list.some((str) => str.endsWith(".md"));
  if (!containsMdFile) {
    console.log(`${folderPath} Don't cantain any md file!`);
    return [];
  }

  let items = sortFiles(folderPath, items_list);

  items.forEach((item) => {
    const itemPath = path.join(folderPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      files.push({ type: "folder", path: itemPath });
    } else {
      const fileExt = path.extname(itemPath);
      if (fileExtensions.includes(fileExt)) {
        files.push({ type: "file", path: itemPath });
      }
    }
  });
  return files;
}
/**
 * check and create index.md file under folder
 * @param {string} folderp folder path
 * @returns
 */
function checkAndCreateIndex(folderp) {
  const folder = path.resolve(folderp);

  // if (basePath === folder) {
  //   console.log("root index.md should not be overwite!!,return!");
  //   return;
  // }
  const fileExtensions = [".md"]; // replace with your desired file extensions

  const files = getFilesUnderFolder(folder, fileExtensions);

  // create markdown links for each file
  const fileLinks = files
    .map((file_obj) => {
      let file = file_obj.path;
      const fileName = path.basename(file);

      if (file_obj.type == "folder") {
        const files = getFilesUnderFolder(file, fileExtensions);
        if (files.length == 0) {
          return;
        }
        if (fileName === auto_created_index_file) {
          return;
        }
        return `- [${fileName}](${encodeURIComponent(
          fileName + "/" + auto_created_index_file
        )})`;
      } else {
        if (fileName === auto_created_index_file_name) {
          return;
        }
        const nameWithoutExt = path.parse(fileName).name;
        const fileExt = path.extname(file);
        if (fileExtensions.includes(fileExt)) {
          return `- [${nameWithoutExt}](${encodeURIComponent(fileName)})`;
        }
      }
    })
    .filter((link) => link); // filter out undefined links

  const folerBase = path.basename(folder);
  if (fileLinks.length == 0) {
    return;
  }
  // create README markdown content
  const readmeContent = `# ${folerBase}\n\n${fileLinks.join("\n")}`;

  let indexPath = path.join(folder, auto_created_index_file_name); // replace with your desired README path

  //如果已经存在，判断是否相同
  if (fs.existsSync(indexPath)) {
    const file2 = fs.readFileSync(indexPath, "utf-8");
    if (readmeContent == file2) {
      return;
    } else {
      indexPath = path.join(folder, "_" + auto_created_index_file_name);
    }
  }
  // write README file
  fs.writeFile(indexPath, readmeContent, (err) => {
    if (err) throw err;
    console.log(`${auto_created_index_file_name} file created at ${indexPath}`);
  });
}

/**
 * Get folder list under path
 * @param {string} basePath base path
 * @returns array of folder list
 */
function rootFolderList(basePath) {
  let folders = fs
    .readdirSync(basePath)
    .filter(
      (folder) =>
        !(
          folder.startsWith(".") ||
          folder.startsWith("..") ||
          folder.startsWith("_") ||
          folder == "public"
        )
    );

  // Filter out non-directories
  const subfolders = folders.filter((file) => {
    return fs.statSync(path.join(basePath, file)).isDirectory();
  });
  return subfolders;
}

/**
 * Generate the vitepress config.js file under /docs folder
 */
function CreateVitePressConfig() {
  let folders = rootFolderList(basePath);

  let nav = folders.reduce(
    (total, item) =>
      total.concat({ text: item, link: `/${item}/${auto_created_index_file}` }),
    []
  );
  let sidebar = {};
  folders.map(
    (item) => (sidebar[`/${item}/`] = getAllMdFiles(path.join(basePath, item)))
  );

  configTemplate.themeConfig.nav = nav;
  configTemplate.themeConfig.sidebar = sidebar;

  // syntax needed by vitepress
  const prepend = `export default `;
  fs.writeFileSync(
    path.join(basePath, "/.vitepress/config.js"),
    prepend + JSON.stringify(configTemplate, null, 4)
  );
  console.log(
    `Generated vitepress config:${path.join(basePath, "/.vitepress/config.js")}`
  );
}

// 定义删除函数
function deleteFilesWithBakSuffix(dirPath, extension) {
  if (dirPath.startsWith(".vitepress")) {
    return;
  }

  let ext = extension ? extension : ".bak";
  console.log(extension, ext);
  // 获取目录下的所有文件和子目录
  const files = fs.readdirSync(dirPath);
  // 循环遍历每个文件和子目录
  files
    .filter(
      (file) => path.join(dirPath, file) != path.join(basePath, "index.md")
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
          console.log(`Deleted file: ${filePath}`);
        }
      }
    });
  // // 删除空目录
  // fs.rmdirSync(dirPath);
  // console.log(`Deleted directory: ${dirPath}`);
}

function CleanUp(extension) {
  deleteFilesWithBakSuffix(basePath, extension);
}
// 调用删除函数

module.exports = { CreateVitePressConfig, CleanUp };
