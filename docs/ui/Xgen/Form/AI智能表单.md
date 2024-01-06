# AI 表单

探索 AI 与业务集成的使用场景。

## 配置

在 neo 的配置文件中，可以通过 prepare/write 处理器进行拦截 neo 的提问与回复。

```yaml
connector: openai.gpt-4
guard: 'scripts.guard.Chat'

conversation:
  connector: default
  table: yao_neo_conversation
  max_size: 10
  ttl: 3600

command:
  parser: openai.gpt-3_5-turbo

# 这个地方可以进行拦截用户的提问
prepare: 'scripts.neo.Prepare'

# 拦截机器人回复
write: 'scripts.neo.Write'

option:
  temperature: 0.6

allows:
  - 'http://127.0.0.1:5099'
  - 'http://localhost:5099'
```

## 智能表格

在 xgen 中可以使用 action 可以给 neo 设置不同的指令上下文，让 neo 可以与具体的业务数据进行关联。

典型的应用是根据用户上传的文档进行本地数据库进行搜索。

```json
{
  "title": "提问",
  "icon": "icon-send",
  "showWhenAdd": true,
  "showWhenView": true,
  "action": [
    {
      "name": "提问",
      "type": "Common.emitEvent",
      "payload": {
        "key": "app/setNeoVisible",
        "value": {
          "visible": true,
          "placeholder": "输入你的问题，我会优先从文件中搜索作答",
          "signal": {
            "name": "DocumentQuestion",
            "id": "{{id}}",
            "from": "admin.query"
          }
        }
      }
    }
  ]
}
```

在 Neo prepare 处理器中进行拦截，根据不同的指令进行不同的操作。

比如这里搜索文档内容后再给 AI 提问，在聊天窗口中自然就会包含本地知识的内容。

```ts
function Prepare(context: ChatContext, messages: ChatMessage[]): ChatMessage[] {
  const { namespace, signal, field } = context;
  if (namespace === "Form-Page-expert" && field?.bind === "description") {
    return autoDescribe(context, messages);
  }

  switch (signal?.name) {
    case "AskExpert":
      return askExpert(context, messages);

    //
    case "DocumentQuestion":
      return DocumentQuestion(context, messages);

    case "AutoInput":
      return autoInput(context, messages);
  }

```

## 智能表单

如果是在表单界面使用 neo 助手，还可以进行智能表单的设置。

首先需要在表单中编辑控件中增加 ai 属性

```json
{
  "fields": {
    "form": {
      "介绍": {
        "bind": "description",
        "edit": {
          "props": {
            "rows": 5,
            // ai属性
            "ai": {
              "placeholder": "输入一些关于专家的介绍信息，我会帮助你优化"
            }
          },
          "type": "TextArea"
        },
        "view": { "props": {}, "type": "" }
      }
    }
  }
}
```

在表单编辑时，就会显示一个弹出对话框。

当用户输入提问的问题后会触发事件：`app/getField`，

```js
window.$app.Event.emit('app/getField', {
  name: item.name, //字段名称，表单字段名称
  bind: item.bind, //字段绑定的对象，数据库字段
  text: target.value, //用户的提问
  config: item, //当前字段配置
});
```

在 neo 接收到提问后会向后端发出 ai 请求。

```ts
useEffect(() => {
  if (!messages.length) return;

  const latest_message = messages.at(-1)!;

  if (latest_message.is_neo) return;

  getData(latest_message);
}, [messages]);
```

在后端，可以在 neo.write 消息处理器拦截机器人回复，并返回自定义的 action 操作指令。

比如，这里就能给表单设置不同的值。并且通过 action `Common.emitEvent` 进行回调 xgen 界面的功能。

```ts
function WriteAutoInput(
  context: ChatContext, // 上下文信息
  messages: ChatMessage[], // 历史消息
  response: ResponseMessage, // 机器人的回复流
  content?: string, // 完整的回复内容
): ResponseMessage[] {
  const { namespace, signal } = context;
  if (content === undefined) {
    return [response];
  }

  if (response.done) {
    try {
      const data: Record<string, any> = JSON.parse(content);
      response.actions = [
        {
          name: 'Test',
          type: 'Common.emitEvent',
          payload: {
            key: `${namespace}/setFieldsValue`,
            value: data,
          },
        },
      ];

      response.confirm = true;
      return [response];
    } catch (error) {
      console.log(`Error:`, error.message, content);
      return [response];
    }
  }

  return [response];
}
```

在 Xgen 中，Neo 接收到这些命令后就会执行，比如上面的操作命令就会调用 form.setFieldsValue 方法把后端返回的 data 数据设置到表单中。
