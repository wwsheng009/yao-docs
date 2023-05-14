# 配置外部 API

## API 配置

接下来，我们配置一个外部 api 来访问刚创建的 book 模型。

> api 配置需要保存在目录`apis`下。

创建配置文件：`apis/book.http.yao`

```jsonc
{
  "name": "BOOK 外部接口 ",
  "version": "1.0.0",
  "description": "BOOK 外部接口",
  "guard": "-",
  "group": "v1",
  "paths": [
    {
      "path": "book",
      "method": "GET",
      "guard": "-",
      "process": "models.book.get", //内置的模型处理器
      "in": [":params"],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

以上配置会向 yao 引擎注册一个外部访问的 api 接口。

api 的路径的规则是`http(s)://host:port/api/group/path`,包含以下几部分：

- 主机与接口。
- 固定前缀`/api`。
- api 中配置的 group,这里配置的是 v1,group 可以包含斜杠/，区分大小写。
- api 中配置的 path,paths 节点中每一条记录都是一个访问端点，区分大小写。

最终生成的的 api 访问地址是http://127.0.0.1:5099/api/v1/book。

测试 api 接口，使用命令行工具或是浏览器浏览地址。

```sh
curl http://127.0.0.1:5099/api/v1/book

[{"author":"1212","id":1,"publisher":"1212","title":"1212"},{"author":"12","id":3,"publisher":"12","title":"12"}]
```

API 详细的说明参考官方文档：[API](https://yaoapps.com/doc/%E6%89%8B%E5%86%8C/Widgets/API)

## 处理器

可以把处理器理解为编程语言中的函数，接收输入参数，输出结果值。可以使用 js 脚本编写处理器，也可以使用 golang 编写插件处理器。[关于处理器](https://yaoapps.com/doc/%E5%9F%BA%E7%A1%80/%E4%BD%BF%E7%94%A8%E5%A4%84%E7%90%86%E5%99%A8)

Yao 引擎内置了大量的与模型处理相关的处理器，使用这些处理器能快速、方便的操作模型。

在 api 的配置文件中使用了内置的模型处理器`models.book.get`来读取模型数据。它的命名规则是`models.模型名称.模型方法`：

- `models`，固定的处理前缀，代表这个处理器与模型相关。
- 模型名称是模型的标识 ID,比如这里的书籍模型的标识是 book。
- 模型方法，Yao 针对模型的读取，更新，创建都已经内置了对应的操作方法。

模型处理器文档请参考：[模型处理器](https://yaoapps.com/doc/%E6%89%8B%E5%86%8C/Widgets/Model)

## 总结

Yao 内置了常用的模型处理器方法。

在 API 定义中使用现成的处理器，快速开发 API 接口。
