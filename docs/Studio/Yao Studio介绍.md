# Yao Studio 介绍

`Yao`未提供`Yao Studio`图形化拖拉拽的界面。但是有`Studio 命令`/`Studio API`。

`Studio`脚本拥有最高的执行权限`(root)`。可以操作应用目录下所有的数据文件与脚本文件。利用这一点，可以进行代码生成代码的操作。

## `Studio`目录

Yao 应用目录下有一个`/studio`的目录，`Studio`函数与命令只能调用这个目录下的`js`脚本。在`studio`目录下的`js`脚本可以访问[文件系统](https://yaoapps.com/doc/%E6%89%8B%E5%86%8C/JSAPI/FileSystem)所有的命名空间：` system`，`dsl`，`script `。

```js
//system	/data/app/data	应用数据
function ReadFile() {
  let fs = new FS('system');
  let data = fs.ReadFile('/f1.txt'); // /data/app/data/f1.txt
  return data;
}

//dsl 除 scripts 外的所有目录(仅 Studio 脚本可用)
function ReadFile() {
  let fs = new FS('dsl');
  let data = fs.ReadFile('/models/f1.mod.json'); // /data/app/models/f1.mod.json
  return data;
}

//script 脚本目录(仅 Studio 脚本可用)
function ReadFile() {
  let fs = new FS('script');
  let data = fs.ReadFile('/f1.js'); // /data/app/scripts/f1.js
  return data;
}
```

## Yao Studio 命令

`Yao Studio命令`用来执行`/studios`目录下的所有的脚本。注意：该命令只允许在`YAO_ENV=development`模式下运行

`Studio`并不是一个单独的命令，而是`Yao`的一个子命令,命令的调用方式如下。

```sh
# 脚本名字 ScriptName
# 方法名称 Method
# 参数列表 param1 param2
yao studio run ScriptName.Method param1 param2
```

## Studio JS API

在`js`脚本统一使用函数`Studio`中调用`/studio`目录下的脚本的函数。调用方法像其它的`js`函数一样。

```js
//参数一是脚本名字.函数名
//参数二开始是函数的参数列表。
const data = Studio('file.DotName', modelName);
```

## Studio WEB API

`Studio`脚本函数也可以通过`web rest api`接口调用。不过跟一般的`api`接口调用不一样，它有单独的端口与入口。

`Studio api`请求的基础路由地址：`http://127.0.0.1:5077/service/`,端口可以通过环境变量`YAO_STUDIO_PORT`进行配置，比如在`.env`文件中修改。

如果需要调用脚本函数`model.CreateOne`，按以下的格式调用。

```sh
curl -X POST http://127.0.0.1:5077/service/model \
   -H 'Content-Type: application/json' \
   -H 'Authorization: Bearer <Studio JWT>' \
   -d '{ "args":["yao.demo.pet"],"method":"CreateOne"}'
```

`url`中的`model`是脚本名称，脚本函数访问与参数放在请求的`payload`里。

### 在`Xgen action`中调用

`Xgen`已经封装了`Studio`脚本函数的调用方法

如果需要在`xgen`表单界面上调用`studio`接口。在`form.json`配置中增加`action`配置。

注意只能使用管理员账号登录才能自动获取到`studio`的`token`

```json
{
  "title": "重新生成代码",
  "icon": "icon-layers",
  "showWhenAdd": true,
  "showWhenView": true,
  "action": [
    {
      "name": "StudioModel",
      "type": "Studio.model", //类型名称设置成studio.脚本名称
      "payload": {
        //访问与参数
        "method": "CreateOne",
        "args": ["cms.help"]
      }
    },
    {
      "name": "Confirm",
      "type": "Common.confirm",
      "payload": {
        "title": "提示",
        "content": "处理完成"
      }
    }
  ]
}
```

## 基于 Studio 开发的应用

- [Yao-admin](https://github.com/YaoApp/yao-admin),`Yao`官方开发的根据数据库结构生成`Yao应用`的应用。这个版本目前是适用于`0.10.2`版本`Yao`

- [Yao-Admin-0.10.3](https://github.com/wwsheng009/yao-admin),基于官方的应用适配的`Yao 0.10.3`版本

- [根据模型创建表格与表单](https://github.com/wwsheng009/yao-init-0.10.3/blob/main/studio/init.js)，根据模型定义生成界面配置文件。比如执行下面的代码，能根据你的模型定义生成界面`Table/Form`配置文件。需要下载安装插件脚本。
  > ```sh
  > yao studio run init.CreateTable pet
  > ```
