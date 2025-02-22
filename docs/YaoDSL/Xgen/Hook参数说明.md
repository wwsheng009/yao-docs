# hook 的参数

`Table/Form`都可以使用`hook`来增强功能

## before:save

`before hook`与`after hook`的`xpath`在`action`节点下

`forms/record/total.form.json`

```json
{
  "name": "记录",
  "action": {
    "bind": {
      "model": "record"
    },
    "before:save": "scripts.record.BeforeSave",
    "after:save": "scripts.record.AfterSave"
  }
}
```

`before:save`的输入参数是`payload`,输出是包含`payload`的数组

```js
/** 数据保存之间调用 */
function BeforeSave(payload) {
  // 输出数组,为下一个处理器save作准备,格式一定是数组
  return [payload];
}
```

## save

`Save`处理器的说明如下，第一个参数是结构体，不是数组,使用`[<记录>]`的形式是因为所有的处理器的调用用时的参数形式都是数组，在调用具体脚本函数时，参数列表会自动的解构。

`models.<ID>.Save	[<记录>]	记录主键值	保存单条记录, 不存在创建记录, 存在更新记录, 返回记录 ID 示例 查看`

```js
/**
 * Save Hook函数
 * payload 需要保存的记录结构
 * 返回保存的数据的id
 * */
function Save(payload) {
  // 自定义的处理逻辑

  // 可以返回id或是返回数组[id]
  return id;
}
```

## after:save

`save`只会返回一个保存后的`id`,可以在`aftersave`中根据 id 把数据读取出来

```js
/**
 * 数据保存之后
 * id,接收Save方法返回的id
 * 返回id
 * */
function AfterSave(id) {
  // read the saved record
  var payload = Process('models.<模型名称>.Find', id, {});

  // 可以增加其它筛选条件
  var payload = Process('models.<模型名称>.Find', id, {
    select: ['id', 'name', 'user_sn', 'photo', 'status']
  });

  // 一般都返回id
  return id;
}
```

## form hook

form hook before / after 的源代码

`/yao/widgets/hook/hook.go`
