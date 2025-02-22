# 使用 ts 的注意事项

## ts 使用

yao 可以使用 ts 脚本进行编程，这类会更好的利用编辑器进行智能提示。

比如先在目录`/scripts/__types/yao.ts`文件中创建对下内容。

```ts
export function Process(name: string, ...args: any): any {
  return null;
}

export function Exception(message: string, code: number, ...args: any) {}

export class FS {
  constructor(name: string) {}

  ReadFileBase64(...args): string {
    return '';
  }

  WriteFileBase64(...args) {}

  ExtName(path: string): string {
    return '';
  }
}

export const time = {
  Sleep(ms: number) {}
};
```

在`scripst/demo.ts`文件中编辑以下内容。

```ts
import { Exception, time } from './__types/yao';
```

在编辑器中就会找到类型对应类型定义。

## 注意事项

需要注意的是,如果导入模块或是文件名满足以下条件，yao 引擎会把导入语句作注释处理，不会导入模块中的对象，因此只能在这些模块中定义 yao 内置对象的 ts 类型声明,不要定义自定义的函数对象，对象。

- 导入的文件或是模块有以下后缀`"/yao.ts", "/yao", "/gou", "/gou.ts"`。

- 导入模块有以下前缀`"@yao", "@yaoapps", "@yaoapp", "@gou"`。

## 使用 tsconfig.json 文件

可以在应用根目录下配置 tsconfig.json 文件。注意，配置文件不支持 include 语法。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "paths": {
      "@yao/*": ["./scripts/.types/*"],
      "@lib/*": ["./scripts/runtime/ts/lib/*"]
    },
    "lib": ["ESNEXT", "DOM"]
  }
}
```

在 ts 文件中可以使用前缀导入类型或是对象。yao 引擎在执行脚本时，把简写路径替换成文件全路径。

**注意：**，普通对象，非 yao 内置对象不要定义在后缀是`"/yao.ts", "/yao", "/gou", "/gou.ts"`的模块、文件中,前缀是`"@yao", "@yaoapps", "@yaoapp", "@gou"`的模块、文件中。因为此类模块、文件并不会在运行时导入 js 引擎。

```ts
/**
 * Demo Data
 */
import { Exception } from '@yao/yao'; //特殊后缀或是前缀，事实上不会导入模型

import { Myname2 } from '@lib/data'; //普通模块与文件，会解析到具体的文件路径。

/**
 * Demo Data
 */
function Data() {
  Exception('2', 2, 3);
  console.log(Myname2);
  return Myname2;
}
```

## 最佳实践

在文件`scripts/__types/yao`中定义 yao 内置对象的类型说明。

```ts
export function Process(name: string, ...args: any): any {
  return null;
}

export function Exception(message: string, code: number, ...args: any) {}

export class FS {
  constructor(name: string) {}

  ReadFileBase64(...args): string {
    return '';
  }

  WriteFileBase64(...args) {}

  ExtName(path: string): string {
    return '';
  }
}

export const time = {
  Sleep(ms: number) {}
};
```

引用 yao 内置对象类型

```ts
import { Process, Exception } from './__types/yao';
import { FS } from './__types/yao';
```
