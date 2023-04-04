# dyForm 深入学习

dyForm 从名称来看是 Dynimcal Form，是在 Yao 中实现动态表单的一中方式。

在官方的网站上有一篇教程，是说如何使用创建[自建云表格](https://yaoapps.com/doc/%E6%95%99%E7%A8%8B/%E8%87%AA%E5%BB%BA%E4%BA%91%E8%A1%A8%E6%A0%BC)

重点看这一句话。

> **Widget 支持开发者自定义**，可基于自身业务逻辑特征，自定义 DSL, 快速复制各种通用功能。本文将通过自定义 Widget 的方式，实现一套云表格系统。

重点就是自定义 DSL。

Yao 本身整个系统的逻辑是基于一套自定义的 DSL 构建起来的平台。我们需要编写符合 Yao 定义的规则的 DSL 配置文件，yao 引用才会识别，加载，运行。比如要生成数据库表，需要在 modesl 目录编写 mod.json,如果需要显示表格，需要在 tables 目录编写 table.json 文件，如果需要显示表单，需要在 forms 目录编写 form.json 文件。要完成一个模型的 curd 操作，至少需要编写三个文件:model,form,table。而使用 dyform，可以让我们基于自定义的 DSL 进行代码生成代码的操作。

YAO 平台已经实现了 dyform 引擎，用户使用 dyform 还需要完成以下的工作：

- 定义符合用户自己的 DSL 格式，dsl 的格式由用户创建，可以是任何内容。
- 定义 DSL 解析逻辑，用户需要编写代码把自定义的 DSL 转换成符合 yao 规则的 table/model/form DSL 文件。

dyform 的作用有哪些：

- 通过配置生成 yao 的模型对象，表格与表单。减少了工作量。
- DSL 配置除了可以写在配置文件里，还可以保存在数据库里。

使用场景：

- 使用表单设计器，把 DSL 配置写入到数据库。实现原文中的云端表格。

## dyForm 的技术原理

yao 是如何实现上面所述的功能。

要完成自定义 DSL 转换成 YAO DSL 需要处理以下的事项：

- 读取自定义的 DSL 文件，并转换成源码，在 compile.js 中实现。
- 转换自定义 DSL 文件成 YAO DSL。在脚本 export.js 中实现。
- 提供工具函数，在脚本 process.js 中实现

在这里，dyform 其实是实现了一个简单的编译器。有两个层次。

一个先根据配置文件初始化一个 dyform 编译器。

dyform 编译器再根据自定义的 dsl 生成另外一个 dsl。

整个 widgets 处理分三个阶段：

- 从 js,json 文件中加载 widgets 的定义。从配置文件中加载 widget 的定义，创建 widget 实例。
- 初始化 widget 处理器。
- widget 实例初始化，加载自定义的 DSL 定义，编译源代码，输出 Yao DSL。

## 阶段一 加载 Widget 定义。

在程序启动阶段

- yao 调用`widget.Load(cfg)`，源码：`/data/projects/yao/yao-app-sources/yao/engine/load.go`。

- 调用 `/yao-app-sources/gou/widget/widget.go`中的 load

- 加载配置文件 widgets.json
- 加载 widgets 目录下的 js 脚本文件
- 加载 process.js 中的 Export 函数导出的函数,并注册为 Yao 处理器
- 注册 export.js 中的 Apis 接口

这里容易混淆的地方是，process.js 中的 Export 与 export.js。

- process.js 的函数用于注册 Yao 处理器。注册的函数可以在 export.js 中调用，也可以在其它地方使用。

- export.js 的函数用于转换自定义 DSL 成 Yao DSL，用于处理 DSL 转换逻辑。

### 加载配置

yao 会扫描 widgets 下所有的目录，每一个子目录都是一个 widget 实例。

比如有一个目录为 dyform,那这个 widget 实例就是 dyform。下面以 dyform 作为示例说明。

加载每一个 widget 实例的配置文件`widget.json`，解析文件的配置项。重要的配置项有：

- `root` DSL 文件保存路径(相对于项目根目录)，每一个实例都是独立的。
- `extension` DSL 文件扩展名,默认为`.json`
- `modules` 需要进行 DSL 转换的模块列表。 在 export.js 中自定义的 DSL 会转换成 YAO DSL widget。 如 model, table 等。这些 widgets 与保存在项目目录中的 DSL 文件等效。

### 加载脚本文件

加载 widget(dyform) 中的 Widget js 文件到 v8 引擎中。js 处理器会用在后面的 DSL 编译处理上。

- `compile.js`，用于编译自定义的 DSL 成源码。

- `export.js`，用于转换自定义 DSL 成 yao dsl。

- `process.js`，用于注册全局处理器。会调用 export.js 中的方法处理 DSL 对象。

- `<其它>.js`加载 widget 目录中的其它 js 文件。

比如有一个 js 文件名为 helper.js,会加载为处理器，名称为：`dyform.scripts.helper.方法名`，只能在 js 中使用，不是 process。目前没有看到有调用的地方。

```go
// /yao-app-sources/gou/widget/scripts.go:84
name := fmt.Sprintf("%s.scripts.%s", w.Name, InstName(root, basename))

```

### 阶段二 加载注册处理器

把 process.js 的函数注册为标准的 Yao Process 处理器。函数注册后就可以在 export.js 中被调用。

调用格式：`widgets.INSTANCE.METHOD`，`widgets`是固定的分类，INSTANCE 是 widget 实例名称，METHOD 是 widget 实例目录下 process.js 文件中的 js 函数。

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
// /yao-app-sources/gou/process.go
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

保存 widget 处理器的全局变量 WidgetCustomHandlers:

- `WidgetCustomHandlers['dyform']['Model']`
- `WidgetCustomHandlers['dyform']['Table']`
- `WidgetCustomHandlers['dyform']['Save']`
- `WidgetCustomHandlers['dyform']['Delete']`

```go
// /yao-app-sources/gou/widget.go
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

在处理器里调用与 widget 有关的方法时，实际上是在这里回调 process.js 脚本中的方法。

`widgets.<INSTANCE NAME>.<FUNCTION NAME>`

```go
// /yao-app-sources/gou/widget/register.go

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

`/yao-app-sources/yao/widget/widget.go`。

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

Yao 框架通过加载配置文件后，就能创建出一个个的 widget 实例。

#### Step1

yao 框架会调用实例对应 compile.js 中的 Source 方法获取自定义 DSL 的源代码。这里需要返回一个字典对象。字典对象的 key 就是 widget 实例名称。

#### Step2

Yao 框架调用 compile.js 中的 Compile 方法。

#### Step3

Yao 框架根据 widget.json 配置的 modules 列表，调用 export.js 中的 DSL 转换方法，把自定义的 DSL 转换成 YAO DSL，并注入系统。

到这里自定义的 dsl 处理完成，dyform 可用。

最后 Yao 框架调用 compile.js 中的 Onload 方法。

```js
/**
 * The DSL compiler.
 * Translate the customize DSL to Models, Processes, Flows, Tables, etc.
 */

/**
 * Source
 * Where to get the source of DSL
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

自定义的 DSL 需要转换成 YAO DSL 后才能被 YAO 平台识别，所以需要进行 DSL 转换处理与注册 DSL 的操作。

在`yao-app-sources/yao/widget/widget.go`中，yao 把 DSL 资源加载入口函数暴露给 gou 引擎。

gou 引擎可以调用 yao 的资源注册函数，把 Yao DSL 对象注册到全局资源池中。

```go
// yao-app-sources/yao/widget/widget.go

func moduleRegister() widget.ModuleRegister {
	return widget.ModuleRegister{
		"Apis": func(name string, source []byte) error {
			_, err := gou.LoadAPIReturn(string(source), name)
			log.Trace("[Widget] Register api %s", name)
			if err != nil {
				log.Error("[Widget] Register api %s %v", name, err)
			}
			return err
		},
		"Models": func(name string, source []byte) error {
			_, err := gou.LoadModelReturn(string(source), name)
			log.Trace("[Widget] Register model %s", name)
			if err != nil {
				log.Error("[Widget] Register model %s %v", name, err)
			}
			return err
		},
		"Tables": func(name string, source []byte) error {
			log.Trace("[Widget] Register table %s", name)
			_, err := table.LoadTable(string(source), name)
			if err != nil {
				log.Error("[Widget] Register table %s %v", name, err)
			}
			return nil
		},
		"Tasks": func(name string, source []byte) error {
			log.Trace("[Widget] Register task %s", name)
			_, err := gou.LoadTask(string(source), name)
			if err != nil {
				log.Error("[Widget] Register task %s %v", name, err)
			}
			return nil
		},
		"Schedules": func(name string, source []byte) error {
			log.Trace("[Widget] Register schedule %s", name)
			_, err := gou.LoadSchedule(string(source), name)
			if err != nil {
				log.Error("[Widget] Register schedule %s %v", name, err)
			}
			return nil
		},
	}
}
```

框架会根据 widget 配置文件 `widget.yao` 里的`modules`属性调用转换函数。

```go
// /yao-app-sources/gou/widget/instance.go
// Register modules
if w.Modules != nil {
	for _, module := range w.Modules {
		err = w.RegisterModule(module, name, dsl)
		if err != nil {
			return err
		}
	}
}
```

可配置的对象列表有`["Apis", "Models", "Tables", "Tasks", "Schedules"]`。这些对象就是 Yao DSL 的内置类型。

- Apis API 定义
- Models 模型列表
- Tables 表格列表
- Tasks 任务
- Schedules 计划

gou 引擎根据你的`modules`配置在脚本 export.js 文件里找到对应的 js 函数。

比如`Apis`,就找 export.js 中的函数`function Apis(name, DSL){}`。找到函数在合适的时机调用函数，最后调用上面 yao 的回调函数,把 DSL 加载到全局对象。

以下的各个函数的方法定义。

```js
/**
 * Export Apis
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义dsl
 * @returns 返回一个api dsl定义对象
 */
function Apis(name, DSL) {
  // /yao-app-sources/gou/api.types.go
  // HTTP http 协议服务
  return {};
}

/**
 * Export Models 注册model的回调函数。
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义dsl
 * @returns
 */
function Models(name, DSL) {
  // /yao-app-sources/gou/model.types.go MetaData
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
//  * @param {string} DSL 自定义dsl
//  * @returns
//  */
// function Flows(name, DSL) {
//   return {};
// }

/**
 * Export Tables
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义dsl
 * @returns
 */
function Tables(name, DSL) {
  // /yao-app-sources/yao/table/table.go
  // 返回Table对象
  return {};
}

/**
 * Export Tasks
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义dsl
 * @returns
 */
function Tasks(name, DSL) {
  // /yao-app-sources/gou/task.go
  return {};
}

/**
 * Export Schedules
 * @param {string} name widget实例名称，
 * @param {string} DSL 自定义dsl
 * @returns
 */
function Schedules(name, DSL) {
  // /yao-app-sources/gou/schedule.go Schedule定义
  return {};
}
```

## 总结

dyform 与 Studio 一脉相承。Yao 使用这种自定义 DSL 生成生成配置的方式让整个平台非常的灵活，保留了很好扩展性。

一生二，二生三，三生万物。乐高积木块虽小，却能组装出形式各样的玩具与物件。Yao 把复杂的软件代码解耦成一个个的"处理器",使用组合不同的处理器就能创建出新的软件功能。

使用 JSON 作为配置文件，看似不方便，但却是最灵活的处理方式。它有无限的扩展性，也许就是软件组件级别的元编程吧。
