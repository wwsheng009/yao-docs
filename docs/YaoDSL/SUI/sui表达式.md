# SUI 表达式

## 基本语法

SUI 页面中可以使用`{{ }}`来引用页面变量或是使用`{% %}`引用上级html元素属性值。这里的引用不单可以直接使用变量名，还可以使用简单的表达式，其中表达式是用`Go`语言风格的表达式解析库，支持以下表达式类型：

### 1. 数据渲染

在页面中，可以使用表达式来动态地显示数据或是作条件判断。表达式的语法使用了go语言风格的表达式解析库[源代码]
(https://github.com/expr-lang/expr),[文档](https://expr-lang.org/)的语法，具体请参考库的文档。

```html
{{ variable }}
<!-- 渲染变量 -->
{{ object.key }}
<!-- 访问对象属性 -->
{{ array[0] }}
<!-- 访问数组元素 -->
```

### 2. 条件渲染

```html
<div s:if="condition">内容</div>
<div s:elif="condition2">内容2</div>
<div s:elif="condition3">内容3</div>
<div s:else>内容4</div>

<div s:if="len(array) > 0">数组不为空</div>
```

需要注意使用的是**[定制表达式]**(https://expr-lang.org/docs/language-definition),并不是使用js的语法，比如判断
长度的表达式需要使用len()函数，而不是articles.data.length。

### 3. 循环渲染

```html
<div s:for="items" s:for-item="item">{{ item.name }}</div>
```

### 4. 事件绑定

```html
<button s:on-click="handleClick" s:data-id="{{ id }}">点击</button>
```

## 内置函数

- `P_()`: 调用处理器
- `True()`: 判断是否为真
- `False()`: 判断是否为假
- `Empty()`: 判断是否为空

## 定制Yao表达式

在 SUI 中，有几个额外定制的 Yao 相关的处理函数:

- `P_()`: 调用处理器，例如 `P*('process_name', arg1, arg2)`，第一个参数是处理器名称，剩下的是处理器的参数。
- `True()`: 判断是否为真，例如 `true`, `"true"`, `1`, 非 0 都会返回真
- `False()`: 判断是否为假，例如 `false`, `"false"`, `0`, 空字符串都会返回假
- `Empty()`: 判断是否为空，例如空的数组，空的对象，空的字符串都会返回真

## 处理布尔属性

在HTML页面中有一些布尔属性，例如 `disabled`, `checked`, `selected`,`required` 等，这些属性的值通常是布尔类型，

布尔属性的值本质上不是字符串，而是表示属性的存在或不存在。例如：

```html
<input disabled />
<!-- 表示 disabled 属性存在 -->
<input disabled="false" />
<!-- 表示 disabled 属性存在 -->
<input disabled="true" />
<!-- 表示 disabled 属性存在 -->
<input disabled="disabled" />
<!-- 表示 disabled 属性存在 -->
```

针对于这些属性不，给它们赋一任何字符串值，会被认为是存在的。

在SUI中，这样处理，给它们增加一个特殊的前缀`s:attr-`，只有当值为真时，才会添加属性，当值为非真时，不会添加属性。

渲染成HTML时，会自动去掉`s:attr-`前缀，例如：

```html
<input s:attr-disabled="{{True(disabled)}}" />
<!-- 表示 disabled 属性存在 -->
<input s:attr-disabled="{{True(disabled)}}" />
<!-- 表示 disabled 属性不存在 -->
```

## 示例

### 调用处理器

```html
<div>articles:{{ P_('scripts.app.blog.site.getPostList') }}</div>
```

### 条件判断

```html
<div s:if="len(articles.data) == 0">
  <div>没有文章</div>
</div>
```

## 调试技巧

1. 使用 `{{ }}` 输出表达式值进行调试
2. 使用 `$env` 查看所有可用变量
3. 使用 `yao sui watch` 实时预览修改

### 调试示例

```html
<!-- 输出所有环境变量 -->
<div>$env: {{$env}}</div>

<!-- 输出特定变量 -->
<div>articles: {{articles}}</div>
```

## 开发命令

```bash
# 构建页面
yao sui build <sui_id> <template_id>

# 监视文件变化并自动构建
yao sui watch <sui_id> <template_id>
```
