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

在connectors目录创建OpenAI 连接器配置文件。

## 配置 openai 请求规则

在 app 目录下创建`aigcs`子目录（如果不存在）,在子目录下创建 ai 访问配置文件。

配置文件：`aigcs\translate.ai.yml`

这个示例使用了配置的 `gpt-3_5-turbo` 连接器。`prompts` 字段用于设置与 OpenAI 模型的初始化指令，不同模型可能需要不同格式的提示词。以下是一个翻译助手的配置示例，使用 GPT-3.5-Turbo 模型：

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
