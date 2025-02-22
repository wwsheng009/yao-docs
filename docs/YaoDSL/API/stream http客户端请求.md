# yao http.Stream 处理器

yao http.Stream 用于进行异步 sse 请求。

## 适用版本

0.10.3 或以上

## 使用方法

使用 处理器`http.Stream` 向服务端发出请求时需要进行异步响应处理。与其它 http 处理器不一样的地方在于第三个参数需要是一个回调函数(js 函数)。

```js
http.Stream('POST', url, handler, RequestBody, null, {
  Accept: 'text/event-stream; charset=utf-8',
  'Content-Type': 'application/json',
  Authorization: `Bearer ` + setting.api_token
});
```

回调处理器，处理函数要与上面的请求函数在同一个 js 文件里。

```js
function handler(payload) {
  const lines = payload.split('\n\n');
  for (const line of lines) {
    if (line === '') {
      continue;
    }
    if (line === 'data: [DONE]') {
      return 0;
    } else if (line.startsWith('data:')) {
      const myString = line.substring(5);
      try {
        let message = JSON.parse(myString);
        if (message) {
          reply = message;
          let content = message.choices[0]?.delta?.content;
          // console.log(`content:${content}`);

          if (content) {
            g_message += content;
            collect(content);
          }
        }
      } catch (error) {
        ssEvent('errors', error.Error());
        return -1;
      }
    } else {
      console.log('unexpected', line);
    }
  }
  //异常，返回-1
  //正常返回1，默认
  //中断返回0
  return 1;
}
```

## 示例代码

yao-chatgpt 0.10.3 分支

```sh
git clone https://github.com/wwsheng009/yao-chatgpt.git

cd yao-chatgpt && git checkout 0.10.3
```
