# Yao List 配置文档

## 概述

List 是 Yao 框架中用于展示和编辑数据列表的组件，支持数据查询、展示、编辑、删除等操作。List 配置文件通常位于 `lists/` 目录下，支持 `.json`、`.jsonc`、`.yao` 格式。

## 基本结构

```json
{
  "name": "列表名称",
  "action": {
    "bind": {
      "model": "模型名称",
      "store": "存储名称",
      "table": "表格名称",
      "option": {}
    },
    "setting": {},
    "component": {},
    "upload": {},
    "download": {},
    "get": {},
    "save": {},
    "before:get": {},
    "after:get": {},
    "before:save": {},
    "after:save": {}
  },
  "layout": {
    "list": {
      "props": {},
      "columns": []
    },
    "config": {}
  },
  "fields": {
    "list": {
      "字段名": {
        "key": "字段键名",
        "bind": "绑定字段",
        "title": "字段标题",
        "type": "字段类型",
        "view": {
          "type": "视图类型",
          "props": {}
        },
        "edit": {
          "type": "编辑类型",
          "props": {}
        }
      }
    }
  },
  "config": {}
}
```

## 详细配置说明

### 1. 基本属性

| 属性     | 类型   | 必填 | 说明           |
| -------- | ------ | ---- | -------------- |
| `name`   | string | 否   | 列表显示名称   |
| `id`     | string | 否   | 列表唯一标识符 |
| `config` | object | 否   | 自定义配置项   |

### 2. Action 配置

#### 2.1 Bind 配置

| 属性     | 类型   | 必填 | 说明               |
| -------- | ------ | ---- | ------------------ |
| `model`  | string | 否   | 绑定的数据模型名称 |
| `store`  | string | 否   | 绑定的数据存储名称 |
| `table`  | string | 否   | 绑定的数据表格名称 |
| `option` | object | 否   | 绑定选项配置       |

#### 2.2 Process 配置

| 属性        | 类型    | 必填 | 默认值 | 说明           |
| ----------- | ------- | ---- | ------ | -------------- |
| `setting`   | Process | 否   | 见下方 | 列表设置处理器 |
| `component` | Process | 否   | 见下方 | 组件处理器     |
| `upload`    | Process | 否   | 见下方 | 文件上传处理器 |
| `download`  | Process | 否   | 见下方 | 文件下载处理器 |
| `get`       | Process | 否   | 见下方 | 数据获取处理器 |
| `save`      | Process | 否   | 见下方 | 数据保存处理器 |

**默认 Process 配置：**

- `setting`: `yao.list.Xgen`
- `component`: `yao.list.Component`
- `upload`: `yao.list.Upload`
- `download`: `fs.system.Download`
- `get`: `yao.list.Get`
- `save`: `yao.list.Save`

#### 2.3 Hook 配置

| 属性          | 类型 | 必填 | 说明           |
| ------------- | ---- | ---- | -------------- |
| `before:get`  | Hook | 否   | 获取数据前钩子 |
| `after:get`   | Hook | 否   | 获取数据后钩子 |
| `before:save` | Hook | 否   | 保存数据前钩子 |
| `after:save`  | Hook | 否   | 保存数据后钩子 |

### 3. Layout 配置

#### 3.1 List 布局

| 属性      | 类型   | 必填 | 说明         |
| --------- | ------ | ---- | ------------ |
| `props`   | object | 否   | 列表属性配置 |
| `columns` | array  | 否   | 列配置数组   |

**列配置 (Column):**

```json
{
  "name": "列名称",
  "title": "列标题",
  "width": 12,
  "props": {}
}
```

#### 3.2 Config 配置

| 属性     | 类型   | 必填 | 说明       |
| -------- | ------ | ---- | ---------- |
| `config` | object | 否   | 布局配置项 |

### 4. Fields 配置

#### 4.1 List 字段

| 属性    | 类型   | 必填 | 说明           |
| ------- | ------ | ---- | -------------- |
| `key`   | string | 是   | 字段唯一标识   |
| `bind`  | string | 否   | 绑定的数据字段 |
| `title` | string | 否   | 字段显示标题   |
| `type`  | string | 否   | 字段数据类型   |

#### 4.2 View 配置

| 属性      | 类型    | 必填 | 说明         |
| --------- | ------- | ---- | ------------ |
| `type`    | string  | 否   | 视图组件类型 |
| `props`   | object  | 否   | 视图组件属性 |
| `compute` | Compute | 否   | 计算属性配置 |

#### 4.3 Edit 配置

| 属性      | 类型    | 必填 | 说明         |
| --------- | ------- | ---- | ------------ |
| `type`    | string  | 否   | 编辑组件类型 |
| `props`   | object  | 否   | 编辑组件属性 |
| `compute` | Compute | 否   | 计算属性配置 |

## 常用字段类型

### 输入类组件

- `Input` - 文本输入框
- `TextArea` - 多行文本输入框
- `Number` - 数字输入框
- `Password` - 密码输入框

### 选择类组件

- `Select` - 下拉选择框
- `Radio` - 单选按钮组
- `Checkbox` - 复选框组
- `Switch` - 开关

### 日期时间组件

- `DatePicker` - 日期选择器
- `DateTimePicker` - 日期时间选择器
- `TimePicker` - 时间选择器

### 文件上传组件

- `Upload` - 文件上传
- `Image` - 图片上传

### 其他组件

- `Tag` - 标签
- `Rate` - 评分
- `Slider` - 滑块

## API 接口

List 组件提供以下 API 接口：

| 方法 | 路径                                           | 说明         |
| ---- | ---------------------------------------------- | ------------ |
| GET  | `/api/__yao/list/:id/setting`                  | 获取列表设置 |
| GET  | `/api/__yao/list/:id/get`                      | 获取列表数据 |
| GET  | `/api/__yao/list/:id/component/:xpath/:method` | 调用组件方法 |
| POST | `/api/__yao/list/:id/save`                     | 保存列表数据 |
| GET  | `/api/__yao/list/:id/upload/:xpath/:method`    | 文件上传     |
| GET  | `/api/__yao/list/:id/download/:field`          | 文件下载     |

## Process 处理器

List 支持以下处理器：

- `yao.list.Setting` - 返回应用 DSL
- `yao.list.Xgen` - 返回 Xgen 设置
- `yao.list.Component` - 返回组件结果
- `yao.list.Upload` - 文件上传
- `yao.list.Download` - 文件下载
- `yao.list.Get` - 返回查询记录
- `yao.list.Save` - 保存记录

## Hook 钩子

支持的生命周期钩子：

- `before:get` - 获取数据前
- `after:get` - 获取数据后
- `before:save` - 保存数据前
- `after:save` - 保存数据后

## 配置示例

参见 `category.list.json` 示例文件。

## 注意事项

1. 文件名即为列表 ID，建议使用有意义的名称
2. 支持多语言，标题可以使用 `::` 前缀定义翻译键
3. 字段的 `key` 属性在列表内必须唯一
4. 组件类型区分大小写
5. 上传文件组件需要配置正确的权限和路径
