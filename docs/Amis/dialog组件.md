# dialog 组件

amis dialog 组件在点击确认时会触发 onConfirm 事件,可以通过该事件来获取用户输入的数据。

```jsx
onConfirm(values, rawAction || action, ctx, targets);
```

//其中 values 是一个数组，包含了 dialog 内部所有的组件的值。比如以下的组件，返回的 values 将是一个数组:`[{"label":"","path":"name"}]`

```json
{
    type: 'dialog',
    title: '新增页面',
    body: {
      type: 'form',
      controls: [
        {
          type: 'text',
          label: '名称',
          name: 'label',
          validations: {
            maxLength: 20
          },
          required: true
        },

        {
          type: 'text',
          label: '路径',
          name: 'path',
          validations: {
            isUrlPath: true
          },
          required: true,
          validate(values: any, value: string) {
            const exists = !!values.pages.filter(
              (item: any) => item.path === value
            ).length;
            return exists ? '当前路径已被占用，请换一个' : '';
          }
        },
        {
          type: 'icon-picker',
          label: '图标',
          name: 'icon'
        }
      ]
    }
  }
```
