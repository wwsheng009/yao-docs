---
title: Switch Case 无子节点 goto 兼容修复
---

## 背景

在 Pipe DSL 中，`switch` 节点的 `case` 分支被实现为“子 Pipe”（`map[string]*Pipe`）。因此在 DSL 表达上，分支不仅可以包含 `nodes`（可执行子管道），也可能只包含 `goto / input / output` 等控制字段。

本次修复解决的场景：`switch.case` 里只有 `default`，且 `default` 仅配置了 `goto`（以及可选的 `input/output`），**没有配置子节点 `nodes`**。

## 问题表现（复现）

类似以下 DSL：

```json
{
  "name": "AI Translator",
  "hooks": { "progress": "scripts.pipe.onProgress" },
  "whitelist": ["utils.json.Validate", "utils.fmt.Print", "utils.app.Ping"],
  "nodes": [
    {
      "name": "user",
      "label": "Enter the command",
      "ui": "cli",
      "autofill": { "value": "{{ $in[0].placeholder }}", "action": "exit" },
      "output": { "cmd": "{{$out[0]}}", "args": "{{$out[1:]}}" }
    },
    {
      "name": "switch",
      "case": {
        "default": { "goto": "help", "input": "{{ user }}" } // not trigger
      }
    },
    {
      "name": "print",
      "process": { "name": "utils.fmt.Print", "args": "{{ $in }}" },
      "output": null,
      "goto": "EOF"
    },
    {
      "name": "help",
      "process": {
        "name": "utils.fmt.Print",
        "args": ["help", "{{ $in }}"]
      },
      "output": null
    }
  ],
  "output": {
    "switch": "{{ switch }}",
    "output": "{{ $output }}",
    "input": "{{ $input }}",
    "sid": "{{ $sid }}",
    "global": "{{ $global }}"
  }
}
```

- `switch.case.default` 只有 `goto`，没有 `nodes`
- 期望效果：命中 `default` 后跳到 `help` 节点

示例（摘录）：

```json
{
  "name": "switch",
  "case": {
    "default": { "goto": "help", "input": "{{ user }}" }
  }
}
```

实际表现：

- `switch` 执行后没有跳转到 `help`
- 分支 `input` 也没有被应用

## 根因分析（结合 Pipe 处理引擎）

### 1) Build 阶段：`case` 被建模为子 Pipe

`pipe.build()` 会将 `node.Switch`（即 `case`）中的每个分支当作 `*Pipe` 来递归 `_build()`。

- 当分支没有 `nodes` 时，该子 Pipe 仍然是合法对象，但 `Pipe.HasNodes()` 为 false。

### 2) Exec 阶段：`node.Case()` 只会执行子 Pipe 节点

旧逻辑（问题点）：

- `node.Case()` 选择 `child` 后调用 `child.Create().inheritance(ctx)`
- 仅当 `subctx.current != nil` 时才 `subctx.Exec(...)`

这导致：

- 子 Pipe 没有 `nodes` 时，`subctx.current == nil`，直接跳过执行
- 因为没有执行流程：
  - `child.Input`（pipe-level input 映射）不会被应用
  - `child.Goto`（pipe-level goto）不会影响父 `Context` 的 `next()`
  - `child.Output`（pipe-level output 映射）不会输出
- 另外 `child.Create()` 会把 `subctx` 存入全局 `contexts`，但由于没有走到 EOF，也没有显式 `Close()`，会产生上下文泄漏风险。

### 3) 为什么 `@context.go` 的 `Create()` 无法兜底

`Context.Create()` 只负责初始化 `current`（若有 nodes 则指向第一个节点），它本身不具备“分支 pipe 只有 goto 也要跳转”的语义。
跳转语义是在 `Context.next()` 中实现的，而 `next()` 只检查当前节点的 `Goto`（`ctx.current.Goto`），并不会检查 `switch.case` 子 Pipe 的 `Goto`。

## 修复目标

- **允许 `switch.case` 的分支作为“控制分支”存在**：即无 `nodes` 也可以通过 `goto` 驱动父管道跳转。
- 在控制分支中：
  - 需要支持 `input`（pipe-level input）映射
  - 需要支持 `goto`（pipe-level goto）跳转
  - 需要支持 `output`（pipe-level output）产出结果
- 避免子 pipe `Context` 泄漏。

## 修复设计（实现要点）

### 1) 新增运行时跳转覆盖字段 `Context.gotoNext`

在 `Context` 中新增 `gotoNext` 字段，用于“本次 `next()` 的跳转覆盖”。

**为什么不用直接修改 `Node.Goto`**：

- `Node` 结构属于 DSL 静态配置，运行期写入可能引入并发数据竞争（同一 Pipe 多次并发运行）。
- `gotoNext` 是每次运行上下文私有字段，安全且语义清晰。

### 2) `Context.next()` 优先消费 `gotoNext`

在 `next()` 开头增加：

- 若 `ctx.gotoNext != ""`：
  - 消费一次（取出后立刻清空）
  - 若为 `EOF` 则结束
  - 否则按名称从 `ctx.mapping` 找节点并跳转

### 3) `node.Case()` 兼容“无 nodes 的控制分支”

在 `node.Case()` 中检测：

- 若 `subctx.current == nil`：按控制分支处理
  - `subctx.parseInput(input)`：应用子 pipe 的 pipe-level `Input` 映射
  - 若 `child.Goto != ""`：用 `subctx.data(nil).replaceString(child.Goto)` 计算跳转目标，并写入 `ctx.gotoNext`
  - 输出：
    - 若 `child.Output != nil`：`subctx.parseOutput()`
    - 否则默认返回“映射后的 input”
  - `defer Close(subctx.id)`：避免泄漏
- 若 `subctx.current != nil`：保留原行为执行子 pipe；同时如果 `child.Goto` 有值，也转发到父 `ctx.gotoNext`。

## 修复后的执行流程（简化时序）

1. 进入 `switch` 节点 -> `node.Case()` 选择分支 `child`
2. 创建 `subctx`（继承父上下文数据）
3. 若分支无 `nodes`：
   - 应用 `child.Input`（可选）
   - 写入 `ctx.gotoNext = child.Goto`（可选）
   - 计算输出（`child.Output` 优先，否则用映射后的 input）
4. 回到父 `Context.exec()` -> 调用 `ctx.next()`
5. `ctx.next()` 优先命中 `gotoNext`，跳转到目标节点（例如 `help`）

## 关键改动点

- **新增字段**：`pipe/types.go` -> `Context.gotoNext`
- **新增跳转逻辑**：`pipe/context.go` -> `Context.next()` 优先消费 `gotoNext`
- **switch 控制分支兼容**：`pipe/node.go` -> `Node.Case()` 支持 `subctx.current == nil` 的分支
- **防泄漏**：控制分支路径 `defer Close(subctx.id)`

## 行为说明与兼容性

- **原有含子节点的 case 分支**：行为不变（仍执行子 pipe 节点）。
- **无子节点的 case 分支**：
  - `goto` 生效：驱动父管道跳转
  - `input` 生效：用于构造跳转后节点的入参
  - `output` 生效：用于 `switch` 节点输出
- **并发安全**：跳转信息存放在 `Context.gotoNext`，不修改静态 DSL 结构。

## 回归测试

新增用例：`TestSwitchCaseGotoWithoutNodes`

- 构造一个最小 Pipe：`user -> switch(default goto help) -> help`
- 验证：执行后返回的 `ResumeContext.Node.Name == "help"`

> 注意：该用例为纯内存 Pipe（`pipe.New(source)`），不依赖应用目录加载。
