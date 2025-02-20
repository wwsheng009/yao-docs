# xgen 自定义远程控件

通过自定义远程控件，可以在一定程序上扩展`xgen`的展现能力。它的原理是使用的`react`的远程加载控件功能。

自定义的远程控件会存在在服务器上，在`table`或是`form`中配置控件类型为`"public/"`,这一类型的控件会在界面初始化时远程加载

## 操作过程

在应用的目录下创建目录`components`，每一个控件单独占用一个子目录，比如创建一个新的控件`Test`,目录结构如下：

```sh
components/Test/index.tsx
components
        Test
            index.tsx
```

在`index.tsx`文件里编写控件的实现逻辑，只要是`react`控件即可

```ts
interface IProps {
  __value: string;
}

const Index = (props: IProps) => {
  const { __value } = props;
  if (!__value) return <span>-</span>;

  return <span style={{ color: 'red' }}>{__value}</span>;
};

export default Index;
```

开发环境准备`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "skipLibCheck": true,
    "lib": ["ESNEXT", "DOM"],
    "moduleResolution": "Node",
    "declaration": true,
    "emitDeclarationOnly": true,
    "strict": true,
    "outDir": "public/components",
    "suppressImplicitAnyIndexErrors": true,
    "baseUrl": ".",
    "esModuleInterop": true,
    "paths": { "@/*": ["./components/*"] },
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "jsx": "react-jsx"
  },
  "include": ["components"]
}
```

`rollup`配置`rollup.common.ts`

需要注意的是这里的配置项

配置中的`input`是指需要打包的文件的路径，所有需要打包的控件都写入`external`,配置的是控件的外部依赖项，在后面还要处理

由于`xgen`中动态引用控件使用的是`systemjs`,所以这里的`rollup`的打包输出格式也使用`systemjs`

```ts
import { defineConfig } from 'rollup';

import { nodeResolve } from '@rollup/plugin-node-resolve';

export const plugins = [nodeResolve()];

export default defineConfig({
  input: ['components/Test/index.tsx', 'components/A/index.ts'],
  output: {
    dir: 'public/components',
    preserveModules: true,
    format: 'systemjs',
  },
  external: ['antd', 'react', 'react-dom', 'react/jsx-runtime'],

  // When using tsyringe, this item needs to be set
  context: 'false',
});
```

`rollup`开发打包配置`rollup.dev.ts`

```ts
import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';

import config, { plugins } from './rollup.common';

export default defineConfig({
  ...config,
  plugins: [...plugins, swc()],
});
```

`rollup`生成打包配置,`rollup.build.ts`
生成生产库，最小化文件

```ts
import { defineConfig } from 'rollup';
import del from 'rollup-plugin-delete';
import { defineRollupSwcMinifyOption, minify, swc } from 'rollup-plugin-swc3';

import config, { plugins } from './rollup.common';

export default defineConfig({
  ...config,
  plugins: [
    ...plugins,
    swc(),
    minify(
      defineRollupSwcMinifyOption({
        compress: { drop_console: false },
      }),
    ),
    del({ targets: 'dist/*' }),
  ],
});
```

为了让控件能成功编译，还需要在配置文件`package.json`里增加打包操作,注意，这里增加了`antd`控件库的依赖

```json
{
  "name": "xgen-dev-app",
  "version": "1.0.0",
  "description": "",
  "keywords": [],
  "author": "Wendao",
  "license": "Apache-2.0",
  "scripts": {
    "dev": "rollup --config rollup.dev.ts --configPlugin swc3 -w",
    "build": "rollup --config rollup.build.ts --configPlugin swc3"
  },
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.0.1",
    "@swc/core": "^1.3.23",
    "@types/react": "^18.0.26",
    "@types/react-dom": "^18.0.9",
    "rollup": "^3.7.5",
    "rollup-plugin-delete": "^2.0.0",
    "rollup-plugin-swc3": "^0.8.0"
  },
  "dependencies": {
    "antd": "4.24.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

## 远程控件的原理

`xgen`在加载控件时会判断控件名称是否以`"public/"`为前缀，如果是的话，会作为远程控件加载。

控件的动态加载,`packages/xgen/components/x/index.tsx`

```ts
import { message } from 'antd';
import { lazy, Suspense, useMemo } from 'react';

import type { Global } from '@/types';

type ComponentsType = 'base' | 'edit' | 'view' | 'chart' | 'group' | 'optional';

interface IProps {
  type: ComponentsType;
  name: string;
  props: Global.AnyObject;
}

const Index = ({ type, name, props }: IProps) => {
  const Component = useMemo(() => {
    if (name.startsWith('public/')) {
      const { origin } = window.location;
      const component_name = name.replace('public/', '');

      return lazy(() =>
        // @ts-ignore
        System.import(`${origin}/components/${component_name}/index.js`).catch(
          () => {
            message.error(
              `Component is not exist, type:'${type}' name:'${name}'`,
            );
          },
        ),
      );
    }

    return lazy(() =>
      import(`@/components/${type}/${name}`).catch(() => {
        message.error(`Component is not exist, type:'${type}' name:'${name}'`);
      }),
    );
  }, [type, name]);

  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  );
};

export default window.$app.memo(Index);
```

由于增加了`antd`控件库，还需要修改`xgen`的另外一个地方,要不然会提示错误，如果引用了其它库，也需要在这里作映射。

```ts
//packages/xgen/utils/preset/system_modules.ts
import React from 'react';
import ReactDom from 'react-dom';
import ReactDomClient from 'react-dom/client';
import JsxRuntime from 'react/jsx-runtime';
import * as antd from 'antd'; //为了方便导入所有的控件

System.set('app:react', { default: React, __useDefault: true });
System.set('app:react/jsx-runtime', { ...JsxRuntime });
System.set('app:react-dom', { default: ReactDom, __useDefault: true });
System.set('app:react-dom/client', {
  default: ReactDomClient,
  __useDefault: true,
});

System.set('app:antd', { ...antd }); //注册所有的antd控件

System.addImportMap({
  imports: {
    react: 'app:react',
    'react/jsx-runtime': 'app:react/jsx-runtime',
    'react-dom': 'app:react-dom',
    'react-dom/client': 'app:react-dom/client',
    antd: 'app:antd', //增加antd外部依赖的映射,只有这样，生成的远程控件才能找到对应的控件
  },
});
```

这里为了方便，把`antd`所有的控件都注入框架。如果需要考虑性能问题，需要单独注入组件库。

## 演示项目

[yao-chatgpt](https://github.com/wwsheng009/yao-chatgpt/tree/main/components)
