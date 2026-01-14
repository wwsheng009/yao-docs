---
name: form
description: Deep analysis of Yao Form DSL parsing, covering core struct mapping, action behavior, and layout definitions.
license: Complete terms in LICENSE.txt
---

# Yao Form DSL 解析深度分析报告

本文档分析Yao 引擎（Golang）内部的映射关系与处理逻辑。

## 1\. 核心结构体映射概览

Yao 引擎在加载 Form 时，主要通过 `widgets/form/types.go` 中定义的结构体进行反序列化。

| JSON Key | Golang Struct Field | 类型 (Type)              | 说明                                |
| :------- | :------------------ | :----------------------- | :---------------------------------- |
| `name`   | `DSL.Name`          | `string`                 | 表单名称，支持 `::` 国际化语法      |
| `action` | `DSL.Action`        | `*ActionDSL`             | 定义数据交互行为与模型绑定          |
| `layout` | `DSL.Layout`        | `*LayoutDSL`             | 定义页面布局结构                    |
| `fields` | `DSL.Fields`        | `*FieldsDSL`             | 定义字段的具体属性、Hook 和计算逻辑 |
| `config` | `DSL.Config`        | `map[string]interface{}` | 其他配置项                          |

## 2\. Action (行为层) 解析

在 `list.form.json` 中，`action` 部分定义了数据模型的绑定：

```json
"action": {
  "bind": {
    "model": "pet",
    "option": {
      "withs": { "categories": { ... } }
    }
  }
}
```

### 源码实现分析

该部分映射到 `widgets/form/types.go` 中的 **`ActionDSL`** 和 **`BindActionDSL`** 结构体。

- **模型绑定**: `model: "pet"` 映射到 `BindActionDSL.Model`。
- **查询选项**: `option` 映射到 `BindActionDSL.Option`。这里定义的 `withs` 参数会直接传递给底层 ORM (Gou Model) 的查询过程。

**处理逻辑 (`widgets/form/action.go`):**
当 `dsl.parse()` 被调用时，会触发 `SetDefaultProcess()`。如果设置了 `Bind`，`BindModel` 方法会被调用：

1.  **自动生成 Process**: 引擎会自动将 `Find`, `Save`, `Create`, `Update`, `Delete` 等操作绑定到 `models.pet.Find`, `models.pet.Save` 等处理器上。
2.  **注入 Option**: 配置中的 `option` (即 `withs` 查询) 会被注入到 `Find` 操作的默认参数中 (`act.Find.Default[1] = act.Bind.Option`)，从而实现关联数据的自动查询。

## 3\. Layout (布局层) 解析

配置定义了表单的视觉结构：

```json
"layout": {
  "primary": "id",
  "form": {
    "props": {},
    "sections": [
      {
        "columns": [
          { "name": "住院天数", "width": 8 },
          ...
        ]
      }
    ]
  },
  "config": { "showAnchor": true }
}
```

### 源码实现分析

该部分映射到 **`LayoutDSL`** 结构体。

- **主键**: `primary` 映射到 `LayoutDSL.Primary`。
- **视图结构**: `form` 映射到 `ViewLayoutDSL`。
- **分栏布局**: `sections` 映射到 `[]SectionDSL`，其中的 `columns` 映射到 `[]Column`。
- **列引用**: `columns` 中的 `name` ("住院天数" 等) **并不是直接定义字段**，而是引用 `fields` 中定义的字段键值。这在 `widgets/form/layout.go` 的 `Xgen` 方法中被解析，用于组装最终发往前端的配置。

## 4\. Fields (字段层) 解析与计算属性

这是配置中最复杂的部分，涉及数据绑定、UI 组件渲染以及 **Compute (计算属性)**。

```json
"fields": {
  "form": {
    "列表": {
      "bind": "categories",
      "view": { "compute": "scripts.pet.CategoryList" },
      "edit": {
        "type": "List",
        "compute": {
          "process": "scripts.pet.CategorySave",
          "args": ["$C(row.id)", "$C(value)"]
        },
        ...
      }
    }
    ...
  }
}
```

### 源码实现分析

该部分映射到 `widgets/form/types.go` 中的 **`FieldsDSL`**，内部是一个 `field.Columns` (即 `map[string]field.ColumnDSL`)。

#### 核心机制：Compute 与 V8go 集成

在 `列表` 字段中，我们看到了 Yao 引擎核心能力之一：**动态计算**。

1.  **View Compute (`scripts.pet.CategoryList`)**:
    - 当读取数据 (`Find`) 时，引擎会加载 `categories` 字段的数据。
    - 由于定义了 `view.compute`，Yao 引擎会调用嵌入的 V8 引擎执行 `scripts/pet.js` 中的 `CategoryList` 函数，将处理后的结果返回给前端。

2.  **Edit Compute (`scripts.pet.CategorySave`)**:
    - 这是一个典型的 **Hook** 机制。
    - 当表单保存 (`Save/Update`) 时，`edit.compute` 被触发。
    - **Args 解析**: `"$C(row.id)"` 和 `"$C(value)"` 是 Yao 的 DSL 变量语法。引擎解析时，会将其替换为当前行的 ID 和当前字段的值。
    - **执行**: `scripts.pet.CategorySave` 函数在 V8 中执行，允许开发者在保存数据前对数据结构进行转换（例如将前端的 List 结构转换为数据库的关联关系结构）。

## 5\. 引擎加载流程总结 (`widgets/form/form.go`)

根据源代码，Yao 引擎加载这个 Form 的流程如下：

1.  **Load (加载)**: `Load` 函数扫描 `forms/` 目录，找到 `list.form.json`。
2.  **Parse (解析)**:
    - 调用 `application.Parse` 将 JSON 字节流反序列化为 `DSL` 结构体。
    - 调用 `dsl.parse()`。
3.  **Binding (绑定)**:
    - 触发 `BindModel`，根据 `action.bind.model="pet"`，自动生成 CRUD 的处理器定义。
4.  **Xgen (转换)**:
    - 当 API 请求 `GET /api/__yao/form/list/setting` 时，`dsl.Xgen()` 方法被调用。
    - 它会过滤掉敏感字段，根据 `Layout` 中的列名引用，从 `Fields` 中提取具体的字段配置，组装成前端 Xgen 框架可用的 JSON 结构。

这份分析展示了 Yao 如何通过 Golang 的强类型结构体来承载灵活的 JSON 配置，并通过内置的处理器机制（Golang Process 和 V8 Script）实现了高度可扩展的业务逻辑。如有关于具体 Process 实现或 V8 交互的疑问，请随时提问。
