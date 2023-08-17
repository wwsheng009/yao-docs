# 创建第一个 Yao 应用

当下载并安装好 Yao 之后，下一步就创建 Yao 应用。

## 创建 Hello World 应用

## 初始化项目

在个人 Home 目录或是其它的目录下创建一个空的目录 hello_wolrd。

```sh
# 创建一个hello world的空目录
mkdir hello_world

cd hello_world

# 执行start命令，打开配置页面
yao start
```

执行命令后，在控制台上会提示以下内容。

> 如果你的电脑中的 5099 端口已经被占用，会分配一个随机的端口。

```sh
---------------------------------
Yao Application Setup v0.10.3
---------------------------------
Open URL in the browser to continue:
http://127.0.0.1:5099
```

在浏览器里打开配置页面地址`http://127.0.0.1:5099`

在配置页面上，配置以下内容：

- 语言，中文/英文
- 启动模式，在开发应用时推荐选择开发模式，当配置文件有变化时，会自动重新加载
- 监听端口，默认是 5099,可以配置不同的端口
- Studio 端口，默认是 5077,可以配置不同的端口
- 数据库类型，选择 sqlite 或是 mysql
- 数据库文件地址，根据不同的数据库类型，需要不同的配置项

检查所有配置项正确后，点击完成按钮。会提示后台配置中，配置完成后会跳转到后台管理页面:`http://127.0.0.1:5099/admin/`。

使用默认用户名密码登录系统。

- 用户名: xiang@iqka.com
- 密码: A123456p+

## 项目目录结构

回到控制台，查看刚才的 hello_world 目录。刚才还是空白的目录，现在已经增加了不少的目录与文件,这些文件与目录是我们在界面上点击确认按钮后 Yao 根据配置自动生成的，可以理解为 Yao 初始化项目模板。这些目录与文件与 yao 执行程序一起，构建成一个应用。

后面的主要操作是编写新的或是修改现有的配置文件。

不同的目录对应不同的功能配置。配置文件可以使用后缀`.yao`,`.jsonc`,`.json`,`.yaml`,`.yml`。

- agics/neo/langs 目录下使用`.yaml`,`.yml`。
- 其它的目录使用`.yao`,`.jsonc`,`.json`，这三种格式的配置文件都使用了 json 语法，其中`.yao`,`.jsonc`是在 json 格式的基础上增加注释功能。推荐使用`.yao`作为文件后缀，这种格式的配置文件更有辨识度，也方便编写注释。

```sh
├── aigcs                                       <= chatgpt aigc接口
│   └── translate.ai.yml
├── apis                                        <= 外部api配置
│   └── aigc.http.yao
├── app.yao                                     <= yao应用配置
├── charts                                      <= 图表配置
│   └── pet.chart.yao
├── connectors                                  <= 连接器
│   └── openai
│       ├── gpt-3_5-turbo.conn.yao
│       ├── text-embedding-ada-002.conn.yao
│       └── whisper-1.conn.yao
├── dashboards                                  <= 大屏配置
│   └── kanban.dash.yao
├── data                                        <= 应用数据
├── db                                          <= 数据库
│   └── yao.db
├── .env                                        <= 环境变量配置
├── flows                                       <= flows处理器
│   ├── app
│   │   └── menu.flow.yao
│   └── stat
│       └── data.flow.yao
├── forms                                       <= 表单配置
│   ├── admin
│   │   └── user.form.yao
│   └── demo
│       └── pet.form.yao
├── icons                                       <= 应用图标
│   ├── app.icns
│   ├── app.ico
│   └── app.png
├── langs                                       <= 多语言
│   ├── zh-cn
│   │   └── global.yml
│   └── zh-hk
│       └── global.yml
├── LICENSE
├── logins                                      <= 登录处理器
│   ├── admin.login.yao
│   └── user.login.yao
├── logs                                        <= 日志
│   └── application.log
├── models                                      <= 模型配置
│   ├── admin
│   │   └── user.mod.yao                        <= 应用默认的用户配置表
│   └── pet.mod.yao
├── neo                                         <= neo助手/neo命令配置
│   └── neo.yml                                 <= neo助手配置
├── public                                      <= 网站public目录
│   ├── demo
│   │   └── pet.html
│   └── index.html                              <= 自定义网站入口
├── README.md
├── scripts                                     <= js脚本处理器
│   ├── dash.js
│   ├── guard.js
│   ├── setup.js
│   └── stat.js
├── services                                    <= 云函数
│   └── neo.js                                  <= neo脚手默认服务处理器
└── tables                                      <= 表格配置
    ├── admin
    │   └── user.tab.yao
    └── demo
        └── pet.tab.yao
```

## 总结

使用命令`Yao start`启动项目的配置页面。

Yao 使用模板与命令辅助生成初始化项目，非常的方便。
