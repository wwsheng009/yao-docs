# sui项目中使用flowbite

在sui项目中使用tailwindcss 4与flowbite

## 安装pnpm

```sh
npm install -g pnpm
```

在sui模板目录下初始pnpm配置

```ps
cd /data/templates/default
pnpm init
```

## 安装tailwindcss 4与flowbite

```sh
pnpm add -D tailwindcss @tailwindcss/cli flowbite @tailwindcss/typography flowbite-typography

# 复制flowbite的js文件到sui项目的__assets/js目录下
cp ./node_modules/flowbite/dist/flowbite.min.js ./__assets/js/flowbite.min.js
```

## 配置tailwindcss

注意，tailwindcss 4.x 可以直接在css文件中进行配置。

创建tailwindcss input CSS配置文件：`./__assets/css/tailwind.css`

- 使用tailwindcss 4
- 使用flowbite
- 使使用插件flowbite-typography
- 使用插件@tailwindcss/typography
- 使用dark模式
- 使用自定义主题
- 使用自定义主题变量

`input.css`文件内容如下：

```css
@import 'tailwindcss';

@plugin "flowbite/plugin";
@source "../../node_modules/flowbite";

@plugin "flowbite-typography";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;
  --color-primary: #1d4ed8;
  --color-danger-50: #ffe5e5;
  --color-danger-100: #ffcccc;
  --color-danger-200: #ffb2b2;
  --color-danger-300: #ff8080;
  --color-danger-400: #ff4d4d;
  --color-danger-500: #ff1a1a;
  --color-danger-600: #e60000;
  --color-danger-700: #b30000;
  --color-danger-800: #800000;
  --color-danger-900: #4d0000;
  --color-danger-950: #260000;
  --color-danger: #d40518;
  --color-info-50: #e3f2fd;
  --color-info-100: #bbdefb;
  --color-info-200: #90caf9;
  --color-info-300: #64b5f6;
  --color-info-400: #42a5f5;
  --color-info-500: #2196f3;
  --color-info-600: #1e88e5;
  --color-info-700: #1976d2;
  --color-info-800: #1565c0;
  --color-info-900: #0d47a1;
  --color-info-950: #0a356f;
  --color-info: #2196f3;
  --color-success-50: #e8f5e9;
  --color-success-100: #c8e6c9;
  --color-success-200: #a5d6a7;
  --color-success-300: #81c784;
  --color-success-400: #66bb6a;
  --color-success-500: #4caf50;
  --color-success-600: #43a047;
  --color-success-700: #388e3c;
  --color-success-800: #2e7d32;
  --color-success-900: #1b5e20;
  --color-success-950: #123813;
  --color-success: #4caf50;
  --color-warning-50: #fff8e1;
  --color-warning-100: #ffecb3;
  --color-warning-200: #ffe082;
  --color-warning-300: #ffd54f;
  --color-warning-400: #ffca28;
  --color-warning-500: #ffc107;
  --color-warning-600: #ffb300;
  --color-warning-700: #ffa000;
  --color-warning-800: #ff8f00;
  --color-warning-900: #ff6f00;
  --color-warning-950: #b74e00;
  --color-warning: #ffc107;
}

@layer base {
  @variant dark {
    --color-primary-50: #eff6ff;
    --color-primary-100: #dbeafe;
    --color-primary-200: #bfdbfe;
    --color-primary-300: #93c5fd;
    --color-primary-400: #60a5fa;
    --color-primary-500: #3b82f6;
    --color-primary-600: #2563eb;
    --color-primary-700: #1d4ed8;
    --color-primary-800: #1e40af;
    --color-primary-900: #1e3a8a;
    --color-primary-950: #172554;
    --color-primary: #1d4ed8;
    --color-danger-50: #ffe5e5;
    --color-danger-100: #ffcccc;
    --color-danger-200: #ffb2b2;
    --color-danger-300: #ff8080;
    --color-danger-400: #ff4d4d;
    --color-danger-500: #ff1a1a;
    --color-danger-600: #e60000;
    --color-danger-700: #b30000;
    --color-danger-800: #800000;
    --color-danger-900: #4d0000;
    --color-danger-950: #260000;
    --color-danger: #d40518;
    --color-info-50: #e3f2fd;
    --color-info-100: #bbdefb;
    --color-info-200: #90caf9;
    --color-info-300: #64b5f6;
    --color-info-400: #42a5f5;
    --color-info-500: #2196f3;
    --color-info-600: #1e88e5;
    --color-info-700: #1976d2;
    --color-info-800: #1565c0;
    --color-info-900: #0d47a1;
    --color-info-950: #0a356f;
    --color-info: #2196f3;
    --color-success-50: #e8f5e9;
    --color-success-100: #c8e6c9;
    --color-success-200: #a5d6a7;
    --color-success-300: #81c784;
    --color-success-400: #66bb6a;
    --color-success-500: #4caf50;
    --color-success-600: #43a047;
    --color-success-700: #388e3c;
    --color-success-800: #2e7d32;
    --color-success-900: #1b5e20;
    --color-success-950: #123813;
    --color-success: #4caf50;
    --color-warning-50: #fff8e1;
    --color-warning-100: #ffecb3;
    --color-warning-200: #ffe082;
    --color-warning-300: #ffd54f;
    --color-warning-400: #ffca28;
    --color-warning-500: #ffc107;
    --color-warning-600: #ffb300;
    --color-warning-700: #ffa000;
    --color-warning-800: #ff8f00;
    --color-warning-900: #ff6f00;
    --color-warning-950: #b74e00;
    --color-warning: #ffc107;
  }
}
```

## 配置构建命令

- 使用nodejs 进行构建

更新package.json,增加tailwindcss的构建命令。

- dev: 开发模式, 自动编译，会自动的扫描文件变化，自动编译。
- build: 生产模式, 编译一次，不会自动扫描文件变化。

```json
{
  "scripts": {
    "dev": "tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --watch --minify",
    "build": "tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --minify"
  },
  "packageManager": "pnpm@10.4.1",
  "devDependencies": {
    "@tailwindcss/cli": "^4.1.8",
    "@tailwindcss/typography": "^0.5.16",
    "flowbite": "^3.1.2",
    "flowbite-typography": "^1.0.5",
    "tailwindcss": "^4.1.8"
  }
}
```

- 使用`yao sui build` 构建sui项目。

更新sui 模板配置文件`template.json`，增加自定义构建的命令。

- before:build: 构建前执行
- after:build: 构建后执行
- build:complete: 构建成功后执行，构建过程无错误。

```json
{
  "scripts": {
    "before:build": [
      { "type": "process", "content": "scripts.build.Before" },
      {
        "type": "command",
        "content": "pnpx @tailwindcss/cli -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --minify"
      }
    ],
    "after:build": [{ "type": "process", "content": "scripts.build.After" }],
    "build:complete": [
      { "type": "process", "content": "scripts.build.Complete" }
    ]
  }
}
```

创建自定义构建脚本`build.ts`，在这里可以作一些自定义的构建处理。

```ts
import { FS } from '@yao/runtime';
import { Locale } from '@yao/sui';
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

更新文件`__doucument.html`。

- 需要引入tailwindcss的css文件即可，此文件是在构建时自动生成的。
- 需要引入flowbite的js文件。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="{{ description }}" />
    <title>{{ title }}</title>
    <link href="@assets/css/light.css" type="text/css" rel="stylesheet" />
    <link href="@assets/css/dark.css" type="text/css" rel="stylesheet" />
    <!-- FAV LOGO -->
    <link href="@assets/css/tailwind.min.css" rel="stylesheet" />
  </head>
  <body>
    <main class="relative bg-transparent">{{ __page }}</main>

    <!-- JAVASCRIPTS -->
    <script src="@assets/js/flowbite.min.js"></script>
  </body>
</html>
```

注意tailwindcss3.x与4.x版本在安装上不同：

tailwindcss 3.x

```bash
pnpm install tailwindcss
pnpx tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --watch
```

tailwindcss 4.x

```bash
pnpm install tailwindcss @tailwindcss/cli
pnpx @tailwindcss/cli -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --watch
```
