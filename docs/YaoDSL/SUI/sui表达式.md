# SUI页面中使用表达式

## 1. 表达式

在页面中，可以使用表达式来动态地显示数据或是作条件判断。表达式的语法使用了go语言风格的表达式解析库[源代码](https://github.com/expr-lang/expr),[文档](https://expr-lang.org/)的语法，具体请参考库的文档。

具体的每一个表达式的语法请参考库的[文档]

需要注意使用的是**[定制表达式]**(https://expr-lang.org/docs/language-definition),并不是使用js的语法，比如判断长度的表达式需要使用len()函数，而不是articles.data.length。

比如以下代码中需要判断数组的长度：

```html
<div s:if="len(articles.data) == 0">
  <div>没有文章</div>
</div>
```

## 定制Yao表达式

另外在sui中，有几个额外定制的Yao相关的处理函数:

- P*()，调用处理器，比如P*(process_name,args1,args2,args3)，第一个参数是处理器名称，剩下的是处理器的参数。
- True()，判断是否是真，比如true,"true",1,非0都会返回真
- False()，判断是否为假，比如false,"false",0,空字符串都会返回假
- Empty()，判断是否为空，比如空的数组，空的对象，空的字符串都会返回真

直接在页面中使用表达式调用处理器：

```html
<div>articles:{{ P_('scripts.app.blog.site.getPostList') }}</div>
```

## 调试

在sui中，有几个有用的命令，可以方便地调试：

开发阶段构建页面使用watch命令。

```sh
# build sui web page
yao sui build <sui_id> <template_id>
# for example:
yao sui build  blog website

# watch sui web page change and build
yao sui watch <sui_id> <template_id>

# for example:
yao sui watch  blog website
```

在页面中，如果不确定某个表达式的值，可以使用{{}}来包裹表达式，直接在页面上输出表达式的值进行调试处理。

使用变量$env可以输出当前页面中所有的变量，所有的变量在整个渲染的过程中都是可用的。

```html
<div>$env: {{$env}}</div>
```
