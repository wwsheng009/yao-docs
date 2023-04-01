# yao run 命令中的特殊字符

在使用 yao 的过程中，会频繁的使用到一个`yao run`的命令。

新增一条数据

```sh
yao run models.pet.Create '::{"sn":"200001", "name":"球球", "type":"狗", "desc":"新成员"}'
```

更新一条数据

```sh
yao run models.pet.Update 1 '::{"desc":"一只可爱的三色猫"}'
```

保存一条数据，指定主键则更新，不指定创建创建。

```sh
yao run models.pet.Save '::{"sn":"200002", "name":"天狼", "type":"狗", "desc":"新成员"}'
yao run models.pet.Save '::{"id":1,"desc":"一只可爱的三色猫"}'
```

在这些命令中最常见的一个字符串是`::`,其中的`::`表示`yao run`命令的参数的类型是`json`格式，需要按`json`的格式输入数据。

源代码学习
`/yao/source/yao/cmd/run.go`

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
