# xgen 菜单配置（`menu.process` 返回约定）

Xgen（CUI 管理端）在用户登录后，需要从后端获取一份“当前用户可访问的菜单数据”，用于渲染左侧导航、右上角设置入口、快捷入口等。

菜单数据由 `app.*` 中的 `menu.process` 指定的处理器负责生成，默认通过 `yao.app.Menu` 调用。

- `app.*`：`menu.process` 必填，`menu.args` 可选
- 默认接口：`GET /api/__yao/app/menu`
  - 会把 `menu.args` 作为参数传入
  - 并在最后**追加** `locale`（实际传入为 `$query.locale`）

> 重要：`menu.process` 的“最终返回值”应当是一个对象，**顶层包含 `items` / `setting`（以及可选 `quick`）**。

---

## 1. `app.*` 中的 `menu` 配置

```json
{
  "menu": {
    "process": "flows.app.menu",
    "args": []
  }
}
```

- **process**: string，必填。菜单数据处理器名。
- **args**: array，可选。调用处理器时的参数列表。

`yao.app.Menu` 会执行：

- 仅传入 `menu.args`（例如登录流程中）
- 或传入 `menu.args + locale`（通过 `GET /api/__yao/app/menu?locale=zh-cn` 拉取时）

因此你的 `menu.process` 应能够兼容“最后一个参数可能是 locale”。

---

## 2. `menu.process` 的返回结构

`menu.process` 建议返回如下结构（字段可增减，但 `items`/`setting` 建议始终存在，测试也会校验）：

```json
{
  "items": [],
  "setting": [],
  "quick": []
}
```

- **items**: array，主菜单（通常对应左侧导航）。
- **setting**: array，设置/个人菜单（常用于右上角“设置/管理员”等入口）。
- **quick**: array，可选，快捷入口（用于首页快捷区、顶部快捷入口等，取决于前端实现）。

---

## 3. 菜单项（MenuItem）字段说明

菜单项为一个树形结构节点（通过 `children` 递归）。常用字段如下：

| 字段       | 类型   | 必填 | 说明                                                                                               |
| ---------- | ------ | ---- | -------------------------------------------------------------------------------------------------- |
| `name`     | string | 是   | 显示名称；建议支持国际化（例如 `::Dashboard`）                                                     |
| `path`     | string | 否   | 路由/跳转地址；可为 Xgen 内置路由（如 `/x/Table/...`）或自定义页面（如 `/setting`、`/iframe?...`） |
| `icon`     | string | 否   | 图标名称（如 `icon-book`）                                                                         |
| `children` | array  | 否   | 子菜单数组                                                                                         |

以下字段在示例中出现，但后端不会强制校验；具体含义由前端（CUI/Xgen）决定，通常用于增强展示：

| 字段           | 类型           | 说明                                  |
| -------------- | -------------- | ------------------------------------- |
| `id`           | number/string  | 菜单 ID（可用于排序/定位/权限映射等） |
| `badge`        | number         | 徽标数字（例如未读数）                |
| `dot`          | boolean        | 小红点（例如提醒）                    |
| `visible_menu` | number/boolean | 是否在菜单中显示（示例里为 `0/1`）    |
| `blocks`       | number         | 布局/展示相关参数（示例里为 `0`）     |

---

## 4. 示例

### 4.1 作为 Flow（`flows/*.flow.yao`）时的写法

如果你的 `menu.process` 指向一个 Flow（例如 `flows.app.menu`），那么 Flow DSL 文件通常包含 `name`/`nodes`/`output` 等元信息。

注意：**Flow 执行后的返回值通常是 `output` 节点对应的数据**，也就是最终返回给前端的菜单对象（顶层应含 `items/setting/...`）。

初始化模板中的示例（节选自 `flows/app/menu.flow.yao`）：

```json
{
  "name": "APP Menu",
  "nodes": [],
  "output": {
    "setting": [
      { "name": "系统设置", "path": "/setting", "icon": "icon-settings" }
    ],
    "items": [
      {
        "name": "演示",
        "path": "/x/Dashboard/kanban",
        "icon": "icon-book",
        "children": [
          {
            "name": "看板",
            "path": "/x/Dashboard/kanban",
            "icon": "icon-activity"
          }
        ]
      }
    ]
  }
}
```

### 4.2 直接返回菜单对象（脚本/处理器）

如果你的 `menu.process` 是脚本/自定义处理器，直接返回即可：

```json
{
  "items": [
    { "name": "图表", "path": "/x/Chart/dashboard", "icon": "icon-activity" },
    {
      "name": "表格",
      "icon": "icon-book",
      "path": "/x/Table/pet",
      "children": [
        { "name": "宠物列表", "path": "/x/Table/pet", "icon": "icon-book" },
        { "name": "环境变量", "path": "/x/Table/env", "icon": "icon-settings" }
      ]
    }
  ],
  "setting": [
    { "icon": "icon-settings", "name": "系统设置", "path": "/setting" }
  ],
  "quick": [
    { "icon": "icon-activity", "name": "图表", "path": "/x/Chart/dashboard" }
  ]
}
```

---

## 5. 相关文档

- `xgen.md`：Xgen 最小配置与 `app.* / logins/* / icons/*` 的整体说明
- `login.md`：登录 DSL 配置
- `xgen_config.md`：`yao.app.Xgen` 输出结构与字段详解
