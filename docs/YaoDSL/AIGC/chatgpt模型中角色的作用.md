# chatgpt3 中角色的设置

在调用 chatgpt api 接口时，如果是使用到模型 gpt-3.5-turbo 或是 3.5 以上版本，api 的消息中可设置一个角色字段`role`。

角色`role`有三个值:user/system/assistant

user，表示消息内容是用户请求。将 role 设置为"user"可以帮助 ChatGPT 区分对话中的角色。这样，ChatGPT 可以更好地理解用户的输入，并以更适当的方式进行回应。此外，当 ChatGPT 需要请求更多信息时，它可以更明确地指出用户需要提供什么信息。在多轮对话中，设置角色还可以帮助 ChatGPT 跟踪对话历史记录，以便更准确地回答后续的问题。因此，将角色设置为"user"可以提高 ChatGPT 的对话质量和效率。

```json
{
  "messages": [{ "role": "user", "content": "tell me a joke" }]
}
```

system，表示此命令是系统指令，非对话内容。设置 ChatGPT 对话中的 role 属性为 system 可以使其在对话中扮演系统角色，即扮演自动回复和处理请求的角色。这意味着当用户在对话中发送消息时，ChatGPT 将会使用预定义的规则和逻辑来生成自动回复，而不是直接响应用户的消息。通过这种方式，ChatGPT 可以为用户提供快速且准确的反馈，从而提高用户体验和对话的效率。同时，系统角色还可以用来处理各种类型的请求和任务，例如查询数据库或执行操作。因此，设置 ChatGPT 对话中的 role 属性为 system 是实现自动化对话和任务处理的重要步骤。

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "tell me a joke"
    },
    {
      "role": "system",
      "content": "You are an assistant that speaks like Shakespeare."
    }
  ]
}
```

assistant，所有 ai 回复的消息的角色都是 assistant。

```json
{
  "id": "chatcmpl-87n798n6bv4678",
  "object": "chat.completion",
  "created": 1683212418,
  "model": "gpt-3.5-turbo-0301",
  "usage": {
    //chat模式没有，只有complete模式才有
    "prompt_tokens": 12,
    "completion_tokens": 18,
    "total_tokens": 30
  },
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "why did the chicken cross the road"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ]
}
```

## gpt 接口交互

stream 模式下的数据格式：

原始数据：

```json
{
  "data": {
    "id": "chatcmpl-8KLHFd0wez62XH6UOxs2mGV0JUD68",
    "object": "chat.completion.chunk",
    "created": 1699859041,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
      { "index": 0, "delta": { "content": "吗" }, "finish_reason": null }
    ]
  }
}
```

如果是结束,固定返回以下内容

```md
data: [DONE]
```

可以把聊天内容理解为 json 数据

返回的第一条数据：

```json
{
  "data": {
    "id": "chatcmpl-8KLRrq4mHgncUN0OSF4QQ1DSOsfJ4",
    "object": "chat.completion.chunk",
    "created": 1699859699,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
      {
        "index": 0,
        "delta": {
          "role": "assistant", //角色
          "content": ""
        },
        "finish_reason": null
      }
    ]
  }
}
```

正常对话内容：

```json
{
  "data": {
    "id": "chatcmpl-8KLHFd0wez62XH6UOxs2mGV0JUD68", //每次聊天的会话标识
    "object": "chat.completion.chunk", //对象类型
    "created": 1699859041, //创建时间
    "model": "gpt-3.5-turbo-0613", //模型
    "choices": [
      {
        "index": 0,
        "delta": { "content": "吗" }, //增量
        "finish_reason": null
      }
    ]
  }
}
```

如果是结束，在最后一条消息也会有不同数据。`finish_reason`等于`stop`

```json
{
  "data": {
    "id": "chatcmpl-8KLHFd0wez62XH6UOxs2mGV0JUD68",
    "object": "chat.completion.chunk",
    "created": 1699859041,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
      { "index": 0, "delta": {}, "finish_reason": "stop" } //结束原因
    ]
  }
}
```
