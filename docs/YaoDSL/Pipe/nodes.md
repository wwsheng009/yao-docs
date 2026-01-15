# 节点类型

> ⚠️ **重要**: 以下示例使用 **JSON 格式**，不是 YAML！
>
> 📖 查看 [JSON 格式说明](./JSON-格式说明.md) 了解详细的转换指南

Pipe 通过不同类型的节点实现各种功能。每个节点都有特定的用途和配置方式。本节详细介绍所有支持的节点类型。

## 节点概览

| 节点类型   | 用途             | 关键配置                       |
| ---------- | ---------------- | ------------------------------ |
| Process    | 执行 Yao Process | `process.name`, `process.args` |
| AI         | 调用 AI 模型     | `prompts`, `model`             |
| Switch     | 条件分支         | `switch`                       |
| User Input | 用户交互         | `ui`, `autofill`               |
| Request    | HTTP 请求        | `request` (暂未支持)           |

## Process 节点

用于执行 Yao Process 的节点，是最常用的节点类型之一。

### 基本配置

```json
{
  "name": "calculate",
  "type": "process",
  "label": "数据计算",
  "process": {
    "name": "math.calculate", // Process 名称（必需）
    "args": [
      // Process 参数（可选）
      "{{ $in[0] }}",
      "{{ $in[1] }}"
    ]
  },
  "input": [
    // 节点输入（可选）
    "{{ $global.num1 }}",
    "{{ $global.num2 }}"
  ],
  "output": "{{ $out }}" // 节点输出（可选）
}
```

### 详细说明

#### process 配置

- `name` (string, 必需): Yao Process 的名称
- `args` (Args, 可选): 传递给 Process 的参数

#### 安全机制

Process 节点受白名单限制，只能执行被授权的 Process：

```json
// Pipe 级白名单配置
{
  "whitelist": ["math.*", "utils.format", "user.validate"]
}

// 现在可以执行这些 Process
{
  "name": "calc",
  "process": {
    "name": "math.calculate"  // ✅ 允许
  }
}

{
  "name": "invalid",
  "process": {
    "name": "system.delete"   // ❌ 不在白名单中，会报错
  }
}
```

### 使用示例

```json
// 示例 1: 简单计算
{
  "name": "add-numbers",
  "process": {
    "name": "math.add",
    "args": ["{{ $in[0] }}", "{{ $in[1] }}"]
  }
}

// 示例 2: 数据验证
{
  "name": "validate-email",
  "process": {
    "name": "utils.validate_email",
    "args": ["{{ $in[0] }}"]
  },
  "output": "{{ $out.is_valid }}"
}

// 示例 3: 用户查询
{
  "name": "get-user",
  "process": {
    "name": "user.get",
    "args": ["{{ $global.user_id }}"]
  },
  "output": {
    "user": "{{ $out }}",
    "exists": "{{ $out != null }}"
  }
}
```

## AI 节点

用于调用大语言模型的节点，支持多种 AI 模型和流式响应。

### 基本配置

```json
{
  "name": "translate",
  "type": "ai",
  "label": "AI 翻译",
  "model": "gpt-3.5-turbo", // 模型名称（可选）
  "prompts": [
    // 提示词列表（必需）
    {
      "role": "system",
      "content": "你是一个专业的翻译助手"
    },
    {
      "role": "user",
      "content": "请将以下内容翻译成英文：{{ $in[0] }}"
    }
  ],
  "options": {
    // AI 选项（可选）
    "temperature": 0.7,
    "max_tokens": 1000
  },
  "output": "{{ $out.choices[0].message.content }}"
}
```

### 详细说明

#### prompts 配置

- 支持多轮对话的提示词数组
- 每个提示词包含 `role` 和 `content` 字段
- `role` 可选值: `system`, `user`, `assistant`
- `content` 支持表达式插值

```yaml
prompts:
  - role: 'system'
    content: '你是{{ $global.assistant_name}}，专门处理{{ $global.domain}}相关问题'
  - role: 'user'
    content: '{{ $in[0] }}'
  - role: 'assistant'
    content: '我理解了，让我帮您处理这个问题'
  - role: 'user'
    content: '{{ $in[1] }}'
```

#### model 配置

支持的模型名称取决于具体的 AI 服务配置：

```yaml
# OpenAI 模型
model: "gpt-4"
model: "gpt-3.5-turbo"
model: "gpt-4-turbo"

# 其他模型（取决于配置）
model: "claude-3"
model: "gemini-pro"
```

#### options 配置

常用的 AI 选项：

```yaml
options:
  temperature: 0.7 # 创造性，0-2
  max_tokens: 1000 # 最大输出长度
  top_p: 0.9 # 核心采样
  frequency_penalty: 0.5 # 频率惩罚
  presence_penalty: 0.5 # 存在惩罚
  stream: true # 流式输出
```

### 使用示例

```yaml
# 示例 1: 文本生成
- name: 'generate-text'
  prompts:
    - role: 'system'
      content: '你是一个创意写作助手'
    - role: 'user'
      content: '写一个关于{{ $in[0] }}的短故事'
  options:
    max_tokens: 500
    temperature: 0.8

# 示例 2: 代码生成
- name: 'generate-code'
  model: 'gpt-4'
  prompts:
    - role: 'system'
      content: '你是一个专业的程序员，擅长{{ $in[1] }}'
    - role: 'user'
      content: '请用{{ $in[1] }}写一个{{ $in[0] }}函数'
  output: '{{ $out }}'

# 示例 3: 数据分析
- name: 'analyze-data'
  prompts:
    - role: 'system'
      content: '你是一个数据分析师'
    - role: 'user'
      content: '分析以下数据：{{ $json($in[0]) }}'
  output:
    summary: '{{ $out.summary }}'
    insights: '{{ $out.insights }}'
```

## Switch 节点

用于条件分支的节点，根据条件表达式选择执行不同的子流程。

### 基本配置

```yaml
name: 'router'
type: 'switch'
label: '路由选择'
switch:
  '{{ $in[0] > 10 }}': # 条件表达式
    name: 'high-branch' # 分支名称
    input: # 分支输入（可选）
      - '{{ $in[0] }}'
    nodes: # 分支节点（可选）
      - name: 'handle-high'
        process:
          name: 'process.high'
          args: ['{{ $in[0] }}']
    output: '{{ $out }}' # 分支输出（可选）

  '{{ $in[0] > 5 }}':
    name: 'medium-branch'
    nodes:
      - name: 'handle-medium'
        process:
          name: 'process.medium'

  default: # 默认分支
    name: 'low-branch'
    nodes:
      - name: 'handle-low'
        process:
          name: 'process.low'
```

### 详细说明

#### 条件表达式

- 使用标准的表达式语法
- 表达式返回 `true` 时执行对应分支
- 支持复杂的逻辑表达式

```yaml
switch:
  # 数值比较
  '{{ $in[0] > 100 }}':
    # 分支配置

  # 字符串匹配
  "{{ $in[0] == 'vip' }}":
    # 分支配置

  # 复杂逻辑
  "{{ $in[0] > 50 && $in[1] == 'active' }}":
    # 分支配置

  # 对象属性
  '{{ $user.is_admin == true }}':
    # 分支配置

  # 函数调用
  "{{ contains($in[0], 'error') }}":
    # 分支配置
```

#### 分支继承

分支会继承父 Pipe 的配置：

```yaml
name: 'main-pipe'
whitelist: ['common.*']

nodes:
  - name: 'router'
    switch:
      '{{ $in[0] > 0 }}':
        name: 'positive'
        # 继承 main-pipe 的 whitelist
        nodes:
          - name: 'process-positive'
            process:
              name: 'common.positive' # ✅ 可以执行
```

### 使用示例

```yaml
# 示例 1: 用户类型路由
- name: 'user-router'
  switch:
    "{{ $global.user.type == 'admin' }}":
      name: 'admin-flow'
      nodes:
        - name: 'admin-auth'
          process:
            name: 'admin.verify'
        - name: 'admin-operation'
          process:
            name: 'admin.execute'

    "{{ $global.user.type == 'vip' }}":
      name: 'vip-flow'
      nodes:
        - name: 'vip-service'
          process:
            name: 'vip.process'

    default:
      name: 'normal-flow'
      nodes:
        - name: 'normal-service'
          process:
            name: 'user.process'

# 示例 2: 数据处理路由
- name: 'data-router'
  input: ['{{ $global.data }}']
  switch:
    "{{ $in[0].type == 'image' }}":
      name: 'image-processing'
      nodes:
        - name: 'resize-image'
          process:
            name: 'image.resize'
            args: ['{{ $in[0] }}', '800x600']

    "{{ $in[0].type == 'text' }}":
      name: 'text-processing'
      nodes:
        - name: 'analyze-text'
          process:
            name: 'text.analyze'
            args: ['{{ $in[0].content }}']

    default:
      name: 'default-processing'
      nodes:
        - name: 'generic-process'
          process:
            name: 'data.process'
```

## User Input 节点

用于与用户交互的节点，支持多种界面类型。

### 基本配置

```yaml
name: 'get-input'
type: 'user-input'
ui: 'cli' # 界面类型
label: '请输入内容：' # 提示标签
autofill: # 自动填充（可选）
  value: '{{ $global.default_value }}'
  action: 'exit' # 自动动作
input: # 节点输入（可选）
  - '{{ $global.prompt }}'
output: '{{ $out }}' # 节点输出（可选）
```

### 详细说明

#### UI 类型

- `cli`: 命令行界面
- `web`: Web 界面
- `app`: 移动应用界面
- `wxapp`: 微信小程序界面

```yaml
# CLI 界面
- name: 'cli-input'
  ui: 'cli'
  label: '请输入命令：'

# Web 界面
- name: 'web-input'
  ui: 'web'
  label: '请填写表单：'

# 移动应用界面
- name: 'app-input'
  ui: 'app'
  label: '请输入信息：'

# 小程序界面
- name: 'wxapp-input'
  ui: 'wxapp'
  label: '请输入：'
```

#### AutoFill 配置

```yaml
# 简单值自动填充
autofill: "{{ $global.suggested_value }}"

# 对象配置
autofill:
  value: "{{ $global.default_input }}"
  action: "exit"    # "exit" 或空字符串
```

`action` 的含义：

- `exit`: 自动填充后直接结束输入
- 空字符串: 自动填充后等待用户确认或修改

### 使用示例

```yaml
# 示例 1: CLI 输入
- name: 'cli-question'
  ui: 'cli'
  label: '请输入您的问题：'
  autofill:
    value: '{{ $global.default_question }}'
    action: 'exit'

# 示例 2: Web 表单
- name: 'user-registration'
  ui: 'web'
  label: '用户注册'
  input:
    - '请输入用户名：'
    - '请输入邮箱：'
    - '请输入密码：'

# 示例 3: 带验证的输入
- name: 'email-input'
  ui: 'cli'
  label: '请输入邮箱地址：'
  output: '{{ $out[0] }}' # 获取第一行输入
```

## 节点通用配置

所有节点都支持的通用配置：

### Input 配置

```yaml
# 数组输入
input:
  - "{{ $global.value1 }}"
  - "{{ $in[0] }}"
  - "fixed_value"

# 单值输入
input: "{{ $global.single_value }}"

# 表达式输入
input:
  - "{{ $global.user.id }}"
  - "{{ $global.user.name }}"
```

### Output 配置

```yaml
# 直接输出
output: "{{ $out }}"

# 对象输出
output:
  result: "{{ $out }}"
  success: "{{ $out != null }}"
  timestamp: "{{ now() }}"

# 表达式输出
output: "{{ $out.data.items[0].name }}"
```

### Goto 配置

```yaml
# 跳转到指定节点
goto: "next-node"

# 条件跳转
goto: "{{ $in[0] > 0 ? 'success' : 'error' }}"

# 结束流程
goto: "EOF"
```

## 节点组合示例

```yaml
name: 'complex-workflow'
label: '复杂工作流'

nodes:
  # 1. 获取用户输入
  - name: 'get-user-input'
    ui: 'cli'
    label: '请输入查询关键词：'

  # 2. 数据查询
  - name: 'search-data'
    process:
      name: 'data.search'
      args:
        - '{{ $in[0] }}'
        - '{{ $global.user_id }}'

  # 3. 结果路由
  - name: 'route-results'
    switch:
      '{{ $out.count > 0 }}':
        name: 'has-results'
        nodes:
          - name: 'format-results'
            process:
              name: 'data.format'
              args: ['{{ $out }}']
          - name: 'show-results'
            ui: 'cli'
            label: '搜索结果：'
            autofill:
              value: '{{ $out.formatted }}'
              action: 'exit'

      default:
        name: 'no-results'
        nodes:
          - name: 'ai-suggest'
            prompts:
              - role: 'system'
                content: '你是搜索助手'
              - role: 'user'
                content: "用户搜索'{{ $global.query }}'没有结果，请建议相关关键词"
            output: '{{ $out.choices[0].message.content }}'
          - name: 'show-suggestions'
            ui: 'cli'
            label: '建议的关键词：'
            autofill:
              value: '{{ $out }}'
              action: 'exit'

  # 4. 记录日志
  - name: 'log-search'
    process:
      name: 'log.search_activity'
      args:
        - '{{ $global.user_id }}'
        - '{{ $global.query }}'
        - '{{ $out.result_count }}'
    goto: 'EOF'
```

## 注意事项

1. **节点名称**: 同一 Pipe 内必须唯一
2. **类型推断**: `type` 字段通常可以省略
3. **安全性**: Process 节点受白名单限制
4. **表达式**: 所有表达式使用 `{{ }}` 语法
5. **循环引用**: 避免节点间的循环引用
6. **UI 兼容性**: 不同 UI 类型可能有特定的行为差异
7. **AI 配额**: AI 节点可能受 API 配额限制
8. **上下文管理**: 复杂工作流要注意上下文数据的合理使用
