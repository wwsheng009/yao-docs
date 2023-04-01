# 在字段中使用计算功能

## 使用 Compute

组件`table/form/filter`可以使用字段的`compute`功能在数据显示前或是输入后进行拦截处理。
一般有两个使用场景：
数据输出之前需要在字段的 view 属性里设置`compute`属性,在数据输出之前会调用处理方法。
数据输入之后需要在字段的 edit 属性里设置`compute`属性，在用户输入数据之后会调用处理方法。

```json
{
  "图集": {
    "bind": "images",
    "view": { "type": "Image", "compute": "ImagesView", "props": {} },
    "edit": {
      "type": "Upload",
      "compute": "ImagesEdit",
      "props": {
        "api": "/api/__yao/upload_test",
        "filetype": "image",
        "maxCount": 6
      }
    }
  }
}
```

`compute`属性定义如下：

源代码路径：`yao/widgets/component/compute.go`

```go
type Compute struct {
    Process string `json:"process"`
    Args    []CArg `json:"args,omitempty"`
}

// CArg compute interface{}
type CArg struct {
    IsExp bool
    key   string
    value interface{}
}
```

如果`compute`属性的值类型是字符串，会自动的转换成`处理器`名称，并给`处理器`传入 4 个参数。

```go
//第一个参数是字段的值。
// ["$C(value)", "$C(props)", "$C(type)","$C(id)","$C(path)"]
var defaults = []CArg{
    {IsExp: true, key: "value", value: nil},//控件的值，
    {IsExp: true, key: "props", value: nil},//属性
    {IsExp: true, key: "type", value: nil},//类型
    {IsExp: true, key: "id", value: nil},//数据的id
    {IsExp: true, key: "path", value: nil},//配置路径xpath
}
```

## 参数的传值

传入值：

调用 `Compute` 实际上是在调用处理器,参数的数量可变的，类型也没限制。

参数里可以使用表达式引用变量或是常量。

在参数中可使用表达式`$()`引用变量，也可以直接使用常量。非常的灵活。

```go

 "Concat": []byte(`{
     "process": "Concat",
     "args": ["$C(row.type)", "\\::", "$C(value)", "-", "$C(row.status)"]
 }`),
 "Mapping": []byte(` {
     "process": "Mapping",
     "args": [
       "$C(value)",
       { "0": "checked", "1": "curing", "2": "cured" }
     ]
 }`),
 "MappingOnline": []byte(`{
     "process": "scripts.compute.MappingOnline",
     "args": ["$C(value)", "$C(props.mapping)"]
 }`),

```

返回值：**Compute 处理器的返回值会赋予字段**。

`view/edit`中的`compute`处理器可以在表达式中引用以下的变量:

- row， 引用整行用户传入的单条数据结构对象，可以使用点号引用嵌套对象。
- value， 引用当前字段的值
- id，引用行 id
- path，引用属性路径，比如：fields.table.创建时间
- props，同时还可以访问字段配置的 view 下所有的属性

**注意**：`Compute`无法处理嵌套的关联表子对象：
[自我修复](../%E6%BA%90%E4%BB%A3%E7%A0%81/Yao/Compute%20%E5%A4%84%E7%90%86%E5%99%A8%E6%97%A0%E6%B3%95%E5%A4%84%E7%90%86%E5%85%B3%E8%81%94%E8%A1%A8.md)

## 内置处理器

yao 系统里有几个内置的处理器

`yao/widgets/component/handlers.go`

- Get，直接返回当前字段的值，可引用不同路径的值
- Trim，去除前后空格
- Hide，不返回值，相当于隐藏了值，在数据库里有，但是没有显示
- Concat，拼接多个值
- Download，返回文件的下载地址
- Upload，上传文件并返回下载路径

除了内置的处理，可以使用其它任何合法的 yao 处理器。

示例

```json
{
  "别名": {
    "bind": "name_new",
    "view": {
      "type": "Text",
      "compute": {
        "process": "Concat",
        "args": ["$C(row.name)", "-", "$C(row.status)"]
      },
      "props": {}
    },
    "edit": {
      "type": "Input",
      "props": { "placeholder": "请输入宠物名称" }
    }
  }
}
```

`Compute`的调用顺序与生命周期

```js
// Life-Circle: Compute Filter → Before Hook → Compute Edit → Run Process → Compute View → After Hook

// 筛选控件的Compute
// Execute Compute Filter On:  Search, Get, Find

// 编辑控件的Compute
// Execute Compute Edit On:    Save, Create, Update, UpdateWhere, UpdateIn, Insert

// 查看控件的Compute
// Execute Compute View On:    Search, Get, Find
```
