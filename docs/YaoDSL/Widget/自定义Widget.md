# 自定义 Widget

使用自定义 Widget 实现动态表单。

_只适用于 0.10.3 以前的版本_

在官方的网站上有一篇教程，是说如何使用创建[自建云表格](https://Yaoapps.com/doc/%E6%95%99%E7%A8%8B/%E8%87%AA%E5%BB%BA%E4%BA%91%E8%A1%A8%E6%A0%BC)

重点看这一句话。

> **Widget 支持开发者自定义**，可基于自身业务逻辑特征，自定义 DSL, 快速复制各种通用功能。本文将通过自定义 Widget 的方式，实现一套云表格系统。

重点就是自定义 Widget。

Yao 本身整个系统的逻辑是基于一套自定义的 DSL 构建起来的平台。我们需要编写符合 Yao 定义的规则的 DSL 配置文件，Yao 引擎才会识别，加载，运行。比如要生成数据库表，需要在 models 目录编写 mod.json,如果需要显示表格，需要在 tables 目录编写 table Widget DSL 文件，如果需要显示表单，需要在 forms 目录编写 form Widget DSL 文件。要完成一个模型的 curd 操作，至少需要编写三个文件:model,form,table。而使用自定义 Widget，只需要定义一个配置文件，就能快速生成动态表单。

Yao 平台已经实现了自定义 Widget 引擎，用户使用自定义 Widget 还需要完成以下的工作：

- 自定义 Widget 配置文件，自定义 Widget 的定义规则由用户创建，可以是任何合法的 JSON 文件。
- 自定义 Widget 解析逻辑，用户需要编写代码把自定义 Widget 转换成符合 Yao Widget 对象。

自定义 Widget 的作用有哪些：

- 通过一份配置文件生成多个 Yao 模型对象，简化工作流程，减少工作量。
- 自定义 Widget 配置源码不限来源，除了可以写在配置文件里，还可以保存在数据库里。

使用场景：

- 使用表单设计器，把自定义 Widget 配置写入到数据库，实现原文中说的云端表格，调查问卷等。

## 自定义 Widget 的技术原理

Yao 是如何实现上面所述的功能。

要完成自定义 Widget 转换成 Yao Widget 需要处理以下的事项：

- 读取自定义的 Widget 源码，在脚本 compile.js 中实现。
- 把自定义 Widget DSL 转换成 Yao Widget DSL。在脚本 export.js 中实现。
- 提供 widget 工具函数，在脚本 process.js 中实现

Yao 引擎实现了一个简单的 Widget 编译器。使用编译器加载源代码进行处理，最后生成 Yao Widget。

整个 widgets 处理分三个阶段：

- 从 js,json 文件中加载 Widget 的定义。从配置文件中加载 Widget 的定义，创建 Widget 实例。
- 初始化 Widget 处理器。
- Widget 实例初始化，加载自定义的 Widget 定义，编译源代码，输出 Yao Widget。

下面使用源代码进行实践，使用逻辑流程图加强理解。

- [自定义 Widget 演示项目源代码](https://github.com/YaoApp/demo-widget)

- [流程图在线查看](https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=yao_widget.drawio#Uhttps%3A%2F%2Fraw.githubusercontent.com%2Fwwsheng009%2Fyao-docs%2Fmain%2Fdocs%2F%25E6%25B5%2581%25E7%25A8%258B%25E5%259B%25BE%2Fdrawio%2Fyao_widget.drawio)

## 阶段一 加载 Widget 定义。

在程序启动阶段

- Yao 调用`widget.Load(cfg)`，源码：`/data/projects/Yao/Yao-app-sources/Yao/engine/load.go`。

- 调用 `/Yao-app-sources/gou/widget/widget.go`中的 load

- 加载配置文件 widgets.json
- 加载 widgets 目录下的 js 脚本文件
- 加载 process.js 中的 Export 函数导出的函数,并注册为 Yao 处理器
- 注册 export.js 中的 Apis 接口

这里容易混淆的地方是，process.js 中的 Export 与 export.js。

- process.js 的函数用于注册 Yao 处理器。注册的函数可以在 export.js 中调用，也可以在其它地方使用。process.js 中的 Export 是一个配置函数，暴露函数接口。

- export.js 的函数用于转换自定义 Widget 成 Yao Widget，用于处理 Widget 转换逻辑。

- 在 export.js 可以使用 process.js 中的函数，反过来就不行。

### 加载配置

Yao 会扫描 widgets 下所有的目录，每一个子目录都是一个 widget 实例。

比如有一个目录为 dyform,那这个自定义 Widget 实例就是 dyform。

加载每一个自定义 Widget 目录下的配置文件`widget.json`，解析文件的配置项。重要的配置项有：

- `root` 自定义 Widget DSL 文件保存路径(相对于项目根目录)，每一个实例都是独立的。
- `extension` 自定义 Widget 文件扩展名,默认为`.json`
- `modules` 需要进行自定义 Widget 转换的模块列表,每个实例都可以配置转换哪些模块，如 model, table 等。模块的转换实现逻辑在 export.js 中定义，函数需要实现从定义 Widget 会转换成 Yao widget 的具体逻辑。 最后输出的 widget DSL 与保存在项目目录中的 DSL 文件等效。

### 加载脚本文件

加载 Widget 实例目录下的所有 js 文件到 v8 引擎中。必须有`compile.js`，`export.js`，`process.js`三个 js 脚本文件。

- `compile.js`，用于编译自定义的 Widget DSL，完成源码到 DSL 的转换。

- `export.js`，用于转换自定义 Widget DSL 成 Yao Widget。可以调用 process.js 中的方法处理 DSL 对象。

- `process.js`，用于注册全局处理器。

- `<其它>.js`加载 Widget 实例目录中的其它 js 文件，属于辅助 js 函数。

比如有一个 js 文件名为 helper.js,会加载为处理器，名称为：`dyform.scripts.helper.方法名`，只能在 js 中使用，不是 process。

但是目前没有看到有调用的地方。

helper.js 命名格式

```go
// /Yao-app-sources/gou/widget/scripts.go:84
name := fmt.Sprintf("%s.scripts.%s", w.Name, InstName(root, basename))

```

### 阶段二 加载注册处理器

把 process.js 的函数注册为标准的 Yao Process 处理器。函数注册后就是标准的处理器，可以在 export.js 中被调用。

调用格式：`widgets.INSTANCE.METHOD`，`widgets`是固定的分类，INSTANCE 是 Widget 实例名称，METHOD 是 Widget 实例目录下 process.js 文件中的 js 函数。

> process.js 的 Export 函数是一个导出配置函数，它的作用是定义在 process.js 中哪些函数可以被注册。

```js
//process.js

/**
 * Export processes，需要返回一个字典对象。
 */
function Export() {
  return { Model: 'Model', Table: 'Table', Save: 'Save', Delete: 'Delete' };
}
```

### 源代码学习

当用户调用处理器`widgets.INSTANCE.METHOD`时,会在全局对象`WidgetCustomHandlers`中查找`WidgetCustomHandlers['INSTANCE']`的处理器。

另外有一个全局默认的方法`widgets.INSTANCE.reload`,用于重加载 widget 配置。

```go
// /Yao-app-sources/gou/process.go
case "widgets":
	//查找 widget 实例 instance
	if widgetHanlders, has := WidgetCustomHandlers[strings.ToLower(process.Class)]; has {
		//查找方法
		if handler, has := widgetHanlders[strings.ToLower(process.Method)]; has {
			process.Name = strings.ToLower(process.Name)
			process.Handler = handler
			return
		}
	}
	process.Name = strings.ToLower(process.Name)
	//有默认的配置方法。
	handler, has := WidgetHandlers[strings.ToLower(process.Method)]
	if !has {
		exception.New("Widget: %s %s does not exist", 404, process.Name, process.Method).Throw()
	}
	process.Handler = handler
	return
```

保存 Widget 处理器的全局变量 WidgetCustomHandlers:

- `WidgetCustomHandlers['dyform']['Model']`
- `WidgetCustomHandlers['dyform']['Table']`
- `WidgetCustomHandlers['dyform']['Save']`
- `WidgetCustomHandlers['dyform']['Delete']`

```go
// /Yao-app-sources/gou/widget.go
func customProcessRegister() widget.ProcessRegister {
	return func(widget, name string, handler func(args ...interface{}) interface{}) error {
		widget = strings.ToLower(widget)
		name = strings.ToLower(name)
		log.Info("[Widget] Register Process widgets.%s.%s", widget, name)
		if _, has := WidgetCustomHandlers[widget]; !has {
			WidgetCustomHandlers[widget] = map[string]ProcessHandler{}
		}

		WidgetCustomHandlers[widget][name] = func(process *Process) interface{} {
			return handler(process.Args...)
		}
		return nil
	}
}

```

在处理器里调用 Widget 实例方法时，实际上是在这里回调 process.js 脚本中的方法。

`widgets.<INSTANCE NAME>.<FUNCTION NAME>`

```go
// /Yao-app-sources/gou/widget/register.go

for name, methodAny := range resp {
	if method, ok := methodAny.(string); ok {
		w.ProcessRegister(w.Name, name, func(args ...interface{}) interface{} {
			value, err := w.ProcessExec(method, args...)
			if err != nil {
				exception.New(err.Error(), 500).Throw()
				return nil
			}
			return value
		})
	}
}
```

## 阶段三 加载 Widget 实例

`/Yao-app-sources/Yao/widget/widget.go`。

```go
for _, path := range paths {

	if !path.IsDir() {
		continue
	}

	name := path.Name()
	if _, err := os.Stat(filepath.Join(dir, name, "widget.json")); errors.Is(err, os.ErrNotExist) {
		// path/to/whatever does not exist
		continue
	}
	//widget定义加载
	w, err := gou.LoadWidget(filepath.Join(dir, name), name, register)
	if err != nil {
		return err
	}

	// widget实例加载
	// Load instances
	err = w.Load()
	if err != nil {
		return err
	}
}
```

### 源代码转换 compile.js

`compile.js` 负责获取自定义 DSL 的源代码。

Yao 框架通过加载配置 DSL 文件后，就能创建出 Widget 实例。

#### Step1

自定义 DSL 文件来源默认是在 widget.json 配置的 root 目录下的所有的 json 文件。json 文件会自动加载。

也可以自定义 DSL 源码来源，比如保存在数据库中。这时就需要实现 compile.js 中的 Source 方法。Yao 框架会调用实例对应 compile.js 中的 Source 方法获取自定义 Widget DSL 的源代码。这里需要返回一个字典对象。字典对象的 key 就是 widget 实例名称，字典对象中的 Value 是 Widget 实例的 DSL 源代码，需要转换成 JS 对象。

#### Step2

无论是默认的 json 文件配置或是自定义的来源，Yao 框架调用 compile.js 中的 Compile 方法。在这里可以对 DSL 模型进一步的修正，Compile 方法的输入值是 js 对象，Yao 框架已经自动的作了转换。

#### Step3

Yao 框架根据 widget.json 配置的 modules 列表，调用 export.js 中的 DSL 转换方法，把自定义的 DSL 转换成 Yao DSL，并注入系统。

到这里自定义的 DSL 处理完成，Widget 实例在 Yao 系统中可用。

最后 Yao 框架调用 compile.js 中的 Onload 方法。

```js
/**
 * The DSL compiler.
 * Translate the customize DSL to Models, Processes, Flows, Tables, etc.
 */

/**
 * Source 自定义源代码来源
 * Where to get the custom source of DSL
 */
function Source() {
  var sources = {};
  const tpl = '';
  DSL = JSON.parse(tpl);
  sources[instance] = DSL;

  return sources;
}

/**
 * Compile
 * Translate or extend the customize DSL
 * @param {*} DSL
 */
function Compile(name, DSL) {
  return DSL;
}

/**
 * OnLoad
 * When the widget instance are loaded, the function will be called.
 * For preparing the sources the widget need.
 * @param {DSL} DSL
 */
function OnLoad(name, DSL) {
  log.Info('[Widget] dyform %s loaded', name);
}

/**
 * Migrate 未使用
 * When the migrate command executes, the function will be called
 * @param {DSL} DSL
 * @param {bool} force
 */
function Migrate(DSL, force) {}
```

### 解析配置，DSL 转换

自定义的 Widget 需要转换成 Yao Widget 后才能被 Yao 平台识别，所以需要进行 Widget 转换处理与注册 Widget 的操作。

在`Yao-app-sources/Yao/widget/widget.go`中，Yao 把 Widget 资源加载入口函数暴露给 gou 引擎。

gou 引擎可以调用 Yao 的资源注册函数，把 Yao Widget 对象注册到全局资源池中。

```go
// Yao-app-sources/Yao/widget/widget.go

func moduleRegister() widget.ModuleRegister {
	return widget.ModuleRegister{
		"Apis": func(name string, source []byte) error {
			//注入
			_, err := gou.LoadAPIReturn(string(source), name)
			log.Trace("[Widget] Register api %s", name)
			if err != nil {
				log.Error("[Widget] Register api %s %v", name, err)
			}
			return err
		},
		"Models": func(name string, source []byte) error {
			//注入
			_, err := gou.LoadModelReturn(string(source), name)
			log.Trace("[Widget] Register model %s", name)
			if err != nil {
				log.Error("[Widget] Register model %s %v", name, err)
			}
			return err
		},
		"Tables": func(name string, source []byte) error {
			log.Trace("[Widget] Register table %s", name)
			//注入
			_, err := table.LoadTable(string(source), name)
			if err != nil {
				log.Error("[Widget] Register table %s %v", name, err)
			}
			return nil
		},
		"Tasks": func(name string, source []byte) error {
			log.Trace("[Widget] Register task %s", name)
			//注入
			_, err := gou.LoadTask(string(source), name)
			if err != nil {
				log.Error("[Widget] Register task %s %v", name, err)
			}
			return nil
		},
		"Schedules": func(name string, source []byte) error {
			log.Trace("[Widget] Register schedule %s", name)
			//注入
			_, err := gou.LoadSchedule(string(source), name)
			if err != nil {
				log.Error("[Widget] Register schedule %s %v", name, err)
			}
			return nil
		},
	}
}
```

框架会根据 Widget 配置文件`widget.Yao`里的`modules`属性配置调用对应的 js 转换函数。

```go
// /Yao-app-sources/gou/widget/instance.go
// Register modules
if w.Modules != nil {
	for _, module := range w.Modules {
		err = w.RegisterModule(module, name, DSL)
		if err != nil {
			return err
		}
	}
}
```

可配置的对象列表有`["Apis", "Models", "Tables", "Tasks", "Schedules"]`。这些对象就是 Yao Widget DSL 的内置类型。

- Apis API 定义
- Models 模型列表
- Tables 表格列表
- Tasks 任务
- Schedules 计划

gou 引擎根据你的`modules`配置在脚本 export.js 文件里找到对应的 js 函数。

比如`Apis`,就找 export.js 中的函数`function Apis(name, DSL){}`。找到函数并调用函数，最后调用上面 Yao 的回调函数,把 Widget 加载到全局对象。

以下的各个函数的方法定义，输入值是自定义 widget 实例名称与自定义 Widget 实例 DSL 配置，输出值是 Yao Widget DSL 对象。

```js
/**
 * Export Apis
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns 返回一个api DSL定义对象
 */
function Apis(name, DSL) {
  // /Yao-app-sources/gou/api.types.go
  // HTTP http 协议服务
  return {};
}

/**
 * Export Models 注册model的回调函数。
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Models(name, DSL) {
  // /Yao-app-sources/gou/model.types.go MetaData
  return {
    table: { name: 'dyform' },
    columns: [
      { label: 'DYFORM ID', name: 'id', type: 'ID' },
      { label: 'SN', name: 'sn', type: 'string', length: 20, unique: true },
    ],
    indexes: [],
  };
}

// /**
//  * Export Flows 不支持
//  * @param {string} name widget实例名称，
//  * @param {string} DSL 自定义DSL
//  * @returns
//  */
// function Flows(name, DSL) {
//   return {};
// }

/**
 * Export Tables
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Tables(name, DSL) {
  // /Yao-app-sources/Yao/table/table.go
  // 返回Table对象
  return {};
}

/**
 * Export Tasks
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Tasks(name, DSL) {
  // /Yao-app-sources/gou/task.go
  return {};
}

/**
 * Export Schedules
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义DSL
 * @returns
 */
function Schedules(name, DSL) {
  // /Yao-app-sources/gou/schedule.go Schedule定义
  return {};
}
```

## 总结

自定义 Widget 与 Studio 一脉相承。Yao 使用自定义 Widget 进行功能扩展让整个平台非常的灵活，保留了很好扩展性。

使用 JSON 作为配置文件，看似不方便，但却是最灵活的处理方式。
