# YAO 编程基础

YAO 应用引擎是给专业开发者使用的应用开发和运行时工具， 熟悉 JavaScript/HTML/CSS 和基本数据库查询，即可实现大部分功能。

阅读基础文档，需要有基础的编程经验，熟悉基本数据库操作。

阅读进阶文档，需了解 RESTFul API，可以熟练使用 JavaScript 脚本语言，了解 HTML/CSS 等。

阅读专家文档，需掌握 Go 编程语言，熟悉 Linux 操作系统。

下表为使用 YAO 开发不同类型应用，对开发者的能力要求:

| 构建应用       | 等级 | 数据库             | RESTFul API | JavaScript | HTML/CSS/VUE/React/其他 | Golang |
| -------------- | ---- | ------------------ | ----------- | ---------- | ----------------------- | ------ |
| 简易管理后台   | 基础 | 熟悉基本查询       | -           | -          | -                       | -      |
| 简易业务系统   | 基础 | 熟悉基本查询       | 可对接      | 了解       | -                       | -      |
| C 端页面/应用  | 基础 | -                  | 可对接      | 了解       | 熟练                    | -      |
| 复杂业务系统   | 进阶 | 具备数据表设计能力 | 可设计      | 掌握       | 了解                    | -      |
| 复杂管理后台   | 进阶 | 具备数据表设计能力 | 可设计      | 掌握       | 了解                    | -      |
| 自建低代码平台 | 专家 | 具备数据表设计能力 | 可设计      | 掌握       | 熟练                    | -      |
| 参与代码贡献   | 专家 | 具备数据表设计能力 | 可设计      | 掌握       | 熟练                    | 掌握   |

## 基础概念

### YAO DSL

领域特定语言 DSL (domain specific language), 是专门针对特定应用领域的计算机语言。

YAO 定义了一套 YAO DSL，用来描述数据结构、数据流、API 接口、并发任务、计划任务、WebSocket 、Socket、Table、Form、Chart 等功能(或服务)模块。

DSL 文件是一个 JSON 格式的文本, 编写体验与 HTML 相似, HTML 描述页面元素, DSL 用来描述功能。

YAO DSL 有多种编写方式，且这些编程方式可以随意切换。

1. 支持手工编写， 开发者可以使用任意编程工具编写调试。
2. 支持程序生成， 根据上下文逻辑，自动生成 DSL 或脚本代码，甚至可以接入 AI 让人工智能编程序。
3. 支持可视化编程工具制作，使用 Studio 通过托拉拽图形化编程。

通过这种编码方式，可以有效提升生产力, 降低复制粘贴错误率，同时也让自动化编程成为可能。

### YAO Runtime

YAO 内建 JavaScript Runtime。

在复杂业务逻辑编排、Studio 自动化生成 DSL 和云函数等场景下，均可以使用 JavaScript 脚本实现复杂业务逻辑。

这一特性使 YAO 具备脚本语言的基础能力，在一些场景下可以代替脚本语言使用。

### YAO Widget

Widget 抽象出一个功能模块的通用部分,使用 YAO DSL 描述差异，实现快速复制，有效提升开发效率。

Widget 支持自定义, 支持使用 Studio 脚本创建实例，可用于自建低代码平台。

**内建 Widgets:**

| Widget           | 说明                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| App              | APP Widget 每一个应用只有一个                                                    |
| Model            | 数据模型 用于描述数据表结构                                                      |
| Store            | Key-Value 存储                                                                   |
| Flow             | 数据流 用于编排处理器调用逻辑                                                    |
| API              | REST API 用于编写 RESTFul API                                                    |
| Connector        | 连接器 用于连接 Redis, Mongo, MySQL, ES 等外部服务, 连接器可与 Model, Store 关联 |
| Task             | 并发任务                                                                         |
| Schedule         | 计划任务                                                                         |
| WebSocket Server | WebSocket Server                                                                 |
| WebSocket Client | WebSocket Client                                                                 |
| Socket           | Socket Server/Client                                                             |
| Cert             | PEM 证书导入                                                                     |
| Import           | 数据导入 可以与表格界面关联                                                      |
| Login            | 登录界面                                                                         |
| Table            | 表格界面                                                                         |
| Form             | 表单界面                                                                         |
| Chart            | 图表界面                                                                         |

### YAO Process

YAO 提供一组数据原子操作、网络请求、流程控制等一系列的处理器。

这些处理器可以在命令行、Widget、Script、云函数和 Studio 脚本中使用。

处理器支持自定义，可以通过编写 Flow、Script、 GRPC 插件或自定义 Widget 方式扩展。

**内建处理器:**

| 处理器      | 说明                         |
| ----------- | ---------------------------- |
| models.\*   | 数据模型原子操作             |
| schemas.\*  | 数据表结构操作               |
| stores.\*   | 数据存储                     |
| fs.\*       | 文件系统                     |
| http.\*     | HTTP 请求                    |
| session.\*  | 会话数据                     |
| encoding.\* | 编码解码                     |
| crypto.\*   | 加密解密                     |
| ssl.\*      | 签名校验                     |
| utils.\*    | 一组实用程序                 |
| flows.\*    | 使用 Flow 编写的处理器       |
| scripts.\*  | 使用 Script 脚本编写的处理器 |
| plugins.\*  | 使用 GRPC 插件编写处理器     |
| widgets.\*  | 自定义 Widget 导出的的处理器 |

内建 Widgets 的处理器:

| Widget   | 处理器       | 说明                           |
| -------- | ------------ | ------------------------------ |
| App      | yao.app.\*   | App Widget 处理器              |
| Login    | yao.login.\* | Login Widget 处理器            |
| Table    | yao.table.\* | Table Widget 处理器            |
| Form     | yao.form.\*  | Form Widget 处理器             |
| Chart    | yao.chart.\* | Chart Widget 处理器            |
| Import   | imports.\*   | Import Widget 数据导入处理器   |
| Task     | tasks.\*     | Task Widget 并发任务处理器     |
| Schedule | schedules.\* | Schedule Widget 异步任务处理器 |

[使用使用处理器文档](使用处理器)

### 关系数据库

关系数据库，是创建在关系模型基础上的数据库，借助于集合代数等数学概念和方法来处理数据库中的数据。现实世界中的各种实体以及实体之间的各种联系均用关系模型来表示。关系模型是由埃德加·科德于 1970 年首先提出的，并配合“科德十二定律”。现如今虽然对此模型有一些批评意见，但它还是数据存储的传统标准。标准数据查询语言 SQL 就是一种基于关系数据库的语言，这种语言执行对关系数据库中数据的检索和操作。

关系模型由关系数据结构、关系操作集合、关系完整性约束三部分组成。 [维基百科链接](https://zh.wikipedia.org/wiki/%E5%85%B3%E7%B3%BB%E6%95%B0%E6%8D%AE%E5%BA%93)

YAO 支持的关系数据库版本

| 数据库   | 版本  | 说明     |
| -------- | ----- | -------- |
| MySQL    | 5.7.x |          |
| MySQL    | 8.0.x |          |
| SQLite   | 3.x   |          |
| Postgres | 9.6   | 即将支持 |
| Postgres | 14    | 即将支持 |

### Web Server

Web Server，通过 HTTP 协议或 HTTPS 协议 接受请求， 根据客户端(浏览器)请求内容，应答响应。 [维基百科链接](https://en.wikipedia.org/wiki/Web_server)

### HTTP 协议

超文本传输协议 (HTTP) 是 Internet 协议套件模型中的一个应用层协议，用于分布式、协作、超媒体信息系统。[维基百科链接](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol)

### REST API

REST API 也称为 RESTful API，是遵循 REST 架构规范的应用编程接口（API 或 Web API），支持与 RESTful Web 服务进行交互。REST 是表述性状态传递的英文缩写，由计算机科学家 Roy Fielding 创建。

[维基百科链接](https://en.wikipedia.org/wiki/Representational_state_transfer)
