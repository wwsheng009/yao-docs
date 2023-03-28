# 自定义用户登陆过程 api

`demo-crm\flows\login\password.flow.json`
第一步，检查动态验证码，如果是接口调用，这一步可以省略
第二步，读取用户的 ID 与密码
第三步，检查用户密码
第四步，生成 token

```json
{
  "label": "Password Login",
  "version": "1.0.0",
  "description": "Password Login",
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

`demo-crm\flows\login\token.flow.json`
第一步，读取用户信息
第二步，生成 token
第三步，设置全局会话信息，一般是用户的信息

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
