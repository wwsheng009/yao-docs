# aigc 处理器

aigc 处理器是在 yao 中实现的直接与 openai 接口交互的处理器。通过配置 openai 连接器与 openai 请求规则。能把 openai 接口转换成 yao 处理器，可以与其它的 yao 功能串联起来。

## 适用版本

0.10.3-dev 或以上

使用方法：

## 配置 OPENAI 连接器。

在应用目录下的 connectors 目录中创建连接器配置文件，配置文件的后缀为`.conn.yao`。

> 0.10.3 版本可以支持 jsonc 的格式的配置文件,后缀为.jsonc 或是.yao，即可以在 json 文本中写入注释。

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
    "key": "$ENV.OPENAI_TEST_KEY"
  }
}
```

配置文件的语法。最重要是的配置 options 中的 model 与 key

- model 是 openai 语言模型

- key 是你的 openai 接口访问 key,可以在环境变量中配置，这个 key 不要上传到 github 上，被检测出来后 key 很快就会失效。可以把 key 配置在环境变量中，再在配置文件中使用`$ENV.`语法进行引用。

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

## 配置 openai 请求规则

在 app 目录下创建`aigcs`子目录（如果不存在）,在子目录下创建 ai 访问配置文件。

配置文件：`aigcs\translate.ai.yml`

比如这里使用的 connector 是上面配置的`gpt-3_5-turbo`。`prompts`是指连接 openai 时的初始化指令，提示词的内容按不同的模型有不同的格式。这里配置是的`chatgpt3.5-turbo`模型与对应的提示词规则。

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
