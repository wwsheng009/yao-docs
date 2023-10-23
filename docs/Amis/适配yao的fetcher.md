# 适配 Yao 的 amis fetcher

默认情况下，amis 会使用一个默认的 fetcher,这个 fetcher 会直接发起请求。
Amis 框架对返回数据格式有一定的要求。

为了让 amis 适配 yao 返回的数据格式，需要创建一个适配 yao 的 fetcher,主要负责请求数据和处理响应。

## 创建自定义的 fetcher

amis fetcher 的作用是发送请求和处理响应,我们需要创建一个适配 yao 的 fetcher:

- 在发出请求时自动的增加 header authorization token.
- 处理 yao 返回的数据格式,将数据和状态封装成 amis 需要的格式,如果返回格式没有问题,直接返回。
- 非 `/api` 请求直接返回。
- 在返回时，需要返回 promise 对象，这样自定义的 adopter 才能生效。
- 增加出错处理，如果没有权限，重定位到定向到登录页。
- 处理跨域时自动的取消 withCredentials 请求。

```js
fetcher: ({ url, method, data, config, headers }) => {
  config = config || {};
  config.headers = config.headers || headers || {};

  //使用token
  let token = getCookie('token');

  config.withCredentials = true;
  try {
    const url2 = new URL(url);
    //跨域
    //后端可能会设置：Access-Control-Allow-Origin:'*'，与withCredentials会有冲突
    if (
      url2.port !== window.location.port ||
      url2.host !== window.location.host ||
      url2.protocol != window.location.protocol
    ) {
      //使用studio
      token = getCookie('studio');

      config.withCredentials = false;
    }
  } catch (error) {}
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  } else {
    window.location.href = 'login.html';
    return;
  }
  const catcherr = (error) => {
    if (error.response.data && error.response.data.message) {
      error.message = error.response.data.message;
    }
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      if (error.response.data.message === 'Invalid token') {
        window.location.href = 'login.html';
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

    return new Promise(function (resolve, reject) {
      reject(error);
    });
  };
  const check = (response) => {
    if (
      response.data &&
      response.data.data &&
      response.data.msg &&
      response.data.status != null &&
      response.data.status != undefined
    ) {
      return new Promise(function (resolve, reject) {
        resolve(response);
      });
    }
    // debugger;
    // const url = new URL(response.config.url);
    const path = response.config.url;

    if (!path.startsWith('api')) {
      return new Promise(function (resolve, reject) {
        resolve(response);
      });
    }

    //组成新的payload,即是修改response的数据
    let payload = {
      status: !response.data.code ? 0 : response.data.code,
      msg: response.data.message ? response.data.message : '',
      data: response.data,
    };
    response.data = payload;
    // 在这个回调函数中返回一个新的 Promise 对象
    return new Promise(function (resolve, reject) {
      // 这里应该返回一个新的response,可以在下一个adapter里使用
      // 执行异步操作
      // 在异步操作完成后调用 resolve 或 reject
      resolve(response);
    });
  };
  if (method !== 'post' && method !== 'put' && method !== 'patch') {
    if (data) {
      config.params = data;
    }
    return axios[method](url, config).then(check).catch(catcherr);
  } else if (data && data instanceof FormData) {
    // config.headers = config.headers || {};
    // config.headers['Content-Type'] = 'multipart/form-data';
  } else if (
    data &&
    typeof data !== 'string' &&
    !(data instanceof Blob) &&
    !(data instanceof ArrayBuffer)
  ) {
    data = JSON.stringify(data);
    config.headers['Content-Type'] = 'application/json';
  }

  return axios[method](url, data, config).then(check).catch(catcherr);
};
```
