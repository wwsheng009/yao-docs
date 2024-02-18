# Form 钩子函数

替换 Form 的默认处理器,可自定义 form 处理的过程

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
      "process": "", //处理器名称
      "bind": "", //处理器名称,同process
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。
      "default": [] //默认参数值
    }
  }
}
```

## Hook:

使用 hook 函数可以增强 Form 的处理过程，比如 find 处理器使用默认的处理器，使用 before 与 after 处理器增强默认处理器的行为。

- before:find
- after:find
- before:save
- after:save
- before:create
- after:create
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

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致。

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。
