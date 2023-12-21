# 使用 sui 搭建博客网站

使用 sui 之前需要先了解下 sui 的整体框架与处理流程：

框架：

在设计时，sui 有三层结构：sui->template->page。

- sui，可以配置多套 sui 页面。

- template,每个 sui 又可以配置多个模板，比如按主题样式，配置蓝色，灰色等。

- page,在每套模板中可以创建多个页面，页面之间可以进行引用。

处理流程：

- 定义 sui
- 创建模板目录
- 创建页面目录

- 构建
- 预览
- 发布

## 目录结构

首先需要在应用目录的`suis`目录下创建一个 sui 配置定义文件。

在 sui 中定义的模板的存储方式与模板存储位置

`/suis/blog.sui.yao`

```json
{
  "name": "blog",
  "storage": {
    "driver": "local", //存储方式
    "option": {
      "root": "/blogs" //模板位置
    }
  },
  "public": {
    "root": "/blog", //访问路由
    "remote": "/",
    "index": "/index", //前端访问入口地址
    "matcher": ""
  }
}
```

比如在配置文件里配置了`"root": "/blogs" `与`"driver": "local"`。下一步就需要在应用的 data 目录下创建模板文件目录与相关的文件。

官方后期应该会有页面编辑器配合使用。但是如果不用编辑器，也是可以直接使用这套模板工具的。

每一套 sui 下面可以有多套模板,比如这里的模板是 website,每一个模板都是一个独立目录。

```sh
├data目录
├── blogs                           # 对应sui的配置
│   └── website                     # 每一套sui下面可以有多套模板,比如这里的模板是website,每一个模板都是一个独立目录。
│       ├── article                 # article页面模板
│       │   ├── article.config
│       │   ├── article.html
│       │   ├── article.js
│       │   └── article.json
│       ├── __assets                # 页面开发过程中引用的资源
│       │   ├── css                 # css文件，比如放入tailwind的css
│       │   ├── dark
│       │   ├── fonts
│       │   ├── images
│       │   ├── js
│       │   ├── libs
│       │   ├── light
│       │   ├── main.js
│       ├── __blocks               # 编辑器中定义的布局
│       │   ├── ColumnsTwo
│       │   ├── export.json
│       │   ├── Hero
│       │   ├── Section
│       │   └── Table
│       ├── __components          # 在编辑器器中页面可以使用的组件
│       │   ├── Box
│       │   ├── Card
│       │   └── Nav
│       ├── __data.json           # 下定义在页面中引用的数据定义
│       ├── __document.html       # 模板页面
│       ├── index                 # 页面模板index
│       │   ├── index.config
│       │   ├── index.css
│       │   ├── index.html
│       │   ├── index.js
│       │   └── index.json
│       ├── __locales            # 多语言支持
│       │   ├── ar
│       │   ├── zh-cn
│       │   └── zh-tw
│       ├── __services
│       │   ├── article.ts
│       │   └── __pages
│       ├── website.json         # 模板全局配置
│       └── __yao
│           ├── core.ts
│           └── types.ts
```

上面目录中的`acticle`与`index`的目录可以理解为`acticle.html`与`index.html`页面的构建临时目录,其它的带有`__`下划线的目录都是辅助目录。

## 重要的文件

`__document.html` 是页面的最外层模板文档，可以用于整个页面应用的框架。 在这个文档中会通过变量`{{ __page }}`来引用具体的页面，在用户访问时，会根据不同的路由替换不同的页面。

```html
<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth" dir="ltr">

<head>
  <meta charset="UTF-8" />
  <title>
    Yao Sui Page
  </title>
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <meta name="description" content="Tailwind CSS Saas & Software Landing Page Template" />
  <meta name="keywords"
    content="yao, application, tailwind css" />
  <meta name="author" content="Shreethemes" />
  <meta name="website" content="https://shreethemes.in" />
  <meta name="email" content="support@shreethemes.in" />
  <meta name="version" content="2.0.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  </link>

  <!-- favicon -->

  <!-- CSS -->

  <!-- Main Css -->

  <link rel="stylesheet" href="@assets/css/tailwind.min.css" />
</head>

<body>
{{ __page }}
<!-- JAVASCRIPTS -->

</body>

</html>
```

页面模板相关文件，这里是与`index`相关的文件

```sh
├── index                 # 页面模板index
│   ├── index.config      # page mock配置
│   ├── index.css         # 样式
│   ├── index.html        # page 源代码
│   ├── index.js          # js脚本
│   └── index.json        # 模板相关数据定义，可以配置处理器调用
```

## 模板语法

### 引用

在页面的源代码中可以使用`{{}}`双括号来表示动态引用变量，可以引用的变量有：

- 全局变量`$global`,取的值是模板目录下的`__data.json`文件中定义的对象，如果没有此文件，会选择页面的关联变量。
- 页面的关联变量，同名的页面对应的配置文件：`<page>.json`中的定义的对象。

引用可以放在元素属性或是元素值。

```html
<img src="{{ article.img }}" />
```

```html
<p>{{ article.description }}</p>
```

### 循环

与其它的页面开发技术类似，使用三个关键字实现循环输出语法：

- `s:for`, 引用需要循环数据，一般是数组
- `s:for-item`,设置循环中的 key 字段。
- `s:for-index`,设置索引字段

```html
<!-- Replace the code below with your actual post data -->
<li s:for="articles.data" s:for-item="article" s:for-index="idx">
  <div class="bg-white shadow-md rounded-lg p-4">
    <p class="text-gray-600 mb-4">{{ article.description }}</p>
  </div>
</li>
```

### 条件

使用条件可以控制页面元素的显示与隐藏。对应的命令有：`s:if`,`s:elif`,`s:else`

```html
<section>
  <h1 class="text-3xl font-bold mb-4">Yao Blog Post List</h1>
  <ul
    class="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  >
    <!-- Replace the code below with your actual post data -->
    <li s:for="articles.data" s:for-item="article" s:for-index="idx">
      <div class="bg-white shadow-md rounded-lg p-4">
        <img
          s:if="article.img != ''"
          src="{{ article.img }}"
          alt="Post Image"
          class="object-cover rounded-md"
        />
        <a
          href="{{ article.url }}"
          target="_blank"
          class="text-xl text-blue-500 font-semibold mb-2"
          >{{ article.title }}</a
        >
        <p class="text-gray-600 mb-4">{{ article.description }}</p>
        <a
          href="{{ article.url }}"
          target="_blank"
          class="text-blue-500 font-semibold"
          >Read More</a
        >
      </div>
    </li>
    <!-- Repeat the above code for each post -->
  </ul>
</section>
<!-- JAVASCRIPTS -->
```

### 原始值

在没有使用这个指令时，所有的模板绑定的变量值在输出前都会被进行 url 编码处理。

使用`s:raw`指令输出子原元素的 html 原始值,比如把博客的内容保存在数据库中，在渲染时直接输出博客的内容。

**注意：用户需要注意处理 s:raw 的原始信息，避免出现 xss 的攻击漏洞**

```html
<p s:raw="true">{{post.content}}</p>
```

### 页面引用

使用 page 标签引用其它页面，`is="/xxx"`,这里的 `xxx` 是同一套模板中的其它页面地址

```html
<page is="/footer">
  <slot is="link"> Link </slot>
  <slot is="item"> Item </slot>
</page>
```

### 插槽

当使用页面引用功能时，需要解决另外一个问题，就是向子页面传递属性与插槽。

插槽：`<slot>`与

比如有两个页面：
主页面：main.html,子页面 item.html，它们的定义是

`main.html` 主页面引用了子页面`item`,并且传递了属性`index`，两个 slot 配置：`link/item`

```html
<div class="bg-blue-700">
  <page is="/item" active="index">
    <slot is="link"> Link Slot</slot>
    <slot is="item"> Item Slot</slot>
  </page>
</div>
```

`item.html`,在子页面中使用`[{$prop.<prop>}]`来引用父页面传递的属性值。并且使用`[{}]`语法来接收父页面传递的 slot 配置。

```html
<div class="flex">
  <div
    class="[{ $prop.active=='index' ? 'text-white' : 'text-blue-200' }] w-10"
  >
    <a href="/index">介绍</a>
  </div>

  <div
    class="[{ $prop.active=='signin' ? 'text-white' : 'text-blue-200' }] w-10"
  >
    <a href="/index">登录</a>
  </div>
</div>

<div class="text-blue-200">[{link}]</div>

<div class="text-red-200">[{item}]</div>
```

## 模板变量引用

上面的 html 模板文件中的变量来自另外一个文件中的定义。比如首页的页面的目录是`index`,对应的变量定义文件为`index/index.json`。

先看看数据定义文件中的内容，在这里包含了处理器调用，静态数量定义，数组定义。

没有使用`$`作为前缀的是静态数量定义。

```json
{
  "$articles": "scripts.article.Search",
  "$showImage": {
    "process": "scripts.article.ShowImage",
    "args": ["$query.show"]
  },
  "length": 20,
  "array": [
    "item-1",
    "$scripts.article.Setting",
    { "$images": "scripts.article.Images" },
    {
      "process": "scripts.article.Thumbs",
      "args": ["$query.show"],
      "__exec": true
    }
  ],
  "input": { "data": "hello world" }
}
```

### 模板中的处理器调用

比如上面的`$articles`就对应变量定义中的以下部分，它定义了一个文章列表的变量，而这个变量的值是过调用 yao 的处理器的返回值。以`$`开头变量说明需要调用处理器并返回数据。

处理器的调用方式也有两种：1，没有参数的，直接配置成`key:value`的形式，需要参数的，配置成`key:object`的方式。

```json
{
  "$articles": "scripts.blog.site.getPostList"
}
```

处理器调用还有另外一种形式：

比如：对象本身没有包含 key 键，这里无法使用前缀`$`,这时就需要设置`__exec=true`来说明此对象是一个处理器调用。

```json
{ "process": "scripts.article.Thumbs", "args": ["$query.show"], "__exec": true }
```

在处理器中，可以通过变量的方法引用 url 参数，类似于 api 定义与使用方法。

在处理器中可以使用`$query`引用 url 查询参数。

- `$query` url 请求参数
- `$header` url header 中的变量
- `$param` url 请求参数
- `$payload` post 请求中的 payload

## 设计器使用 mock 数据

在页面目录可以使用 config 文件来配置预览页面的请求参数。

```json
{
  "title": "Home Page | {{ $global.title }}",
  "mock": {
    "method": "GET",
    "query": {
      "post_id": ["2"]
    }
  }
}
```

Page 请求 Mock 完整类型定义：

```go
type PageMock struct {
	Method  string                 `json:"method,omitempty"`
	Referer string                 `json:"referer,omitempty"`
	Payload map[string]interface{} `json:"payload,omitempty"`
	Query   url.Values             `json:"query,omitempty"`
	Params  map[string]string      `json:"params,omitempty"`
	Headers url.Values             `json:"headers,omitempty"`
	Body    interface{}            `json:"body,omitempty"`
	Sid     string                 `json:"sid,omitempty"`
}
```

## 页面访问

访问方法:`<host>:<port>:/<root>/<page_index>`,比如这里的页面访问方法：`http://localhost:5099/blog/index`。

**注意** 目前是调整了 yao 的路径处理代码才能使用

## 示例源代码

在 yao-admin-admin 项目中实现了简单的博客[yao-amis-admin](https://github.com/wwsheng009/yao-amis-admin)。
