# Table 钩子函数

可使用以下的配置替换 table 的默认处理器

## action

- setting
- component
- upload
- download
- search
- get
- find
- save
- create
- insert
- delete
- delete-in
- delete-where
- update
- update-in
- update-where

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

- before:find
- after:find
- before:search
- after:search
- before:get
- after:get
- before:save
- after:save
- before:create
- after:create
- before:delete
- after:delete
- before:insert
- after:insert
- before:delete-in
- after:delete-in
- before:delete-where
- after:delete-where
- before:update-in
- after:update-in
- before:update-where
- after:update-where

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
