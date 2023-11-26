# neo 嵌入业务流程指令

# 适用版本

0.10.3 或以上

## 配置

### api 配置

如果是在 yao 中配置 api 接口。需要按以下的格式进行配置。

字段`type`一定要包含`text/event-stream`

```json
{
  "path": "/my/neo",
  "method": "POST",
  "guard": "-",
  "process": "scripts.ai.stream.chat",
  "in": [":payload"],
  "out": {
    "status": 200,
    "type": "text/event-stream; charset=utf-8"
  }
}
```

### 配置 app.yao

neo 需要使用 sse 接口的配置。

在应用配置文件 app.yao 中增加以下的 api 接口配置。
这里的 api 接口可以使用外部的 api 地址或是内部的 api 地址。

注意：地址`api/__yao/neo`是 yao 内嵌的 neo api,

- 外部地址：`http://localhost:5099/api/my/neo`
- 内部地址会自动补全 api 前缀:`my/neo`

```json
{
  "xgen": "1.0",
  "optional": {
    "neo": { "api": "my/neo" }
  }
}
```

### 处理器

在 api 对应的处理器需要按以下的语法返回消息。

全局函数`ssEvent`是一个 yao 特有的 sse 流消息处理函数。

- 参数一是 sse 指令，这里一定要使用`message`,xgen 才会识别。
- 参数二是业务指令或是消息。

`scripts/ai/stream.js`

```js
function chat() {
  ssEvent('message', {
    // 在xgen neo中执行的命令
    actions: [
      {
        name: 'SearchTable',
        type: 'Table.search',
        payload: {},
      },
      {
        name: 'HistoryPush',
        type: 'Comman.historyPush',
        payload: {
          pathname: '/x/Form/hero/1/edit',
        },
      },
    ],
    confirm: true, //会提示消息包含业务指令，是否执行？
    done: true, //确认此次对话已经完成
  });

  //
  //   发送其它消息
  ssEvent('message', { text: 'hello wolrd' });
}
```

## 指令

neo 指令也是 action。但是不同的指令在不同的场景中有不同的作用。

共用的 action:

- Common.historyPush 可以用于打开新的链接
- Common.historyBack
- Common.confirm 提示
- Service. 所有的 service 函数
- Studio. 所有的 stuio 函数，开发环境有效

## 与 Table/Form 页面关联。

如果在 form 表单页面或是 table 表格页面使用 neo。以下特定的 action 可以生效。

在 Table 显示页面使用 neo 助手可以使用以下的 action:

- Table.search
- ~~Table.save~~ 无法使用
- ~~Table.delete~~ 无法使用

在 form 页面使用 neo 助手可以使用以下的 action。

- Form.find
- Form.submit
- Form.delete
- Form.fullscreen form 全屏显示
- Common.openModal
- Common.closeModal
