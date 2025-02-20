# Table 钩子函数

可使用以下的配置替换 table 的默认处理器

注意：在钩子函数中报错或是 error 只会记录在日志文件里，不会影响整个流程。

通过指定 API 处理器，在不绑定数据模型的情况下，在数据表格中使用其他的数据源。

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

可以使用 Hooks 处理表格 API 输入输出数据。Hook 分为 `before` 和 `after` 两类， before hook，在 API 调用前运行，可以用来处理传入参数，after hook，在 API 调用后运行，可用来处理查询结果。

在描述数据表格时，在 `hooks` 字段，声明 **Hook 关联的处理器**，例如：

使用 Before Hook 锁定搜索条件，过滤掉 `search` API 越界输入。

使用 After Hook 处理表单提交数据，保存历史数据。

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
