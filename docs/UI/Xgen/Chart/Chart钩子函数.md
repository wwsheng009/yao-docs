# Chart 钩子函数

替换 Chart 的默认处理器,可自定义 Chart 处理的过程

## action

- setting 默认处理器 "yao.chart.Setting"
- component 默认处理器 "yao.chart.Component"
- data 默认处理器 "yao.chart.Data"

```json
{
  "action": {
    "data": {
      "process": "", //处理器名称
      "bind": "", //处理器名称,同process
      "guard": "bearer-jwt", //处理器名称，常见的有bearer-jwt，-。
      "default": [] //默认参数值
    }
  }
}
```

## Hook:

使用 hook 函数可以增强 Chart 的处理过程，比如 data 处理器使用默认的处理器，使用 before 与 after 处理器增强默认处理器的行为。

- before:data
- after:data

比如：

```json
{
  "action": {
    "after:data": "scripts.demo.AfterData",
    "before:data": "scripts.demo.BeforeData"
  }
}
```

## hook 函数参数

before 处理器的输入参数与默认处理器输入参数保持一致，before 处理器输出返回值需要与默认处理器的**输入参数**保持一致。

after 处理器的输入参数是默认处理器的返回值，after 处理器输出返回值需要与默认处理器的**输出参数**保持一致。

也既是只要了解默认处理器的传入参数与返回值，可以推算出 before 与 after 处理器的参数与返回值。
