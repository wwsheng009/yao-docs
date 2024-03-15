# Form 钩子函数

替换 Form 的默认处理器,可自定义 form 处理的过程,

钩子函数分两类：一类是完全替换整个功能，另外一类是不修改内置功能，而是进行补丁。

第一类，比如要创建一个用户主数据记录，yao 本身就内置了一个处理器`yao.form.save`,用于把数据保存到数据库中。如果不需要把数据保存到数据库，而是把数据通过 http 接口传输到另外一个系统时，可以通过配置`action.save`来设置一个自定义的`action`处理器。

## action

| 操作      | 默认处理器         | 参数                                   |
| --------- | ------------------ | -------------------------------------- |
| setting   | yao.form.Setting   | form_id, xpath, method, query          |
| component | yao.form.Component | form_id, xpath, method, payload        |
| upload    | yao.form.Upload    | form_id, xpath, method, file           |
| download  | yao.form.Download  | form_id, field_name, query_name, token |
| find      | yao.form.Find      | form_id, primary_key                   |
| save      | yao.form.Save      | form_id, payload                       |
| create    | yao.form.Create    | form_id, payload                       |
| update    | yao.form.Update    | form_id, primary_key, payload          |
| delete    | yao.form.Delete    | form_id, payload                       |

```json
{
  "action": {
    "find": {
      "process": "", //处理器名称，必选
      "bind": "", //处理器名称,同process【可选】
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。【可选】
      "default": [] //默认参数值【可选】
    }
  }
}
```

第二类需求，在把数据保存到数据库之后或是之前，进行数据处理，可以使用`before`或是`after` `action`处理器。

注意：在钩子函数中报错或是 error 只会记录在日志文件里，不会影响整个流程，所以当需要错误处理时，最好选择第一类钩子函数进行增强处理。

## Hook:

使用 hook 函数可以增强 Form 的处理过程，比如 find 处理器使用默认的处理器，使用 before 与 after 处理器增强默认处理器的行为。

- before:find
- after:find
- before:save
- after:save
- before:create
- after:create,传入参数是记录创建后的主键值，一般是 autoid
- before:delete
- after:delete
- before:update
- after:update

比如：

```json
{
  "action": {
    "after:find": "scripts.license.AfterFind",
    "before:delete": "scripts.license.BeforeDelete"
  }
}
```

## hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致,由于 yao 处理器的特殊性，返回值如果不是 null,都需要返回数组。

```js
function beforeSave(payload) {
  if (!payload.public_key && !payload.private_key) {
    const keyObj = Process('plugins.license.create');
    payload.public_key = keyObj.public_key;
    payload.private_key = keyObj.private_key;
    payload.key_hash = keyObj.key_hash;
  }

  return [payload]; //返回数组
}
```

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。
