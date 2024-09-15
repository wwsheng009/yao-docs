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
    "tsconfig-paths": "^4.2.0"
  },
  "dependencies": {
    "@yaoapps/client": "npm:yao-node-client@^1.0.8"
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

API 代理接口处理功能文件源代码`scripts/jsproxy.ts`

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

  // JSON.stringify({'a':null,'b':undefined})
  // '{"a":null}'

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

接口检查文件`scripts/security.ts`。

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

## YAO 内置对象的引用方法

在脚本文件中使用以下的语法引用类型说明

```ts
//使用别名
import { Process } from '@yao/yao';
//或者
import { Store, Studio, WebSocket } from './__types/yao';
import { Exception, Process, Query } from './__types/yao';
import { $L, FS, http, log } from './__types/yao';
```

## 编辑器准备

在调试之前，代码编辑器准备，这里使用的是 vscode。

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
