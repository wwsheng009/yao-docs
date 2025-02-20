# List 钩子函数

替换 List 的默认处理器

## action

- setting 默认处理器 "yao.list.Setting"
- component 默认处理器 "yao.list.Component"
- upload 默认处理器 "yao.list.Upload"
- download 默认处理器 "yao.list.Download"
- get 默认处理器 "yao.list.Get"
- save 默认处理器 "yao.list.Save"

```json
{
  "action": {
    "get": {
      "process": "", //处理器名称
      "bind": "", //处理器名称,同process
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。
      "default": [] //默认参数值
    }
  }
}
```

## Hook:

- before:get
- after:get ""
- before:save
- after:save

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
