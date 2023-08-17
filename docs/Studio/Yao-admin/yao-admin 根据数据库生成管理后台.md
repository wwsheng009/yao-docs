# yao-admin 根据数据库自动生成管理后台

## Yao-admin 是一个可以让你零代码就能生成一个管理后台的工具。

很多初学 yao 的朋友会对 yao 的配置文件望而却步。

- 一 是 yao 自定义了一系列的 dsl 语法,如果需要完全掌握这套语法需要不少的时间。
- 二 是要作出一个功能完整的 yao 管理后台,需要编写不少的 json 文件。
- 三 什么文档都不想看,只想着软件下载完后就能得到一个管理后台了。

没错,yao-admin 就是为懒人准备的。即使你完全没有 yao 的使用经验也没有关系。你只需要有一个 mysql 数据库,并且在数据库里创建了一些表或是已经存在现有的表就可以使用 yao-admin。

## 前提条件

- 知道 yao 是什么
- 知道基本的 linux 命令行
- 把这篇文档读完,并按步操作

## 准备工作

准备好 mysql 数据库的连接用户名与密码。

在数据库中创建你的表。

数据库表也不知怎么创建? 也没有关系,这里有一个示例数据库的 sql,下载 sql 文件并导入到你的数据库里。

https://github.com/linlinjava/litemall/tree/master/litemall-db/sql

**注意**:yao 对数据库表格式要求是,表中必须有一个名称为 id 的自增字段。

## 下载 yao

目前是推荐使用 yao-0.10.3 版本的执行程序。请在以下地址找到 yao 程序并下载安装。

https://yaoapps.com/release#Yao%20v0.10.3%20%E6%AD%A3%E5%BC%8F%E5%8F%91%E5%B8%83

yao 程序是 go 编译的单文件执行程序,如果你有几个版本的 yao,只需要把 yao 执行程序重命名即可。

## 下载 yao-admin

```sh
git clone https://github.com/wwsheng009/yao-admin
cd yao-admin
yao start
```

注意,不需要配置额外的文件,比如自己创建.env 文件。

执行 yao start 后控制台会显示一个 url 地址,复制地址并在浏览器里打开。在这一步里,如果默认端口 5099 被占用,会显示一个随机的端口,这个并不会影响后面的操作。

```sh
yao start
---------------------------------
Yao Application Setup v0.10.3
---------------------------------

Open URL in the browser to continue:

http://127.0.0.1:45973
```

你需要配置好:

- 监听端口 5089,默认的端品是 5099,如果已经被占用,指定别的端口
- Studio 端口 5067,默认的端品是 5077,如果已经被占用,指定别的端口

- 数据库类型,推荐使用 mysql
- 数据库名称,你创建的数据库名称
- mysql 的连接地址
- mysql 的连接端口
- mysql 的用户名
- mysql 的密码

点击测试连接,测试通过后,最后点击确认按钮就可以了。

一切顺利,浏览器会打开一个新的地址,yao 管理后台登录界面。使用下面的用户名密码登录。

**注意**：如果之前使用过 yao 的旧版本，请清空浏览器缓存，或是使用新的浏览器。

```sh
用户名
xiang@iqka.com
密码
A123456p+
```

恭喜你,yao-admin 已经帮你生成一个完整的管理后台。

## 如果数据库表结构变了

如果数据库表结构变了,执行以下的命令重新生成所有的配置。

```sh
# 根据数据库表结构创建模型文件
yao studio run model.cmd.CreateModelsFromDB

# 根据本地模型DSL文件创建所有模型对应的表格与表单
yao studio run model.cmd.CreateFromFile
```

## 其它高级的使用方法

你可以看看源代码

https://github.com/wwsheng009/yao-admin
