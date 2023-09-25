# 在 Yao 中使用外部 js 库

在 Yao 中调用外部 JavaScript 库有点麻烦。Yao 运行时使用 v8go 环境,所以在 Node.js 中使用的库不能直接在 Yao 中直接使用。

需要注意的是：在 yao 中无法使用 nodejs 中的 fs/envents/util 等模块。如果开发库中涉及到相关的功能，此库无法使用。检查的方法是在库中是否包含了 require("fs")等语句。

所以外部 js 库只能是一些纯 JavaScript 库，比如 lodash/big.js 等。无法使用 jquery。

解决方法是打包 JS。

## 使用 ESBUILD

安装

```sh
npm install --save-dev --save-exact esbuild

# 使用yarn
yarn add  -D esbuild
```

打包命令,找到入口文件。

```json
{
  "esbuild": "esbuild src/index.ts --bundle --platform=node --target=node10.4  --outfile=dist/out.js"
}
```

将 src/index.ts 文件打包成一个 Node.js 模块，并将其输出到 dist/out.js 文件中。

步骤：

将 src/index.ts 文件转换为 JavaScript 代码。这里直接支持编辑 ts 文件。

将生成的 JavaScript 代码打包成一个 Node.js 模块。

将打包后的 Node.js 模块输出到 dist/out.js 文件中。

--bundle 选项表示将输出文件打包成一个单文件模块格式（如 CommonJS 或 ESM），而不是作为一个单独的文件。这通常用于构建用于在浏览器中运行的代码。

--platform=node 选项表示使用 Node.js 作为目标平台。

--target=node10.4 选项表示将代码兼容到 Node.js 10.4 版本。这通常用于构建兼容旧版本 Node.js 的代码。

--outfile=dist/out.js 选项表示将生成的输出文件命名为 dist/out.js，并将其放在 dist 目录中。

## rollup

先下载 js 库项目的源代码。再在 js 项目中安装 rollup 工具。

用户使用 npm 安装了几个 Rollup 插件。以下是每个插件的简要说明：

- **rollup** 是 Rollup 的核心包。必须安装 Rollup 才能使用任何插件。
- **@rollup/plugin-alias** 允许您为模块导入路径创建别名。这对于创建更短、更易于阅读的导入路径非常有用。
- **@rollup/plugin-commonjs** 允许 Rollup 使用 CommonJS 模块，这是 Node.js 和许多其他库使用的一种模块格式。
- **@rollup/plugin-json** 允许 Rollup 将 JSON 文件作为模块使用。
- **@rollup/plugin-node-resolve** 帮助 Rollup 在类似 Node.js 的`node_modules`目录中查找模块依赖项。
- **@rollup/plugin-typescript** 允许 Rollup 将 TypeScript 文件作为模块使用。

```sh
npm install -D rollup
npm install -D @rollup/plugin-alias
npm install -D @rollup/plugin-commonjs
npm install -D @rollup/plugin-json
npm install -D @rollup/plugin-node-resolve
npm install -D @rollup/plugin-typescript
```

创建 rollup 配置文件`rollup.config.mjs`。

```js
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';

const __dirname = path.resolve();

// 命令行定义环境变量，在脚本中可以直接获取
// console.log(process.env.TEST);

export default {
  input: './lib/index.js',
  output: {
    file: './dist/bound.esm.js',
    sourcemap: false,
    format: 'esm',
  },

  plugins: [
    nodeResolve({ preferBuiltins: true }),
    json(),
    //路径别名
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src'),
        },
      ],
    }),
    typescript({ module: 'commonjs' }),
    commonjs({ include: 'node_modules/**' }),
  ],
  external: [], //不要打包的库匹配
};
```

如果是 `typescript` 项目，配置 `tsconfig.json`,后执行`tsc`命令。

输出 esm 模块

```json
{
  "compilerOptions": {
    "outDir": "lib",
    "allowJs": true,
    "module": "ESNext",
    "target": "ESNext",
    "declaration": false,
    "sourceMap": false,
    "newLine": "lf",
    "moduleResolution": "nodenext",
    "lib": ["ES2015", "ES2016", "ES2017"]
  },
  "include": ["src"],
  "exclude": ["lib", "node_modules"]
}
```

package.json 增加编译脚本命令

```json
{
  "scripts": {
    "build": "tsc",
    "rollupJs": "rimraf dist && rollup -c rollup.config.mjs"
  }
}
```

将打包出来的文件中的导出语句修改成`module.exports `

```js
// export {}
module.exports = {};
```

有可能一些全局函数不可用，这些函数是浏览器专用，直接设置空函数。

```js
let clearTimeout = function () {};
let setTimeout = function () {};
```

复制文件到 yao 项目的 scripts 目录。

在别的文件中引用库，使用`Require`进行引用。注意`Require`中的 R 是大写。

```js
const { defaultParser } = Require('bound');
```

测试 js 库：

https://github.com/Soontao/odata-v4-parser.git
