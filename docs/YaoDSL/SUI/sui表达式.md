# SUI 表达式语言文档

::: v-pre

## 概述

SUI（Simple User Interface）是YAO应用内置的模板处理引擎。SUI 使用 `{{ }}` 引用页面变量或表达式，`{% %}` 引用上级 HTML 元素属性值，结合 Expr 解析库（[文档](https://expr-lang.org/)，[源代码](https://github.com/expr-lang/expr)）提供强大的表达式处理能力。本文档详细介绍 SUI 表达式的语法、功能和使用方法，包括字面量、运算符、变量、函数以及 SUI 特定的扩展功能。

## 基本语法

SUI 表达式基于 Expr 语言，支持以下核心功能：

- **变量引用**：使用 `{{ variable }}` 直接渲染变量值。
- **属性访问**：通过 `{{ object.key }}` 或 `{{ array[0] }}` 访问对象或数组。
- **逻辑表达式**：支持算术、比较、逻辑运算以及函数调用。
- **SUI 特定语法**：
  - `{{ }}`：渲染变量或表达式结果。
  - `{% %}`：引用上级 HTML 元素属性。
  - `s:if`, `s:for`, `s:on-click` 等指令：用于条件渲染、循环和事件绑定。
  - `s:attr-` 前缀：处理布尔属性（如 `disabled`, `checked`）。

### 示例

```html
<!-- 渲染变量 -->
<p>{{ user.Name }}</p>
<!-- 输出: John Doe -->

<!-- 条件渲染 -->
<div s:if="len(articles.data) > 0">有文章</div>
<div s:else>没有文章</div>

<!-- 循环渲染 -->
<ul s:for="articles.data" s:for-item="article">
  <li>{{ article.title }}</li>
</ul>

<!-- 事件绑定 -->
<button s:on-click="handleClick" s:data-id="{{ id }}">点击</button>
```

## 表达式类型

SUI 表达式基于 Expr，支持多种数据类型和操作，以下为详细分类。

### 字面量

字面量表示固定值，支持以下类型：

- **布尔值**：`true`, `false`
- **整数**：十进制（`42`）、十六进制（`0x2A`）、八进制（`0o52`）、二进制（`0b101010`）
- **浮点数**：`0.5`, `.5`
- **字符串**：单引号（`'bar'`）、双引号（`"foo"`）、反引号（`` `Hello\nWorld` ``，原始字符串）
- **数组**：`[1, 2, 3]`
- **映射**：`{a: 1, b: 2, c: 3}`
- **空值**：`nil`

#### 示例

```bash
{{ true }}         // 输出: true
{{ 0x2A }}         // 输出: 42
{{ 0.5 }}          // 输出: 0.5
{{ "foo" }}        // 输出: foo
{{ `Hello\nWorld` }} // 输出: Hello\nWorld
{{ [1, 2, 3] }}   // 输出: [1, 2, 3]
{{ {a: 1, b: 2} }} // 输出: {a: 1, b: 2}
{{ nil }}          // 输出: nil
```

### 运算符

SUI 支持多种运算符，用于处理算术、比较、逻辑、条件、成员访问、字符串操作等。

#### 算术运算符

包括 `+`, `-`, `*`, `/`, `%`（取模），`^` 或 `**`（幂运算）。

```bash
{{ 2 + 3 }}        // 输出: 5
{{ 10 % 3 }}       // 输出: 1
{{ 2 ^ 3 }}        // 输出: 8
```

#### 比较运算符

包括 `==`, `!=`, `<`, `>`, `<=`, `>=`。

```bash
{{ 5 == 5 }}       // 输出: true
{{ 5 != 3 }}       // 输出: true
{{ 5 < 6 }}        // 输出: true
```

#### 逻辑运算符

包括 `not`（或 `!`）、`and`（或 `&&`）、`or`（或 `||`）。

```bash
{{ not true }}     // 输出: false
{{ true and false }} // 输出: false
{{ true or false }} // 输出: true
```

#### 条件运算符

包括三元运算符 `?:`、空值合并 `??` 和多行 `if {} else {}`。

```bash
{{ true ? 1 : 0 }} // 输出: 1
{{ isNull ?? "default" }} // 输出: default
{{ if { user.Age > 18 } else { "未成年" } }} // 输出: user.Age > 18 的结果
```

#### 成员运算符

支持 `.` 和 `[]` 访问字段，`in` 检查成员，`?.` 可选链，`[]` 数组索引（支持负索引）。

```bash
{{ user.Name }}          // 输出: "John Doe"
{{ array[0] }}           // 输出: 1
{{ array[-1] }}          // 输出: 5
{{ "John" in ["John", "Jane"] }} // 输出: true
{{ user?.User?.Name ?? "Anonymous" }} // 输出: "Anonymous"
```

#### 字符串运算符

包括 `+`（拼接）、`contains`、`startsWith`、`endsWith`。

```bash
{{ "Hello" + " World" }} // 输出: "Hello World"
{{ "Hello World" contains "World" }} // 输出: true
{{ "Hello" startsWith "He" }} // 输出: true
```

#### 正则表达式运算符

`matches` 用于正则匹配。

```bash
{{ "hello123" matches "h.*3" }} // 输出: true
```

#### 范围运算符

`..` 创建整数范围。

```bash
{{ 1..3 }}         // 输出: [1, 2, 3]
```

#### 切片运算符

`[:]` 用于数组切片。

```bash
{{ array[1:4] }}   // 输出: [2, 3, 4]
{{ array[:3] }}    // 输出: [1, 2, 3]
{{ array[3:] }}    // 输出: [4, 5]
```

#### 管道运算符

`|` 将左侧结果传递给右侧函数。

```bash
{{ user.Name | lower() | split(" ")[0] }} // 输出: "john"
```

### 变量

使用 `let` 声明变量，变量名以字母或下划线开头，可包含字母、数字和下划线。

```bash
{{ let x = 42; x * 2 }} // 输出: 84
{{ let name = user.Name | lower() | split(" "); "Hello, " + name[0] + "!" }} // 输出: "Hello, john!"
```

#### $env

`$env` 是包含所有传入变量的映射。

```bash
{{ 'user' in $env }} // 输出: true
{{ $env["user"].Name }} // 输出: "John Doe"
```

### 谓词

谓词用于函数（如 `filter`, `all`, `any`），支持 `#` 或省略字段访问。

```bash
{{ filter(0..9, {# % 2 == 0}) }} // 输出: [0, 2, 4, 6, 8]
{{ filter(tweets, len(.Content) > 20) }} // 输出: [{Content: "This is a long tweet...", Size: 22}]
```

## 函数

SUI 提供丰富的内置函数，分为字符串、日期、数字、数组、映射、类型转换和位运算等类别。

### 字符串函数

- **trim(str[, chars])**：移除字符串两端的空白或指定字符。
  ```bash
  {{ trim("  Hello  ") }} // 输出: "Hello"
  {{ trim("__Hello__", "_") }} // 输出: "Hello"
  ```
- **trimPrefix(str, prefix)**：移除字符串前缀。
  ```bash
  {{ trimPrefix("HelloWorld", "Hello") }} // 输出: "World"
  ```
- **upper(str)**：转换为大写。
  ```bash
  {{ upper("hello") }} // 输出: "HELLO"
  ```
- **lower(str)**：转换为小写。
  ```bash
  {{ lower("HELLO") }} // 输出: "hello"
  ```
- **split(str, delimiter[, n])**：按分隔符分割字符串。
  ```bash
  {{ split("apple,orange,grape", ",") }} // 输出: ["apple", "orange", "grape"]
  {{ split("apple,orange,grape", ",", 2) }} // 输出: ["apple", "orange,grape"]
  ```
- **其他**：`splitAfter`, `replace`, `repeat`, `indexOf`, `lastIndexOf`, `hasPrefix`, `hasSuffix` 等，详见测试页面。

### 日期函数

基于 Go 的 `time` 包，支持日期操作。

- **now()**：返回当前时间。
  ```bash
  {{ now().Year() }} // 输出: 2025（取决于当前年份）
  ```
- **duration(str)**：将字符串转换为时间段。
  ```bash
  {{ duration("1h").Seconds() }} // 输出: 3600
  ```
- **date(str[, format[, timezone]])**：将字符串解析为日期。
  ```bash
  {{ date("2023-08-14").Year() }} // 输出: 2023
  {{ date("2023-08-14 15:04:05", "2006-01-02 15:04:05", "Europe/Zurich").Hour() }} // 输出: 15
  ```
- **timezone(str)**：设置时区。
  ```bash
  {{ date("2023-08-14 00:00:00").In(timezone("Europe/Zurich")).Hour() }} // 输出: 时区调整后的小时
  ```

### 数字函数

包括 `max`, `min`, `abs`, `ceil`, `floor`, `round`。

```bash
{{ max(5, 7) }} // 输出: 7
{{ abs(-5) }} // 输出: 5
{{ ceil(1.5) }} // 输出: 2.0
```

### 数组函数

支持数组操作，如过滤、映射、排序等。

- **all(array, predicate)**：检查所有元素是否满足谓词。
  ```bash
  {{ all(tweets, {.Size < 280}) }} // 输出: true
  ```
- **any(array, predicate)**：检查是否有元素满足谓词。
  ```bash
  {{ any(tweets, {.Size > 20}) }} // 输出: true
  ```
- **map(array, predicate)**：对每个元素应用谓词。
  ```bash
  {{ map(tweets, {.Size}) }} // 输出: [11, 22]
  ```
- **filter(array, predicate)**：过滤满足谓词的元素。
  ```bash
  {{ filter(numbers, {# > 3}) }} // 输出: [4, 5]
  ```
- **其他**：`one`, `none`, `find`, `findIndex`, `findLast`, `findLastIndex`, `groupBy`, `count`, `concat`, `flatten`, `uniq`, `join`, `reduce`, `sum`, `mean`, `median`, `first`, `last`, `take`, `reverse`, `sort`, `sortBy` 等，详见测试页面。

### 映射函数

- **keys(map)**：返回映射的键数组。
  ```bash
  {{ keys({a: 1, b: 2}) }} // 输出: ["a", "b"]
  ```
- **values(map)**：返回映射的值数组。
  ```bash
  {{ values({a: 1, b: 2}) }} // 输出: [1, 2]
  ```

### 类型转换函数

包括 `type`, `int`, `float`, `string`, `toJSON`, `fromJSON`, `toBase64`, `fromBase64`, `toPairs`, `fromPairs`。

```bash
{{ type(42) }} // 输出: "int"
{{ float("123.45") }} // 输出: 123.45
{{ toJSON({a: 1}) }} // 输出: "{\"a\": 1}"
{{ toBase64("Hello World") }} // 输出: "SGVsbG8gV29ybGQ="
```

### 位运算函数

包括 `bitand`, `bitor`, `bitxor`, `bitnand`, `bitnot`, `bitshl`, `bitshr`, `bitushr`。

```bash
{{ bitand(0b1010, 0b1100) }} // 输出: 8
{{ bitshl(0b101101, 2) }} // 输出: 180
```

### 其他函数

- **len(v)**：返回数组、映射或字符串的长度。
  ```bash
  {{ len("Hello") }} // 输出: 5
  {{ len([1, 2, 3]) }} // 输出: 3
  ```
- **get(v, index)**：获取数组或映射的元素。
  ```bash
  {{ get([1, 2, 3], 1) }} // 输出: 2
  {{ get({a: 1}, "a") }} // 输出: 1
  ```

## SUI 扩展功能

SUI 提供了一些特定于其环境的扩展功能，增强了表达式的灵活性。

### SUI 扩展函数

- **P\_(process_name, ...args)**：调用处理器，`process_name` 为处理器名称，`args` 为参数。
  ```html
  <div>{{ P_('scripts.app.blog.site.getPostList') }}</div>
  <!-- 输出: 文章列表 -->
  ```
- **True(value)**：判断值是否为真（`true`, `"true"`, `1`, 非零值返回 `true`）。
  ```bash
  {{ True(1) }} // 输出: true
  {{ True("true") }} // 输出: true
  ```
- **False(value)**：判断值是否为假（`false`, `"false"`, `0`, 空字符串返回 `true`）。
  ```bash
  {{ False(0) }} // 输出: true
  {{ False("") }} // 输出: true
  ```
- **Empty(value)**：判断值是否为空（空数组、空对象、空字符串返回 `true`）。
  ```bash
  {{ Empty([]) }} // 输出: true
  {{ Empty("") }} // 输出: true
  ```

### 布尔属性处理

HTML 中的布尔属性（如 `disabled`, `checked`, `selected`, `required`）在 SUI 中通过 `s:attr-` 前缀处理，仅当值为真时添加属性。

```html
<input s:attr-disabled="{{True(isDisable)}}" />
<!-- 如果 isDisable 为 true，则渲染为 <input disabled> -->
<input s:attr-checked="{{True(isCheck)}}" />
<!-- 如果 isCheck 为 true，则渲染为 <input checked> -->
```

**注意**：

- 布尔属性即使赋值为 `"false"` 或其他字符串，也会被视为存在。
- 使用 `True()` 确保属性仅在值明确为真时添加。

### 条件渲染

使用 `s:if`, `s:elif`, `s:else` 进行条件渲染。

```html
<div s:if="len(articles.data) == 0">没有文章</div>
<div s:elif="len(articles.data) == 1">仅有一篇文章</div>
<div s:else>多篇文章</div>
```

**注意**：SUI 使用 `len()` 而非 JavaScript 的 `.length`。

### 循环渲染

使用 `s:for` 和 `s:for-item` 进行循环。

```html
<ul s:for="articles.data" s:for-item="article">
  <li>{{ article.title }}</li>
</ul>
```

### 事件绑定

使用 `s:on-<event>` 绑定事件处理函数。

```html
<button s:on-click="handleClick" s:data-id="{{ id }}">点击</button>
```

## 调试与开发

### 调试技巧

1. **输出表达式值**：使用 `{{ }}` 检查表达式结果。
   ```html
   <div>{{ user.Name }}</div>
   <!-- 输出: John Doe -->
   ```
2. **查看环境变量**：使用 `$env` 检查所有可用变量。
   ```html
   <div>$env: {{ $env }}</div>
   ```
3. **检查特定变量**：
   ```html
   <div>articles: {{ articles }}</div>
   ```

### 开发命令

- **构建页面**：
  ```bash
  yao sui build <sui_id> <template_id>
  ```
- **监视文件变化**：
  ```bash
  yao sui watch <sui_id> <template_id>
  ```

### 注意事项

1. **避免 JavaScript 语法**：SUI 使用 Expr 语法，例如 `len(articles.data)` 而非 `articles.data.length`。
2. **布尔属性**：始终使用 `True()` 或 `False()` 配合 `s:attr-` 前缀处理布尔属性。
3. **测试页面**：参考 `expression.html`（需配合 `expression.json` 和 `expression.css`）测试表达式。
4. **错误调试**：若表达式未正确渲染，检查 `expression.json` 数据是否正确，或使用 `yao sui watch` 实时预览。

## 示例

以下为综合示例，展示 SUI 表达式的实际应用：

```html
<!-- 数据渲染 -->
<div>用户名: {{ user.Name }}</div>

<!-- 条件渲染 -->
<div s:if="user.Age > 18">成年用户</div>
<div s:else>未成年用户</div>

<!-- 循环渲染 -->
<ul s:for="articles.data" s:for-item="article">
  <li>{{ article.title }} ({{ len(article.title) }} 字符)</li>
</ul>

<!-- 调用处理器 -->
<div>文章列表: {{ P_('scripts.app.blog.site.getPostList') }}</div>

<!-- 布尔属性 -->
<input type="checkbox" s:attr-checked="{{True(isCheck)}}" />
<button s:attr-disabled="{{True(isDisable)}}">提交</button>

<!-- 复杂表达式 -->
<div>
  {{ let name = user.Name | lower() | split(" ")[0]; "欢迎, " + name + "!" }}
</div>
```

## 参考资源

- Expr 官方文档：[https://expr-lang.org/](https://expr-lang.org/)
- Expr 源代码：[https://github.com/expr-lang/expr](https://github.com/expr-lang/expr)
- 测试页面：`expression.html`（需配合 `expression.json` 和 `expression.css`）

:::
