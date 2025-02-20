# 远程 select 控件

`Tag`,`Select`,`AutoComplete`控件可以使用固定的 options 选项，也可以使用数据库表中的数据作为选项。

- `props.xProps`表示这是一个云属性，后端定义，前端调用,默认配置可以省略。
- `props.xProps.$remote`表示这是云属性中的一个远程`api`定义,比如 select 控件，需要定义`$remote`属性。
- `props.xProps.$remote.query`会转换成前端`xgen`框架的`url`查询参数，可以使用`{{id}}`变量绑定语法

```json
{
  "类目": {
    "bind": "category_id",
    "view": {
      "type": "Tag",
      "props": {
        "xProps": {
          "$remote": {
            "process": "yao.component.SelectOptions"
          }
        },
        "query": {
          "from": "material.category",
          "labelField": "name",
          "valueField": "id"
        }
      }
    },
    "edit": {
      "type": "Select",
      "props": {
        "placeholder": "请输入 类目",
        "xProps": {
          "$remote": {
            "process": "yao.component.SelectOptions"
          }
        },
        "query": {
          "from": "material.category",
          "labelField": "name",
          "valueField": "id"
        }
      }
    }
  }
}
```

可以加上查询条件,`wheres`可以是一个数组，也可以是一个对象。

```json
{
  "类目": {
    "edit": {
      "type": "Select",
      "props": {
        "placeholder": "请输入 类目",
        "xProps": {
          //默认配置可以省略
          "$remote": {
            "process": "yao.component.SelectOptions"
          }
        },
        "query": {
          //调用处理器使用的参数
          "from": "material.category",
          "labelField": "name",
          "valueField": "id",
          "wheres": [
            {
              "column": "id",
              "op": "ne",
              "value": "[[ $id ]]" //数据引用，前端的输入条件
            }
          ],
          "limit": "2",
          "params": {
            //查询参数,可以使用{{id}}变量绑定前端数据
            "id": "{{id}}",
            "status": "enabled"
          }
        }
      }
    }
  }
}
```

数据引用，分为两种情况：

- 输出值引用：`[[ $id ]]`，表示引用当前数据的`id`字段值。
- 筛选条件数值引用：`[[ $selected ]]`，表示引用当前数据的`selected`字段值。
  比如下面的例子，`wheres`中使用了`orwhere`条件，`value`的值是`[[ $selected ]]`，表示引用当前数据的`

```json
{
  "labelField": "name",
  "valueField": "id",
  "iconField": "status",
  "from": "category",
  "wheres": [
    { "column": "name", "value": "[[ $keywords ]]", "op": "match" },
    {
      "method": "orwhere",
      "column": "id",
      "op": "in",
      "value": "[[ $selected ]]" //数据引用，前端的输入条件
    }
  ],
  "limit": 20,
  "labelFormat": "[[ $name ]]-[[ $status ]]", //输出替换
  "valueFormat": "[[ $id ]]", //输出替换
  "iconFormat": "[[ $status ]]" //输出替换
}
```

远程控件本身带有数据缓存功能，第一次读取数据后会在浏览器本地缓存。如果不需要缓存功能，需要在`app.json`里设置选项`optional.remoteCache`为`false`

```json
{
  "xgen": "1.0",
  "name": "智慧仓库管理平台",
  "short": "智慧仓库",
  "version": "0.10.3",
  "description": "智慧仓库管理平台",
  "adminRoot": "admin",
  "optional": {
    "remoteCache": false
  },
  "menu": {
    "process": "flows.app.menu",
    "args": []
  }
}
```

默认情况下，如果`Tag`控件绑定的字段值是字符串，而不是列表。只会显示`Value`。为了让单个值也能搜索`option`中的标签值，需要增强`Tag`控件：

https://github.com/wwsheng009/xgen/blob/main/packages/xgen/components/view/Tag/index.tsx

## 源代码

`xProps`解析源代码`/yao-app-sources/yao/widgets/component/props.go`

处理器`yao.component.selectoptions`源代码：`yao-app-sources/yao/widgets/component/process.go`

## 其它远程控件

在 props 中以`$`开头的属性，都是远程属性。远程属性的作用是在前端调用后端的处理器，获取数据。远程属性需要一个 process 属性，指定处理器的名称。可以使用 query 属性，指定处理器的参数。

这些远程属性在浏览器会转换成`api`函数，调用的时机需要看`xgen`框架中的源代码配置。

```json
{
  "Flow Builder": {
    "bind": "flow_dsl",
    "edit": {
      "type": "FlowBuilder",
      "props": {
        "ai": { "placeholder": "帮我制作一个 XXX 功能..." },
        "height": 500, // min-height should be more than 300, default is 300

        // The flow builder component is built on top of react-flow, a library for building node-based applications.
        // It will display the attribution by default at the right bottom corner. You can remove it by setting `removeAttribution` to `true`.
        // If you’re considering removing the attribution, you should be aware of the license agreement, follow the next link to learn more.
        // https://reactflow.dev/learn/troubleshooting/remove-attribution
        "removeAttribution": false,

        // execute interface
        // The execute API is to execute the flow data. It will be called when the user clicks the run button or your custom calls the execute method.
        "$execute": {
          "process": "scripts.flow.Execute",
          "query": { "id": "{{ id }}" }
        },

        // presets interface
        "$presets": {
          "process": "scripts.flow.BuilderPresets",
          "query": { "id": "{{ id }}" }
        },

        // setting interface
        "$setting": {
          "process": "scripts.flow.BuilderSetting",
          "query": { "id": "{{ id }}" }
        }
      }
    }
  }
}
```
