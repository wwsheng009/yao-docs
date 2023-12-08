# 使用 sui 搭建博客网站

首先需要在应用目录的根目录下创建一个 sui 配置定义。

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

```sh
├data目录
├── blogs
│   └── website                     # 每一套sui模板下都有一个子目录website,
│       ├── article                 # article页面模板
│       │   ├── article.config
│       │   ├── article.html
│       │   ├── article.js
│       │   └── article.json
│       ├── __assets                # 页面开发过程中引用的资源
│       │   ├── css
│       │   ├── dark
│       │   ├── fonts
│       │   ├── images
│       │   ├── js
│       │   ├── libs
│       │   ├── light
│       │   ├── main.js
│       │   └── tailwind.min.css
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

上面目录中的`acticle`与`index`的目录可以理解为`acticle.html`与`index.html`页面的构建临时目录。

## 重要的文件

`__document.html` 是页面的最外层模板文档，可以用于整个页面应用的框架。 在这个文档中会通过变量`{{ __page }}`来引用具体的页面，在用户访问时，会根据不同的路由替换不同的页面。

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

在页面的源代码中可以使用`{{}}`双括号来使用模板语法。

- 循环：`s:for`, `s:for-item`,`s:for-index`

- 条件：`s:if`

```html
<page>
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
</page>
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

**需要注意的是** admin 项目中的 sui 部分的功能有经过特别的增强，所以并不能直接使用官方的 yao 程序来执行。增强的地方是

- 增加了`s:html`指令，可以替换输出 html 代码。
- 增加了 html 元素属性的模板替换功能。比如以下代码中的 href 属性替换在 yao 官方中并没有实现。

```html
<a href="{{ article.url }}" target="_blank" class="text-blue-500 font-semibold"
  >Read More</a
>
```
