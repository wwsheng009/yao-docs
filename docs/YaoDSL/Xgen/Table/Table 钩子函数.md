# Table 钩子函数

通过使用钩子函数可以达到以下效果：

- 通过使用前置与后置增强内置的action处理器。在数据库数据表中获取数据时，使用前置钩子函数可以对数据进行处理，比如对数据进行过滤、排序、分页等操作。在数据读取完成后，使用后置钩子函数可以对数据进行处理，比如对数据进行格式化、计算等操作。
- 完全替换内置的action处理器。默认的处理器会以模型定义，数据库表的数据作为数据源。而使用替换处理器可以完全自定义表格的数据来源，比如可以从其它的数据数据源中获取数据。

## 替换内置的action处理器

可使用以下的配置替换 table 的默认处理器

注意：在钩子函数中报错或是 error 只会记录在日志文件里，不会影响整个流程。

通过指定 API 处理器，在不绑定数据模型的情况下，在数据表格中使用其他的数据源。

- setting: 获取表格设置
- component: 获取组件配置
- upload: 上传处理
- download: 下载处理
- search: 搜索数据，返回分页数据
- get: 获取单条数据
- find: 查找数据
- save: 保存数据
- create: 创建数据
- insert: 插入数据
- delete: 删除数据
- delete-in: 批量删除数据
- delete-where: 条件删除数据
- update: 更新数据
- update-in: 批量更新数据
- update-where: 条件更新数据

## 示例

可以通过在 `action` 字段中配置以下处理器来替换表格的默认处理器：

```json
{
  "action": {
    "setting": {
      "process": "scripts.setting.get",
      "bind": "scripts.setting.get",
      "guard": "bearer-jwt",
      "default": []
    }
  }
}
```

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

处理器配置项说明：

| 配置项  | 类型   | 说明                               |
| ------- | ------ | ---------------------------------- |
| process | string | 处理器名称                         |
| bind    | string | 处理器名称，同 process，可以省略   |
| guard   | string | 处理器名称，常见的有 bearer-jwt、- |
| default | array  | 默认参数值                         |

## Hook:

可以使用 Hooks 处理表格 API 输入输出数据。Hook 分为 `before` 和 `after` 两类。

- before hook，在 API 调用前运行，可以用来处理传入参数。
- after hook，在 API 调用后运行，可用来处理查询结果。

在描述数据表格时，在 `hooks` 字段，声明 **Hook 关联的处理器**，例如：

使用 Before Hook 锁定搜索条件，过滤掉 `search` API 越界输入。

使用 After Hook 处理表单提交数据，保存历史数据。

- before:find - 在执行find查询前调用，可用于修改查询条件
- after:find - 在执行find查询后调用，可用于处理查询结果
- before:search - 在执行search搜索前调用，可用于修改搜索参数和过滤条件
- after:search - 在执行search搜索后调用，可用于处理搜索结果和分页数据
- before:get - 在执行get获取单条记录前调用，可用于验证和修改查询参数
- after:get - 在执行get获取单条记录后调用，可用于处理返回数据
- before:save - 在执行save保存前调用，可用于数据验证和预处理
- after:save - 在执行save保存后调用，可用于后续处理如发送通知
- before:create - 在执行create创建前调用，可用于设置默认值和数据验证
- after:create - 在执行create创建后调用，可用于关联数据处理
- before:delete - 在执行delete删除前调用，可用于删除验证和关联检查
- after:delete - 在执行delete删除后调用，可用于清理关联数据
- before:insert - 在执行insert插入前调用，可用于数据预处理和验证
- after:insert - 在执行insert插入后调用，可用于更新相关统计数据
- before:delete-in - 在执行批量删除前调用，可用于验证删除条件
- after:delete-in - 在执行批量删除后调用，可用于批量清理关联数据
- before:delete-where - 在执行条件删除前调用，可用于验证删除条件
- after:delete-where - 在执行条件删除后调用，可用于相关数据更新
- before:update-in - 在执行批量更新前调用，可用于数据验证
- after:update-in - 在执行批量更新后调用，可用于更新缓存
- before:update-where - 在执行条件更新前调用，可用于验证更新条件
- after:update-where - 在执行条件更新后调用，可用于同步更新相关数据

## hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致。

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。

## 示例

```json
{
  "action": {
    "after:find": "scripts.license.AfterFind",
    "before:delete": "scripts.license.BeforeDelete"
  }
}
```
