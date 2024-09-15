# 使用 builder 创建 sui 页面

**此功能已被停用**

创建一个空的目录，进入目录，执行 yao start

```sh
mkdir sui-demo
cd sui-demo

yao start
```

yao 会自动的初始化一个模板项目工程文件，并且打开默认的 5099 端口让用户配置数据库连接。

## aigc 配置

如果页面中有标签属性`"aigc-enabled"=true`,可以使用 ai 来帮助生成页面。

要启用 ai 生成页面，需要以下的配置。

修改应用目录下的 app.yao 配置文件，增加以下的配置。

```json
{
  "moapi": {
    "secret": "sk-",
    "mirrors": ["api.openai.com"]
  }
}
```

如果页面里包含以下页面，在设计器的右边会显示一个小图标。点击图标，输入 prompt。

```html
<div aigc-enabled="true">aigc</div>
```

比如输入。

```md
你是一个 tailwind 专家，给我生成一个用户登录界面,居中，手机显示时全屏。
```

## 使用命令

打印数据：
`http://localhost:5099/signup/wechat?__sui_print_data`，`__sui_print_data` 带这个 Query 参数访问的时候能看到读取的数据

## 使用 vscode

可以选择 vscode 作为页面编辑工具。

实时编译，使用`yao sui watch` 监控模板目录，当页面内容有变化时，自动构建所有页面，这个跟 builder 上的"发布所有页面"的功能是一样的。

```sh
yao sui watch  "<sui id>" "<template>" -d '::{sessiong data}'

yao sui watch "blog" "website" -d '::{}'
```
