# sui前端资源引用

## 统一的资源引用

首先需要把静态资源保存在模板目录下的子目录`__assets`下。
比如：

```sh
app
└── data
    └── templates
        └── default
            └── __assets
```

在sui页面中如果需要引用的静态文件，比如css,外部css,图片等资源，可以通过`@assets`引用资源目录。

在`yao build`编译后会自动指向`assets`目录。

```html
<meta property="og:image" content="@assets/images/icons/app.png" />
<link href="@assets/css/flowbite.min.css" rel="stylesheet" />
<script src="@assets/js/jquery.min.js"></script>
```

也可以在html页面关联的ts文件中使用import语言进行导入,同样可以使用`@assets`引用资源目录。

在ts中引用的资源文件会在文档加载后，初始化组件时动态引入。

```ts
import '@assets/js/highlight.min.js';
```

## 页面关联资源

另外一种方法是在页面同一个目录下创建关联资源，比如在页面中引用的css,js等资源。

比如有一个页面是footer.html,可以在同目录下创建footer.css文件。

```sh
footer.html
footer.css
```

css文件中的内容会在构建时，自动插入到页面中，并增加与namespace相关的scope限制。

这里需要避免局部css对全局css的污染。

[增加组件CSS scope限制](https://github.com/wwsheng009/yao/commit/5ce1880d547de17ac8e46b2b454426a3859fbf71)。

## 构建Hook

sui支持在资源构建过程中进行hook处理，有三种hook:

- `before:build`， 在页面进行构建之前调用。
- `after:build` 页面构建完成后调用。
- `build:complete` 页面构建完成后，如果没有出错调用。

支持两种回调，一种是`yao process`调用，另外一种是`command`,调用操作系统本地命令，命令的`cwd`当前目录设置成模板所在的目录。

在模板目录下的template.json中进行配置。

```json
"scripts": {
    "before:build": [
      { "type": "process", "content": "scripts.build.Before" },
      {
        "type": "command",
        "content": "npx tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --minify"
      }
    ],
    "after:build": [{ "type": "process", "content": "scripts.build.After" }],

    "build:complete": [
      { "type": "process", "content": "scripts.build.Complete" }
    ]
  }
```

示例：

- 在`before:build`中，将开发环境的资源替换成生产环境的资源。
- 在`after:build`中，将生产环境的资源替换成开发环境的资源。
- 在`build:complete`中，将生产环境的资源替换成开发环境的资源。

```ts
import { FS } from '@yao/runtime';
/**
 * Replace the Development Block with the Production Block
 * @param root
 */
function Before(root: string) {
  console.log('Build Started');
  //  Find the Development Block in  <!-- Development --> to <!-- Development END--> \n and replace it with the Production Block
  const blockRe =
    /<!-- Development -->\s*\n*([\s\S]*?)\s*<!--  Development END-->/g;

  const fs = new FS('data');
  //   backup the document
  fs.Copy(root + '/__document.html', root + '/__document.html.bak');
  const document = fs.ReadFile(root + '/__document.html');

  // Replace the Development Block with the Production Block
  const productionBlock = `<link href="@assets/css/tailwind.min.css" rel="stylesheet" />`;
  const newDocument = document.replace(blockRe, productionBlock);
  fs.WriteFile(root + '/__document.html', newDocument);
}

function After(root: string) {
  console.log('Build Done Successfully');
  // resetDocument(root);
}

function Complete(root: string) {
  console.log('Build Complete');
  resetDocument(root);
}

function resetDocument(root: string) {
  const fs = new FS('data');
  fs.Remove(root + '/__document.html');
  fs.Move(root + '/__document.html.bak', root + '/__document.html');
  fs.Remove(root + '/__document.html.bak');
}
```
