# vscode 调试 Yao

## vscode 调用 Yao 后台 API 源代码配置。

需要切换到 yao 源代码所在的目录，

注意需要修改调试配置文件中的参数 cwd 到项目目录

参数设置为 start

```json
{
  // 使用 IntelliSense 了解相关属性。
  // 悬停以查看现有属性的描述。
  // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Package",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "${workspaceFolder}/main.go",
      "args": ["start"],
      "cwd": "/home/go/projects/yao/crm1"
    }
  ]
}
```

## xgen 框架调试

设置域名解析，在 host 文件中设置前端的请求的代理地址解析，这样才能在调试阶段访问后端的 api

```sh
127.0.0.1 _dev.com
```

xgen 框架下载安装测试，框架是前后分离的，不需要打包到 yao 中也可以进行调试测试。

```sh
git clone https://github.com/YaoApp/xgen

cd xgen

pnpm i

pnpm run dev
```

参考：`/xgen-v1.0/packages/xgen/build/config.ts`

```js
export const proxy = {
  '/api': {
    target: 'http://_dev.com:5099',
    changeOrigin: true,
  },
  '/components': {
    target: 'http://_dev.com:5099',
    changeOrigin: true,
  },
  '/assets': {
    target: 'http://_dev.com:5099',
    changeOrigin: true,
  },
  '/iframe': {
    target: 'http://_dev.com:5099',
    changeOrigin: true,
  },
};
```

## inject antd 或是其它的库。

如果需要在 remote 组件中使用 antd 组件，需要动手修改下以下代码，把 antd 或是其它需要的组件 inject 到系统里。

`/xgen-v1.0/packages/xgen/utils/preset/system_modules.ts`

```js
import React from 'react';
import ReactDom from 'react-dom';
import ReactDomClient from 'react-dom/client';
import JsxRuntime from 'react/jsx-runtime';
import * as Antd from 'antd'; //为了方便导入所有的控件
import * as Ahooks from 'ahooks';

System.set('app:react', { default: React, __useDefault: true });
System.set('app:react/jsx-runtime', { ...JsxRuntime });
System.set('app:react-dom', { default: ReactDom, __useDefault: true });
System.set('app:react-dom/client', {
  default: ReactDomClient,
  __useDefault: true,
});
//需要修改
System.set('app:antd', { ...Antd }); //注册所有的antd控件
System.set('app:ahooks', { ...Ahooks });

System.addImportMap({
  imports: {
    react: 'app:react',
    'react/jsx-runtime': 'app:react/jsx-runtime',
    'react-dom': 'app:react-dom',
    'react-dom/client': 'app:react-dom/client',
    //需要修改
    antd: 'app:antd', //增加antd外部依赖的映射,只有这样，生成的远程控件才能找到对应的控件
    ahooks: 'app:ahooks',
  },
});
```
