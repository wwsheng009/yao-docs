# 刷新 token

利用 guard 刷新 token

guard 函数的参数

```js
//scripts.guard.test
function test(fullpath, params, query, body, headers) {
  console.log('fullpath:', fullpath);
  console.log('params:', params);
  console.log('query:', query);
  //body，如果是application/json, 则返回json对象，否则返回字符串
  console.log('body:', body);
  console.log('headers:', headers);
}
```

api 定义，guard 可以配置脚本处理器。

```json
{
  "name": "用户接口",
  "version": "1.0.0",
  "description": "用户接口",
  "group": "user",
  "paths": [
    {
      "path": "/token/refresh",
      "guard": "bearer-jwt",
      "method": "POST",
      "process": "scripts.guard.TokenRefresh",
      "in": [],
      "out": { "status": 200, "type": "application/json" }
    }
  ]
}
```

```js
/**
 * 刷新Token
 */
function TokenRefresh() {
  const user = Process('session.Get', 'user');
  const id = user.id;
  const sid = Process('session.ID');
  const jwt = Process(
    'xiang.helper.JWTMake',
    id,
    {},
    { timeout: 3600, sid: sid },
  );

  // 更新 Session
  Process('session.Set', 'user_id', id);
  Process('session.Set', 'user', 'user');

  return jwt;
}
```

自定义 token 检查逻辑。

```js
function Chat(path, params, query, payload, headers) {
  query = query || {};
  token = query.token || '';
  token = token[0] || '';
  token = token.replace('Bearer ', '');
  if (token == '' || token.length == 0) {
    throw new Exception('No token provided', 403);
  }

  let data = Process('utils.jwt.Verify', token);

  // data.data 是jwt.make的第二个参数,可配合自定义生成函数
  // data.sid是会话id

  //可以在这里返回新的__sid与__global
  return { __sid: data.sid, __global: data.data };
}
```
