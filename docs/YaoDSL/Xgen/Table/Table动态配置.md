# CUI 动态表格配置说明

## 概述

CUI（通用用户界面）动态表格配置用于在没有数据库模型定义的情况下，通过配置文件或程序化方式实现表格数据的展示。动态表格配置与静态表格配置均无需绑定数据库模型（即无需`"bind": "models"`），但在实现方式和灵活性上存在显著差异。本文档将详细说明两种配置方式的实现方法、区别与联系，并补充相关逻辑说明。

---

## 应用场景

动态表格配置适用于以下场景：

- 无需创建数据库表或定义模型，但需要展示列表数据。
- 需要灵活地通过代码动态生成表格字段或布局。
- 需要根据运行时条件（如用户输入或外部数据）动态调整表格配置。

静态表格配置适用于字段和布局相对固定的场景，而动态表格配置则更适合需要动态生成或频繁更新的场景。

---

## 静态表格配置

### 实现方式

静态表格配置通过在 JSON 配置文件中定义表格的字段和布局，适用于字段和布局相对固定的场景。配置文件通常位于 `tables/models.json`，包含以下关键部分：

- **`action`**：定义处理器，包括 `setting` 和 `search` 处理器。
- **`fields`**：定义表格字段，包括筛选字段（`filter`）和表格字段（`table`）。
- **`layout`**：定义表格布局，包括表头（`header`）、筛选区域（`filter`）和表格主体（`table`）。

### 示例代码

以下是一个静态表格配置的 JSON 文件示例：

```json
{
  "name": "models",
  "action": {
    "search": {
      "process": "scripts.model.search"
    }
  },
  "fields": {
    "filter": {
      "模型": {
        "bind": "where.model.eq",
        "edit": {
          "props": {
            "options": [],
            "placeholder": "please select 模型"
          },
          "type": "Select"
        }
      }
    },
    "table": {
      "模型": {
        "bind": "model",
        "view": {
          "props": {
            "options": [],
            "placeholder": "please select 模型"
          },
          "type": "Text"
        }
      }
    }
  },
  "layout": {
    "name": "模型",
    "header": {
      "actions": [],
      "preset": {}
    },
    "filter": {
      "actions": [],
      "columns": [
        {
          "name": "模型"
        }
      ]
    },
    "primary": "model",
    "table": {
      "columns": [
        {
          "name": "模型",
          "width": 160
        }
      ],
      "operation": {
        "hide": true,
        "actions": []
      }
    }
  }
}
```

### 逻辑说明

1. **字段定义**：
   - `fields.filter`：定义筛选区域的字段，例如“模型”字段使用 `Select` 组件，支持下拉选择。
   - `fields.table`：定义表格展示字段，例如“模型”字段使用 `Text` 组件展示数据。
   - `bind` 属性用于将字段与数据源或查询条件关联，例如 `where.model.eq` 表示筛选条件，`model` 表示数据字段。

2. **布局定义**：
   - `layout.header`：定义表头区域，可包含操作按钮或预设内容。
   - `layout.filter`：定义筛选区域的布局，指定显示的筛选字段。
   - `layout.table`：定义表格主体的列，包含列名、宽度等属性。
   - `primary`：指定主键字段，用于标识数据行。

3. **处理器**：
   - `action.search`：指向 `scripts.model.search` 处理器，用于获取表格数据。
   - 无 `setting` 处理器，因为字段和布局已在 JSON 文件中静态定义。

### 优点与局限性

- **优点**：
  - 配置简单，适合字段和布局固定的场景。
  - 无需额外编程，维护成本低。
- **局限性**：
  - 灵活性较低，无法根据运行时条件动态调整字段或布局。
  - 修改配置需要更改 JSON 文件，可能需要重启服务生效。

---

## 动态表格配置

### 实现方式

动态表格配置通过程序化方式生成表格字段和布局，配置文件仅需定义处理器路径，具体配置由代码动态返回。配置文件同样位于 `tables/models.json`，但无需 `fields` 和 `layout` 字段，改由 `action.setting` 处理器动态生成。

### 示例代码

以下是一个动态表格配置的 JSON 文件示例：

```json
{
  "name": "models",
  "action": {
    "setting": {
      "process": "scripts.model.setting"
    },
    "search": {
      "process": "scripts.model.search"
    }
  }
}
```

对应的动态表格处理器代码位于 `scripts/model.ts`：

```ts
function setting(tableId: string) {
  return {
    fields: {
      filter: {
        模型: {
          bind: 'where.model.eq',
          edit: {
            props: {
              options: [],
              placeholder: 'please select 模型'
            },
            type: 'Select'
          }
        }
      },
      table: {
        模型: {
          bind: 'model',
          view: {
            props: {
              options: [],
              placeholder: 'please select 模型'
            },
            type: 'Text'
          }
        }
      }
    },
    name: '模型',
    header: {
      actions: [],
      preset: {}
    },
    filter: {
      actions: [],
      columns: [
        {
          name: '模型'
        }
      ]
    },
    primary: 'model',
    table: {
      columns: [
        {
          name: '模型',
          width: 160
        }
      ],
      operation: {
        hide: true,
        actions: []
      }
    }
  };
}

function search(
  param: YaoQueryParam.QueryParam,
  page: number = 1,
  pagesize: number = 20
) {
  return {
    data: [
      {
        // 数据
      }
    ],
    next: -1,
    page: 1,
    pagecnt: 1,
    pagesize: 20,
    prev: -1,
    total: 1
  };
}
```

### 逻辑说明

1. **配置文件**：
   - 仅定义 `action.setting` 和 `action.search` 处理器路径。
   - 不包含 `fields` 和 `layout`，这些内容由 `setting` 函数动态生成。

2. **setting 处理器**：
   - `setting` 函数返回完整的表格配置，包括 `fields` 和 `layout`。
   - 字段定义与静态配置一致，但支持动态生成。例如，可根据 `tableId` 或其他运行时参数动态调整 `options` 或列宽。
   - 不需要额外的 `layout` 节点，配置直接嵌入返回对象。

3. **search 处理器**：
   - `search` 函数返回表格数据，包含分页信息（`page`、`pagecnt`、`pagesize`等）和数据内容（`data`）。
   - 数据结构需与 `setting` 函数定义的字段一致，例如包含 `model` 字段。

4. **动态生成逻辑**：
   - 可通过外部数据源（如 API 调用）或条件逻辑动态生成 `fields` 和 `layout`。
   - 例如，`options` 数组可从数据库或远程服务动态获取，列宽可根据数据量动态调整。

### 优点与局限性

- **优点**：
  - 高度灵活，可根据运行时条件动态生成表格配置。
  - 支持复杂逻辑，例如动态字段、条件渲染等。
- **局限性**：
  - 实现复杂，需要编写和维护额外的代码。
  - 调试难度较高，配置错误可能导致运行时异常。

---

## 静态与动态表格配置的区别与联系

### 联系

1. **无需模型绑定**：
   - 两者均无需绑定数据库模型（即无需 `"bind": "models"`）。
   - 适用于无数据库表或临时数据展示的场景。

2. **处理器支持**：
   - 两者均通过 `action.search` 处理器获取数据。
   - 配置文件均位于 `tables/models.json`。

3. **字段与布局结构**：
   - 两者最终生成的字段（`fields`）和布局（`layout`）结构一致，包含筛选区域、表格主体等。

### 区别

| 特性            | 静态表格配置                             | 动态表格配置                              |
| --------------- | ---------------------------------------- | ----------------------------------------- |
| **配置方式**    | JSON 文件中静态定义 `fields` 和 `layout` | 代码动态 Godot生成的动态配置              |
| **处理器**      | 仅需 `search` 处理器                     | 需 `setting` 和 `search` 处理器           |
| **灵活性**      | 固定配置，修改需更改文件                 | 动态生成，支持运行时调整                  |
| **维护成本**    | 低，适合固定场景                         | 高，需编写和调试代码                      |
| **layout 节点** | 需在 JSON 中定义                         | 嵌入 `setting` 函数返回对象，无需额外节点 |

---

## 使用建议

- **静态表格配置**：适用于字段和布局固定的简单场景，例如展示固定格式的报表或列表。
- **动态表格配置**：适用于需要动态字段、复杂逻辑或运行时调整的场景，例如根据用户角色动态显示不同列。
- **结合使用**：可结合静态配置定义基础结构，动态配置处理特殊逻辑，以平衡灵活性和维护成本。

---

## 总结

CUI 动态表格配置通过静态或动态方式实现无模型绑定的表格展示。静态配置简单易用但灵活性有限，动态配置通过代码实现高度灵活但维护成本较高。根据实际需求选择合适的配置方式，可有效提升开发效率和用户体验。
