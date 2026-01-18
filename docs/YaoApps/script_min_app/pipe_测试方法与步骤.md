# script_min_app Pipe 测试方法与步骤（非交互）

本文用于在 **不走 CLI/Web 输入节点** 的前提下，通过 `yao run pipes.xxx` 快速测试不同 Pipe 配置。

## 1. 测试目录与约定

- 测试 Pipe 配置文件存放目录：`script_min_app/pipes/`
- Pipe 文件扩展名：`.pip.yao`
- Pipe ID 生成规则：文件路径映射为 `pipes.<dir>.<file>`
  - 例：`pipes/test_switch_default_goto.pip.yao` → `pipes.test_switch_default_goto`

> 注意：`YAO_ROOT` 必须指向 **应用根目录**（包含 `app.yao` 的目录），本例为 `script_min_app`，而不是 `pipes` 子目录。

## 2. PowerShell（pwsh）设置 YAO_ROOT

在当前终端会话生效：

```powershell
$env:YAO_ROOT = 'e:\projects\yao\wwsheng009\yao\.vscode\yao-docs\YaoApps\script_min_app'
$env:YAO_ROOT
```

> 建议用**单引号**包裹路径，避免转义问题。

如需清除：

```powershell
Remove-Item Env:YAO_ROOT
```

## 3. CMD（cmd.exe）设置 YAO_ROOT（可选）

在当前终端会话生效：

```bat
set YAO_ROOT=e:\projects\yao\wwsheng009\yao\.vscode\yao-docs\YaoApps\script_min_app
echo %YAO_ROOT%
```

## 4. 运行测试 Pipe（全部为“非交互输入”）

这里的 Pipe 都使用 `yao run pipes.xxx '::{...}'` 方式传入输入参数，不会进入 `ui: cli/web` 的交互挂起流程。

### 4.1 default 分支只有 goto/input、无子节点

- 文件：`pipes/test_switch_default_goto.pip.yao`
- ID：`pipes.test_switch_default_goto`

```powershell
yao run pipes.test_switch_default_goto '::{"cmd":"whatever","args":["a","b"]}'
```

预期：`switch.default` 直接跳转到 `help` 节点并打印输入。

### 4.2 case 分支 goto EOF（无子节点）

- 文件：`pipes/test_switch_case_goto_eof.pip.yao`
- ID：`pipes.test_switch_case_goto_eof`

```powershell
# 命中 exit → 直接结束
yao run pipes.test_switch_case_goto_eof '::{"cmd":"exit","args":[]}'

# 未命中 exit → default → print
yao run pipes.test_switch_case_goto_eof '::{"cmd":"not-exit","args":["x"]}'
```

### 4.3 测试 input 表达式返回数组时的“展开”

- 文件：`pipes/test_switch_input_expand.pip.yao`
- ID：`pipes.test_switch_input_expand`

```powershell
# cmd=expand：input 为 ["start", "{{ $in[0].args }}", "end"]，其中 args 数组会被展开
yao run pipes.test_switch_input_expand '::{"cmd":"expand","args":["A","B"]}'

# default 分支同样覆盖了带数组的场景
yao run pipes.test_switch_input_expand '::{"cmd":"other","args":["A","B"]}'
```

### 4.4 测试无子节点分支的 output 是否可用

- 文件：`pipes/test_switch_output_no_nodes.pip.yao`
- ID：`pipes.test_switch_output_no_nodes`

```powershell
yao run pipes.test_switch_output_no_nodes '::{"cmd":"route","args":["p","q"]}'
yao run pipes.test_switch_output_no_nodes '::{"cmd":"xxx","args":[]}'
```

预期：`switch` 节点产出 `output` 映射结果，并在 `print` 节点中打印。

## 5. 常见问题排查

- **提示找不到 Pipe / pipes.xxx 不存在**
  - 检查 `YAO_ROOT` 是否指向 `script_min_app`（同级需存在 `app.yao` 与 `pipes/` 目录）。
  - 检查文件名是否以 `.pip.yao` 结尾、路径是否正确。

- **JSON 参数传递失败**
  - PowerShell 下建议整体用单引号包裹：`'::{"cmd":"..."}'`。
  - 避免在双引号字符串里直接写 `{}` 导致转义混乱。
