# Xgen 配置（`yao.app.Xgen`）

## 概述

Xgen 管理端在启动时会通过 `widgets/app` 输出一份**前端运行时配置**，默认由处理器 `yao.app.Xgen` 生成（HTTP 接口：`GET/POST /api/__yao/app/setting`）。

这份配置会**合并两类来源**：

- **应用配置文件 `app.*`**：提供应用基础信息、主题、语言、`optional`、`token` 等（解析结构体为 `widgets/app/types.go` 的 `DSL`，与 `share.AppInfo` 不同）。
- **登录配置 `logins/*.login.*`**：提供管理员/用户登录页布局、登录接口、验证码接口、第三方登录入口等（详见 `login.md`）。

## 配置文件位置与读取优先级

### `app.*`（应用根目录）

按以下优先级读取：

1. `app.yao`
2. `app.jsonc`
3. `app.json`

并支持环境变量替换：`$ENV.VAR_NAME`（若环境变量为空则保留原字符串）。

### `logins/*`（应用根目录）

默认从 `logins` 目录读取登录 DSL 文件：

- `logins/admin.login.yao` / `logins/admin.login.jsonc` / `logins/admin.login.json`
- `logins/user.login.yao` / `logins/user.login.jsonc` / `logins/user.login.json`

## `yao.app.Xgen` 输出结构（关键字段）

`yao.app.Xgen` 会返回一个对象，常用字段包括：

- **基础信息**：`name`、`description`、`version`
- **运行时信息**：`mode`（来自 `YAO_ENV`，默认为 `production`）、`apiPrefix`（固定 `__yao`）
- **主题与语言**：`theme`、`lang`
- **资源**：`logo`、`favicon`（会根据 OpenAPI BaseURL 进行动态拼接/替换）
- **可选项透传**：`optional`（来自 `app.*` 的 `optional` 节点）
- **Token 配置透传**：`token`（来自 `app.*` 的 `token` 节点，用于前端持久化策略等）
- **登录配置**：`login`（由 `logins/*.login.*` 生成，包含 `entry`、`admin`、`user`、`thirdPartyLogin` 等）

> 备注：登录接口与验证码接口会自动拼接为：
>
> - `__yao/login/{id}`
> - `__yao/login/{id}/captcha?type=digit`

## `app.*` 中与 Xgen 相关的字段

`widgets/app` 只解析 `app.*` 中与 Xgen 前端相关的一小部分字段（其余字段由引擎启动期的 `AppInfo` 使用）：

- `name` / `short` / `description` / `version`
- `theme`
- `lang`
- `adminRoot`
- `menu`
- `optional`
- `token`
- `setting`（自定义 Setting/Xgen 输出处理器名）
- `setup`（安装完成后的 Hook）

## 菜单配置（登录后必需）

Xgen 在**登录成功后**需要拿到当前用户可访问的菜单数据，用于构建左侧菜单、路由入口等。

- 登录处理器（例如内置 `yao.login.admin`）会在签发 Token 后调用 `yao.app.menu` 获取 `menus` 并返回给前端。
- 同时也提供独立接口：`GET /api/__yao/app/menu`（会自动把 `locale` 作为最后一个参数传入）。

### 必填字段：`menu.process`

你必须在 `app.*` 中配置：

- `menu.process`: string，菜单数据的进程名（例如 `flows.app.menu`）

若缺失，调用 `yao.app.Menu` 会直接抛错：`menu.process is required`（HTTP 400）。

### 可选字段：`menu.args`

- `menu.args`: array，可选参数列表
- 当通过 `GET /api/__yao/app/menu` 请求菜单时，系统会在 `menu.args` 后**追加**一个参数：`$query.locale`（即 `?locale=zh-cn` 之类）

因此，你的 `menu.process` 需要能处理：

- 仅 `menu.args`（登录流程里通常没有 locale 参数）
- `menu.args + locale`（通过菜单接口拉取时）

### 返回数据约定（建议）

`menu.process` 建议返回：

- `items`: 菜单项数组
- `setting`: 菜单设置（例如布局、展开策略等）

> 具体结构取决于你的前端（Xgen）实现，但至少要能驱动“菜单渲染 + 路由入口”。

## 示例

### 1) `app.yao`：配置 `menu` + 透传 `optional` 与 `token`

```json
{
  "name": "My App",
  "adminRoot": "admin",
  "theme": "light",

  "menu": {
    "process": "flows.app.menu",
    "args": ["demo"]
  },

  "optional": {
    "remoteCache": true,
    "hideNotification": false
  },
  "token": {
    "driver": "localStorage",
    "key": "__yao_token"
  }
}
```

### 2) `logins/admin.login.yao`：配置登录入口与布局

登录布局/入口请参考 `login.md`；配置完成后会反映到 `yao.app.Xgen` 返回的 `login.*` 字段中。
