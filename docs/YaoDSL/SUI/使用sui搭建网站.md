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
│       ├── __data.json           # 全局数据定义，在页面中使用$global来引用
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
│       ├── template.json         # 模板全局配置
│       └── __yao
│           ├── core.ts
│           └── types.ts
```

上面目录中的`acticle`与`index`的目录可以理解为`acticle.html`与`index.html`页面的构建临时目录,其它的带有`__`下划线的目录都是辅助目录。

## 重要的文件

`__document.html` 是页面的最外层模板文档，可以用于整个页面应用的框架。 在这个文档中会通过变量`{{ __page }}`来引用具体的页面，在用户访问时，会根据不同的路由替换不同的页面。

整个模板处理逻辑由上至下，由整体到局部，document > page > component。

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

### 模板全局配置文件template.json

sui 模板的配置文件，定义了模板的名称，描述，主题，语言，脚本，翻译器等。

模板脚本处理：

- `before:build`：在构建之前执行的脚本，支持两种类型：
  - `process`：使用处理器处理脚本，可在脚本中进行更复杂的文件操作，处理器的参数是模板的根目录。
  - `command`：使用命令行处理脚本，比如使用 tailwind 构建 css。
- `after:build`：在构建之后执行的脚本，支持两种类型：
  - `process`：使用处理器处理脚本。
  - `command`：使用命令行处理脚本。
- `build:complete`：在构建完成后执行的脚本，支持两种类型：
  - `process`：使用处理器处理脚本。
  - `command`：使用命令行处理脚本。

示例：

```json
{
  "name": "Yao Official Website",
  "description": "The official website of Yao.",
  "themes": [
    { "label": "Light", "value": "light" },
    { "label": "Dark", "value": "dark" }
  ],
  "locales": [
    { "label": "English", "value": "en-us", "default": true },
    { "label": "简体中文", "value": "zh-cn" },
    { "label": "繁體中文", "value": "zh-hk" },
    { "label": "日本語", "value": "ja-jp" }
  ],
  "translator": "scripts.translator.Default", //自动的多语言翻译器
  "scripts": {
    "before:build": [
      { "type": "process", "content": "scripts.build.Before" },
      {
        "type": "command",
        "content": "npx tailwindcss -i ./__assets/css/tailwind.css -o ./__assets/css/tailwind.min.css --minify"
      }
    ],
    "after:build": {% "type": "process", "content": "scripts.build.After" %},

    "build:complete": [
      { "type": "process", "content": "scripts.build.Complete" }
    ]
  }
}
```

```go
// Template is the struct for the template
type Template struct {
	Version      int              `json:"version"` // 模板版本
	ID           string           `json:"id"` // 模板ID
	Name         string           `json:"name"`// 模板名称
	Descrption   string           `json:"description"`// 模板描述
	Screenshots  []string         `json:"screenshots"`// 模板截图
	Themes       []SelectOption   `json:"themes"`// 主题 可以使处理器`yao run sui.theme.get sui_id template_id`获取
	Locales      []SelectOption   `json:"locales"`// 语言
	Scripts      *TemplateScirpts `json:"scripts,omitempty"`// 模板脚本
	Translator   string           `json:"translator,omitempty"`// 翻译器
}

// SelectOption is the struct for the select option
type SelectOption struct {
	Label   string `json:"label"`
	Value   string `json:"value"`
	Default bool   `json:"default"`
}

// TemplateScirpts is the struct for the template scripts
type TemplateScirpts struct {
	BeforeBuild   []*TemplateScript `json:"before:build,omitempty"`   // Run before build
	AfterBuild    []*TemplateScript `json:"after:build,omitempty"`    // Run after build
	BuildComplete []*TemplateScript `json:"build:complete,omitempty"` // Run build complete
}

// TemplateScript is the struct for the template script
type TemplateScript struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}
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

当定义好模板后，需要使用数据来进行填充。数据有多个来源：

- 用户请求 request 中的参数。
- 全局变量`$global`,取的值是模板目录下的`__data.json`文件中定义的对象，如果没有此文件，会选择页面的关联变量。此部分的数据是静态的，不可再修改。
- 页面的关联变量，同名的页面对应的配置文件：`<page>.json`中的定义的对象，这里可以使用处理器实时获取数据。
- 页面中的`Set`标签配置的数据。

### 引用

在页面的源代码中可以使用`{{}}`双括号来表示动态引用变量，可以引用的变量有：

引用可以放在元素属性或是元素值。

在属性中替换：

```html
<img src="{{ article.img }}" />
```

在文本节点替换：

```html
<p>{{ article.description }}</p>
```

可以在模板中引用的全局对象：

```js
data['$payload'] = r.Payload;
data['$query'] = r.Query;
data['$param'] = r.Params;
data['$cookie'] = cookies;
data['$url'] = r.URL; //请求地址
data['$theme'] = r.Theme; //主题
data['$locale'] = r.Locale; //语言
data['$timezone'] = GetSystemTimezone(); //时区
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

### 页面引用

使用 page 标签引用其它页面，`is="/xxx"`,这里的 `xxx` 是同一套模板中的其它页面地址。有`is`属性标定的元素会作为子组件进行处理。

子组件也是一个单独的组件，但是组件的数据与主页面共享。

```html
<page is="/footer">
  <slot name="link"> Link </slot>
  <slot name="item"> Item </slot>

  <!-- jit 组件 -->
  <div is="link2">{{xxx}}</div>
  <div is="link3" p2="{%xxx%}"></div>
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
    <slot name="link1"><div>Link</div></slot>
    <slot name="item1"><div>item</div></slot>
  </page>
</div>
```

`item.html`,在子页面中：

- 使用`{% <prop> %}`来引用父页面传递的属性值。

```html
<div class="flex">
  <div class="{% active=='index' ? 'text-white' : 'text-blue-200' %} w-10">
    <a href="/index">介绍</a>
  </div>

  <div class="{% active=='signin' ? 'text-white' : 'text-blue-200' %} w-10">
    <a href="/index">登录</a>
  </div>
</div>
```

- 自定义html元素接收父页面传递的 slot 配置。

```html
<link1></link1>

<item1></item1>
```

## 组件导入

组件导入的功能跟子页面引用一样的，但是使用了不同的语法描述。

```html
<import s:as="Anchor" s:from="/flowbite/components/anchor"></import>

<Anchor
  href="{{ '/docs/' + item.link }}"
  color="{{ $param.name == item.link ? 'primary' : 'dark' }}"
  class="mb-2 {{ $param.name == item.link ? 'active' : '' }}"
>
  <span class="font-bold text-sm"> {{ item.title }} </span>
</Anchor>
```

## 模板变量引用

上面的 html 模板文件中的变量来自另外一个文件中的定义。比如首页的页面的目录是`index`,对应的变量定义文件为`index/index.json`。

先看看数据定义文件中的内容，在这里包含了处理器调用，静态数量定义，数组定义。

没有使用`$`作为前缀的是静态数量定义。

- key 以`$`作为开始，调用后端处理或是 Yao 处理器
- key 没有以`$`作为开始，一般变量
- 子对象是一个数组，如果`$query.`,`$url.`,`$header.`作为前缀,说明是引用值。

```json
{
  "$articles": "scripts.article.Search", //key有$前缀，说明是处理器
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

### 调用 Yao 处理器

比如上面的`$articles`就对应变量定义中的以下部分，它定义了一个文章列表的变量，而这个变量的值是过调用 yao 的处理器的返回值。Key 或是 Value 以`$`开头说明需要调用 Yao 处理器并返回数据。

```json
{
  "$articles": "scripts.blog.site.getPostList", //方式一
  "articles": "$scripts.blog.site.getPostList" //方式二，两种方式都可以
}
```

处理器的调用方式也有两种：1，隐式参数传递，直接配置成`key:value`的形式

#### 使用 request 对象作为处理器的参数。

```json
{
  "$articles": "scripts.blog.site.getPostList" //方式一,隐式参数传递request对象
}
```

没有显式的指定处理器参数 args,会有一个默认的参数 request,request 对象定义：

```ts
/**
 * Namespace defining types and interfaces for SUI Templating Engine.
 */
export declare namespace sui {
  /**
   * Represents a request structure in the Sui framework.
   */
  export interface Request {
    /** The HTTP method of the request, e.g., "GET" or "POST". */
    method: string;
    /** The root URL for accessing assets, optional. */
    asset_root?: string;
    /** The referer URL, indicating the source of the request. */
    referer?: string;
    /** Payload data sent with the request. */
    payload?: Record<string, any>;
    /** Query parameters in the request URL as key-value pairs. */
    query?: Record<string, string[]>;
    /** Path parameters extracted from the URL. */
    params?: Record<string, string>;
    /** Headers included in the request as key-value pairs. */
    headers?: Record<string, string[]>;
    /** The body of the request, containing any payload data. */
    body?: any;
    /** Details about the request URL. */
    url?: URL;
    /** Session ID for the request, optional. */
    sid?: string;
    /** The theme preference associated with the request, optional. */
    theme?: string;
    /** The locale setting for the request, optional. */
    locale?: string;
  }

  /**
   * Represents the structure of a request URL in the Sui framework.
   */
  export interface URL {
    /** The host of the request, e.g., "www.example.com". */
    host?: string;
    /** The domain of the request, e.g., "example.com". */
    domain?: string;
    /** The path of the request, e.g., "/path/to/route". */
    path?: string;
    /** The scheme of the request, e.g., "http" or "https". */
    scheme?: string;
    /** The full URL of the request. */
    url?: string;
  }
}
```

#### 显式参数传递

处理器调用还有另外一种形式，配置成`key:object`的方式，显式参数传递。

在处理器中，可以通过变量的方法引用 url 参数，类似于 api 定义与使用方法。

可以使用`$query`引用 url 查询参数。

- `$query` url 请求参数
- `$header` url header 中的变量
- `$param` url 请求参数
- `$payload` post 请求中的 payload

```json
{
  "articles": {
    "process": "scripts.article.Thumbs", //process处理器名称，必要的设置
    "args": ["$query.show"], //处理器参数
    "__exec": true //设置`__exec=true`来说明此对象是一个处理器调用。
  }
}
```

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

另外可以引用其它对象。

```js
// $query
// $url.path
// $url.host
// $url.domain
// $url.scheme
// $header
// $param.
// $payload
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

### 调用后端脚本

如果处理器的名称以`@`开头，并且存在后台脚本，会调用后台页面关联的`.backend.ts` 脚本。ts/js 脚本的优先级会比一般的处理器的优先级要高。

组件与关联脚本存放在同一个目录下，逻辑会比较清晰。

比如存在`index/index.backend.js`文件，文件内容如下：

```js
function myscript(args) {}
```

定义模式。

```json
{
  "articles": {
    "process": "@myscript", //process处理器名称，必要的设置
    "args": ["$query.show"], //处理器参数
    "__exec": true //设置`__exec=true`来说明此对象是一个处理器调用。
  }
}
```

简洁模式，默认使用 request 对象作为参数。

```json
{
  "$catalog": "@Catalog"
}
```

此时函数的参数是 request 对象。

```ts
function Catalog(r: sui.Request) {
  const route = parseRoute(r);
  const ignoreCache = r.query?.refresh?.[0] === 'true' || false;
  return GetCatalog(route.root, route.name, route.locale, ignoreCache);
}
```

## 组件事件处理

为了响应页面上的组件的事件，比如用户的点击事件等。

在`.backend.ts`文件中定义事件处理函数。

在页面上使用`s:on-`来绑定事件处理函数。

```html
<li
  s:for="categories"
  class="
      px-1 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-200
      hover:text-primary-500 dark:hover:text-primary-400 cursor-pointer
      border-b-2 
      {{ item.name == articles.category ? 'text-primary-500 dark:text-primary-400  border-primary-500 dark:border-primary-400' : 'border-transparent ' }}
    "
  s:data-category="{{ item.name }}"
  s:on-click="LoadCategory"
  category
>
  {{ item.name }}
</li>
```

```ts
/**
 * When category is changed, load articles
 * @param event
 * @param data
 */
self.LoadCategory = async function (event: MouseEvent, data: EventData) {
  // Active and inactive class
  const active =
    'text-primary-500 dark:text-primary-400 border-primary-500 dark:border-primary-400';
  const inactive = 'border-transparent';

  // Prevent default behavior ( href redirect )
  event.preventDefault();

  // Get category and store it
  const category = data.category || null;
  self.store.Set('category', category);

  // Change item style
  $Query('[category]').each((el) => {
    el.removeClass(active).addClass(inactive);
    // Current category
    if ($Store(el.element as HTMLElement).Get('category') === category) {
      el.removeClass(inactive).addClass(active);
    }
  });

  // Load articles
  const articles = await $Backend('/blog').Call('GetArticles', category, 1);

  // Render articles
  await self.render('articles', { articles });
};
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

## 前端访问入口地址脚本

为了增强组件在浏览器的交互功能，可以在同一个目录下创建一个同名的 js 或是 ts 文件。如果是 ts 脚本会自动的编译成 js 文件。

```sh
├── index                 # 页面模板index
│   ├── index.config      # page mock配置
│   ├── index.css         # 样式
│   ├── index.html        # page 源代码
│   ├── index.js          # js脚本
│   ├── index.ts          # ts脚本,优先级比js高
│   └── index.json        # 模板相关数据定义，可以配置处理器调用
```

js 文件有以下的作用。

针对于组件进行增强处理，比如一个组件元素有属性"s:cn"的标识，说明是一个 html 组件。此时会在查找带有`script[name=imports]`标签的脚本。

有脚本中编写的代码会以固定的模析编译成一与组件关联的 js 脚本。

每一个组件的代码都会在页面加载时自动执行。

```js
// 组件的定义,comp_name是组件唯一的名称。
function comp_name(component){

  // 这里会自动的引用在`.backend.ts`文件中定义的常量对象Constants。可以理解为前后端共享的变量。
  // 在前端的js代码中可以使用self.Constants进行引用
  this.Constants = {};

  this.root = %s;//component 或是document.body,
	const __self = this;

  this.store = new __sui_store(this.root);//组件数据读取与设置

	this.state = new __sui_state(this);//事件处理

  this.props = new __sui_props(this.root);//读取组件的属性

  //把html对象转换成Query对象
	this.$root = new __Query(this.root);//组件选择器

  //查找html组件，返回Query对象
	this.find = function (selector) {
		return new __Query(__self.root).find(selector);
	};
  //查找html组件
	this.query = function (selector) {
		return __self.root.querySelector(selector);
	}
  //查找html组件
	this.queryAll = function (selector) {
		return __self.root.querySelectorAll(selector);
	}
  //远程渲染
	this.render = function(name, data, option) {
		const r = new __Render(__self, option);
  		return r.Exec(name, data);
	};
  //事件分发
	this.emit = function (name, data) {
		const event = new CustomEvent(name, { detail: data });
		__self.root.dispatchEvent(event);
	};

	//%s,用户的在<component>.ts中定义的代码。在组件js中可以使用上面定义的函数与定义。

	if (this.root.getAttribute("initialized") != 'true') {
		__self.root.setAttribute("initialized", 'true');
		__self.root.addEventListener("state:change", function (event) {
			const name = this.getAttribute("s:cn");
			const target = event.detail.target;
			const key = event.detail.key;
			const value = event.detail.value;
			const component = new window[name](this);//this是指当前的函数
			const state = new __sui_state(component);
			state.Set(key, value, target)
		});
    // 只运行一次的初始化函数
		__self.once && __self.once();
	}

}
```

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

BeforeRender返回的数据会保存在组件的属性`json:__component_data`中，如果是动态渲染，会把此数据再次发送到后端。

### sui 页面 guard

每一个 sui 页面可以设置页面对应的配置，`<page>.config`,这是一个 json 文件，它的定义结构如下：

```go
{
    // 页面配置，包含页面设置、模拟请求数据和渲染信息
    // 页面标题
      "title": "",
      // 用于处理页面请求处理器认证的守卫
      "guard": "",
      // 缓存存储方式
      "cacheStore": "",
      // 缓存时间
      "cache": 0,
      // 页面根路径
      "root": "",
      // 数据缓存时间
      "dataCache": 0,
      // 页面描述
      "description": "",
      // 页面 SEO 相关信息
      "seo": {
          // SEO 标题
          "title": "",
          // SEO 描述
          "description": "",
          // SEO 关键词
          "keywords": "",
          // SEO 图片链接
          "image": "",
          // SEO 页面链接
          "url": ""
      },
      // 页面 API 相关配置
      "api": {
          // API 前缀
          "prefix": "",
          // 默认的 API 认证守卫
          "defaultGuard": "",
          // 不同 API 对应的认证守卫映射
          "guards": {}
      },
    // 模拟请求数据
    "mock": {
        // 请求方法，如 GET、POST 等
        "method": "",
        // 请求来源页面的 URL
        "referer": "",
        // 请求携带的有效负载数据
        "payload": {},
        // 请求的查询参数
        "query": {},
        // 请求的路径参数
        "params": {},
        // 请求头信息
        "headers": {},
        // 请求体数据
        "body": null,
        // 请求的 URL 信息
        "url": {},
        // 会话 ID
        "sid": ""
    },
    // 页面渲染相关信息
    "rendered": {
        // 渲染后的页面标题
        "title": "",
        // 渲染后的页面链接
        "link": ""
    }
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

- 函数 SetSid 设置全局对象`__sid`
- 函数 SetGlobal，设置全局对象`__global`
- 函数 Redirect(code,url)，跳转到特定的地址。
- 函数 Abort(),退出请求
- 函数 Cookie(name),获取特定 cookie
- 函数 SetCookie(name,value,maxAge,path,domain,secure,httpOnly)，设置 cookie

## 页面访问

访问方法:`<host>:<port>:/<root>/<page_index>`,比如这里的页面访问方法：`http://localhost:5099/blog/index`。

## 示例源代码

在 yao-website 项目中实现了官网的实现[yao website](https://github.com/Yaoapp/website)。

## 调试模式

在页面请求时，添加`__debug=true`参数 或是是`__sui_print_data=true`参数，会开启调试模式。调试模式会禁用页面缓存。浏览器会自动的在控制台输入页面数据`console.log(__sui_data)`。

## 禁用缓存

- 在页面请求时，添加 `__sui_disable_cache=true`参数，会禁用页面缓存。
- 请求抬头中包含配置项 `Cache-Control = "no-cache"` 同样会禁用缓存。
- 页面请求时，添加`__debug=true`参数，会开启调试模式。调试模式会禁用页面缓存。
