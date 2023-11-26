# propsTransform 属性

amis 在渲染一个控件时如果传入一个 propsTransform 函数,则会调用该函数,并将控件的 props 作为参数传入。可以用来做一些 props 的变换。

比如以下代码就是一个 propsTransform 函数，功能是进行一个属性格式的转换，onConfirm 是用户编写的回调函数，其它的都是 props，amis 框架会在合适的时机调用这个函数，返回新的属性值。

```js
({ onConfirm, pages, ...rest }: any) => {
  return {
    ...rest,
    data: {
      pages,
    },
    onConfirm: (values: Array<any>) => onConfirm && onConfirm(values[0]),
  };
};
```
