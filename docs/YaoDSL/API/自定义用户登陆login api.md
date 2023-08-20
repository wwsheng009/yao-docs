# 自定义用户登陆 API

## 使用 Flow 自定义登录 API

- 第一步，检查动态验证码，如果是接口调用，这一步可以省略
- 第二步，读取用户的 ID 与密码
- 第三步，检查用户密码
- 第四步，生成 token

示例：`flows\login\password.flow.json`

```json
{
  "label": "Login",
  "version": "1.0.0",
  "description": "Login",
  "nodes": [
    {
      "name": "Validate Captcha",
      "process": "xiang.helper.CaptchaValidate",
      "args": ["{{$captcha.id}}", "{{$captcha.code}}"]
    },
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "password"],
          "wheres": [{ "column": "mobile", "value": "?:$mobile" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Validate Passwor",
      "process": "xiang.helper.PasswordValidate",
      "args": ["{{$password}}", "{{$res.User.0.password}}"]
    },
    {
      "name": "Response",
      "process": "flows.login.Token",
      "args": ["{{$res.User.0.id}}"]
    }
  ],
  "output": "{{$res.Response}}"
}
```

## Token 设置

用户名密码校验成功后，可以根据用户 id 可以读取用户的菜单或是权限设置。

- 第一步，读取用户信息
- 第二步，生成 token
- 第三步，设置全局会话（Session）信息，可使用处理器`session.set`设置变量

示例：`demo-crm\flows\login\token.flow.json`

```json
{
  "label": "Token",
  "version": "1.0.0",
  "description": "JWT Token",
  "nodes": [
    {
      "name": "User",
      "process": "models.user.Get",
      "args": [
        {
          "select": ["id", "mobile", "name", "user_id", "open_id", "union_id"],
          "wheres": [{ "column": "id", "value": "?:$in.0" }],
          "limit": 1
        }
      ]
    },
    {
      "name": "Menu",
      "process": "flows.xiang.menu",
      "args": ["{{$res.User.0.id}}"]
    },
    {
      "name": "SID",
      "process": "session.start"
    },
    {
      "name": "JWT",
      "process": "xiang.helper.JWTMake",
      "args": [
        "{{$res.User.0.id}}",
        {},
        {
          "timeout": 3600,
          "sid": "{{$res.SID}}"
        }
      ]
    },
    {
      "name": "Set User Data",
      "process": "session.set",
      "args": ["user", "{{$res.User.0}}"]
    },
    {
      "name": "Set User ID",
      "process": "session.set",
      "args": ["user_id", "{{$res.User.0.id}}"]
    }
  ],
  "output": {
    "sid": "{{$res.SID}}",
    "user": "{{$res.User.0}}",
    "menus": "{{$res.Menu}}",
    "token": "{{$res.JWT.token}}",
    "expires_at": "{{$res.JWT.expires_at}}"
  }
}
```

0.10.3 版本后，不能再使用`session.start`。使用 js 脚本会更好。

```js
/**
 * vben 登录接口
 * yao run scripts.login.Password '::{"username":"test@yao.com","password":"A123456p+"}'
 * @param {*} payload
 * @returns
 */
function Password(payload) {
  const { username, password } = payload;

  const q = new Query();
  const user = q.First({
    debug: true,
    select: ['id', 'name', 'password'],
    wheres: [
      {
        field: 'name',
        value: username,
      },
      { or: true, field: 'email', value: username },
    ],
    from: '$admin.user',
    limit: 1,
  });

  if (!user) {
    return Process('scripts.return.Error', '', '400', '用户不存在');
  }

  try {
    const password_validate = Process(
      'utils.pwd.Verify',
      password,
      user.password,
    );
    if (password_validate !== true) {
      return Process('scripts.return.Error', '', '400', '密码不正确');
    }
  } catch (error) {
    return Process('scripts.return.Error', '', '400', '密码不正确');
  }
  const timeout = 60 * 60;
  const sessionId = Process('utils.str.UUID');
  let userPayload = { ...user };
  delete userPayload.password;
  const jwtOptions = {
    timeout: timeout,
    sid: sessionId,
  };
  const jwtClaims = { user_name: user.name };
  const jwt = Process('utils.jwt.Make', user.id, jwtClaims, jwtOptions);
  Process('session.set', 'user', userPayload, timeout, sessionId);
  Process('session.set', 'token', jwt.token, timeout, sessionId);
  Process('session.set', 'user_id', user.id, timeout, sessionId);

  return Process('scripts.return.Success', {
    sid: sessionId,
    user: userPayload,
    menus: Process('flows.app.menu'),
    token: jwt.token,
    expires_at: jwt.expires_at,
  });
}
```

辅助脚本，封装返回的数据格式
//scripts/return.js

```js
//scripts.return.Success
function Success(data) {
  return {
    code: 0,
    message: 'ok',
    type: 'success',
    result: data,
  };
}
//scripts.return.Error "密码不正确","403","密码不正确"
function Error(data, code, message) {
  let vcode = code;
  let vmessage = message;
  if (code == undefined) {
    vcode = -1;
  }
  if (message == undefined) {
    vmessage = 'error';
  }
  return {
    code: vcode,
    message: vmessage,
    type: 'error',
    result: data,
  };
}
```
