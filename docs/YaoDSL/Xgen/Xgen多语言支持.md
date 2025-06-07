# Xgen 多语言支持

## 多语言配置使用

语言包分全局语言包与特定类型`DSL`语言包。两种语言包的功能一样，但是作用域不一样。

全局语言包在目录应用`langs`目录。

特定Widget类型的`DSL`语言包在语言包对应语言目录的子目录下

支持以下的Widgets，每一种widgets都有对应的语言包目录，翻译文件的名称对应widgets的名称与路径。

- "logins"
- "tables"
- "forms"
- "charts"
- "kanban"
- "screen"
- "pages"
- "apis"
- "models"
- "flows"
- "apis"
- "app.yao" 配置文件的语言包

示例：

- `/data/app/langs/zh-cn/global.yml` 全局语言包文件
- `/data/app/langs/zh-cn/models/pet.mod.yml` Model pet 语言包
- `/data/app/langs/zh-cn/models/user/pet.mod.yml` Model user.pet 语言包
- `/data/app/langs/zh-cn/tables/pet.mod.yml` Table pet 语言包
- `/data/app/langs/zh-cn/app/app.yml` app.yao 语言包

语言包的作用主要是用于`xgen`框架，当然也可以使用`api`函数进行调用，读取相关的界面配置。相关的处理器有`（yao.table.Setting/yao.form.Setting）`

## 源代码分析：

如果`DSL`配置文件里的配置有包含`$L()`的表达式时，说明配置对象是一个需要翻译的文本对象。在输出到界面之前，程序会针对这类对象进行多语言翻译。

可以修改环境变量`YAO_LANG`变换多语言翻译项目，可选项有`en-us/zh-cn/zh-hk`
如果处理器中包含语言设置时，会覆盖默认值。

- `yao/widgets/form/action.go`，在 json 中配置的前缀会转换成$L()表达式
- `yao/i18n/i18n.go`
- `gou/lang/lang.go` 处理多语言的过程
- `yao/fields/model.trans.json` 在模型定义文件中有较多的使用场景

## 在`js`函数里可以直接使用`$L()`函数处理多语言描述

`$L()`这个函数会读取global.yml的配置文件，然后根据`YAO_LANG`环境变量的值，读取对应的语言包文件。

```js
function Bar(...args) {
  return {
    message: $L('Another yao application') + ' (Cloud Function: foo.Bar)',
    args: args
  };
}
```

也可以在第二个参数指定语言包名称

```js
function Bar(...args) {
  return {
    message:
      $L('Another yao application', 'zh-cn') + ' (Cloud Function: foo.Bar)',
    args: args
  };
}
```

## 在`json`配置文件中使用多语言

如果在`DSL`配置文件中需要翻译文本，在文本内容前面加上前缀::

根据`YAO_LANG`环境变量的值，读取对应的语言包文件。

适用范围是`api`文件，`model`文件，`table`文件，`form`文件，`app.yao`文件

根据`YAO_LANG`环境变量的值，读取对应的语言包文件。

```json
{
  "name": "::Pet",
  "table": { "name": "pet", "comment": "$L(Pet) Table" },
  "columns": [
    { "name": "id", "comment": "ID", "type": "ID" },
    {
      "name": "name",
      "comment": "::Pet Name",
      "type": "string",
      "length": 80,
      "index": true,
      "nullable": true
    }
  ]
}
```
