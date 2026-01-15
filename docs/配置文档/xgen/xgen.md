# xgen 配置

在 Yao 中内置了 xgen/cui 作为管理端（后端提供配置与数据接口，前端负责渲染）。

本文档描述 **Xgen 最小可运行配置** 与 `app.*` 里和 Xgen 相关的核心字段，并把菜单配置的“返回结构约定”说明清楚。

---

## 1. 相关接口与处理器

`widgets/app` 会注册以下接口/处理器（节选）：

- **Setting（应用配置）**
  - `GET /api/__yao/app/setting` → 默认 `yao.app.Xgen`
  - `POST /api/__yao/app/setting` → 默认 `yao.app.Xgen`（可传 `{ "sid": "...", "lang": "zh-cn" }`）
- **Menu（菜单）**
  - `GET /api/__yao/app/menu` → `yao.app.Menu`
- **Icons（图标资源）**
  - `GET /api/__yao/app/icons/:name` → `yao.app.Icons`

> 说明：`yao.app.Xgen` 会在运行时合并 `app.*`（应用 DSL）与 `logins/*.login.*`（登录 DSL），并返回给前端。

---

## 2. 配置文件位置与读取优先级

### 2.1 `app.*`（应用根目录）

按以下优先级读取：

1. `app.yao`
2. `app.jsonc`
3. `app.json`

并支持环境变量替换：`$ENV.VAR_NAME`（若环境变量为空则保留原字符串）。

### 2.2 `logins/*`（应用根目录）

Xgen 登录相关配置默认从 `logins` 目录读取（支持 `.yao/.jsonc/.json`）：

- `logins/admin.login.*`
- `logins/user.login.*`

详见：`login.md`。

---

## 3. 最小配置清单（建议）

要让 xgen/cui 正常运行，建议至少具备以下内容：

### 3.1 配置用户主数据与登录

- **用户模型**：管理员模型 `admin.user`
  - 示例文件：`models/admin.user.mod.yao`
  - 初始化管理员账号可以在模型中配置 `values` 节点

- **登录配置**：在 `logins` 目录下创建登录 DSL
  - `logins/admin.login.yao`
  - `logins/user.login.yao`

- **icons 目录**：提供默认图标资源
  - `icons/app.icon`
  - `icons/app.png`

### 3.2 配置用户登录后的菜单

在 `app.*` 中配置 `menu.process`，用于生成登录后菜单。

```json
{
  "menu": {
    "process": "flows.app.menu",
    "args": []
  }
}
```

- `menu.process`：必填，菜单处理器名。
- `menu.args`：可选，调用参数列表。

`yao.app.Menu` 在调用 `menu.process` 时会自动附加传入参数 `"$query.locale"`（对应 `GET /api/__yao/app/menu?locale=zh-cn`）。

菜单数据结构（返回约定与字段说明）详见：`menu.md`。

---

## 4. `app.*` 中与 Xgen 相关的字段（摘要）

`widgets/app` 只解析 `app.*` 中与 Xgen 前端相关的一小部分字段（其余字段由引擎启动期的配置使用）：

- `name` / `short` / `description` / `version`
- `theme`
- `lang`
- `adminRoot`：管理端路由根路径（用于替换 CUI 前端中的 `__yao_admin_root`）
- `menu`：菜单处理器配置（见上）
- `optional`：可选项透传给前端
- `token`：Token 持久化等策略透传给前端
- `setting`：自定义 Setting/Xgen 输出处理器（默认 `yao.app.Xgen`）
- `setup`：安装完成后的 Hook（默认 `yao.app.Setup`）

更完整的 `yao.app.Xgen` 输出字段说明见：`xgen_config.md`。

---

## 5. 相关文档

- `menu.md`：菜单配置（`menu.process` 返回约定）
- `login.md`：登录配置（`logins/*.login.*`）
- `xgen_config.md`：`yao.app.Xgen` 输出结构与字段详解
