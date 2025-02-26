# OPENAI连接器

## 配置 OPENAI 连接器。

在应用目录下的 connectors 目录中创建连接器配置文件，配置文件的后缀为`.conn.yao`。

> 0.10.3 以上的版本可以支持 jsonc 的格式的配置文件,后缀为.jsonc 或是.yao，即可以在 json 文本中写入注释。

`connectors/gpt-3_5-turbo.conn.yao`

**类型一定要设置成 openai**

```json
{
  "version": "1.0.0", //版本
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

- `model`：OpenAI 语言模型，如 gpt-3.5-turbo、gpt-4 等。在配置文件中使用 `$ENV.` 语法引用环境变量，如 `$ENV.OPENAI_MODEL`

- `key`：OpenAI API 密钥。强烈建议使用环境变量配置，避免密钥泄露。在配置文件中使用 `$ENV.` 语法引用环境变量，如 `$ENV.OPENAI_KEY`

- `proxy`：API 代理地址。默认为 api.openai.com，如果需要使用代理服务，可以在这里配置。同时，如果需要使用 openai 类型的代理，使用此字段来配置基本 url。比如：`http://URL_ADDRESS/v1`

以上三个配置项都支持使用环境变量（`$ENV.<ENV_NAME>`），这样可以更好地管理敏感信息，避免意外泄露。特别是 API 密钥，建议使用环境变量配置。

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
    "model": "deepseek-reasoner", //可以使用$ENV.DEEPSEEK_MODEL替换
    "key": "$ENV.DEEPSEEK_KEY",
    "proxy": "https://api.deepseek.com"
  }
}
```
