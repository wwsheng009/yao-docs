# Select 控件联动

当需要两个 Select 控件进行联动时，可以使用`SendOn`来控制。

这里有两种使用方法：

一是在 url 中使用`${}`语法自动的跟踪有变化的变量。

```json
[
  {
    "type": "select",
    "name": "model",
    "label": "关联模型",
    "source": "/api/v1/table/ddic.model/select_options",
    "required": true
  },
  {
    "multiple": false,
    "type": "select",
    "name": "key",
    "label": "关联模型key",
    "id": "module_key",
    "required": true,
    "source": {
      "method": "get",
      "url": "/api/v1/table/ddic.model.column/select_options?model_id=${model}",
      "sendOn": "data.model"
    }
  }
]
```

二是需要使用`trackExpression`跟踪表达式，比如使用 post 请求方法，在 url 里没有跟踪变量。就需要使用这个表达式。

```json
[
  {
    "type": "select",
    "name": "model",
    "label": "关联模型",
    "source": "/api/v1/table/ddic.model/select_options",
    "required": true
  },
  {
    "multiple": false,
    "type": "select",
    "name": "key",
    "label": "关联模型key",
    "id": "module_key",
    "required": true,
    "source": {
      "method": "post",
      "url": "/api/v1/table/ddic.model.column/select_options",
      "data": {
        "model_id": "${model}"
      },
      "trackExpression": "${model}",
      "sendOn": "data.model"
    }
  }
]
```

## 自动刷新

凡是拉取类接口，默认都会开启自动刷新，比如 form 配置 initApi: `/api/initForm?tpl=${tpl}`。这个接口会在 form 初始化的请求。当接口中有参数时，amis 会监控这个接口的实际结果是否有变化，假如这个时候 form 里面有个字段名为 tpl 的表单项，它的值发生变化，这个 form 的 initApi 又会请求一次。

```json
{
  "type": "form",
  "mode": "horizontal",
  "title": "监听表单内部的修改",
  "initApi": "/api/mock2/form/initData?tpl=${tpl}",
  "actions": [],
  "body": [
    {
      "label": "数据模板",
      "type": "select",
      "labelClassName": "text-muted",
      "name": "tpl",
      "value": "tpl1",
      "inline": true,
      "options": [
        {
          "label": "模板1",
          "value": "tpl1"
        },
        {
          "label": "模板2",
          "value": "tpl2"
        },
        {
          "label": "模板3",
          "value": "tpl3"
        }
      ],
      "description": "<span class=\"text-danger\">请修改这里看效果</span>"
    },
    {
      "label": "名称",
      "type": "static",
      "labelClassName": "text-muted",
      "name": "name"
    },
    {
      "label": "作者",
      "type": "static",
      "labelClassName": "text-muted",
      "name": "author"
    },
    {
      "label": "请求时间",
      "type": "static-datetime",
      "labelClassName": "text-muted",
      "format": "YYYY-MM-DD HH:mm:ss",
      "name": "date"
    }
  ]
}
```

这个功能是自动开启的，直接配置 api 地址（`/api/xxx?xx=${xxx}`），或者对象形式配置 `{method: 'get', url: '/api/xxx?xx=${xxx}'}` 都会自动启动这个功能。如果想要关闭这个功能，有两种方式。

1. 把依赖的数据写在对象形式的 data 里面比如 `{method: 'get', url: '/api/xxx', data: {'xx': "${xxx}"}}`。
2. 对象形式添加 `autoRefresh: false` 属性。

【重点】利用这个 feature 结合 `sendOn` 接口发送条件，可以做到接口的串行加载。比如，接口 2 的地址上写上接口 1 会返回的某个字段，然后配置接口 2 的发送条件为这个字段必须存在时。这样接口 2 就会等接口 1 完了才会加载。

## 跟踪数据自动刷新

> since 1.1.6

之前的版本，配置的 api 默认就会具备自动刷新功能，除非显式的配置 `autoRefresh: false` 来关闭。自动刷新主要通过跟踪 api 的 url 属性来完成的，如果 url 中了使用了某个变量，而这个变量发生变化则会触发自动刷新。
也就说这个 url 地址，既能控制 api 请求的 query 参数，同时又起到跟踪变量重新刷新接口的作用。这个设定大部分情况下都是合理的，但是有时候想要跟踪 url 参数以外的变量就做不到了。所以新增了此属性 `trackExpression`，显式的配置需要跟踪的变量如：

> 如果`trackExpression` 追踪的数据是**对象数据**，可以使用[数据映射](https://baidu.github.io/amis/zh-CN/docs/concepts/data-mapping)的`json`方法将数据序列化之后再比较，例如`"trackExpression": "${fieldToTrack|json}"`

```json
{
  "title": "",
  "type": "form",
  "mode": "horizontal",
  "body": [
    {
      "label": "选项1",
      "type": "radios",
      "name": "a",
      "inline": true,
      "options": [
        {
          "label": "选项A",
          "value": 1
        },
        {
          "label": "选项B",
          "value": 2
        },
        {
          "label": "选项C",
          "value": 3
        }
      ]
    },
    {
      "label": "选项2",
      "type": "select",
      "size": "sm",
      "name": "b",
      "source": {
        "method": "get",
        "url": "/api/mock2/options/level2",
        "trackExpression": "${a}"
      },
      "description": "切换<code>选项1</code>的值，会触发<code>选项2</code>的<code>source</code> 接口重新拉取"
    }
  ],
  "actions": []
}
```

## trackExpression

`trackExpression` 属性，用来主动配置当前组件需要关心的上层数据。

1.  `trackExpression` 配置成 `"none"` 也就是说不追踪任何数据。
2.  `trackExpression` 配置成 `"${xxxVariable}"` 这样 xxxVariable 变化了更新当前组件的数据链。

可以监听多个变量比如: `"${xxx1},${xxx2}"`，还可以写表达式如 `"${ xxx ? xxx : yyy}"`。

amis 内部是通过运算这个表达式的结果来判断。所以表达式中千万不要用随机函数，或者用当前时间等，否则每次都会更新数据链。另外如果变量是数组，或者对象，会转成统一的字符串 `[object Array]` 或者 `[object Object]` 这个其实会影响检测的，所以建议转成 json 字符串如。 `${xxxObject | json}`。还有就是既然是监控上层数据，表达式中不要写当前层数据变量，是取不到的。

```json
{
  "data": {
    "name": "amis"
  },
  "type": "page",
  "body": [
    { "label": "请修改输入框", "type": "input-text", "name": "name" },
    {
      "type": "switch",
      "label": "同步更新",
      "name": "syncSwitch"
    },
    {
      "type": "crud",
      "filter": {
        "trackExpression": "${syncSwitch ? name : ''}",
        "body": ["my name is ${name}"]
      }
    }
  ]
}
```

## 非接口请求类型的联动

可以试试事件动作的 setValue 动作。每次 select 值变化的时候通过 event.data.value 获取选中的值，然后获取对应的数据源，将数据源绑定给变量 opts

```json
{
  "type": "form",
  "title": "表单",
  "body": [
    {
      "type": "select",
      "label": "选项1",
      "name": "select1",
      "options": [
        {
          "label": "选项A",
          "value": "A"
        },
        {
          "label": "选项B",
          "value": "B"
        }
      ],
      "id": "u:af1ad4e2f8db",
      "multiple": false,
      "mode": "inline",
      "onEvent": {
        "change": {
          "weight": 0,
          "actions": [
            {
              "actionType": "setValue",
              "args": {
                "value": {
                  "opts": "${optList[event.data.value]}"
                }
              },
              "componentId": "u:d731760b321e"
            }
          ]
        }
      }
    },
    {
      "type": "select",
      "label": "选项2",
      "name": "select2",
      "id": "u:d731760b321d",
      "multiple": false,
      "mode": "inline",
      "source": "${opts}"
    }
  ],
  "id": "u:d731760b321e",
  "data": {
    "optList": {
      "A": [
        {
          "label": "A",
          "value": "a"
        },
        {
          "label": "B",
          "value": "b"
        },
        {
          "label": "C",
          "value": "c"
        }
      ],
      "B": [
        {
          "label": "A2",
          "value": "a2"
        },
        {
          "label": "B2",
          "value": "b2"
        },
        {
          "label": "C2",
          "value": "c2"
        }
      ]
    },
    "opts": []
  }
}
```
