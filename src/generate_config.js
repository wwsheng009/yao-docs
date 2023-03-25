const fs = require("fs");
const path = require("path");
const { stringify } = require("querystring");

const basePath = path.resolve("./docs");

const template = {
  title: "Yao Docs",
  base: "/yao-docs/",
  themeConfig: {
    siteTitle: "Yao Documents",
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
function checkIsIndexFile(filePath) {
  return filePath.toLowerCase() === "index.md";
}
function checkIsMdFile(filePath) {
  const ext = path.extname(filePath);
  return ext === ".md";
}
function getReletivePaht(filepath) {
  filepath = filepath.replace(basePath, "");
  filepath = filepath.slice(0, -3); //remove .md
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

  let getFile = (parent, d) => {
    let files = fs.readdirSync(d);

    files = sortFiles(d, files);

    files.forEach(function (file) {
      const filePath = d + "/" + file;
      const fileStat = fs.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        let folder = { text: file, collapsed: true, items: [] };
        getFile(folder.items, filePath);
        if (folder.items.length > 0) {
          //empty folder
          parent.push(folder);
        }
      } else {
        if (checkIsMdFile(filePath) && !checkIsIndexFile(file)) {
          parent.push({
            text: file.slice(0, -3),
            link: getReletivePaht(filePath),
          });
        }
      }
    });
  };
  getFile(filesall, dir);
  return filesall;
}

function firstLevelFoler(basePath) {
  let folders = fs
    .readdirSync(basePath)
    .filter(
      (folder) =>
        !(
          folder.startsWith(".") ||
          folder.startsWith("_") ||
          folder.endsWith(".md") ||
          folder == "public"
        )
    );
  return folders;
}
function CreateConfig() {
  let folders = firstLevelFoler(basePath);

  let nav = folders.reduce(
    (total, item) => total.concat({ text: item, link: `/${item}/` }),
    []
  );
  let sidebar = {};
  folders.map(
    (item) => (sidebar[`/${item}/`] = getAllMdFiles(path.join(basePath, item)))
  );

  template.themeConfig.nav = nav;
  template.themeConfig.sidebar = sidebar;

  // syntax needed by vitepress
  const prepend = `export default `;
  fs.writeFileSync(
    path.join(basePath, "/.vitepress/config.js"),
    prepend + JSON.stringify(template, null, 4)
  );
  console.log("generated sidebar");
}
module.exports = CreateConfig;
