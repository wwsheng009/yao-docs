# yao run 命令中的特殊字符

在使用 yao 的过程中，会频繁的使用到一个`yao run`的命令。这个命令用于执行 Yao 中定义的各种处理器，包括模型操作、API 调用等。

## 基本语法

```sh
yao run <处理器名称> [参数1] [参数2] ...
```

## JSON 参数的使用

在这些命令中最常见的一个字符串是`::`，其中的`::`表示`yao run`命令的参数的类型是`json`格式，需要按`json`的格式输入数据。

### 常见示例

1. 新增一条数据

```sh
yao run models.pet.Create '::{ "sn":"200001", "name":"球球", "type":"狗", "desc":"新成员" }'
```

2. 更新一条数据

```sh
yao run models.pet.Update 1 '::{ "desc":"一只可爱的三色猫" }'
```

3. 保存一条数据（指定主键则更新，不指定则创建）

```sh
yao run models.pet.Save '::{ "sn":"200002", "name":"天狼", "type":"狗", "desc":"新成员" }'
yao run models.pet.Save '::{ "id":1, "desc":"一只可爱的三色猫" }'
```

## 转义字符的使用

如果你需要在参数中使用`::`作为普通字符串，而不是作为 JSON 标识符，可以使用`\::`进行转义。

```sh
yao run scripts.test.Print '\::这是一个普通字符串'
```

## 源代码解析

在 Yao 的源代码中（`/yao/source/yao/cmd/run.go`），对参数的处理逻辑如下：

```go
// 解析参数
if strings.HasPrefix(arg, "::") {
    arg := strings.TrimPrefix(arg, "::")
    var v interface{}
    err := jsoniter.Unmarshal([]byte(arg), &v)
    if err != nil {
        fmt.Println(color.RedString(L("Arguments: %s"), err.Error()))
        return
    }
    pargs = append(pargs, v)
    fmt.Println(color.WhiteString("args[%d]: %s", i-1, arg))
} else if strings.HasPrefix(arg, "\\::") {
    arg := "::" + strings.TrimPrefix(arg, "\\::")
    pargs = append(pargs, arg)
    fmt.Println(color.WhiteString("args[%d]: %s", i-1, arg))
} else {
    pargs = append(pargs, arg)
    fmt.Println(color.WhiteString("args[%d]: %s", i-1, arg))
}
```

## 常见问题

1. JSON 格式错误

   - 确保 JSON 字符串格式正确，特别是引号的使用
   - 在 Windows 命令行中，可能需要使用转义字符

2. 特殊字符处理
   - 如果 JSON 中包含特殊字符，确保正确转义
   - 在 Windows 环境下，可能需要使用双引号包裹整个命令

## 最佳实践

1. 使用单引号包裹 JSON 字符串
2. 保持 JSON 格式的整洁和可读性
3. 在复杂的 JSON 数据结构中，建议先将数据保存在文件中，然后使用文件读取的方式执行命令
