# 事件动作中的 reload action

在事件中使用 action 进行组件联动时，使用 reload 的同时进行 setValue 操作：

以下是个按钮的 click 事件，它会刷新加载另外一个 service 组件的内容。

使用 componentId 指定目标组件。

```json
{
  "onEvent": {
    "click": {
      "actions": [
        {
          "type": "action",
          "actionType": "reload",
          "componentId": "u:70aaf268ffc5",
          "args": {
            "current_item": "${item}"
          }
        }
      ],
      "weight": 0
    }
  }
}
```

配置方法二：
先给 service 组件配置一个名称

```json
{
  "onEvent": {
    "click": {
      "actions": [
        {
          "type": "action",
          "actionType": "reload",
          "componentName": "service1",
          "args": {
            "current_item": "${item}"
          }
        }
      ],
      "weight": 0
    }
  }
}
```

在 action 中如果需要查找目标组件，属性需要设置 componentId 或是 componentName,不能使用 target，CmptAction 并不支持这种配置格式。

执行的代码如以所示，原理是找到目标控件，执行目标控件的 reload 方法。

```js
/*!node_modules/amis-core/lib/actions/CmptAction.js*/

/**
 * 根据唯一ID查找指定组件
 * 触发组件未指定id或未指定响应组件componentId，则使用触发组件响应
 */
const key = action.componentId || action.componentName;
const dataMergeMode = action.dataMergeMode || 'merge';

let component = key
  ? event.context.scoped?.[
      action.componentId ? 'getComponentById' : 'getComponentByName'
    ](key)
  : null;

// 刷新
if (action.actionType === 'reload') {
  return component?.reload?.(
    undefined,
    action.data, //{current_item: "admin_user"}
    undefined,
    undefined,
    dataMergeMode === 'override',
    action.args
  );
}
```

```js
// amis\packages\amis\src\renderers\Service.tsx

  reload(
    subpath?: string,
    query?: any,//查询参数
    ctx?: any,
    silent?: boolean,
    replace?: boolean
  ) {
    const scoped = this.context as IScopedContext;
    if (subpath) {
      return scoped.reload(
        query ? `${subpath}?${qsstringify(query)}` : subpath,
        ctx
      );
    }

    return super.reload(subpath, query, ctx, silent, replace);
  }
```

另外需要注意的是传值的方法，这里的携带参数的方法使用 args：

```json
{
  "args": {
    "current_item": "${item}"
  }
}
```

或是使用 data。

```json
{
  "data": {
    "current_item": "${item}"
  }
}
```

以上两种方法都是一样的效果，原因是在执行 action 时，会进行参数的合并，args 会合并到 data 里。

```js
// \amis\packages\amis-core\src\actions\Action.ts

// 动作数据
const actionData =
  args && Object.keys(args).length
    ? omit(
        {
          ...args, // 兼容历史（动作配置与数据混在一起的情况）
          ...(afterMappingData ?? {})
        },
        getOmitActionProp(action.actionType)
      )
    : afterMappingData;

// 默认为当前数据域
const data = actionData !== undefined ? actionData : mergeData;

console.group?.(`run action ${action.actionType}`);
console.debug(`[${action.actionType}] action args, data`, args, data);

let stopped = false;
const actionResult = await actionInstrance.run(
  {
    ...action,
    args,
    data: action.actionType === 'reload' ? actionData : data, // 如果是刷新动作，则只传action.data
    ...key
  },
  renderer,
  event,
  mergeData
);
```

而不是 setValue 中的格式。

```json
{
  "args": {
    "value": { "current_item": "${item}" }
  }
}
```
