# Pipe 入参处理对比与实现说明

本文基于 `pipe/` 目录源码，梳理 Pipe 的“入参/参数”在不同阶段的流转方式，并对比 `replaceInput` 与 `replaceArray` 等实现差异。

## 1. 关键结论（先看这个）

- **Pipe 的入参有两条链路**：
  - **Pipe 级入参**（`Pipe.Input`）：在 Pipe 启动时由 `Context.parseInput` 处理，变量主要是 `{{ $input }}`。
  - **Node 级入参**（`Node.Input`）：每个节点执行前由 `Context.parseNodeInput` 处理，变量主要是 `{{ $in }}`。

- **`replaceArray` 与 `replaceInput` 的核心区别**：
  - `replaceArray`：只做递归替换，**不改变数组层级**。
  - `replaceInput`：用于参数列表（`Input`），对形如 `"{{ ... }}"` 的表达式项，若结果是数组，则会**展开/摊平**进参数列表。

- **子 pipe（switch case 的 value）在“无 nodes”时没有 `$in/$out`**：
  - 该子 pipe 只会走 `subctx.parseInput(...)` / `subctx.parseOutput()`，此时可用变量是 `{{ $input }}`、节点名输出、`{{ $global }}` 等；
  - **不要在子 pipe 的 `input/output` 里写 `$in/$out`**（应该用 `$input/$output`）。

## 2. 数据结构：`Input` / `Args` / 变量域

### 2.1 `Input` 与 `Args`

- `type Input []any`
- `type Args []any`

两者都支持 JSON 的三种形态：

- **字符串**：`"{{ user.args[0] }}"` → 反序列化为单元素数组 `[]any{string}`
- **字符串数组**：`["a","b"]` → `[]any{"a","b"}`
- **任意数组**：`[1,true,{...}]` → `[]any{1,true,map...}`

> 这也是为什么 `"input"`/`"args"` 在 DSL 里既可以写字符串，也可以写数组。

### 2.2 Data 域：`$input`、`$in`、`$out` 的区别

在 `Context.data(node)` 中：

- **Pipe 级变量（始终可用）**
  - `{{ $input }}`：Pipe 启动时的入参（经过 `Pipe.Input` 映射后的结果）
  - `{{ $output }}`：Pipe 结束时的输出（经过 `Pipe.Output` 映射后的结果）
  - `{{ $sid }}`、`{{ $global }}`：会话与全局

- **Node 级变量（仅当传入了 node 时才可用）**
  - `{{ $in }}`：当前节点的输入（进入节点前，经过 `Node.Input` 映射后的结果）
  - `{{ $out }}`：当前节点执行后的输出（经过 `Node.Output` 映射后的结果）

- **稳定引用（推荐用于重名节点）**
  - `{{ $node.<name>.in }}` / `{{ $node.<name>.out }}`：始终可用的稳定键，避免嵌套 pipe 节点重名导致的数据覆盖顺序不稳定。

## 3. 入参流转：从 `yao run` 到每个节点

### 3.1 入口：`yao run pipes.xxx`

执行：

- `yao run pipes.xxx arg1 arg2 ...`
- 或（推荐用于复杂结构）`yao run pipes.xxx '::{"cmd":"...","args":[...]}'`

传入的参数最终会进入 `Context.Exec(args...)`，然后：

1. `Context.parseInput(args)`：生成/映射 Pipe 级输入（`$input`）
2. `ctx.exec(node, input)`：执行当前节点
3. `Context.parseNodeInput(node, input)`：生成/映射 Node 级输入（`$in`）
4. Node 执行完成得到输出，再进入 `Context.parseNodeOutput(node, out)`（生成 `$out`）

### 3.2 Pipe 级入参映射：`Pipe.Input` → `parseInput`

- 触发点：Pipe 启动时（`Context.parseInput`）
- 使用函数：`data.replaceInput(ctx.Input)`
- 可用变量：以 `{{ $input }}` 为主（这是原始入参），以及已经执行过的节点输出（如果是 resume 场景）。

### 3.3 Node 级入参映射：`Node.Input` → `parseNodeInput`

- 触发点：节点执行前（`Context.parseNodeInput`）
- 使用函数：`data.replaceInput(node.Input)`
- 可用变量：以 `{{ $in }}`（上一个节点输出作为本节点输入）和节点名输出为主。

### 3.4 switch 子 pipe 的入参（特别是无 nodes 的控制分支）

switch 的每个 case value 被建模成一个子 `Pipe`。

- **有 nodes 的子 pipe**：会创建 `subctx` 并执行 `subctx.Exec(...)`，期间每个子节点都有 `$in/$out`。
- **无 nodes 的子 pipe（控制分支）**：不会进入 `subctx.exec`，而是只做：
  1. `subctx.parseInput(parentInput)` → 生成该子 pipe 的 `$input`
  2. 如有 `child.Output`，则 `subctx.parseOutput()` → 生成该子 pipe 的 `$output`
  3. 如有 `child.Goto`，则把 goto 转发到父 ctx 的 `gotoNext`

因此在“无 nodes”控制分支里：

- `child.input` / `child.output` 表达式应该使用 `{{ $input }}`（而不是 `{{ $in }}`）。

## 4. 参数替换函数对比

### 4.1 `replace`：通用入口

- string → `replaceAny`（表达式则执行）
- `[]any` / `Input` → `replaceArray`
- `map[string]any` → `replaceMap`

### 4.2 `replaceArray`：只替换，不改层级

适用于：

- `process.args`（`Args` 里每个元素代表一个参数，参数本身可以是数组/对象）
- 普通配置数组

特点：**不会自动摊平**。

### 4.3 `replaceInput`：参数列表专用，支持“表达式数组展开”

适用于：

- `Pipe.Input`
- `Node.Input`

额外规则：

- 仅当原始元素是表达式字符串 `"{{ ... }}"` 时，如果表达式结果是数组（`[]any` / `Input` / `[]string`），则把数组元素**展开**到同一层。

为什么要这样做：

- 在 Pipe DSL 里很常见：`input: "{{ user.args }}"`。
- 如果不展开，那么 `input` 会变成 `[[arg1,arg2,...]]` 这种嵌套数组，后续 `$in[1:]`、`$in[0]` 的语义就不符合“参数列表”的直觉。
- 又因为 `process.args` 等场景往往需要保留数组作为**一个参数**，所以把展开逻辑放在 `replaceInput`，而不是 `replaceArray`，可以控制影响范围。

## 5. 典型写法对比（建议）

### 5.1 把用户 args 作为多参数传递（展开）

- 推荐：
  - `input: "{{ user.args }}"` → `$in` 会变成 `arg1,arg2,...`（被展开）

### 5.2 把数组作为单个参数传给 process（不展开）

- 推荐：
  - `process.args: ["{{ user.args }}"]`

因为 `process.args` 走 `replaceArray`，它不会展开，所以这里会把整个数组当作 **一个参数**。

### 5.3 子 pipe（无 nodes）里引用入参

- 推荐：
  - `case.default.input: "{{ $input[0] }}"`
  - `case.default.output: {"cmd":"{{ $input[0].cmd }}"}`

- 不推荐：
  - `case.default.input: "{{ $in[0] }}"`（无 nodes 时没有 `$in`）

## 6. 附：script_min_app 的非交互测试用例

对应的测试 Pipe 文件位于 `script_min_app/pipes/`，已调整为在子 pipe（无 nodes）场景下使用 `$input`：

- `pipes.test_switch_default_goto`
- `pipes.test_switch_case_goto_eof`
- `pipes.test_switch_input_expand`
- `pipes.test_switch_output_no_nodes`

完整运行步骤见文档：`script_min_app/pipe_测试方法与步骤.md`。
