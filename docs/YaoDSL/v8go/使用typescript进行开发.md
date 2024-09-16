# 使用 typescript 进行开发

使用 typescript 可以进行类型约束，在开发复杂的大型应用时会非常有用。

## 前提条件

请使用 yao 0.10.4 最新的开发版本。

使用 ts 脚本进行开发，而不是 js 脚本。

## 说明

yao 引擎并不直接支持 ts/js 的调试。折衷的方式是使用 nodejs 进行调试与测试，工作原理是在使用 nodejs 作调试时，yao 应用作为一个 web 服务器，代理了客户端的调试对象请求。

具体方法如下：

## 配置

准备工作：

应用目录下 typescript 配置文件`tsconfig.json`。

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "target": "ES2022",
    "paths": {
      "@yao/*": ["./scripts/__types/*"],
      "@lib/*": ["./scripts/runtime/ts/lib/*"]
    },
    "lib": ["ESNEXT", "DOM"],
    "outDir": "dist",
    "skipLibCheck": true,
    "sourceMap": true
  }
}
```

应用目录下 nodejs 项目管理文件`package.json`。
特别注意的是在安装 yao-node-client 时使用包别名。
对应的命令：`pnpm i "@yaoapps/client@npm:yao-node-client@^1.0.8" -D`

```json
{
  "name": "yao-init",
  "type": "commonjs",
  "version": "1.0.0",
  "description": "yao application for nodejs usage",
  "main": "index.js",
  "scripts": {},
  "keywords": [],
  "author": "vincentwwsheng@gmail.com",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^22.5.5",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0"
  },
  "dependencies": {
    "@yaoapps/client": "npm:yao-node-client@^1.1.0"
  }
}
```

执行以下命令安装依赖

```sh
pnpm i
```

yao 内置对象类型配置文件`scripts/__type/yao.ts`

```ts
import {
  Process,
  Exception,
  $L,
  FS,
  http,
  log,
  Query,
  Store,
  Studio,
  WebSocket,
} from '@yaoapps/client';

export {
  Process,
  Exception,
  $L,
  FS,
  http,
  log,
  Query,
  Store,
  Studio,
  WebSocket,
};
```

API 代理接口配置文件：`apis/proxy.http.json`

```json
{
  "name": "代理yao的请求",
  "version": "1.0.0",
  "description": "调试本地yao js脚本",
  "group": "",
  "guard": "-",
  "paths": [
    {
      "guard": "scripts.security.CheckAccessKey",
      "path": "/call",
      "method": "POST",
      "process": "scripts.jsproxy.Server",
      "in": [":payload"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    }
  ]
}
```

API 代理接口处理功能文件源代码`scripts/jsproxy.ts`，代理 nodejs 的接口请求。

```ts
//代理js api请求
import { Store, Studio, WebSocket } from './__types/yao';
import { Exception, Process, Query } from './__types/yao';
import { $L, FS, http, log } from './__types/yao';

/**
 * api 代理服务，可以放在yao应用下
 * @param {object} payload
 * @returns
 */
export function Server(payload: {
  type: string;
  method: string;
  engine?: string;
  args?: any;
  space?: any;
  key?: any;
  value?: any;
  url?: string | URL;
  protocols?: string;
  message?: any;
}) {
  // console.log("request received");
  // console.log(payload);
  // log.Info("debug served called");
  // log.Info(payload);

  let resp = {
    code: 200 as number,
    message: '' as string,
    // error: null as Error, //undefined不会出现在返回json key中
    data: null as any,
  };
  try {
    const type = payload.type;
    const method = payload.method;
    const args = payload.args;
    const space = payload.space; //"dsl","script","system"
    const engine = payload.engine;
    let localParams = [];
    if (Array.isArray(args)) {
      localParams = args;
    } else {
      localParams.push(args);
    }
    switch (type) {
      case 'Process':
        resp.data = Process(method, ...localParams);
        break;
      case 'Studio':
        // @ts-ignore
        __YAO_SU_ROOT = true;
        resp.data = Studio(method, ...localParams);
        break;
      case 'Query':
        if (engine) {
          const query = new Query(engine);
          //@ts-ignore
          resp.data = query[method](args);
        } else {
          const query = new Query();
          //@ts-ignore
          resp.data = query[method](args);
        }
        break;
      case 'FileSystem':
        const fs = new FS(space);
        //@ts-ignore
        resp.data = fs[method](...args);
        break;
      case 'Store':
        const cache = new Store(space);
        if (method == 'Set') {
          resp.data = cache.Set(payload.key, payload.value);
        } else if (method == 'Get') {
          resp.data = cache.Get(payload.key);
        }
        break;
      case 'Http':
        //@ts-ignore
        resp.data = http[method](...args);
        break;
      case 'Log':
        //@ts-ignore
        log[method](...args);
        resp.data = {};
        break;
      case 'WebSocket':
        //目前yao只是实现了push一个方法，也是ws服务连接后push一条信息
        const ws = new WebSocket(payload.url, payload.protocols);
        if (method == 'push') {
          ws.push(payload.message);
          resp.data = {};
        }
        break;
      case 'Translate':
        resp.data = $L(payload.message);
        break;
      default:
        resp.code = 500;
        resp.message = `不支持的方法调用${type}`;
    }
  } catch (error) {
    resp.code = error.code || 500;
    resp.message = error.message || '接口调用异常';
  }
  return resp;
}
```

接口检查文件`scripts/security.ts`，用于代理 api 权限检查。

```ts
import { Exception, Process } from './__types/yao';

/**
 * api guard
 * @param {string} path api path
 * @param {map} params api path params
 * @param {map} queries api queries in url query string
 * @param {object|string} payload json object or string
 * @param {map} headers request headers
 */
export function CheckAccessKey(
  path: string,
  params: any,
  queries: { [x: string]: any[] },
  payload: any,
  headers: { [x: string]: any },
) {
  var token;
  let auth = headers['Authorization'];
  if (auth) {
    token = auth[0].replace('Bearer ', '');
  }
  token = token || (queries['token'] && queries['token'][0]);
  if (!token) {
    error();
  }
  let access_key = Process('yao.env.get', 'YAO_API_ACCESS_KEY');
  if (!access_key) {
    throw new Exception('YAO_API_ACCESS_KEY Not set', 403);
  }
  if (access_key !== token) {
    error();
  }
}

function error() {
  throw new Exception('Not Authorized', 403);
}
```

环境变量配置文件`.env`。需要配置环境变量，要不然 nodejs 程序会报错。

```sh
YAO_APP_PROXY_ENDPOINT=http://localhost:5099/api/proxy/call
YAO_API_ACCESS_KEY="1234"
```

## YAO 内置对象的引用方法

在 ts 脚本文件中使用以下的语法引用 yao 内置对象的类型声明。

```ts
//使用别名
import { Process } from '@yao/yao';
//或者
import { Store, Studio, WebSocket } from './__types/yao';
import { Exception, Process, Query } from './__types/yao';
import { $L, FS, http, log } from './__types/yao';
```

## 编辑器准备

在调试之前，还需要进行代码编辑器设置，在这里使用的代码编辑器是 vscode。

`.vscode/lanch.json`

```json
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": ["<node_internals>/**"],
      "program": "${file}",
      "runtimeArgs": [
        "-r",
        "ts-node/register",
        "-r",
        "tsconfig-paths/register"
      ],
      "preLaunchTask": "tsc: build - tsconfig.json",
      "cwd": "${workspaceFolder}",
      "outFiles": [
        //"sourceMap": true
        "${workspaceFolder}/dist/**/*.js"
      ]
    }
  ]
}
```

## 调试

调试时直接选择需要调试的文件，点击 vscode 左边的调试按钮进行调用。

## 单元测试

使用 ts-jest 测试工具配置单元测试。

安装 ts-jest。

```sh
pnpm i --save-dev jest ts-jest @types/jest
```

ts-jest 的使用参考：https://blog.csdn.net/gitblog_00725/article/details/141150601

Jest 的配置文件:`jest.config.js`如下：

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // 可选择其他环境，如jsdom for browser-like tests
  roots: ['<rootDir>/src'], // 指定查找源码的根目录
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // 处理为ESM模块的扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // 配置ts-jest转译器
  },
  coverageDirectory: '<rootDir>/coverage', // 覆盖率报告存放位置
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.ts'], // 指定覆盖率收集规则
};
```

更新 package.json 文件：

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

## Eslint 安装

vscode 编辑器可以安装 jest 单元测试插件。使用 eslint9.0 进行语法检查。

```sh
pnpm add eslint @eslint/js globals typescript-eslint eslint-plugin-vue @stylistic/eslint-plugin
```

执行以下命令初始 eslint 配置文件。

```sh
npx eslint --init
```

配置文件`eslint.config.mjs`：

```js
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
// import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  {
    ignores: ['node_modules', 'dist', 'public'],
  },

  /** js推荐配置 */
  pluginJs.configs.recommended,
  /** ts推荐配置 */
  ...tseslint.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    quotes: 'double',
    semi: true,
    jsx: false,
    braceStyle: '1tbs',
    arrowParens: 'always',
  }),
  /**
   * javascript 规则
   */
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-console': 'error',
    },
  },
  { languageOptions: { globals: globals.browser } },
  /**
   * typescript 规则
   */
  {
    files: ['**/*.{ts}'],
    rules: {},
  },
  /**
   * prettier 配置
   * 会合并根目录下的prettier.config.js 文件
   * @see https://prettier.io/docs/en/options
   */
  // eslintPluginPrettierRecommended,
];
```

另外在 vscode 中也可以 prettier 进行 ts 文件格式化。

配置文件`prettier.config.js`：

```js
// prettier.config.js
/**
 * @type {import('prettier').Config}
 * @see https://www.prettier.cn/docs/options.html
 */
module.exports = {
  // 一行最多 80 字符
  printWidth: 80,
  // 使用 4 个空格缩进
  tabWidth: 2,
  // 不使用 tab 缩进，而使用空格
  useTabs: false,
  // 行尾需要有分号
  semi: true,
  // 使用单引号代替双引号
  singleQuote: true,
  // 对象的 key 仅在必要时用引号
  quoteProps: 'as-needed',
  // jsx 不使用单引号，而使用双引号
  jsxSingleQuote: false,
  // 末尾使用逗号
  trailingComma: 'all',
  // 大括号内的首尾需要空格 { foo: bar }
  bracketSpacing: true,
  // jsx 标签的反尖括号需要换行
  jsxBracketSameLine: false,
  // 箭头函数，只有一个参数的时候，也需要括号
  arrowParens: 'always',
  // 每个文件格式化的范围是文件的全部内容
  rangeStart: 0,
  rangeEnd: Infinity,
  // 不需要写文件开头的 @prettier
  requirePragma: false,
  // 不需要自动在文件开头插入 @prettier
  insertPragma: false,
  // 使用默认的折行标准
  proseWrap: 'preserve',
  // 根据显示样式决定 html 要不要折行
  htmlWhitespaceSensitivity: 'css',
  // 换行符使用 lf
  endOfLine: 'auto',
  experimentalTernaries: false,
  bracketSameLine: false,
  vueIndentScriptAndStyle: false,
  singleAttributePerLine: false,
};
```

参考：https://juejin.cn/post/7402696141495779363

**需要注意的是：在单元测试或是调试开始之前需要启动 yao 应用。**

完整的参考项目地址：https://github.com/wwsheng009/yao-init
