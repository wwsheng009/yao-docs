# 在 js 脚本中报错的方法

## 使用 JS 标准的 Error 对象

```js
function testException() {
  throw new Error('hello');
}
```

报错结果：

```json
{
  "code": 500,
  "message": "amis.curd.curdTemplate Error: 模型:书本不存在\n    at getModelDefinition (scripts/amis/lib.js:22:17)\n    at getFilterFormFields (scripts/amis/lib.js:272:23)\n    at curdTemplate (scripts/amis/curd.js:16:20)"
}
```

## 对象 Exception

使用 Yao 特定的对象 Exception，会被 Yao 框架捕获。只有一个参数时，异常代码会设置成 500。

```js
function testException() {
  throw new Exception('hello');
}
```

可以在第二个参数指定异常代码。

```js
function testException() {
  throw new Exception('hello', 403);
}
```

转换成错误对象

```json
{ "code": 500, "message": "模型:书本不存在" }
```

区别：

使用 Exception 得到的异常信息会更友好，在 api 接口调用中信息显示更友好。

使用 Error 会得到更具体的 js 堆栈信息，开发时会更好。

在开发代码时可以先把 Exception 设置成 Error，最后再注释掉。

```js
let Exception = Error;
throw new Exception(`模型:${modelName}不存在`);
```
