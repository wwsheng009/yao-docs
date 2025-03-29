# xgen 可用命令列表

通用命令

- Common.openModal 打开一个弹出对话框
- Common.closeModal 关闭对话框
- Common.historyPush 跳转地址
- Common.historyBack 返回
- Common.confirm 弹出确认
- Common.refetch 重新读取相关界面的配置与重新拉取最新数据
- Common.reload 重加载
- Common.reloadMenu 重新加载菜单配置
- Common.showMessage 显示信息
- Common.emitEvent 触发其它事件

调用页面

- Table.search 调用某一个表搜索页面
- Table.save 保存数据
- Table.delete 删除一条数据

调用表单页面

- Form.find 调用某个表单，显示数据
- Form.submit 表单提交数据
- Form.delete 表单删除数据
- Form.fullscreen 全屏显示

直接调用后端命令

- Service. 调用后端 service 命令
- Studio. 调用后端 studio 命令

## Common.openModal

```json
{
  "action": [
    {
      "payload": {
        "Form": {
          "model": "so",
          "type": "edit",
          "data": {
            "pet_name": "{{name}}",
            "total_amount": "{{cost}}"
          }
        }
      },
      "name": "Submit",
      "type": "Common.openModal"
    }
  ],
  "title": "参考创建销售订单",
  "icon": "icon-plus-circle"
}
```

## Common.closeModal

关闭当前打开的对话框

```json
{
  "name": "closeModal",
  "type": "Common.closeModal"
}
```

## Common.confirm

```json
{
  "name": "Confirm",
  "type": "Common.confirm",
  "payload": {
    "title": "确认删除",
    "content": "删除后不可撤销！"
  }
}
```

## Form.delete

```json
{
  "name": "Delete",
  "payload": {
    "model": "<MODEL_ID>"
  },
  "type": "Form.delete"
}
```

## Form.submit

提交当前表单数据

```json
{
  "name": "Submit",
  "type": "Form.submit",
  "payload": {}
}
```

## Form.delete

删除当前表单数据

```json
{
  "name": "Delete",
  "type": "Form.delete"
}
```

## Form.find

刷新当前表单数据

```json
{
  "name": "Find",
  "type": "Form.find"
}
```

## Form.fullscreen

全屏显示当前表单

```json
{
  "name": "fullscreen",
  "type": "Form.fullscreen"
}
```

## Common.showMessage

显示消息，类型可以是 'success' 'warning' 'error'

```json
{
  "name": "message",
  "type": "Common.showMessage",
  "payload": {
    "type": "success",
    "content": "刷新成功"
  }
}
```

## Common.emitEvent

调用 xgen 框架中注册的事件

其中 key 需要使用到命名空间，命名空间的作用是保证控件能唯一定位到事件，防止错误调用事件。

### Neo

比如事件注册示例：`window.$app.Event.on('app/getContext', getContext)`。

- app/getContext,给 neo 组手设置当前命令上下文

当 xgen 界面发生切换时，自动的调用，比如打开不同的 form/table 界面，把当前的 table 或是 form 信息传递给 neo 助手。

```ts
const [context, setContext] = useState<App.Context>({
  namespace: '',
  primary: '',
  data_item: {}
});
```

- app/getField,设置 neo 设置当前控件绑定字段信息

在使用 ai 智能表单时，会自动的触发这个事件，目的是把 ai 表单相关的信息，比如绑定的是哪一个控件，控件的相关配置传到后端。

```ts
const [field, setField] = useState<App.Field>({
  name: '',
  bind: '',
  config: {} as Common.FieldDetail
});
```

- app/setNeoVisible,调用 neo 聊天窗口或是隐藏聊天窗口，传入聊天占位符与 signal。

通常在 xgen 前端的 form 或是 table action 中调用。

```ts
const setNeoVisible = useMemoizedFn((v) => {
  if (v) {
    setVisible(v.visible);
    //
    setChatContext({ placeholder: v.placeholder, signal: v.signal });
  } else {
    setVisible(true);
  }
});
```

使用示例：给 neo 助手设置不同的上下文，赋予不同的角色。同时还需要后端的 neo prepare 处理器进行配合。

```json
{
  "actions": [
    {
      "action": [
        {
          "name": "数字化身",
          "type": "Common.emitEvent",
          "payload": {
            "key": "app/setNeoVisible",
            "value": {
              "visible": true,
              "placeholder": "我是{{name}}的数字分身，你可以向我提问",
              "signal": {
                "name": "AskExpert",
                "id": "{{id}}",
                "expert": "{{name}}"
              }
            }
          }
        }
      ],
      "icon": "icon-at-sign",
      "showWhenAdd": false,
      "hideWhenEdit": true,
      "showWhenView": true,
      "title": "数字化身"
    },
    {
      "action": [
        {
          "name": "智能输入",
          "type": "Common.emitEvent",
          "payload": {
            "key": "app/setNeoVisible",
            "value": {
              "visible": true,
              "placeholder": "输入专家的关键信息, 我会帮你自动填写",
              "signal": { "name": "AutoInput", "id": "{{id}}" }
            }
          }
        }
      ],
      "icon": "icon-send",
      "showWhenAdd": true,
      "showWhenView": false,
      "title": "智能输入"
    }
  ]
}
```

### app

- app/getAppInfo,用户登录后自动调用事件，从后端获取应用的基础信息。
- app/getUserMenu,重新加载用户菜单，由 action Common.reloadMenu 调用，也可以直接调用。
- app/updateMenuStatus,更新当前菜单的状态，当路由切换时自动调用。

### Chart/Dashboard

命名空间规则： `Dashboard-${parent}-${model}`

- ${namespace}/search
- ${namespace}/refetch

### Form

Form 的命名空间规则是`Form-${parent}-${model}`,比如`/forms/export.form.yao`对应的命名空间`Form-Page-expert`,父级是 Page 对象。

- ${namespace}/fullscreen
- ${namespace}/find
- ${namespace}/save
- ${namespace}/delete
- ${namespace}/back
- ${namespace}/refetch
- ${namespace}/submit
- ${namespace}/setFieldsValue，动态的给表单设置字段值
- ${namespace}/${item.bind}/unloading 取消当前加载状态，`item.bind`是 form 中的控件，实际是上调用 ai 控件的加载状态，需要配置 ai 智能表单进行使用。

- ${namespace}/form/actions/done

### Table

Table 的命名空间规则是`Table-${parent}-${model}`,比如`/forms/export.form.yao`对应的命名空间`Table-Page-expert`,父级是 Page 对象。

也有可能是:

- `Table-Model-expert`,在弹出对话框中
- `Table-Dashboard-expert`,在 Dashboard 中
- `Table-Form-expert`,在表单中

- ${namespace}/search
- ${namespace}/save
- ${namespace}/delete
- ${namespace}/batchDelete
- ${namespace}/batchUpdate
- ${namespace}/refetch

### Step

- ${namespace}/save

### Modes

- global.stack.pop
- global.stack.remove

基础使用,在 payload 中传目标事件的 key 与 value。

```json
{
  "name": "数字化身",
  "type": "Common.emitEvent",
  "payload": {
    "key": "app/setNeoVisible", //event key
    "value": {} //event parameters
  }
}
```

示例：调用 Neo

signal 会作为 neo 请求 context 的一部分传到后端。

```json
{
  "name": "数字化身",
  "type": "Common.emitEvent",
  "payload": {
    "key": "app/setNeoVisible",
    "value": {
      "visible": true,
      "placeholder": "我是{{name}}的数字分身，你可以向我提问",
      "signal": {
        "name": "AskExpert",
        "id": "{{id}}",
        "expert": "{{name}}"
      }
    }
  }
}
```

对应的 neo 预处理处理器。

```ts
function Prepare(context: ChatContext, messages: ChatMessage[]): ChatMessage[] {
  const { namespace, signal, field } = context;
  if (namespace === 'Form-Page-expert' && field?.bind === 'description') {
    return autoDescribe(context, messages);
  }

  switch (signal?.name) {
    case 'AskExpert':
      return askExpert(context, messages);

    case 'DocumentQuestion':
      return DocumentQuestion(context, messages);

    case 'AutoInput':
      return autoInput(context, messages);
  }
}
```

neo context 的定义

```js
{
    namespace: context.namespace,//命名空间
    stack,
    pathname,
    formdata: context.data_item,
    field: { name: v.name, bind: v.bind },//字段信息
    config: v.config,
    signal: chat_context.signal//用户输入的任何对象
}
```

## Servcie

在 action 中调用 service 函数

```json
{
  "action": [
    {
      "name": "CreatePse",
      "payload": {
        "args": ["{{id}}"], //使用{{}}的语法传入参数
        "method": "create"
      },
      "type": "Service.pse" //类型为service，pse对应services/pse.js文件
    },
    {
      "name": "message",
      "type": "Common.refetch", //重新加载内容
      "payload": {}
    },
    {
      "name": "message",
      "type": "Common.showMessage",
      "payload": {
        "type": "[[$CreatePse.create_pse.result]]", //使用[[$name]]引用前面的action返回结果
        "content": "[[$CreatePse.create_pse.result]]"
      }
    }
  ],
  "icon": "icon-arrow-left",
  "showWhenAdd": true,
  "title": "创建pse文件"
}
```

js 文件`services/pse.js`

```js
function create(id) {
  return Process('flows.sapsso.pse', id);
}
```

## Common.historyPush

historyPush 的 payload 参数定义如下：

```ts
interface HistoryPush {
  pathname: string; //需要跳转的地址
  search?: any; //类型为对象，搜索参数，即是query参数
  public?: boolean; //是否公共网址，默认是在spa hash地址
  refetch?: boolean; //刷新页面
  withFilterQuery?: boolean; //是否使用筛选查询参数,只对列表界面的filter中的action生效，查询参数会接收筛选器的参数值
}
```

```json
{
  "action": [
    {
      "name": "exportCrt",
      "payload": {
        "pathname": "/api/sapsso/exportcrt.crt",
        "public": true,
        "search": {
          "id": "{{id}}"
        }
      },
      "type": "Common.historyPush"
    }
  ],
  "showWhenAdd": true,
  "title": "导出crt文件"
}
```
