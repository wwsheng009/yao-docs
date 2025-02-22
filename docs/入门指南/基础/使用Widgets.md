# 使用 Widgets

  <p>
    Widget 抽象出一个功能模块的通用部分,使用 DSL 描述差异,
    实现快速复制，有效提升开发效率。Yao 提供一组内建 Widgets,
    覆盖大部分常用功能。
  </p>
  <p>Widget 支持自定义, 支持使用 Studio 脚本创建实例，可用于自建低代码平台。</p>

**约定**

1. 示例中约定应用根目录为 `/data/app`, 实际编写时需替换为应用根目录。
2. 示例中约定服务器地址为 `http://127.0.0.1:5099`, 实际编写时需自行替换。
3. 示例中约定 Studio 服务器地址为 `http://127.0.0.1:5077`, 实际编写时需自行替换。
4. 使用 `<>` 标识自行替换的内容。 例如: `icon-<图标名称>`, 实际编写时应替换为: `icon-foo`, `icon-bar` ...

## Widget

Widget 使用 YAO DSL 编写, 服务启动时, 应用引擎将其解析为一组处理器和 API 接口。

通常来说, 每种 Widget 对应一个 DSL 文件目录, 每个文件是一个 Widget 实例。

DSL 文件是一个 JSON 格式的文本, 编写体验与 HTML 相似, HTML 描述页面元素, DSL 用来描述功能。

DSL 文件名(不含扩展名) 作为 `Widget ID`, 如包含目录，则将 `/` 替换为 `.`

**内建 Widgets:**

| Widget           | 目录(相对应用根目录) | 扩展名                    | 说明                                                                             |
| ---------------- | -------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| App              | `/app.json`          | `-`                       | APP Widget 每一个应用只有一个                                                    |
| Model            | `/models`            | `.mod.json/.jsonc/.yao`   | 数据模型 用于描述数据表结构                                                      |
| Store            | `/stores`            | `.stor.json/.jsonc/.yao`  | Key-Value 存储                                                                   |
| Flow             | `/flows`             | `.flow.json/.jsonc/.yao`  | 数据流 用于编排处理器调用逻辑                                                    |
| API              | `/apis`              | `.http.json/.jsonc/.yao`  | REST API 用于编写 RESTFul API                                                    |
| Connector        | `/connectors`        | `.conn.json/.jsonc/.yao`  | 连接器 用于连接 Redis, Mongo, MySQL, ES 等外部服务, 连接器可与 Model, Store 关联 |
| Task             | `/tasks`             | `.task.json/.jsonc/.yao`  | 并发任务                                                                         |
| Schedule         | `/schedules`         | `.sch.json/.jsonc/.yao`   | 计划任务                                                                         |
| WebSocket Server | `/apis`              | `.ws.json/.jsonc/.yao`    | WebSocket Server                                                                 |
| WebSocket Client | `/websockets`        | `.ws.json/.jsonc/.yao`    | WebSocket Client                                                                 |
| Socket           | `/sockets`           | `.sock.json/.jsonc/.yao`  | Socket Server/Client                                                             |
| Cert             | `/certs`             | `.pem`                    | PEM 证书导入                                                                     |
| Import           | `/imports`           | `.imp.json/.jsonc/.yao`   | 数据导入 可以与表格界面关联                                                      |
| Login            | `/logins`            | `.login.json/.jsonc/.yao` | 登录界面                                                                         |
| Table            | `/tables`            | `.tab.json/.jsonc/.yao`   | 表格界面                                                                         |
| Form             | `/forms`             | `.form.json/.jsonc/.yao`  | 表单界面                                                                         |
| Chart            | `/charts`            | `.chart.json/.jsonc/.yao` | 图表界面                                                                         |

## 编写方式

Widgets 有多种编写方式，且这些编程方式可以随意切换。

### 手工编写

使用 `Visual Studio Code` 等开发工具编写。

**Model**

`/data/app/models/product.mod.json`

```json
{
  "name": "产品",
  "table": { "name": "product", "comment": "产品表" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID", "comment": "ID" },
    { "label": "名称", "name": "name", "type": "string", "index": true }
  ]
}
```

**Flow**

`/data/app/flows/query/product.flow.json`

```json
{
  "label": "演示",
  "version": "1.0.0",
  "description": "数据查询",
  "nodes": [
    {
      "name": "产品",
      "process": "models.product.Find",
      "args": ["{{$in[0]}}", { "select": ["id", "name"] }]
    }
  ],
  "output": "{{$res.产品}}"
}
```

**API**

`/data/app/apis/product.http.json`

```json
{
  "name": "产品",
  "version": "1.0.0",
  "description": "产品接口",
  "guard": "-",
  "group": "product",
  "paths": [
    {
      "path": "/find/:id",
      "method": "GET",
      "process": "flows.query.product",
      "in": ["$param.id"],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

**Table**

`/data/app/tables/product.tab.json`

```json
{
  "name": "产品",
  "action": {
    "bind": { "model": "product" }
  }
}
```

**Form**

`/data/app/forms/product.form.json`

```json
{
  "name": "产品",
  "action": { "bind": { "model": "product" } }
}
```

### 程序生成

创建一个 JS 脚本, 根据已有数据模型, 自动生成 Flow, API, Table 和 Form。

`/data/app/scripts/demo.js`

```javascript
function AutoMake(name) {
  let fs = new FS('app');
  let data = fs.ReadFile(`/models/${name}.mod.json`);
  let mod = JSON.parse(data);
  let title = mod.name || '未知';
  fs.WriteFile(`/flows/query/${name}.flow.json`, makeFlow(name, title));
  fs.WriteFile(`/apis/${name}.http.json`, makeApi(name, title));
  fs.WriteFile(`/tables/${name}.tab.json`, makeTable(name, title));
  fs.WriteFile(`/forms/${name}.form.json`, makeForm(name, title));
}

function makeForm(name, title) {
  return JSON.stringify({
    name: title,
    action: { bind: { model: name } }
  });
}

function makeTable(name, title) {
  return JSON.stringify({
    name: title,
    action: { bind: { model: name } }
  });
}

function makeFlow(name, title) {
  return JSON.stringify({
    label: '演示',
    version: '1.0.0',
    description: '数据查询',
    nodes: [
      {
        name: title,
        process: `models.${name}.Find`,
        args: ['{{$in[0]}}', { select: ['id', 'name'] }]
      }
    ],
    output: `{{$res.${title}}}`
  });
}

function makeApi(name, title) {
  return JSON.stringify({
    name: title,
    version: '1.0.0',
    description: `${title}接口`,
    guard: '-',
    group: name,
    paths: [
      {
        path: '/find/:id',
        method: 'GET',
        process: `flows.query.${name}`,
        in: ['$param.id'],
        out: { status: 200, type: 'application/json' }
      }
    ]
  });
}
```

运行调试

新建一个测试用 Model

`/data/app/models/category.mod.json`

```json
{
  "name": "类目",
  "table": { "name": "category", "comment": "类目" },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID", "comment": "ID" },
    { "label": "名称", "name": "name", "type": "string", "index": true }
  ]
}
```

```bash
yao studio run demo.AutoMake category
```

验证结果

```bash
cat /data/app/flows/query/category.flow.json
cat /data/app/apis/category.http.json
cat /data/app/tables/category.tab.json
cat /data/app/forms/category.form.json

```

也可以通过 Studio API 调用生成脚本

```bash
# Studio JWT 可以通过管理后台, 管理员登录接口获取
curl -X POST http://127.0.0.1:5077/service/demo \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer <Studio JWT>' \
   -d '{ "method":"AutoMake", "args":["category"]}'
```
