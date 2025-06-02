# sui 模板关联数据定义

使用模板关联数据定义，可以给sui模板提供更多的灵活性。

一个模板的关联数据定义文件，通常是`.json`文件，文件名称与模板名称一致，后缀为`.json`，保存在模板的目录下。

```bash
├── index.html
└── index.json
```

## 模板数据定义文件

模板数据文件的作用是定义页面的变量，变量可以是静态的，也可以是动态的。

比如上面的 html 模板文件中的变量来自另外一个文件中的定义。比如首页的页面的目录是`index`,对应的变量定义文件为`index/index.json`。

先看看数据定义文件中的内容，在这里包含了处理器调用，静态数量定义，数组定义。

没有使用`$`作为前缀的是静态数量定义。

- key 以`$`作为开始，调用后端处理或是 Yao 处理器
- key 没有以`$`作为开始，一般变量
- 子对象是一个数组，如果`$query.`,`$url.`,`$header.`作为前缀,说明是引用值。

```json
{
  "$articles": "scripts.article.Search", //key有$前缀，说明是处理器,处理器参数使用Request对象
  "comments": "$scripts.article.Comments", //value有$前缀，说明是处理器,处理器参数使用Request对象
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

### 调用 Yao 处理器

比如上面的`$articles`就对应变量定义中的以下部分，它定义了一个文章列表的变量，而这个变量的值是过调用 yao 的处理器的返回值。Key 或是 Value 以`$`开头说明需要调用 Yao 处理器并返回数据。

```json
{
  "$articles": "scripts.blog.site.getPostList", //方式一
  "articles": "$scripts.blog.site.getPostList" //方式二，两种方式都可以,推荐使用方式一，统一命令方式
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
    "param":   request.Params,//object,url请求参数
    "query":   request.Query,//object url查询请求参数
    "payload": map[string]interface{}{},//post请求的payload
    "header":  request.Headers,//object 请求header信息
    "theme":   request.Theme,//string主题信息
    "locale":  request.Locale,//string 本地化信息
    "url":     request.URL.Map(),//url对象。
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

## 调用后端脚本`.backend.ts`

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
