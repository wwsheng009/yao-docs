# 创建第一个 Yao 应用

当下载并安装好 Yao 之后，下一步就创建 Yao 应用。

## 创建 Hello World 应用

## 初始化项目

在个人 Home 目录或是其它的目录下创建一个空的目录 hello_wolrd。

```sh
# 创建一个Yao应用根目录
mkdir yao-apps

# 在这个根目录下创建一个hello world的目录
cd yao-apps

mkdir hello_world

cd hello_world

yao start
```

执行命令后，在控制台上会提示以下内容。其中最重要的是一个配置地址`http://127.0.0.1:5099`

在浏览器里打开这个地址后会提示输入数据库，端口等配置信息。

> 如果你的电脑中的 5099 端口已经被占用，会分配一个随机的端口。

```sh
---------------------------------
Yao Application Setup v0.10.3
---------------------------------
Open URL in the browser to continue:
http://127.0.0.1:5099
```

在配置页面上，可以配置以下内容：

- 语言，支持中文/英文
- 启动模式，在开发应用时推荐选择开发模式，当应用文件有变化时，会自动重新加载
- 监听端口，默认是 5099,如果有多个应用，可以配置不同的端口
- Studio 端口，默认是 5077
- 数据库类型，支持 sqlite/mysql
- 数据库文件地址，根据不同的数据库类型，需要不同的配置项

检查所有配置项正确后，点击完成按钮。会提示后台配置中，配置完成后会跳转到后台管理页面:`http://127.0.0.1:5099/admin/`。

使用默认用户名密码登录系统。

- 用户名: xiang@iqka.com
- 密码: A123456p+

## 目录结构

回到控制台，查看刚才的 hello_world 目录。刚才还是空白的目录，现在已经增加了不少的目录与文件,这些文件与目录是我们在界面上点击确认按钮后 Yao 根据配置自动生成的，可以理解为 Yao 初始化项目模板。这些目录与文件与 yao 执行程序一起，构建成一个应用。

后面的主要操作是编写新的或是修改 Yao 配置文件。

配置文件可以使用后缀`.yao`,`.jsonc`,`.json`,`.yaml`,`.yml`。

- agics/neo/langs 目录下使用`.yaml`,`.yml`。
- 其它的目录使用`.yao`,`.jsonc`,`.json`。这三种格式的配置文件都使用了 json 语法，其中`.yao`,`.jsonc`可以在 json 格式的基础上编写注释内容。推荐使用`.yao`作为文件后缀，这种格式的配置文件更有辨识度。

```sh
.
├── aigcs
│   └── translate.ai.yml
├── apis
│   └── aigc.http.yao
├── app.yao
├── charts
│   └── pet.chart.yao
├── connectors
│   └── openai
│       ├── gpt-3_5-turbo.conn.yao
│       ├── text-embedding-ada-002.conn.yao
│       └── whisper-1.conn.yao
├── dashboards
│   └── kanban.dash.yao
├── data
├── db
│   └── yao.db
├── .env
├── flows
│   ├── app
│   │   └── menu.flow.yao
│   └── stat
│       └── data.flow.yao
├── forms
│   ├── admin
│   │   └── user.form.yao
│   └── demo
│       └── pet.form.yao
├── icons
│   ├── app.icns
│   ├── app.ico
│   └── app.png
├── langs
│   ├── zh-cn
│   │   └── global.yml
│   └── zh-hk
│       └── global.yml
├── LICENSE
├── logins
│   ├── admin.login.yao
│   └── user.login.yao
├── logs
│   └── application.log
├── models
│   ├── admin
│   │   └── user.mod.yao
│   └── pet.mod.yao
├── neo
│   └── neo.yml
├── public
│   ├── demo
│   │   └── pet.html
│   └── index.html
├── README.md
├── scripts
│   ├── dash.js
│   ├── guard.js
│   ├── setup.js
│   └── stat.js
├── services
│   └── neo.js
└── tables
    ├── admin
    │   └── user.tab.yao
    └── demo
        └── pet.tab.yao
```

## 总结

Yao 一行命令启动并生成初始化项目，非常的方便。
