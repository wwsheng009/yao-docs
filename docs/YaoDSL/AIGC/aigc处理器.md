# aigc 处理器

aigc 处理器是在 Yao 中实现的直接与 OpenAI 接口交互的处理器。通过配置 OpenAI 连接器与请求规则，可以将 OpenAI 接口转换成 Yao 处理器，从而与其它 Yao 功能无缝串联。

## 适用版本

0.10.3 或以上

## 主要功能

- 支持多种 OpenAI 模型配置
- 灵活的提示词系统
- 环境变量配置，安全性高
- 支持代理设置
- 可与其他 Yao 功能集成

## 使用步骤

## 配置 OPENAI 连接器。

在应用目录下的 connectors 目录中创建连接器配置文件，配置文件的后缀为`.conn.yao`。

> 0.10.3 以上的版本可以支持 jsonc 的格式的配置文件,后缀为.jsonc 或是.yao，即可以在 json 文本中写入注释。

`connectors/gpt-3_5-turbo.conn.yao`

**类型一定要设置成 openai**

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0", //版本
  "label": "Model gpt-3.5-turbo", //说明
  "type": "openai", //类型一定是openai
  "options": {
    "model": "gpt-3.5-turbo",
    "key": "$ENV.OPENAI_KEY",
    "proxy": "$ENV.OPENAI_AIP_HOST"
  }
}
```

配置文件中最重要的是 options 中的配置项：

- `model`：OpenAI 语言模型，如 gpt-3.5-turbo、gpt-4 等

- `key`：OpenAI API 密钥。强烈建议使用环境变量配置，避免密钥泄露。在配置文件中使用 `$ENV.` 语法引用环境变量，如 `$ENV.OPENAI_KEY`

- `proxy`：API 代理地址。默认为 api.openai.com，如果需要使用代理服务，可以在这里配置。同时，如果需要使用 openai 类型的代理，使用此字段来配置基本 url。比如：`http://URL_ADDRESS/v1`

所有配置项都支持使用环境变量（`$ENV.<ENV_NAME>`），这样可以更好地管理敏感信息，避免意外泄露。特别是 API 密钥，必须使用环境变量配置。

```go

// DSL the connector DSL
type DSL struct {
	ID      string                 `json:"-"`
	Type    string                 `json:"type"`
	Name    string                 `json:"name,omitempty"`
	Label   string                 `json:"label,omitempty"`
	Version string                 `json:"version,omitempty"`
	Options map[string]interface{} `json:"options,omitempty"`
}

// Options the redis connector option
type Options struct {
	Proxy string `json:"proxy,omitempty"`//如果不是使用https://api.openai.com，可以在这里设置openai的访问地址
	Model string `json:"model,omitempty"`//openai模型
	Key   string `json:"key"`//openai 接口访问密钥
}
```

## 示例：

```json
{
  "label": "Model v3",
  "type": "openai",
  "options": {
    "model": "deepseek-r1-distill-llama-70b",
    "key": "$ENV.BAILIAN_KEY",
    "proxy": "https://dashscope.aliyuncs.com/compatible-mode/v1"
  }
}
```

连接 deepseek。

```json
{
  "label": "Model v3",
  "type": "openai",
  "options": {
    "model": "deepseek-reasoner",
    "key": "$ENV.DEEPSEEK_KEY",
    "proxy": "https://api.deepseek.com"
  }
}
```

## 配置 openai 请求规则

在 app 目录下创建`aigcs`子目录（如果不存在）,在子目录下创建 ai 访问配置文件。

配置文件：`aigcs\translate.ai.yml`

这个示例使用了上面配置的 `gpt-3_5-turbo` 连接器。`prompts` 字段用于设置与 OpenAI 模型的初始化指令，不同模型可能需要不同格式的提示词。以下是一个翻译助手的配置示例，使用 GPT-3.5-Turbo 模型：

```yaml
# Translate to English
# yao run aigcs.translate 你好
name: Translate
connector: gpt-3_5-turbo
prompts:
  - role: system
    content: |
      - Translate the given question into English.
      - Do not explain your answer, and do not use punctuation.
      - Do not add your own punctuation marks.
      - eg: if I say "你好" reply me "Hello" only

optional:
  autopilot: true
```

## 配置网络代理

如果无法直接访问 openai,可以在环境变量中配置网络代理。

```bash
# https请求代理
HTTPS_PROXY="http://0.0.0.0:10809"
https_proxy="http://0.0.0.0:10809"

# http请求代理
HTTP_PROXY="http://0.0.0.0:10809"
http_proxy="http://0.0.0.0:10809"
```

## 测试 aigcs 处理器

处理器的固定前缀为`aigcs`，参数与处理器 ID 与其它 yao 处理器类似。

aigc 处理器只适用于单个请求，对话功能需要使用 neo。

```sh
yao run aigcs.translate 你好
```

## openai 相关的其它处理器

- openai.tiktoken 计算接口 token
- openai.embeddings Embedding 接口
- openai.chat.completions 聊天接口
- openai.audio.transcriptions 语音翻译接口

## 测试代码

官方已提供了测试样例

```sh
https://github.com/YaoApp/yao-dev-app
```
