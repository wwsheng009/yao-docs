# openai 处理器

yao 内置了以下几个与 openai 相关的处理器：

- openai.audio.transcriptions，转换文本成语音。
- openai.chat.completions，聊天接口，支持异步 sse。
- openai.embeddings，调用"text-embedding-ada-002"，把文本转换成向量。
- openai.tiktoken， 计算 token。

## 配置 openai 连接器

使用 openai 之前需要先配置连接器.

比如说需要在 connectors 目录下创建一个配置文件`gpt-3_5-turbo.conn.yao`.

openai 连接器类型定义:`\gou\connector\openai\openai.go`

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "Model gpt-3.5-turbo",
  "type": "openai", //必须是openai
  "options": {
    "model": "gpt-3.5-turbo", //必填
    "key": "$ENV.OPENAI_TEST_KEY", //必填
    "Proxy": "" //可选配置，默认是https://api.openai.com，如果用了openai的代理网站，可以在这里配置,
  }
}
```

## 聊天处理器

处理器：`openai.chat.completions`。

使用聊天处理器可以快速方便的请求 openai 接口。并且处理器还支持异步调用，可以在 api 接口中应用。

`yao\openai\process.go`

### 参数

至少要有两个参数

- connector,connector 配置 id，类型 string
- messages,消息,类型为 json 数组,
- options,选项,类型为 json,可以加入 openai 模型的微调参数。
- callback,回调函数，类型为 golang 函数或是 js 函数,回调函数的参数是返回的是聊天内容文本。如果存在回调函数，可以用于 ss 异步消息场景。

[消息的格式说明](chatgpt%E6%A8%A1%E5%9E%8B%E4%B8%AD%E8%A7%92%E8%89%B2%E7%9A%84%E4%BD%9C%E7%94%A8.md)

处理器示例：

```js
const connectorId = 'gpt-3_5-turbo';

const messages = [
  { role: 'system', content: 'you are ai assistant' },
  { role: 'user', content: 'Write an article about internet' },
];
const options = { max_tokens: 2 };

//方法一
Process('openai.chat.completions', connectorId, messages);

//方法二
Process('openai.chat.completions', connectorId, messages, options);

//方法三
Process(
  'openai.chat.completions',
  connectorId,
  message,
  options,
  function (chatMessage) {
    console.log('ai message:', chatMessage);

    ssEvent('messages', content); //如果在api接口处理中，可以使用ssEvent向api接口写入ss消息
  },
);
```
