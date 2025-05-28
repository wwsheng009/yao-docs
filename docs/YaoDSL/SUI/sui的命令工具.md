# SUI 命令工具

## 构建命令

```bash
yao sui build <sui_id> <template_id>
```

### 参数说明

- `sui_id`: SUI 部件 ID，在 `suis` 目录中定义
- `template_id`: 模板名称，位于 `data/templates` 目录

### 示例

```bash
# 构建默认模板
yao sui build web default

# 构建特定模板
yao sui build blog website
```

## 监视命令

```bash
yao sui watch <sui_id> <template_id>
```

实时监视文件变化并自动重新构建。

### 示例

```bash
# 监视默认模板
yao sui watch web default

# 监视特定模板
yao sui watch blog website
```

## 构建输出

构建成功后会在 `public` 目录生成以下文件：

- 编译后的 HTML 文件 (`.sui`)
- 编译后的 CSS 文件
- 编译后的 JavaScript 文件
- 资源文件

### 输出示例

```bash
-----------------------
Public Root: /public/
   Template: /templates/default
    Session: {}
-----------------------
Build succeeded for production in 9ms
```

## 其他命令

### 列出 SUI 部件

```bash
yao sui list
```

显示所有可用的 SUI 部件和模板。

### 清理构建文件

```bash
yao sui clean
```

清理所有构建生成的文件。

### 帮助信息

```bash
yao sui help
```

显示所有可用的 SUI 命令和说明。

## 命令使用建议

1. 开发时使用 `watch` 命令实时预览修改
2. 部署前使用 `build` 命令生成生产文件
3. 遇到问题时使用 `clean` 命令清理缓存
4. 使用 `list` 命令查看可用的部件和模板

# SUI 开发套件提供了 3 个命令工具

## 构建单一文件

可以使用以下命令进行页面构建。

- `yao sui build <sui> <template> -d [data] -D`
- `yao sui build <sui> <template> --data [data] --debug`

数据参数 `-d [data]` 为可选参数，数据格式为 json,在命令行里输入时需要加上`::`作为前缀，比如 json 对象需要使用格式：`::{}`。还可以使用调试参数 debug，简写为：`-D`。

执行命令时需要指定`sui id`与`template id`,比如`yao sui build <sui> <template> [data]`,`sui`是指 sui 配置 id,`template`是指模板 id,

## 实时编译

模板文件变化时自动构建，使用参数`-d`指定会话数据。

- `yao sui watch <sui> <template> --data [data]`
- `yao sui watch <sui> <template> -d [data]`

## 翻译

在模板的子目录`__locales`下需要有对应的文件夹。

语言文件：

全局配置文件`/data/blogs/website/__locales/<language_id>/__global.yml`

某一页面对应的语言配置文件`/data/blogs/website/__locales/<language_id>/<page_route>.yml`

- `yao sui trans <sui> <template> --data [data] --locales "zh-CN" --deubg true`
- `yao sui trans <sui> <template> -d [data] -l "zh-CN" -D`

参数`--locales`支持同时多个语言，以`,`隔开,比如`zh-CN,en-US`

## 示例

比如有以下目录结构

```sh
├── suis
│   └── demo.sui.yao                //sui配置文件
├── data
│   └── demo_sui_tpl
│       └── website                 //template_id
│           ├── __assets            //引用assets目录下的文件需要使用语法@assets/,yao会自动编译成对应的目录
│           │   └── css
│           │       └── tailwind.min.css
│           ├── __document.html     //共用的html框架文件，比如在这里引用其它的js/css
│           └── index               //每一下页面需要使用单独的目录
│               └── index.html      //用户需要编辑的文件，html文件或是其它文件都需要与文件名同名
├── public
│   ├── demo
│   │   ├── assets                  //复制的assets目录
│   │   │   └── css
│   │   │       └── tailwind.min.css
│   │   └── index.sui               //编译输出内容,不需要修改
│   └── index.html
```

文件`demo.sui.yao`配置内容

```json
{
  "name": "demo",
  "storage": {
    "driver": "local", //存储方式
    "option": {
      "root": "/demo_sui_tpl" //模板位置，目录/data/demo_sui_tpl
    }
  },
  "public": {
    "root": "/demo", //访问路由，输出文件的目录/public/demo
    "remote": "/",
    "index": "/index", //前端访问入口地址
    "matcher": ""
  }
}
```

## watch 命令

当源文件有变化时，会自动的进行编译。

```sh
[root@thinkbook14 sui-dev-app]# yao sui watch demo website
-----------------------
Public Root: /public/demo
   Template: /demo_sui_tpl/website
    Session: {}
-----------------------
Watching...
Press Ctrl+C to exit
Building...  Success (12ms)
Building...  Success (6ms)
Building...  Success (7ms)
Building...  Success (8ms)
```
