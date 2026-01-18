# JSON 格式说明

## 📢 重要说明

**Pipe DSL 使用 JSON 格式，而不是 YAML 格式！**

本文档中的一些示例可能仍显示为 YAML 格式，这是历史遗留问题。在实际使用中，请务必使用 JSON 格式。

## 🔄 YAML 到 JSON 转换指南

### 基本语法差异

| YAML                   | JSON                         | 说明             |
| ---------------------- | ---------------------------- | ---------------- |
| `key: value`           | `"key": "value"`             | 字符串需要引号   |
| `key: 123`             | `"key": 123`                 | 数字不需要引号   |
| `key: true`            | `"key": true`                | 布尔值不需要引号 |
| `- item1`              | `["item1"]`                  | 数组格式         |
| `nested: {key: value}` | `"nested": {"key": "value"}` | 嵌套对象         |

### 转换示例

#### 1. 基本结构

**YAML:**

```yaml
name: 'translator'
label: '翻译助手'
nodes: []
whitelist: ['math.*', 'utils.*']
```

**JSON:**

```json
{
  "name": "translator",
  "label": "翻译助手",
  "nodes": [],
  "whitelist": ["math.*", "utils.*"]
}
```

> 说明：`whitelist` 支持通配符（例如 `utils.*`）以及 glob（`* ? []`，例如 `*.fmt.*`）。如果配置为 `[]`，表示不限制。

#### 2. 节点配置

**YAML:**

```yaml
name: 'process-node'
type: 'process'
process:
  name: 'utils.hello'
  args: ['{{ $in[0] }}']
input: ['{{ $global.value }}']
output: '{{ $out }}'
```

**JSON:**

```json
{
  "name": "process-node",
  "type": "process",
  "process": {
    "name": "utils.hello",
    "args": ["{{ $in[0] }}"]
  },
  "input": ["{{ $global.value }}"],
  "output": "{{ $out }}"
}
```

#### 3. AI 节点

**YAML:**

```yaml
name: 'ai-node'
type: 'ai'
prompts:
  - role: 'system'
    content: 'You are an assistant'
  - role: 'user'
    content: 'Help with: {{ $in[0] }}'
options:
  temperature: 0.7
  max_tokens: 1000
```

**JSON:**

```json
{
  "name": "ai-node",
  "type": "ai",
  "prompts": [
    {
      "role": "system",
      "content": "You are an assistant"
    },
    {
      "role": "user",
      "content": "Help with: {{ $in[0] }}"
    }
  ],
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

#### 4. Switch 节点

**YAML:**

```yaml
name: 'switch-node'
type: 'switch'
switch:
  '{{ $in[0] > 10 }}':
    name: 'high'
    nodes: []
  default:
    name: 'low'
    nodes: []
```

**JSON:**

```json
{
  "name": "switch-node",
  "type": "switch",
  "switch": {
    "{{ $in[0] > 10 }}": {
      "name": "high",
      "nodes": []
    },
    "default": {
      "name": "low",
      "nodes": []
    }
  }
}
```

### 特殊注意事项

#### 1. 注释语法

**YAML 使用 `#`：**

```yaml
# 这是注释
process:
  name: 'utils.hello' # 进程名称
```

**JSON 不支持原生注释，但在文档中可以用 `//`：**

```json
{
  // 这是注释
  "process": {
    "name": "utils.hello" // 进程名称
  }
}
```

#### 2. 字符串中的引号

**YAML 可以省略部分引号：**

```yaml
name: translator
model: gpt-3.5-turbo
```

**JSON 必须使用引号：**

```json
{
  "name": "translator",
  "model": "gpt-3.5-turbo"
}
```

#### 3. 表达式中的引号

**YAML 中的表达式：**

```yaml
content: 'Say &#34;hello&#34; to {{ $user.name }}'
```

**JSON 中的表达式：**

```json
{
  "content": "Say \"hello\" to {{ $user.name }}"
}
```

## 🛠️ 实用转换工具

### 在线转换工具

1. [YAML to JSON Converter](https://www.json2yaml.com/)
2. [Online YAML to JSON](https://codebeautify.org/yaml-to-json-converter)
3. [JSON Formatter](https://jsonformatter.curiousconcept.com/)

### 命令行工具

```bash
# 使用 yq (如果已安装)
yq -o=json input.yaml > output.json

# 使用 Python
python -c "import json, yaml; print(json.dumps(yaml.safe_load(open('input.yaml')), indent=2))" > output.json

# 使用 Node.js
node -e "const yaml = require('js-yaml'); const fs = require('fs'); console.log(JSON.stringify(yaml.load(fs.readFileSync('input.yaml', 'utf8')), null, 2))" > output.json
```

### VS Code 扩展

1. **YAML to JSON**: 直接转换文件格式
2. **Prettier**: 自动格式化 JSON
3. **Rainbow CSV**: 验证 JSON 语法

## ✅ 快速检查清单

转换完成后，请检查：

- [ ] 所有键名都用双引号包围
- [ ] 字符串值都用双引号包围
- [ ] 数组用 `[]` 而不是 `-`
- [ ] 对象用 `{}` 而不是缩进
- [ ] 逗号分隔数组元素和对象属性
- [ ] 没有尾随逗号（除非在特定环境中支持）
- [ ] 表达式中的引号正确转义

## 📋 转换模板

### Pipe 基本模板

```json
{
  "name": "pipe-name",
  "label": "Pipe Label",
  "nodes": [
    {
      "name": "node-name",
      "type": "process",
      "process": {
        "name": "process.name",
        "args": ["{{ $in[0] }}"]
      },
      "input": ["{{ $global.value }}"],
      "output": "{{ $out }}"
    }
  ],
  "whitelist": ["allowed.*"],
  "input": ["{{ $global.input }}"],
  "output": {
    "result": "{{ $out }}",
    "timestamp": "{{ now() }}"
  }
}
```

### 常用节点模板

#### Process 节点

```json
{
  "name": "process-node",
  "type": "process",
  "process": {
    "name": "utils.process",
    "args": ["{{ $in[0] }}", "{{ $in[1] }}"]
  },
  "output": "{{ $out }}"
}
```

#### AI 节点

```json
{
  "name": "ai-node",
  "type": "ai",
  "model": "gpt-3.5-turbo",
  "prompts": [
    {
      "role": "system",
      "content": "You are a helpful assistant"
    },
    {
      "role": "user",
      "content": "{{ $in[0] }}"
    }
  ],
  "options": {
    "temperature": 0.7,
    "max_tokens": 1000
  },
  "output": "{{ $out.choices[0].message.content }}"
}
```

#### Switch 节点

```json
{
  "name": "switch-node",
  "type": "switch",
  "switch": {
    "{{ $in[0] > 10 }}": {
      "name": "high-branch",
      "nodes": []
    },
    "default": {
      "name": "default-branch",
      "nodes": []
    }
  }
}
```

#### User Input 节点

```json
{
  "name": "input-node",
  "type": "user-input",
  "ui": "cli",
  "label": "Please input:",
  "autofill": {
    "value": "{{ $global.default }}",
    "action": "exit"
  },
  "output": "{{ $out[0] }}"
}
```

---

**注意**: 如果您在文档中发现任何仍使用 YAML 格式的示例，请以 JSON 格式为准。我们正在逐步更新所有文档。
