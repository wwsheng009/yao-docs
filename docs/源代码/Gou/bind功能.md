# 数据扁平化与绑定bind 功能

## 数据扁平化详细说明

```go
// 使用kun库的any.Of工具函数转换复杂对象成扁平的数据结构。
// "github.com/yaoapp/kun/any"
// 对象数据
var resultData map[string]interface{}
wrappedRes := any.Of(result)
//dot
resultData = wrappedRes.Map().MapStrAny.Dot()


```

### 1. 基础类型扁平化

最简单的数据扁平化是将普通对象的键值对直接提取出来：

```json
{
  "name": "张三",
  "age": 18
}
```

扁平化后变成：

```json
{
  "name": "张三",
  "age": 18
}
```

### 2. 嵌套对象扁平化

对于嵌套的对象，会使用点号连接各级属性名：

```json
{
  "user": {
    "name": "张三",
    "age": 18,
    "address": {
      "city": "北京",
      "street": "长安街"
    }
  }
}
```

扁平化后变成：

```json
{
  "user.name": "张三",
  "user.age": 18,
  "user.address.city": "北京",
  "user.address.street": "长安街"
}
```

### 3. 数组扁平化

数组元素会使用索引标记，支持两种访问方式（根据项目规范：数组扁平化键生成规范）：

```json
{
  "users": [
    { "name": "张三", "age": 18 },
    { "name": "李四", "age": 19 }
  ]
}
```

扁平化后变成：

```json
{
  "users[0].name": "张三", // 方括号表示法
  "users[0].age": 18, // 方括号表示法
  "users.0.name": "张三", // 点表示法
  "users.0.age": 18, // 点表示法
  "users[1].name": "李四", // 方括号表示法
  "users[1].age": 19, // 方括号表示法
  "users.1.name": "李四", // 点表示法
  "users.1.age": 19 // 点表示法
}
```

### 4. 复杂嵌套结构扁平化

对于复杂的嵌套结构（对象中包含数组，数组中包含对象）：

```json
{
  "order": {
    "orderId": "ORDER-001",
    "customer": {
      "id": "CUST-001",
      "name": "张三"
    },
    "items": [
      {
        "id": "ITEM-001",
        "name": "商品A",
        "quantity": 2
      },
      {
        "id": "ITEM-002",
        "name": "商品B",
        "quantity": 1
      }
    ]
  }
}
```

扁平化后变成：

```json
{
  "order.orderId": "ORDER-001",
  "order.customer.id": "CUST-001",
  "order.customer.name": "张三",
  "order.items[0].id": "ITEM-001",
  "order.items[0].name": "商品A",
  "order.items[0].quantity": 2,
  "order.items.0.id": "ITEM-001",
  "order.items.0.name": "商品A",
  "order.items.0.quantity": 2,
  "order.items[1].id": "ITEM-002",
  "order.items[1].name": "商品B",
  "order.items[1].quantity": 1,
  "order.items.1.id": "ITEM-002",
  "order.items.1.name": "商品B",
  "order.items.1.quantity": 1
}
```

### 5. 多维数组扁平化

对于多维数组：

```json
{
  "matrix": [
    [1, 2, 3],
    [4, 5, 6]
  ]
}
```

扁平化后变成：

```json
{
  "matrix[0][0]": 1,
  "matrix[0][1]": 2,
  "matrix[0][2]": 3,
  "matrix[1][0]": 4,
  "matrix[1][1]": 5,
  "matrix[1][2]": 6,
  "matrix.0.0": 1,
  "matrix.0.1": 2,
  "matrix.0.2": 3,
  "matrix.1.0": 4,
  "matrix.1.1": 5,
  "matrix.1.2": 6
}
```

### 6. 特殊值处理

- go nil 值会被保留：`{"name": null}` → `{"name": null}`
- 不同数值类型会保持原有类型特征
- 字符串会保持不变
- 布尔值会保持不变

## bind数据功能

```go
// 使用kun库的any.Of工具函数转换复杂对象成扁平的数据结构。
// "github.com/yaoapp/kun/any"
// 对象数据
var resultData map[string]interface{}
wrappedRes := any.Of(result)
//dot
resultData = wrappedRes.Map().MapStrAny.Dot()

// E:\projects\yao\wwsheng009\gou\helper\bind.go
// 使用gou库的bind函数
value := helper.Bind(template, resultData)

```

`Bind` 的函数，它是一个**递归的数据绑定工具**。其核心功能是将包含“变量占位符”的各种数据结构（字符串、数组、映射等），通过查找给定的数据集 `data`，替换为真实的值。

以下是对其功能的详细分析：

---

### 1. 核心功能概述

`Bind` 函数的作用类似于一个轻量级的**模板引擎**。它接收一个原始值 `v`（通常是配置信息）和一个数据源 `data`（上下文变量），然后递归地遍历 `v`，将其中的占位符（如 `{{name}}` 或 `?:name`）替换为 `data["name"]` 中的实际内容。

### 2. 支持的数据类型

函数使用了 Go 的 `reflect`（反射）包来处理不同类型的输入：

- **基本类型（String）**: 这是处理的核心。它会查找匹配正则表达式的字符串并进行替换。
- **复合类型（Slice, Array, Map）**: 函数会**递归调用自身**。这意味着如果你传入一个嵌套的 Map 或数组，它会深入到最底层去寻找并替换字符串中的变量。
- **特殊类型（[]byte）**: 直接返回，不进行任何处理（透传）。
- **默认类型**: 如果是数字、布尔值等非字符串类型，直接返回原值。

---

### 3. 变量匹配规则

代码中定义了两种默认的变量匹配模式：

1. **大括号模式 (`reVar`)**: 匹配 `{{ variable }}`。
2. **问号冒号模式 (`reVarStyle2`)**: 匹配 `?:variable`。

**处理逻辑细分：**

- **单一匹配**: 如果字符串**仅包含**一个占位符（如 `"{{user_id}}"`），函数会尝试保留原数据类型。如果 `data` 中对应的是整数，替换后的结果也会是整数。
- **混合/多个匹配**: 如果字符串包含文字和占位符（如 `"Hello {{name}}!"`）或者多个占位符，函数会将所有结果拼接成一个**新的字符串**。

---

### 4. 辅助函数分析 (`extraFunArgs`)

虽然 `Bind` 函数本身目前主要处理变量替换，但代码中预留了 `reFun`（匹配函数调用如 `{{pluck(arg)}}`）和 `extraFunArgs` 函数。

- `extraFunArgs` 的目的是**解析函数参数**：
- 以 `:` 开头的参数被视为从 `data` 中取值。
- 被单引号 `'` 包围的被视为普通字符串。
- 带小数点 `.` 的转为浮点数。
- 其余转为整数。

> **注意**：在当前提供的 `Bind` 代码段中，虽然定义了 `reFun`，但 `Bind` 逻辑内部尚未显式调用处理逻辑，这通常预示着该工具库支持（或计划支持）在绑定时执行简单的函数运算。

---

### 5. 总结与应用场景

**主要特点：**

- **类型保留**: 尽可能保留 `data` 中原始数据的类型，而不仅仅是简单的字符串替换。
- **深度递归**: 能够处理极其复杂的嵌套 JSON 配置。

**典型场景：**
假设你在开发一个低代码平台或工作流引擎：

- **配置**: `{"api_url": "https://api.com/user/{{id}}", "retry": 3}`
- **数据**: `{"id": 1024}`
- **结果**: `Bind` 会输出 `{"api_url": "https://api.com/user/1024", "retry": 3}`

---

为了让你更直观地理解 `Bind` 函数的威力，我根据代码逻辑整理了几个典型场景的示例。

这些示例展示了函数如何处理**类型转换**、**嵌套结构**以及**混合字符串**。

---

### 1. 基础变量替换（保持原始类型）

当字符串**完全匹配**一个占位符且 `data` 中对应非字符串类型时，`Bind` 会尝试保留原类型。

- **输入 `v**`: `"{{user_id}}"`
- **输入 `data**`: `map[string]interface{}{"user_id": 1024}`
- **结果**: `1024` (int类型，而非 "1024" 字符串)

### 2. 混合字符串模板

当占位符嵌入在文字中时，结果会自动转为字符串拼接。

- **输入 `v**`: `"Token 为 ?:token_val"`
- **输入 `data**`: `map[string]interface{}{"token_val": "abc-123"}`
- **结果**: `"Token 为 abc-123"` (string类型)

### 3. 递归处理复杂嵌套结构

这是 `Bind` 最强大的地方，它能递归进入切片（Slice）和映射（Map）。

- **输入 `v**`:

```json
{
  "user": {
    "name": "{{name}}",
    "tags": ["?:tag1", "admin"]
  },
  "active": "{{is_active}}"
}
```

- **输入 `data**`:

```go
map[string]interface{}{
    "name": "张三",
    "tag1": "开发者",
    "is_active": true,
}

```

- **结果**:

```json
{
  "user": {
    "name": "张三",
    "tags": ["开发者", "admin"]
  },
  "active": true
}
```

### 4. 多个占位符拼接

如果一行字符串中有多个变量，函数会按顺序依次查找并替换。

- **输入 `v**`: `"https://{{domain}}/api/{{version}}/query"`
- **输入 `data**`:

```go
map[string]interface{}{
    "domain": "example.com",
    "version": "v1",
}

```

- **结果**: `"https://example.com/api/v1/query"`

---

### 场景对照表

| 场景             | 原始值 (v)            | 数据源 (data)                  | 绑定后结果 (res) | 备注                       |
| ---------------- | --------------------- | ------------------------------ | ---------------- | -------------------------- |
| **单变量(数值)** | `"{{age}}"`           | `{"age": 18}`                  | `18` (int)       | 精确匹配，保留类型         |
| **单变量(布尔)** | `"{{ok}}"`            | `{"ok": true}`                 | `true` (bool)    | 同上                       |
| **多变量拼接**   | `"{{prefix}}_{{id}}"` | `{"prefix": "SN", "id": 9527}` | `"SN_9527"`      | 只要有拼接，必转字符串     |
| **不同风格**     | `"?:path"`            | `{"path": "/home"}`            | `"/home"`        | 支持 `?:` 这种 Style2 语法 |
| **空值处理**     | `"{{missing}}"`       | `{}`                           | `<nil>`          | 如果 key 不存在，返回 nil  |

---

### 需要注意的边界情况

1. **[]byte 透传**: 如果你传入的是 `[]byte("hello")`，函数会直接返回原字节数组，不会扫描其中的 `{{}}` 标签。
2. **指针处理**: 代码中使用了 `reflect.Indirect(value)`，这意味着你传入变量的指针（如 `&myString`），它也能正确解引用并进行绑定。
3. **函数调用**: 虽然代码中定义了 `reFun` 和 `extraFunArgs`，但根据你提供的 `Bind` 核心逻辑，它目前**只实现了变量替换**。如果输入 `{{pluck($res.users, 'id')}}`，当前的 `Bind` 逻辑会因为找不到对应的 `data` 键值而可能返回 `nil` 或原样输出。

**你想看看如何修改 `Bind` 函数，让它真正支持 `reFun` 所定义的函数调用功能（例如执行 `pluck` 操作）吗？**
