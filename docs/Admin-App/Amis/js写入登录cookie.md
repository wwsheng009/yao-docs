# 登录成功后写入 cookie

在登录成功后,我们可以写入 cookie 来保存用户的登录状态:

## 超时设置由 api 返回

原始处理格式，使用原始的 amis fether,登录处理器使用 yao.admin.login

需要注意的是，api 返回的是 unix 时间格式，需要转换为 js 时间格式,转换方法是`time * 1000`

```js
function adoptor(payload, response, api) {
  let data = payload;
  if (response.status === 200 && payload) {
    if (data.data) {
      data = data.data;
    }
    let newDate = new Date();
    newDate.setTime(data.expires_at * 1000);
    let expires = 'expires=' + newDate.toGMTString();
    document.cookie = `token=${escape(data.token)};${expires};path=/`;
    sessionStorage.setItem(
      'xgen:token',
      JSON.stringify({ type: 'String', value: escape(data.token) }),
    );
    //studio
    newDate.setTime(data.studio.expires_at * 1000);
    expires = 'expires=' + newDate.toGMTString();
    document.cookie = `studio=${escape(data.studio.token)};${expires};path=/`;
    sessionStorage.setItem(
      'studio',
      JSON.stringify({ type: 'String', value: data.studio }),
    );
  }
  return {
    status: 0,
    msg: '请求成功',
    data: data,
  };
}
```

也可以在前端直接设置超时，不建议，因为后端的 token 一般都会有超时的设置，两边的设置需要保持一致

```js
function adoptor(payload, response, api) {
  if (response.status === 200) {
    let newDate = new Date(); //获取当前的时间对象
    let nowTimeStamp = newDate.getTime(); //获取当前时间对象的时间戳
    let days = 7;
    nowTimeStamp += days * 24 * 60 * 60 * 1000;
    newDate.setTime(nowTimeStamp);
    let expires = 'expires=' + newDate.toGMTString();
    document.cookie = `token=${escape(payload.data.token)};${expires};path=/`;
    sessionStorage.setItem(
      'xgen:token',
      JSON.stringify({ type: 'String', value: escape(payload.data.token) }),
    );
    //studio
    document.cookie = `studio=${escape(
      payload.data.studio.token,
    )};${expires};path=/`;
    sessionStorage.setItem(
      'studio',
      JSON.stringify({ type: 'String', value: payload.data.studio }),
    );
  }
  return {
    status: 0,
    msg: '请求成功',
    data: payload.data,
  };
}
```
