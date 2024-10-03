# 使用 npm 库

如果在 yao 应用中能引用 npm 开发库，将大大的提高 yao 应用中 js 脚本扩展性。可以直接利用很多现有的库。

## 前提要求：

package.json 需要使用 `npm` 或是 `yarn` 安装而不是 `pnpm`, 原因是 `pnpm` 使用了软链接进行开发包缓存，目前 esbuild 无法正常工作。

yao 内置 esbuild 编译是使用的格式`FormatIIFE`,不是 esm 也不是 commonjs。原因是每一个入口文件都是一个模块，所有导入的模块都会编译入单一文件。

这里的说的操作并不是 yao 官方发布的功能，只是个人研究学习，不保证功能的稳定性。

## 限制条件

- 只能使用 js 纯算法库，如果在库中使用了 nodejs 的内置对象，并不能在 yao 中使用，因为 yao 的 js 引擎并不直接支持这些操作。
- 不要使用异步操作，yao 的 js 引擎使用的是 v8go,是嵌入到 golang 中的对象，只在单线程中运行。
- 脚本中不能判断 windows,process,global,self 对象。yao 中并没有这些对象。
- 如果需要操作文件，网络请求，可以使用 yao 本身的内置对象，比如 FS，http，Store，Process 等等。

演示：

```sh
npm install @zxcvbn-ts/core
npm install dayjs
npm install es-toolkit
npm install lodash-es
npm install radash

# 或是使用yarn
yarn add @zxcvbn-ts/core
yarn add dayjs
yarn add es-toolkit
yarn add lodash-es
yarn add radash
```

```js
import { Process } from '@yaoapps/client';
import { default as countBy } from 'lodash-es/countBy.js';
import { default as keyBy } from 'lodash-es/keyBy';

import dayjs from 'dayjs';
import { zxcvbn } from '@zxcvbn-ts/core';

import { keys } from 'radash';

import { sum } from 'es-toolkit';

/**
 * yao run scripts.tests.lodash.test
 */
function test() {
  console.log(countBy([6.1, 4.2, 6.3], Math.floor));
  // => { '4': 1, '6': 2 }
  console.log(countBy(['one', 'two', 'three'], 'length'));
  const data = Process('models.admin.user.get', {});
  console.log(keyBy(data, 'email'));
  console.log(dayjs('2018-08-08'));
  console.log(dayjs().add(1, 'year')); //'2018-08-08'));
  console.log(zxcvbn('12#133%&*3').score);
  console.log(keys(data[0]));
  console.log(sum([1, 2, 3]));
}
```

## 支持导入的工具库

- lodash-es
- underscore,支持
- dayjs，支持导入。
- radash，支持导入，radash 同时支持 cjs 与 esm,程序会根据`package.json`配置优先使用`module`配置入口。
- @zxcvbn-ts，支持导入。
- es-toolkit, 支持导入。纯 typescript 项目
- cytoscape, 支持 headless 模式
- mathjs,支持
- crossfilter,支持,https://github.com/square/crossfilter
- d3,支持
- pandas-js，支持

## 不支持的

- crypto-js, 不支持导入。这是一个 cjs 项目，里面需要引用浏览器或是 nodejs 的本地功能，也有，无法导入。
- danfojs/danfojs-node,不支持导入，里面判断了全局对象
- dataframe-js，无法导入，无法解析 child_process/fs/url/http/https 对象
- papaparse,无法导入，使用 stream 对象。

## 测试项目

https://github.com/wwsheng009/yao-typescript-demo

## 建议

不要使用功能库 lodash，而是使用它的替代库`lodash-es`，只导入有需要的库，减少编译文件的大小。

## yao 源代码调整

https://github.com/wwsheng009/gou/commit/0ec6d9f57b7a168f1699878d378112479065acd3

## 原理

调整 Yao 内部 esbuild 编译器的处理逻辑，增加加载`node_modules`目录的代码的功能。

通过 esbuild on-load 事件加载其它的引用的代码：https://esbuild.github.io/plugins/#on-load
