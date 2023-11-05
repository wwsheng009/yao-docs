# 自定义 widget 升级版

在 0.10.3 版本后，widget 进行了重构。

在 yao 的框架中已经实现了以下内置的 widget:

- app
- chart
- dashboard
- import
- table
- form
- list

自定义 widget 的思路是按照 widget 的思路使用 js 脚本进行功能扩展，用户可以使用 json 文件定义自己的 dsl。

处理过程：

- 配置自定义 widget 的元配置信息，比如储存，加载，转换。

- 配置自定义 widget 的源代码 DSL 处理器与接口等配置信息

## 配置自定义 widget 的元配置信息

元信息保存了一个自定义 widget 的加载与及处理器信息。

自定义的 widget 的元信息定义文件需要存放在应用目录子目录 widgets 下，文件后缀名需要是`*.wid.yao, *.wid.json, *.wid.jsonc`。

widget 的类型定义有以下这些内容：

- name 名称
- description 描述
- path 路径
- extensions 扩展
- remote 远程配置
- loader 加载器，加载 DSL 定义的自定义的加载器
- process 处理器，API 的回调函数
- api 定义
- Instances DSL，每一种自定义的 widget 中都会根据配置加载所有的 DSL 定义

```go
type DSL struct {
	ID          string            `json:"-"`
	File        string            `json:"-"`
	Instances   sync.Map          `json:"-"`//
	FS          FS                `json:"-"`
	Name        string            `json:"name,omitempty"`
	Description string            `json:"description,omitempty"`
	Path        string            `json:"path,omitempty"`
	Extensions  []string          `json:"extensions,omitempty"`//DSL源文件扩展名列表
	Remote      *RemoteDSL        `json:"remote,omitempty"`//远程加载连接配置
	Loader      LoaderDSL         `json:"loader"`
	Process     map[string]string `json:"process,omitempty"`
	API         *api.HTTP         `json:"api,omitempty"`
}

// RemoteDSL is the remote widget DSL
type RemoteDSL struct {
	Connector string `json:"connector,omitempty"`
	Table     string `json:"table,omitempty"`
	Reload    bool   `json:"reload,omitempty"`
}
// LoaderDSL is the loader widget DSL
type LoaderDSL struct {
	Load   string `json:"load,omitempty"`
	Reload string `json:"reload,omitempty"`
	Unload string `json:"unload,omitempty"`
}
```

保存 widget DSL 原始配置有两种方式：

### 从本地文件加载。

从本地文件系统加载需要两个配置项，path【保存自定义 widget 的目录路径】与 extension【自定义 widget 配置文件的扩展名】。

比如在应用目录下使用目录 dyforms 保存自定义 widget，需要以下的配置。

DSL 文件内容只支持这几种格式：yao/json/jsonc/yaml/yam。

```json
  // DSL Source  from application path: dyforms/feedback.form.yao
  "path": "dyforms",
  "extensions": ["*.form.yao"],//如果没有配置，默认使用： "*.yao", "*.json", "*.jsonc"
```

### 从远程数据库表中加载

如果同时配置了远程连接器与本地配置，会优先使用远程连接器。

- connector，配置数据库连接器，需要是一个数据库的连接器，不配置的话会使用 default。
- table,保存源代码的表名。
- reload，是否使用重载功能，配置 true 会调用 reload 处理器。

保存源代码的数据库表需要两个字段：`file`,`source`。如果不指定 table 名称，会自动的根据 `widget_id` 配置一个表名 `widget_id` 命名的表`__yao_dsl_[widget_id]`。

这个保存源代码的表如果不存在，在 yao 启动的时候自动的创建，不需要手工干预。

- 字段`file`保存文件名，后缀名需要是 `yao/json/jsonc/yaml/yam`其中的一种。

- 保存`source`源代码，内容只支持这几种格式：`yao/json/jsonc/yaml/yam`。

```jsonc
  // Remote storage options (optional) - set "reload" to true to reload when DSL is updated (calls the Reload loader)
  // If remote storage is set, DSL is loaded from remote storage; otherwise, it is loaded locally.
  // If connector is default or not set, using the default database connection
  // If table not set, the default name is __yao_dsl_<Widget ID>
  "remote": { "connector": "default", "table": "dsl_iform", "reload": true },

```

### 加载 widget DSL 实例

在上面读取了本地目录路径或是数据库的连接信息后，就会加载 widget 的 DSL 的源代码。

_需要注意的是，本地文件或是数据库中的源代码都只是原始的源代码信息，还不是最后的 DSL 定义。_

比如从目录 dyforms 下读取所有的后缀为`*.form.yao`文件。

```json
  // DSL Source  from application path: dyforms/feedback.form.yao
  "path": "dyforms",
  "extensions": ["*.form.yao"],
```

从数据库表 `dsl_iform` 中读取所有的实例定义。

```jsonc
  // Remote storage options (optional) - set "reload" to true to reload when DSL is updated (calls the Reload loader)
  // If remote storage is set, DSL is loaded from remote storage; otherwise, it is loaded locally.
  // If connector is default or not set, using the default database connection
  // If table not set, the default name is __yao_dsl_<Widget ID>
  "remote": { "connector": "default", "table": "dsl_iform", "reload": true },

```

### DSL 实例加载器

在 Yao 加载 dsl 源代码后，还需要调用定义的处理器来进一步转换成 DSL 实例，通常 DSL 会使用 JSON 保存。

widget DSL 实例的加载还可以配置额外的三个处理器：

- load,加载处理，参数：【DSL 实例 ID，DSL 源代码】,注意不是 widget id，返回 dsl 定义。需要实现这个处理器来把源代码转换成 DSL 定义。

- reload,重加载处理，参数：【DSL 实例 ID，DSL 源代码，旧的实例定义】，返回新的 dsl 定义。当使用远程存储时，并且实现了这个方法，会自动的调用。

- unload,卸载处理，参数：【DSL 实例 ID】。卸载前的检查处理。

yao 并没有默认的实现，所以 load 与 reload 一定要实现。

```json
{
  // Widget DSL loader
  "loader": {
    "load": "scripts.dyform.Load",
    "reload": "scripts.dyform.Reload",
    "unload": "scripts.dyform.Unload"
  }
}
```

对应的 js 定义。

```js
/**
 * Dyform Loader: load
 * @param {*} id
 * @param {*} source
 * @returns
 */
function Load(id, source) {
  let dsl = source || {};
  dsl['id'] = id;
  return dsl;
}

/**
 * Dyform Loader: reload
 * @param {*} id
 * @param {*} source
 * @param {*} dsl
 * @returns
 */
function Reload(id, source, dsl) {
  let newDSL = source || {};
  newDSL['id'] = id;
  newDSL['tests.reload'] = typeof dsl === 'object';
  return newDSL;
}

/**
 * Dyform Loader: unload
 * @param {*} id
 */
function Unload(id) {
  if (id == undefined || id == null) {
    throw new Exception('id is required');
  }
}
```

比如定义文件名称为`feedback/new.form.yao`,对应的 DSL ID 为`feedback.new`,即是 DSL ID 是根据文件名进行处理的。

_不管理是保存在本地目录还是数据库，这个文件名一定要按 yao 的命名规则进行处理。_

### dsl 源代码处理 API

widget 定义对应的实例源代码还可以通过两个处理器进行操作。

注意：只能针对于保存在数据库里的源代码进行操作，不能删除或是保存本地目录下的 dsl 定义文件。

保存 widget 源代码，处理器：widget.save，处理参数：

- name,widget 配置名称，即是在 widgets 目录下的配置名称，比如 dyform.wid.yao 对应的 widget 配置名就是 dyform
- file,widget 实例名称[文件名称],比如 feedback/website.form.jsonc
- source,源代码

删除 widget 源代码，处理器：widget.remove，处理参数：

- name,widget 配置名称，即是在 widgets 目录下的配置名称，比如 dyform.wid.yao 对应的 widget 配置名就是 dyform
- file,widget 实例名称[文件名称],比如 feedback/website.form.jsonc

在加载完 widget 的实例后还需要注册数据处理的处理器与 api。

## 注册 widget 处理器

处理器用于处理自定义 widget 的数据保存与读取等操作。

处理器的配置是一个映射表，这个表中所有的配置都会注册成这个 widget 的处理器。比如说下面的配置里的`setting`会注册成`widgets.[widget].[setting]`。而键配置是处理器名称，配置值是处理器的回调函数。调用`widgets.[widget].[method]`时会调用配置中对应的 js 脚本`scripts.*`。

比如下面的处理器 `widgets.[widget_id].Setting` 用于读取保存在文件或是数据库中的 widget 实例的配置，调用这个处理器会调用脚本`scripts.dyform.Setting`。

```json
{
  // Custom Widget handlers
  "process": {
    "setting": "scripts.dyform.Setting", //外部调用的处理器名称为 widgets.iform.Setting
    "find": "scripts.dyform.Find", // widgets.iform.Find
    "save": "scripts.dyform.Save", // widgets.iform.Save
    "delete": "scripts.dyform.Delete", // widgets.iform.Delete
    "cancel": "scripts.dyform.Cancel" // widgets.iform.Cancel
  }
}
```

这里的配置的处理器的名称没有限制。但是处理器的参数有以下的要求：

至少要有一个参数。

第一个参数是 `widget_id`,`widget_id` 一定是有效的 id，Yao 框架根据 id 找到对应的 widget 实例。

最后一个参数是 widget 对应的 dsl 定义。

这里示例只实现了读取 dsl setting 的操作，其它函数的都需要根据自己的具体需求进行扩展。

```js
/**
 * @process widgets.dyform.Setting
 * @args [id, dsl]
 */
function Setting(id, dsl) {
  dsl = dsl || {};
  dsl['tests.id'] = id;
  return dsl;
}
```

## 注册 WIDGET API

通过注册 api，可以把与自定义 widget 相关的功能暴露出来作为接口使用。

在这里配置的 api 会作为特定 `widget_id` 的处理接口，注册的 api 地址会统一加上前缀。

比如以下的接口定义就作了自定义表单的增删改查功能的定义。

注意：下面的配置的处理器`widgets.*` 只是一个示例，还要根据实际的需要修改成其它的处理。

```json
{
  // Custom Widget API
  // In production, if the API is changed, the service needs to be restarted.
  "api": {
    "guard": "bearer-jwt",
    "paths": [
      {
        "path": "/:id/setting", // GET /api/__yao/widget/dyform/feedback/setting
        "method": "GET",
        "process": "widgets.dyform.Setting",
        "in": ["$param.id"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/find/:primary", // GET /api/__yao/widget/dyform/feedback/find/1?select=id,name
        "method": "GET",
        "process": "widgets.dyform.Find",
        "in": ["$param.id", "$param.primary", ":query-param"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/save/:primary", // POST /api/__yao/widget/dyform/feedback/save/1
        "method": "POST",
        "process": "widgets.dyform.Save",
        "in": ["$param.id", "$param.primary", ":payload"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/cancel/:primary", // POST /api/__yao/widget/dyform/feedback/cancel/1
        "method": "POST",
        "process": "widgets.dyform.Cancel",
        "in": ["$param.id", "$param.primary", ":payload"],
        "out": { "status": 200, "type": "application/json" }
      },
      {
        "path": "/:id/delete/:primary", // POST /api/__yao/widget/dyform/feedback/delete/1
        "method": "POST",
        "process": "widgets.dyform.Delete",
        "in": ["$param.id", "$param.primary"],
        "out": { "status": 200, "type": "application/json" }
      }
    ]
  }
}
```

注册 API 后就可以通过 api 读取 widget 的定义，或是调用其它的功能。

api 的格式是`/api/__yao/widget/[WIDGET_ID]/[DSL_ID]/setting`,WIDGET_ID 是指自定义的 widget 配置 ID，DSL_ID 是指自定义 WIDGET 对应的 DSL 实例,可以理解为文件 ID。

比如读取 amis 中的实例 crud-list：`/api/__yao/wdiget/amis/crud-list/setting`

## 总结

新版本的 dyform 实现相比旧版的 dyform 逻辑上会更加清晰。但是只是进行了处理器处理与 API 加载，没有注册自定义 dsl 的 model/table/form 等操作。

可以调用以下的处理器把自定义的 DSL 转换成 YAO 标准模型，并加载到模型缓存或是生成数据库表。

- models.\<MODEL_ID\>.load，参数：【文件名，源代码】，加载模型定义到内存
- models.\<MODEL_ID\>.migrate，参数：【强制升级】，把模型定义映射到数据库

其它的界面设置可以参考 setting 处理器与 api，动态的根据参数输出不同的配置。

源代码位置：`\yao\widget`

## 测试案例：

https://github.com/YaoApp/yao-dev-app
