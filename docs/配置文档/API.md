# Yao API 配置指导文档

本文档为 AI LLM 提供编写 Yao API 配置文件的完整指导，涵盖 API 定义、参数绑定、认证机制、流式处理、文件上传下载等核心功能。

## 目录结构

```
apis/
├── odata/
│   ├── v2/
│   │   └── service.http.yao
│   └── v4/
│       └── service.http.yao
├── user.http.yao
└── pet.http.yao
```

## 命名规范

API 配置文件后缀名：`.http.yao`（推荐，支持注释）或 `.json`

| 文件位置       | 文件名        | API 名称           | API 类型     |
| -------------- | ------------- | ------------------ | ------------ |
| /              | name.http.yao | name               | HTTP RESTFul |
| /group         | name.http.yao | group.name         | HTTP RESTFul |
| /group1/group2 | name.http.yao | group1.group2.name | HTTP RESTFul |

API 访问路径：`/api/<group>/<path>`

## 核心结构

### 两级结构设计

#### 第一级：全局配置

```json
{
  "name": "API名称",
  "version": "1.0.0",
  "description": "API描述",
  "group": "分组名",
  "guard": "bearer-jwt"
}
```

#### 第二级：路径配置

```json
{
  "paths": [
    {
      "path": "/路由路径",
      "method": "GET",
      "process": "处理器名称",
      "in": ["参数列表"],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

## 完整字段说明

### HTTP 级字段（第一级）

| 字段        | 类型   | 必填 | 说明                       |
| ----------- | ------ | ---- | -------------------------- |
| name        | String | 是   | API 显示名称               |
| version     | String | 是   | 版本号                     |
| description | String | 否   | API 描述                   |
| group       | String | 是   | 分组名，构成路由前缀       |
| guard       | String | 否   | 全局中间件，多个用逗号分隔 |
| paths       | Array  | 是   | API 路径配置数组           |

### Path 级字段（第二级）

| 字段        | 类型   | 必填 | 说明                         |
| ----------- | ------ | ---- | ---------------------------- |
| label       | String | 否   | API 显示标签                 |
| description | String | 否   | API 描述                     |
| path        | String | 是   | 路由路径，支持 `:param` 参数 |
| method      | String | 是   | HTTP 方法                    |
| process     | String | 是   | 处理器名称                   |
| guard       | String | 否   | 路径级中间件，覆盖全局配置   |
| in          | Array  | 是   | 输入参数数组                 |
| out         | Object | 是   | 输出配置                     |
| err         | Object | 否   | 错误响应配置（未实现）       |

### Out 对象字段

| 字段     | 类型    | 必填 | 说明                 |
| -------- | ------- | ---- | -------------------- |
| status   | Integer | 是   | HTTP 状态码          |
| type     | String  | 是   | Content-Type         |
| body     | Any     | 否   | 响应体，支持模板绑定 |
| headers  | Object  | 否   | 响应头，支持模板绑定 |
| redirect | Object  | 否   | 重定向配置           |

## HTTP 方法支持

| 方法    | 用途         | 示例        |
| ------- | ------------ | ----------- |
| GET     | 获取资源     | `/user/:id` |
| POST    | 创建资源     | `/user`     |
| PUT     | 更新整个资源 | `/user/:id` |
| DELETE  | 删除资源     | `/user/:id` |
| PATCH   | 部分更新     | `/user/:id` |
| HEAD    | 获取响应头   | `/user/:id` |
| OPTIONS | 跨域预检     | `/user`     |
| ANY     | 匹配任意方法 | `/any`      |

## Guard 认证机制

### 优先级

`Path.Guard` > `HTTP.Guard` > 系统默认（`bearer-jwt`）

### Guard 值说明

| 值                  | 说明                           |
| ------------------- | ------------------------------ |
| `-`                 | 公开 API，无需认证             |
| `bearer-jwt`        | 从 Header 获取 JWT Token       |
| `query-jwt`         | 从查询参数 `__tk` 获取 Token   |
| `cross-origin`      | 跨域处理                       |
| `scripts.xxx.Guard` | 自定义 JS Guard 处理器         |
| 多个组合            | `bearer-jwt,scripts.pet.Guard` |

### 内置 Guard 列表

```go
"bearer-jwt"       // Bearer JWT 认证
"query-jwt"        // 从查询参数获取 JWT
"cross-origin"     // 跨域处理
"table-guard"      // 表格 Guard
"widget-table"     // 表格组件 Guard
"widget-list"      // 列表组件 Guard
"widget-form"      // 表单组件 Guard
"widget-chart"     // 图表组件 Guard
"widget-dashboard" // 仪表盘组件 Guard
```

### 自定义 Guard

自定义 Guard 函数接收 5 个参数：

```js
/**
 * @param {string} path - API 完整路径
 * @param {object} params - API 路径参数
 * @param {object} query - 查询参数
 * @param {any} payload - 请求体
 * @param {object} headers - 请求头
 */
function Guard(path, params, query, payload, headers) {
  isTest = headers['Unit-Test'] ? headers['Unit-Test'] : [];
  if (isTest[0] == 'yes') {
    throw new Exception('Unit-test throw', 418);
  }
}
```

## 参数绑定

### 输入参数（in）

支持的参数引用变量：

| 变量           | 类型                 | 说明           |
| -------------- | -------------------- | -------------- |
| `:payload`     | `[key:String]:Any`   | JSON 请求体    |
| `:query`       | `[key:String]:Any`   | URL 查询参数   |
| `:form`        | `[key:String]:Any`   | POST 表单数据  |
| `:body`        | String               | 原始请求体     |
| `:fullpath`    | String               | 完整请求路径   |
| `:headers`     | `[key:String]:Array` | 请求头         |
| `:params`      | String               | 路径参数       |
| `:query-param` | QueryParam           | 结构化查询参数 |
| `$form.*`      | String               | 表单字段值     |
| `$param.*`     | String               | 路径参数值     |
| `$query.*`     | String               | 查询参数值     |
| `$payload.*`   | Any                  | 请求体字段值   |
| `$session.*`   | Any                  | 会话数据       |
| `$header.*`    | String               | 请求头字段值   |
| `$file.*`      | UploadFile           | 上传文件对象   |

### 路径参数

```json
{
  "path": "/user/:id",
  "in": ["$param.id"]
}
```

### 查询参数

```json
{
  "in": ["$query.page", "$query.pagesize"]
}
```

### 请求体

```json
{
  "in": ["$payload.username", "$payload.password"]
}
```

### 会话参数

```json
{
  "in": ["$session.user_id"]
}
```

### 结构化查询参数（QueryParam）

适用于模型查询处理器：

```json
{
  "in": [":query-param"]
}
```

支持的查询参数格式：

- `select=field1,field2` → 选择字段
- `with=rel1,rel2` → 关联查询
- `where.status.eq=enabled` → Where 条件
- `order=id.desc` → 排序

### 文件上传

```json
{
  "path": "/upload",
  "method": "POST",
  "in": ["$file.file"]
}
```

上传文件对象结构：

```json
{
  "name": "文件名",
  "tempFile": "临时文件路径",
  "size": 文件大小,
  "mimeType": "MIME 类型"
}
```

## 输出配置（out）

### 基本输出

```json
{
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

### 模板绑定

使用 `{{}}` 或 `?:` 引用处理器返回值：

```json
{
  "out": {
    "status": 200,
    "headers": {
      "Content-Type": "{{type}}",
      "User-Agent": "?:agent"
    },
    "body": "{{content}}"
  }
}
```

处理器需要返回对象：

```js
return {
  type: 'application/json',
  content: 'hello',
  agent: 'edge/chrome'
};
```

### 文件下载

```json
{
  "out": {
    "status": 200,
    "body": "{{content}}",
    "headers": {
      "Content-Type": "{{type}}"
    }
  }
}
```

### 重定向

```json
{
  "out": {
    "redirect": {
      "code": 301,
      "location": "https://example.com"
    }
  }
}
```

## 流式 API（SSE）

### 配置

```json
{
  "path": "/ask-stream",
  "method": "POST",
  "process": "scripts.ai.stream.Call",
  "in": [":payload"],
  "out": {
    "status": 200,
    "type": "text/event-stream; charset=utf-8"
  }
}
```

### JS 流处理器

```js
function Call(payload) {
  // 使用 http.Stream 调用 AI 服务
  http.Stream('POST', url, handler, payload, null, {
    Accept: 'text/event-stream; charset=utf-8',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  });
}

function handler(payload) {
  const lines = payload.split('\n\n');
  for (const line of lines) {
    if (line === 'data: [DONE]') {
      return 0; // 中断
    } else if (line.startsWith('data:')) {
      const data = JSON.parse(line.substring(5));
      const content = data.choices[0]?.delta?.content;
      if (content) {
        ssEvent('message', content); // 发送数据
      }
    }
  }
  return 1; // 正常继续
}
```

### 流式 API 函数

- `ssEvent(event, data)` - 发送事件
- `cancel()` - 取消请求

## 会话管理

### 登录流程

1. 验证用户名密码
2. 生成 Session ID
3. 生成 JWT Token
4. 设置会话数据

### Session 处理器

| 处理器          | 说明                      |
| --------------- | ------------------------- |
| `session.start` | 启动会话（0.10.3 后废弃） |
| `session.get`   | 获取会话数据              |
| `session.set`   | 设置会话数据              |
| `session.dump`  | 获取所有会话数据          |

### 登录示例（0.10.3+）

```js
function Login(payload) {
  const { username, password } = payload;

  // 查询用户
  const user = Process('models.user.Get', {
    select: ['id', 'name', 'password'],
    wheres: [{ column: 'name', value: username }],
    limit: 1
  });

  if (!user) {
    throw new Exception('用户不存在', 400);
  }

  // 验证密码
  const isValid = Process('utils.pwd.Verify', password, user.password);
  if (!isValid) {
    throw new Exception('密码错误', 400);
  }

  // 生成 Session ID
  const sessionId = Process('utils.str.UUID');
  const timeout = 3600;

  // 生成 JWT
  const jwt = Process(
    'utils.jwt.Make',
    user.id,
    {},
    {
      timeout: timeout,
      sid: sessionId
    }
  );

  // 设置会话数据
  Process('session.set', 'user', user, timeout, sessionId);
  Process('session.set', 'user_id', user.id, timeout, sessionId);
  Process('session.set', 'token', jwt.token, timeout, sessionId);

  return {
    token: jwt.token,
    expires_at: jwt.expires_at,
    user: user
  };
}
```

## Service API

### 定义 Service

在 `services/` 目录创建 JS 文件：

```js
// services/schema.js
function getTables() {
  const list = Process('schemas.default.Tables');
  return { rows: list.map((table) => ({ item: table })) };
}
```

### 调用 Service

```bash
POST /api/__yao/app/service/schema
Content-Type: application/json

{
  "args": [],
  "method": "getTables"
}
```

## 文件上传下载

### 上传

```json
{
  "path": "/upload",
  "method": "POST",
  "process": "fs.system.Upload",
  "in": ["$file.file"],
  "out": {
    "status": 200,
    "type": "application/json"
  }
}
```

### 下载

```json
{
  "path": "/download",
  "method": "GET",
  "process": "fs.system.Download",
  "in": ["$query.name"],
  "out": {
    "status": 200,
    "body": "{{content}}",
    "headers": {
      "Content-Type": "{{type}}"
    }
  }
}
```

### 自定义上传

```js
function upload(file) {
  const content = Process('fs.system.ReadFile', file.tempFile);
  const filename = `/data/${Date.now()}`;
  Process('fs.system.WriteFile', filename, content, '0644');
  return `/api/storage/download?name=${filename}`;
}
```

## 错误处理

### 错误码规范

| 范围                      | 说明             |
| ------------------------- | ---------------- |
| 400-499                   | 用户输入错误     |
| 500-599                   | 服务器错误       |
| 418-420, 432-450, 452-499 | 自定义用户错误   |
| 512-599                   | 自定义服务器错误 |

### 常见错误码

| 状态码 | 说明               |
| ------ | ------------------ |
| 400    | 输入数据不符合要求 |
| 401    | 未登录             |
| 403    | 权限不足           |
| 404    | 资源不存在         |
| 413    | 数据越界           |
| 500    | 服务器异常         |
| 503    | 服务暂时不可用     |
| 504    | 连接超时           |

### 错误响应格式

```json
{
  "code": 500,
  "message": "错误描述",
  "context": {
    "field": "具体字段"
  }
}
```

## 内置 API

### 应用服务 API

- `GET /api/__yao/app/setting` - 获取应用配置
- `POST /api/__yao/app/setting` - 更新应用配置
- `GET /api/__yao/app/menu` - 获取菜单
- `POST /api/__yao/app/service/:name` - 调用 Service
- `POST /api/__yao/app/setup` - 应用初始化
- `POST /api/__yao/app/check` - 应用检查

### 登录 API

- `POST /api/__yao/login/admin` - 管理员登录
- `POST /api/__yao/login/user` - 用户登录

### Table API

自动生成：

- `POST /api/__yao/table/:id/search` - 搜索
- `GET /api/__yao/table/:id/get` - 获取
- `GET /api/__yao/table/:id/find/:primary` - 按主键查找
- `POST /api/__yao/table/:id/save` - 保存
- `POST /api/__yao/table/:id/create` - 创建
- `POST /api/__yao/table/:id/update/:primary` - 更新
- `DELETE /api/__yao/table/:id/delete/:primary` - 删除

## 完整示例

```json
{
  "name": "用户管理 API",
  "version": "1.0.0",
  "description": "用户相关接口",
  "group": "user",
  "guard": "bearer-jwt",
  "paths": [
    {
      "label": "用户登录",
      "path": "/login",
      "method": "POST",
      "guard": "-",
      "process": "scripts.user.Login",
      "in": ["$payload.username", "$payload.password"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "label": "获取用户信息",
      "path": "/:id",
      "method": "GET",
      "process": "models.user.Find",
      "in": ["$param.id"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "label": "用户列表",
      "path": "/list",
      "method": "GET",
      "process": "models.user.Paginate",
      "in": [":query-param", "$query.page", "$query.pagesize"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "label": "上传头像",
      "path": "/avatar",
      "method": "POST",
      "process": "scripts.user.UploadAvatar",
      "in": ["$file.avatar", "$session.user_id"],
      "out": {
        "status": 200,
        "type": "application/json"
      }
    },
    {
      "label": "AI 对话",
      "path": "/chat",
      "method": "POST",
      "process": "scripts.ai.ChatStream",
      "in": [":payload"],
      "out": {
        "status": 200,
        "type": "text/event-stream; charset=utf-8"
      }
    }
  ]
}
```

## 最佳实践

1. **分组命名**：按业务模块分组，如 `user`, `order`, `product`
2. **路径命名**：使用小写和连字符，如 `/user-profile`
3. **版本管理**：重要修改时升级版本号
4. **认证控制**：公开接口显式设置 `guard: "-"`
5. **错误处理**：使用标准错误码，提供清晰的错误信息
6. **流式 API**：仅在需要实时数据传输时使用 SSE
7. **文件处理**：使用内置处理器 `fs.system.Upload/Download`
8. **会话管理**：合理设置超时时间，避免内存泄漏

## 注意事项

1. 0.10.3 版本后，`session.start` 已废弃，需使用 `utils.str.UUID` 生成 Session ID
2. 流式 API 处理器必须是 JS 脚本
3. Guard 函数不应执行耗时操作
4. 自定义 Guard 抛出 Exception 会终止请求
5. QueryParam 仅支持部分模型处理器
6. 文件上传后需及时处理，临时文件会被自动清理
