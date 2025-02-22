# vscode 调试 Yao

## vscode 调用 Yao 后台 API 源代码配置

### 前置条件

1. 安装 Go 语言开发环境
2. 安装 vscode 的 Go 语言插件
3. 下载 Yao 源代码到本地

### 调试配置步骤

1. 切换到 yao 源代码所在的目录
2. 在 vscode 中打开源代码目录
3. 创建或修改.vscode/launch.json 文件，添加调试配置
4. 注意修改调试配置文件中的参数 cwd 到实际的项目目录

参数设置为 start，完整的配置示例：

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
      "cwd": "/home/go/projects/yao/crm1" //需要指定测试用的项目目录
    }
  ]
}
```

### 调试注意事项

1. 确保项目目录(cwd)中包含有效的 Yao 应用配置
2. 调试时可以设置断点观察 API 请求的处理流程
3. 可以通过修改 args 参数来调试不同的命令，如：
   - `["start"]` - 启动服务
   - `["run", "scripts.test"]` - 运行指定脚本
   - `["migrate"]` - 执行数据库迁移

## xgen 框架调试

### 环境准备

1. 设置域名解析，在 host 文件中设置前端请求的代理地址解析，这样才能在调试阶段访问后端的 api：

```sh
127.0.0.1 _dev.com
```

2. 下载并安装 xgen 框架（框架是前后分离的，不需要打包到 yao 中也可以进行调试测试）：

```sh
git clone https://github.com/YaoApp/xgen
cd xgen
pnpm i
pnpm run dev
```

### 代理配置

在`/xgen-v1.0/packages/xgen/build/config.ts`中配置代理：

```js
export const proxy = {
  '/api': {
    target: 'http://_dev.com:5099',
    changeOrigin: true
  },
  '/components': {
    target: 'http://_dev.com:5099',
    changeOrigin: true
  },
  '/assets': {
    target: 'http://_dev.com:5099',
    changeOrigin: true
  },
  '/iframe': {
    target: 'http://_dev.com:5099',
    changeOrigin: true
  }
};
```

### 调试注意事项

1. 确保后端 Yao 服务已经启动并监听在正确的端口(默认 5099)
2. 检查 host 文件配置是否生效
3. 如遇到跨域问题，检查后端 CORS 配置

## inject antd 或是其它的库

如果需要在 remote 组件中使用 antd 组件，需要修改以下代码，把 antd 或是其它需要的组件 inject 到系统里。

修改文件：`/xgen-v1.0/packages/xgen/runtime.ts`

当前已经引用的库：

```js
const import_maps = {
	['react']: {
		default: React,
		...React,
		__useDefault: true
	},
	['react-dom']: {
		default: ReactDom,
		...ReactDom,
		__useDefault: true
	},
	['react-dom/client']: {
		default: ReactDomClient,
		...ReactDomClient,
		__useDefault: true
	},
	['react/jsx-runtime']: {
		...JsxRuntime
	},

	['react-shadow']: {
		default: root,
		__useDefault: true
	},
	['await-to-js']: {
		default: to,
		__useDefault: true
	},
	['ts-pattern']: {
		match,
		P
	},
	['axios']: {
		default: axios,
		__useDefault: true
	},
	['emittery']: {
		default: Emittery,
		__useDefault: true
	},
	['nanoid']: {
		nanoid
	},
	['classix']: {
		cx
	},
	['tss-react']: {
		createMakeAndWithStyles
	},
	['fast-equals']: {
		deepEqual
	},

	['tsyringe']: {
		container,
		injectable,
		singleton
	},
	['mobx']: {
		toJS,
		makeAutoObservable,
		reaction,
		autorun,
		configure
	},
	['mobx-react-lite']: {
		observer
	},

	['@antv/x6']: {
		Graph,
		Markup
	},
	['@antv/x6-react-shape']: {
		register,
		Portal
	},
	['@antv/x6-plugin-scroller']: {
		Scroller
	},
	['@antv/layout']: {
		DagreLayout
	},

	['@dnd-kit/core']: {
		DndContext,
		DragOverlay,
		PointerSensor,
		useSensor,
		useSensors
	},
	['@dnd-kit/sortable']: {
		SortableContext,
		useSortable,
		verticalListSortingStrategy,
		rectSortingStrategy,
		arrayMove
	},
	['@dnd-kit/utilities']: {
		CSS
	},

	['@editorjs/editorjs']: {
		default: EditorJS,
		__useDefault: true
	},

	['antd']: {
		ConfigProvider,
		Input,
		Form,
		Drawer,
		Popover,
		Button,
		Select,
		Table,
		Checkbox,
		Radio,
		InputNumber,
		Tooltip
	},
	['ahooks']: {
		useMemoizedFn,
		useClickAway,
		useFullscreen,
		useToggle,
		useMount,
		useDeepCompareEffect,
		useKeyPress,
		useAsyncEffect,
		useSize,
		useUpdateEffect,
		useDynamicList
	},

	['@yaoapp/storex']: {
		local,
		session
	},
	['@yaoapp/editorjs_plugins']: {
		Header,
		Image,
		Marker,
		NestedList,
		Paragraph,
		Underline
	}
} as Record<string, System.Module>
```

### 添加新的库

要添加新的库，需要：

1. 在项目中安装相应的 npm 包
2. 在 runtime.ts 中导入需要的组件
3. 在 import_maps 中添加相应的配置

注意确保添加的库与现有依赖不会产生冲突。
