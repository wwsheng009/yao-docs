# xgen 远程 onChange 事件

当我们需要在 xgen 界面上响应编辑控件的值变化事件时，需要设置控件中的远程 onChange 事件。

使用 onChange 事件能增强 xgen 的用户交互功能，xgen 本身是一个集成在 yao 中的前端项目，在不修改前端项目的源代码的前提下，需要自定义的界面交互功能，可以使用 远程 onChange 事件。事件不但可以修改表单结构的值，还可以修改界面的配置。比如动态的显示隐藏界面元素。

演示：通过字段选项值修改界面的布局。

![](../../public/imgs/form_on_change_event.gif)

哪些地方可以用 onChange 事件：

- form 表单控件字段，目前只有 form 的字段能使用。
- list 不可用，虽然在 yao 服务器端预留了配置位，但是在 xgen 并没有处理。
- dashboard 不可用，虽然在 yao 服务器端预留了配置位，但是在 xgen 并没有处理。

## 配置

Form 表单控件配置属性`edit.props["$on:change"]`。

这个属性有两个参数：

- `process`处理器，任何合法的 yao 处理器都可以。
- `query`调用处理器时的查询附加参数。

```json
{
  "住院天数": {
    "bind": "stay",
    "edit": {
      "type": "Input",
      "props": {
        "$on:change": {
          "process": "scripts.event.OnChange",
          "query": { "extra": "开发者定义数据" }
        }
      }
    }
  }
}
```

## 事件响应处理。

需要注意的是这里配置的 onChange 事件会调用服务端的处理，不只是发生在浏览器上的，它会发起 http 请求，并等待服务器返回。

当前端输入类型的控件的值有变化时就会调用远程 onChange 事件。

onChange 处理器的输入输出参数如下：

输入参数是一个对象，有以下的属性：

- key 字段名称
- value 新数值
- isOnload 所有 form 字段的旧值，如果是 form 加载触发的调用（form 配置 onLoadSync 属性），这个参数的值是 undefined。
- params 开发者定义数据，这个参数是配置在`on:change.query`里的参数，可以配置其它参数

返回值也是一个对象，它有两个属性：

- data 返回 form 表单值对象。
- setting 返回 xgen form/list/table 的配置 dsl 对象。

可以单独返回`data`，也可以单据返回界面配置`setting`，也可以直接返回空对象，什么也不修改。

注意，一定要返回一个对象，即使是空对象。

```js
/**
 * Debug
 * @param {*} query
 */
function OnChange(query) {
  query = query || {};
  isOnLoad = query.isOnload; //保存所有form字段旧值,这里的命名有点误导
  key = query.key; // 字段名称
  params = query.params; // 开发者定义数据
  value = query.value; //新值

  //一般会在原来数据的基础下进行修改更新
  let data = { ...query, cost: 1000 }; // 更新消费金额数据, 消费金额
  //读取form配置
  let setting = Process('yao.form.Setting', 'hero'); // 根据新数值生成配置信息;
  setting['fields']['form']['位置']['edit']['props']['options'] = [
    {
      label: '上单',
      value: '上单'
    },
    {
      label: '中单',
      value: '中单'
    },
    {
      label: '打野',
      value: '打野'
    }
  ];
  // 错误检测
  if (setting && setting.code && setting.message) {
    throw new Exception(setting.message, 500);
  }

  return {
    data: data, // 更新消费金额数据, 消费金额
    setting: setting
  };
}
```

## 源代码学习：

form 表单字段 onChange 事件。

`/xgen-v1.0/packages/xgen/components/base/PureForm/hooks/useOnValuesChange.ts`

函数 useOnValuesChange 会作为 form 的 onValuesChangeg 事件处理器。当 form 的字段有值发生变化时，就会回调这个函数。函数会先设置浏览器里的 form 字段的值，然后再调用远程处理函数。

```js
// useOnValuesChange
export default (
	onChangeHook: Required<FormType.Setting>['hooks']['onChange'],
	setData: IPropsPureForm['setData'],
	setSetting: IPropsPureForm['setSetting']
) => {
      return useMemoizedFn(async (v, isOnLoad?: boolean) => {
            if (!onChangeHook) return

            setData(v)//先设置本地form的值

		const key = Object.keys(v)[0]
		const value = v[key]

		if (!(key in onChangeHook)) return

		const [err, res] = await to<{ data: Global.AnyObject; setting: FormType.Setting }>(
			axios.post(onChangeHook[key].api, { key, value, params: onChangeHook[key]?.params, isOnLoad })
		)

		if (err) return

		if (res.setting) setSetting(res.setting)//如果返回界面设置，变更显示界面
		if (res.data && Object.keys(res.data).length) setData(res.data)//如果远程函数返回新值，设置新值
	})
}
```

## Form 加载时触发事件

在表单中使用 onChange 事件时，还可以使用配置 onLoadSync 来控制是否在界面加载时就调用远程 onChange 事件。`layout.form.props.onLoadSync=true时`，form 在加载时就会调用所有字段的 onChange 事件。但是处理器参数 isOnLoad 会是 undefined。

```js
useLayoutEffect(() => {
  setFieldsValue(data);

  if (!Object.keys(data).length) return;
  if (!onLoadSync) return;

  Object.keys(data).map((key) => onValuesChange({ [key]: data[key] }), true);
}, [data, onLoadSync]);
```
