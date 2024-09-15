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

首先需要在应用目录的`suis`目录下创建一个 sui 配置定义文件,配置文件后缀名可以是`*.sui.yao", "*.sui.jsonc", "*.sui.json`。其中`.yao`,`.jsonc` 是 json 的变种，可以增加注释。

在 sui 配置文件中定义的模板的存储方式与模板存储位置

`/suis/blog.sui.yao`

```json
{
  "name": "blog",
  "guard": "guard", //
  "storage": {
    "driver": "local", //存储方式
    "option": {
      "root": "/blogs" //模板位置,如果没有配置，默认是/data/sui/templates
    }
  },
  "public": {
    "root": "/blog", //访问路由
    "remote": "/",
    "index": "/index", //前端访问入口地址
    "matcher": "" //目录正则匹配表达式，如果没有配置，则是完全匹配
  },
  "cache_store": "" //缓存配置
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
│       ├── template.json         # 模板配置
│       ├── __build.backend.ts         # 构建时的ts文件
│       ├── __build.backend.js         # 模板配置
│       ├── __global.backend.ts        # 模板配置
│       ├── __global.backend.js         # 模板配置
│       ├── index                 # 页面模板index
│       │   ├── index.config
│       │   ├── index.css
│       │   ├── index.html
│       │   ├── index.ts
│       │   ├── index.js
│       │   ├── index.backend.ts    #后台执行处理器的脚本文件
│       │   ├── index.backend.js
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

还可以使用`[]`的语法进行正则模糊匹配路由中带有参数[数字字母]的访问路径，比如`/1a/test`,`/2d/test`。

```sh
├── [123]                 # 页面模板index
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

在属性中替换：

```html
<img src="{{ article.img }}" />
```

在文本节点替换：

```html
<p>{{ article.description }}</p>
```

可以在模板中引用的对象。

```js
data['$payload'] = r.Payload;
data['$query'] = r.Query;
data['$param'] = r.Params;
data['$cookie'] = cookies;
data['$url'] = r.URL;
data['$theme'] = r.Theme;
data['$locale'] = r.Locale;
data['$timezone'] = GetSystemTimezone();
data['$direction'] = 'ltr';
data['$global']; //其它全局对象，从<page>.json文件复制而来。
```

### 引用请求中的对象

- 引用 query 对象

使用`$query.<key>`引用 url query 查询中的对象。

```json
{
  "value": "$query.<key>" //引用query中的内容
}
```

- 引用 http.url 请求对象

```json
{
  "path": "$url.path",
  "host": "$url.host",
  "domain": "$url.domain",
  "scheme": "$url.scheme"
}
```

- 其它的请求对象

其它的以`$header.`,`$param.`,`$payload.`为开头的对象。

### 循环

与其它的页面开发技术类似，使用三个关键字实现循环输出语法：

- `s:for`, 引用需要循环数据，要求是数组格式的数据，可以是在数组中包含复杂的对象。
- `s:for-item`,设置循环中的 key 字段，默认值是`item`。
- `s:for-index`,设置索引字段,默认值是`index`。
- `s:if`,可以在循环中使用`s:if`控制条目是否显示,表达式需要返回 true 才会生效。

```html
<!-- Replace the code below with your actual post data -->
<li s:for="articles.data" s:for-item="article" s:for-index="idx" s:if="idx==1">
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

使用 page 标签引用其它页面，`is="/xxx"`,这里的 `xxx` 是同一套模板中的其它页面地址。有`is`属性标定的元素会作为子组件进行处理。

子组件也是一个单独的组件，但是组件的数据与主页面共享。

```html
<page is="/footer">
  <slot is="link"> Link </slot>
  <slot is="item"> Item </slot>

  <!-- jit 组件 -->
  <div is="link2">{{xxx}}</div>
  <div is="link3" p2="[{xxx}]"></div>
  <div is="link4" p1="{%xxx%}"></div>
</page>
```

### 插槽

当使用页面引用功能时，需要解决另外一个问题，就是向子页面传递属性与插槽。

比如有两个页面：
主页面：main.html,子页面 item.html，它们的定义是：

`main.html` 主页面引用了子页面`item`,并且传递了属性`index`，两个 slot 配置：`link/item`

```html
<div class="bg-blue-700">
  <page is="/item" active="index">
    <slot is="link1"> Link Slot</slot>
    <slot is="item"> Item Slot</slot>
  </page>
</div>
```

`item.html`,在子页面中：

- 使用`[{$prop.<prop>}]`来引用父页面传递的属性值。

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
```

- 使用`[{}]`语法来接收父页面传递的 slot 配置。

```html
<div class="text-blue-200">[{link}]</div>

<div class="text-red-200">[{item}]</div>
```

## 模板变量引用

上面的 html 模板文件中的变量来自另外一个文件中的定义。比如首页的页面的目录是`index`,对应的变量定义文件为`index/index.json`。

先看看数据定义文件中的内容，在这里包含了处理器调用，静态数量定义，数组定义。

没有使用`$`作为前缀的是静态数量定义。

- key 以$作为开始，调用脚本
- key 没有以$作为开始，一般变量
- 子对象是一个数组，如果`$query.`,`$url.`,`$header.`作为前缀,说明是引用值。

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

处理器的调用方式也有两种：1，隐式参数传递，直接配置成`key:value`的形式

```json
{
  "$articles": "scripts.blog.site.getPostList"
}
```

处理器调用还有另外一种形式，配置成`key:object`的方式。

```json
{
  "articles": {
    "process": "scripts.article.Thumbs", //process处理器名称，必要的设置
    "args": ["$query.show"], //处理器参数
    "__exec": true //设置`__exec=true`来说明此对象是一个处理器调用。
  }
}
```

如果处理器的名称以`@`开头，并且存在后台脚本，会调用后台页面关联的.backend.ts 脚本。ts/js 脚本的优先级会比一般的处理器的优先级要高。并且这里使用 js 脚本在效率上会比一般处理器高。

比如存在`index/index.backend.js`文件，文件内容如下：

```js
function myscript(args) {}
```

简洁模式，处理器名称以`@`开头。

```json
{
  "$object": "@myscript"
}
```

或是完整定义模式。

```json
{
  "articles": {
    "process": "@myscript", //process处理器名称，必要的设置
    "args": ["$query.show"], //处理器参数
    "__exec": true //设置`__exec=true`来说明此对象是一个处理器调用。
  }
}
```

- 使用 request 对象作为处理器的参数。

在处理器中，可以通过变量的方法引用 url 参数，类似于 api 定义与使用方法。

在处理器中可以使用`$query`引用 url 查询参数。

- `$query` url 请求参数
- `$header` url header 中的变量
- `$param` url 请求参数
- `$payload` post 请求中的 payload

在调用处理器时，隐式绑定处理器的参数,处理器名称以`$`开头

```json
{
  "$object": "$scripts.demo.process"
}
```

或是显式绑定：

```json
{
  "$object": {
    "process": "scripts.demo.process",
    "args": ["$header.key"]
  }
}
```

```json
{
  "object": {
    "process": "scripts.demo.process",
    "args": ["$header.key"],
    "__exec": true
  }
}
```

在处理器中可以把请求中的对象绑定到处理器的参数，可以在处理器参数中通过`$`来引用请求中的全局对象。

```js

  // $query
  // $url.path
  // $url.host
  // $url.domain
  // $url.scheme
  // $header
  // $param.
  // $payload

// header对象只能使用两级引用。
		if strings.HasPrefix(v, "$header.") {
			key := strings.TrimPrefix(v, "$header.")
			if r.Headers.Has(key) {
				return r.Headers.Get(key), nil
			}
			return "", nil
		}
```

```go
{
		"param":   r.Params,//object,url请求参数
		"query":   r.Query,//object url查询请求参数
		"payload": map[string]interface{}{},//post请求的payload
		"header":  r.Headers,//object 请求header信息
		"theme":   r.Theme,//string主题信息
		"locale":  r.Locale,//string 本地化信息
		"url":     r.URL.Map(),//url对象。
}

```

URL 子对象定义

```go
{
	Host   string `json:"host,omitempty"`
	Domain string `json:"domain,omitempty"`
	Path   string `json:"path,omitempty"`
	Scheme string `json:"scheme,omitempty"`
	URL    string `json:"url,omitempty"`
}
```

同样可以在数组中调用处理器

```json
{
  "$articles": "scripts.article.Search", //有$前缀，说明是处理器
  "$showImage": {
    //有$前缀，说明是处理器，不需要设置__exec=true
    "process": "scripts.article.ShowImage",
    "args": ["$query.show"]
  },
  "length": 20,
  "array": [
    "item-1",
    "$scripts.article.Setting", //有$前缀，说明是处理器
    { "$images": "scripts.article.Images" }, //有$前缀，说明是处理器
    {
      //在数组中，没办法设置$,需要使用__exec=true
      "process": "scripts.article.Thumbs",
      "args": ["$query.show"],
      "__exec": true
    }
  ],
  "input": { "data": "hello world" },
  "url": { "path": "$url.path" } //不是处理器，也可以替换绑定变量
}
```

如果没有显式的指定处理器参数 args,会有一个默认的参数 request.
request 对象定义：

```go
type Request struct {
	Method    string                 `json:"method"`
	AssetRoot string                 `json:"asset_root,omitempty"`
	Referer   string                 `json:"referer,omitempty"`
	Payload   map[string]interface{} `json:"payload,omitempty"`
	Query     url.Values             `json:"query,omitempty"`
	Params    map[string]string      `json:"params,omitempty"`
	Headers   url.Values             `json:"headers,omitempty"`
	Body      interface{}            `json:"body,omitempty"`
	URL       ReqeustURL             `json:"url,omitempty"`
	Sid       string                 `json:"sid,omitempty"`
	Theme     any                    `json:"theme,omitempty"`
	Locale    any                    `json:"locale,omitempty"`
	Script    *Script                `json:"-"`
}
```

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

## 脚本

可以 js 或是 ts 文件中定制页面关联的 js 脚本，ts 脚本会自动的转换成 js 文件。

js 文件有以下的作用。

针对于组件进行增强处理，比如一个组件元素有属性"s:cn"的标识，说明是一个 html 组件。此时会在查找带有`script[name=imports]`标签的脚本。

```html
<!-- 父组件或是页面 -->
<div is="abc"></div>

<!-- 上面引用的组件会被编译，并以单独的代码块的方式嵌入 -->
<!-- 如果需要脚本增强处理，可导入脚本配置 -->
<script name="imports" type="json">
  {
    //comp1 组件名称
    //myscript 组件的路由
    "comp_abc": "myscript"
  }
</script>
```

<!-- 嵌入后的组件，有s:cn标识说明是一个组件，组件的属性使用prop:xx来设置-->
<div s:cn="comp_abc" prop:k1="xxx1"></div>

### `BeforeRender`Hook,在页面渲染前的处理事件钩子。

在 js 文件中定义一个函数，函数返回对象。

```js
//请求对象的定义
// type Request struct {
//     Method    string                 `json:"method"`
//     AssetRoot string                 `json:"asset_root,omitempty"`
//     Referer   string                 `json:"referer,omitempty"`
//     Payload   map[string]interface{} `json:"payload,omitempty"`
//     Query     url.Values             `json:"query,omitempty"`
//     Params    map[string]string      `json:"params,omitempty"`
//     Headers   url.Values             `json:"headers,omitempty"`
//     Body      interface{}            `json:"body,omitempty"`
//     URL       ReqeustURL             `json:"url,omitempty"`
//     Sid       string                 `json:"sid,omitempty"`
//     Theme     any                    `json:"theme,omitempty"`
//     Locale    any                    `json:"locale,omitempty"`
//     Script    *Script                `json:"-"`
// }

//props表示是html元素中的"prop:"设置
function BeforeRender(request,props){

  retrun {
    "k":v
  }
}

```

### sui 页面 guard

每一个 sui 页面可以设置页面对应的配置，`<page>.config`,这是一个 json 文件，它的定义结构如下：

```go

type PageConfig struct {
	PageSetting `json:",omitempty"`
	Mock        *PageMock           `json:"mock,omitempty"`
	Rendered    *PageConfigRendered `json:"rendered,omitempty"`
}
type PageConfigRendered struct {
	Title string `json:"title,omitempty"`
	Link  string `json:"link,omitempty"`
}
// PageSetting is the struct for the page setting
type PageSetting struct {
	Title       string   `json:"title,omitempty"`
	Guard       string   `json:"guard,omitempty"` //配置页面请求时的认证处理器，比如scripts.page.guard
	CacheStore  string   `json:"cache_store,omitempty"`
	Cache       int      `json:"cache,omitempty"`
	Root        string   `json:"root,omitempty"`
	DataCache   int      `json:"data_cache,omitempty"`
	Description string   `json:"description,omitempty"`
	SEO         *PageSEO `json:"seo,omitempty"`
}
type PageSEO struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	Keywords    string `json:"keywords,omitempty"`
	Image       string `json:"image,omitempty"`
	URL         string `json:"url,omitempty"`
}

```

在 sui 请求中，可以设置 guard 来处理每一个页面的请求处理器的认证。可以使用以下 4 种 guard。可以使用这几种内置方法中的一种来保护需要认证才能查看的页面，或是使用自定义的 guard,但是同一时间不能像 api 接口那样同时使用多个 guard。

```go
// Guards middlewares
var Guards = map[string]func(c *Request) error{
	"bearer-jwt":   guardBearerJWT,   // Bearer JWT
	"query-jwt":    guardQueryJWT,    // Get JWT Token from query string  "__tk"
	"cookie-jwt":   guardCookieJWT,   // Get JWT Token from cookie "__tk"
	"cookie-trace": guardCookieTrace, // Set sid cookie
}
```

guard 跳转如果 guard 中有分号，那么分号的第二部分会是 guard 检查失败后跳转的地址，`guard=cookie-jwt:redirect-url`，比如说是登录认证页面。

自定义的 guard 处理器，除了使用内置的 guard,还可以开发自定义的处理器,推荐使用 js 脚本来处理，可以使用额外的处理功能。

guard 处理器可以使用以下的参数：

```go
	args := []interface{}{
		r.URL,     // page url
		r.Params,  // page params
		r.Query,   // query string
		r.Payload, // payload
		r.Headers, // Request headers
	}
```

如果是在 sui guard 环境中使用脚本处理器，比如`scripts.xxx`,那么可以在 js 脚本中使用以下的特有的 js 函数对象。

- 函数 SetSid 设置全局对象\_\_sid
- 函数 SetGlobal，设置全局对象\_\_global
- 函数 Redirect(code,url)，跳转到特定的地址。
- 函数 Abort(),退出请求
- 函数 Cookie(name),获取特定 cookie
- 函数 SetCookie(name,value,maxAge,path,domain,secure,httpOnly)，设置 cookie

## 页面访问

访问方法:`<host>:<port>:/<root>/<page_index>`,比如这里的页面访问方法：`http://localhost:5099/blog/index`。

**注意** 目前是调整了 yao 的路径处理代码才能使用

## 示例源代码

在 yao-admin-admin 项目中实现了简单的博客[yao-amis-admin](https://github.com/wwsheng009/yao-amis-admin)。
