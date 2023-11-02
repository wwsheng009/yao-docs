# 组件事件刷新

在 amis 中可以使用 action reload 刷新另外一个组件。

对于 action/button/dialog/drawer/wizard/form/service/page/app/chart/curd，可以直接配置以下属性来刷新另外一个组件。

```json
{
  "actions": [
    {
      "type": "action",
      "actionType": "reload",
      "label": "发送到 form2",
      "target": "form2?name=${name}&email=${email}"
    }
  ]
}
```

form 组件还有更方便的配置，配置`reload`属性为其他组件`name`值，可以在表单提交成功之后，刷新指定组件。

指定 target，提交表单时，amis 会寻找 target 所配置的目标组件，把 form 中所提交的数据，发送给该目标组件中，并将该数据合并到目标组件的数据域中，并触发目标组件的刷新操作。

```json
{
  "title": "查询条件",
  "type": "form",
  "target": "my_crud",
  "body": [
    {
      "type": "input-text",
      "name": "keywords",
      "label": "关键字："
    }
  ],
  "submitText": "搜索"
}
```

配置`reload`属性为其他组件`name`值，可以在表单提交成功之后，刷新指定组件。

```json
{
  "type": "form",
  "initApi": "/api/mock2/page/initData",
  "title": "用户信息",
  "reload": "my_service",
  "body": [
    {
      "type": "input-text",
      "name": "name",
      "label": "姓名"
    },
    {
      "type": "input-email",
      "name": "email",
      "label": "邮箱"
    }
  ]
}
```

reload action 配置 target 属性的操作原理

```js
// \amis\packages\amis-core\src\RootRenderer.tsx

const scoped = delegate || (this.context as IScopedContext);
if (action.actionType === 'reload') {
    //域reload
    action.target && scoped.reload(action.target, ctx);
} else if (action.target) {
    action.target.split(',').forEach(name => {
    let target = scoped.getComponentByName(name);
    target &&
        target.doAction &&
        target.doAction(
        {
            ...action,
            target: undefined
        },
        ctx
        );
    });
}

```

scope 用来创建一个域，在这个域里面会把里面的运行时实例注册进来，方便组件之间的通信。

```js
//\amis\packages\amis-core\src\Scoped.tsx
function getComponentByName(name: string) {
    if (~name.indexOf('.')) {
    const paths = name.split('.');
    const len = paths.length;

    return paths.reduce((scope, name, idx) => {
        if (scope && scope.getComponentByName) {
        const result: ScopedComponentType = scope.getComponentByName(name);
        return result && idx < len - 1 ? result.context : result;
        }

        return null;
    }, this);
    }

    const resolved = find(
    components,
    component =>
        filter(component.props.name, component.props.data) === name ||
        component.props.id === name
    );
    return resolved || (parent && parent.getComponentByName(name));
}

function  getComponentById(id: string) {
    let root: AliasIScopedContext = this;
    // 找到顶端scoped
    while (root.parent && root.parent !== rootScopedContext) {
    root = root.parent;
    }

    // 向下查找
    let component = undefined;
    findTree([root], (item: TreeItem) =>
    item.getComponents().find((cmpt: ScopedComponentType) => {
        if (filter(cmpt.props.id, cmpt.props.data) === id) {
        component = cmpt;
        return true;
        }
        return false;
    })
    ) as ScopedComponentType | undefined;

    return component;
}
```

目标组件的查找，配置 target 相当于配置 componentName,

componentName 会调用方法 getComponentByName，而 componentId 会调用方法 getComponentById ;

componentId 是全局定位指定的组件，首先会定位到域的顶端，再在整个树路径中查找，而 componentName 是就近按照层级向上查找，使用 componentName 可以使用命名空间的方式，比如 xxx.x1。

## 注意

而在 onEvent 事件响应处理中不能使用这种配置方法，而是需要使用 componentId 或是 componentName

```json
{
  "onEvent": {
    "click": {
      "actions": [
        {
          "actionType": "reload",
          "componentId": "service-reload",
          "data": {
            "age": "18"
          }
        }
      ]
    }
  }
}
```

示例：

旧版本的刷新与新版本的刷新操作对比。

```json
{
  "toolbar": [
    {
      "type": "button",
      "label": "导入-旧",
      "actionType": "ajax",
      "api": "post:/api/v1/system/meta/model/import_system_models",
      "reload": "model-list"
    },
    {
      "type": "button",
      "label": "导入系统模型-新",
      "onEvent": {
        "click": {
          "actions": [
            {
              "ignoreError": false,
              "outputVar": "",
              "actionType": "ajax",
              "options": {},
              "api": {
                "url": "/api/v1/system/meta/model/import_system_models",
                "method": "post"
              }
            },
            {
              "componentName": "model-list",
              "ignoreError": false,
              "actionType": "reload"
            }
          ]
        }
      },
      "id": "u:9bde38141acd"
    }
  ]
}
```
