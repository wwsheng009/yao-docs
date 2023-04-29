# yao stream api 接口

## 适用版本

0.10.3-dev 或以上

## 配置

在配置 api 接口时，在 out 节点里设置`"stream":true`,这个接口的服务端处理器将会使用 stream 流式处理。**注意流式处理器的类型必须是 js 脚本，比如 scripts.xxx.xx**。在流处理器(js 脚本中)里可以两个全局函数`ssEvent/cancel`。

- ssEvent 在服务器端脚本里向流发送数据，客户端会收到响应。
- cancel 在服务器脚本里调用，取消请求。

```json
{
  "path": "/ask-stream",
  "method": "POST",
  "guard": "-",
  "process": "scripts.ai.stream.Call",
  "in": [":payload"],
  "out": {
    "stream": true,
    "status": 200,
    "type": "application/json"
  }
}
```

流式处理器向客户端请求发送实时消息。

```js
function collect(content) {
  ssEvent('messages', content);
  // console.log(`content:${content}`);
}
```

客户端一般是浏览器，可以使用 fetch 函数进行 api 调用。

`front-end\src\chatpgt.ts`

```js
export function post<T = any>({
  url,
  data,
  headers,
  onDownloadProgress,
}: HttpOption) {
  const p = new Promise<Response<T>>((resolve, reject) => {
    // return new Promise((resolve, reject) => {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...headers,
      },
      body: JSON.stringify({
        stream: true,
        ...data,
      }),
    })
      .then((response) => {
        const reader = response.body?.getReader();
        function readStream() {
          if (reader) {
            reader
              .read()
              .then(({ value, done }) => {
                const data = new TextDecoder().decode(value);
                // console.log(`data :${data}`);
                // console.log(`done:${done}`);
                if (!done) {
                  const lines = data.split("\n\n");
                  for (const key in lines) {
                    const line = lines[key];
                    if (line.startsWith("event:session_id\ndata:")) {
                      let sesseion_id = line.substring(
                        "event:session_id\ndata:".length
                      );
                      onDownloadProgress?.({ sesseion_id: sesseion_id });
                    } else {
                      // 有可能有nil值，还不知是哪里来的
                      if (!line.includes("event:messages")) {
                        continue;
                      }
                      let newLines = line.replace(/event:messages\n/g, "");
                      newLines = newLines.replace(/data:/g, "");
                      onDownloadProgress?.({ message: newLines });
                    }
                  }

                  return readStream();
                } else {
                  // eslint-disable-next-line no-console
                  console.log("done");
                  resolve({
                    data: { data: "" },
                    message: "",
                    status: 200,
                  } as unknown as Response<T>);
                }
              })
              .catch((error) => {
                reject(error);
              });
          }
        }
        return readStream();
      })
      .catch((error) => {
        reject(error);
      });
  });
  return p;
  // return Promise.resolve({ data: '' } as Response<T>)
}
```

## 示例代码

yao-chatgpt 0.10.3-dev 分支

```sh
git clone https://github.com/wwsheng009/yao-chatgpt.git

cd yao-chatgpt && git checkout 0.10.3-dev
```
