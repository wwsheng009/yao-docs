# SUI 指令

在SUI中，有丰富的指令可以帮助开发者更高效地构建和管理SUI应用。以下是一些常用的SUI指令：

## 原始值

在没有使用这个指令时，所有的模板绑定的变量值在输出前都会被进行 url 编码处理。

使用`s:raw`指令输出子原元素的 html 原始值,比如把博客的内容保存在数据库中，在渲染时直接输出博客的内容。

**注意：用户需要注意处理 s:raw 的原始信息，避免出现 xss 的攻击漏洞**

```html
<p s:raw="true">{{post.content}}</p>
```

## 使用 Set 数据

在模板中，可以使用`s:set` 或是`set` 标签,属性`value`来设置页面数据。这部分代码会在编译后保存，但是在页面输出时，set 配置数据被读取后，会删除`s:set`标签内容。它的作用跟页面关联的`json`配置文件作用一样。

比如，以下的模板中使用`s:set name="weight"`标签来来接收上级节点传入的属性配置weight,并把weight转换成本页面的变量配置。

```html
...

<!-- 简单类型数据 -->
<s:set name="weight" value="{% weight %}"></s:set>
<s:set name="icon" value="{% icon %}"></s:set>
<!-- json object 对象 -->
<s:set
  name="sizes"
  value="{{ { 
          'xs': 'text-xs', 
          'sm': 'text-sm', 
          'base': 'text-base',
          'lg': 'text-lg', 
          'xl': 'text-xl',
          'none': ''
      } }}"
></s:set>

<!-- 在模板中，可以使用set name来引用set中的配置数据 -->
<a
  id="{{ id }}"
  name="{{ name }}"
  title="{{ title }}"
  class="cursor-pointer hover:transition hover:duration-200 hover:ease-in-out
          {{ icon != '' ? 'flex items-center justify-start' : 'inline-block' }}
          {{ size != '' ? sizes[size] : sizes.base }}
      "
  href="{{ href }}"
  target="{{ target != '' ? target : '_self' }}"
  button
>
  <i s:if="icon != ''" class="material outlined me-1"> {{icon}} </i>
  <children></children>
</a>
```

需要注意的是，在模板编译过程中，如果使用是使用的`{% %}`标签来定义变量，那么在编译后，会被替换成父节点的属性信息。

比如，有以下两个模板配置：

子节点：

```html
<s:set name="acvice" value="{% active == '' ? '/' : active %}"></s:set>

<div color="{{ acvice == item.href ? 'primary' : 'dark' }}"></div>
```

父节点,引用了子节点：

```html
<header is="/header" active="/"></header>
```

在编译后，子节点的模板会被替换成，这个过程会发生在编译阶段`yao sui build`。

```html
<s:set name="acvice" value="/"></s:set>

<div color="{{ acvice == item.href? 'primary' : 'dark' }}"></div>
```

如果希望在编译后，子节点的模板接收变量，那么在父节点需要配置变量。
父节点：

```html
<header is="/header" active="{{ active }}"></header>
```

编译后,active 会在运行时引用页面变量。

```html
<s:set name="acvice" value="{{ active }}"></s:set>

<div color="{{ acvice == item.href? 'primary' : 'dark' }}"></div>
```
