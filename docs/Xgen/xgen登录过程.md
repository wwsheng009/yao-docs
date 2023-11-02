# xgen 登录请求过程

当用户打开登录页面时，xgen 会向服务器 POST 一个请求`/api/__yao/app/setting`，获取应用的配置信息。这个 api 请求是不需要认证的，一般来说会在登录前调用这个接口地址。

调用接口一般传入三个参数：

- sid 会话 id，客户端生成的唯一字符串，可以是唯一加当前时间。作为请求参数
- lang,语言
- time,当前时间

```json
{ "sid": "temp_sid", "lang": "浏览器当前语言", "time": "当前时间" }
```

服务器收到请求后，会生成一个临时的会话，会话的 id 使用传入的 sid。并把语言设置与 sid 关联起来。在用户登录系统时，也会把 temp_sid 传入登录请求中。

在后端处理请求时，默认会使用处理器`yao.app.xgen`。同时还可使用处理器`yao.app.Setting`,或是使用自定义的处理器,在`app.yao`配置文件里配置`setting`节点。

处理器`yao.app.xgen`的处理流程：

- 读取应用配置文件，配置文件：app.yao/app.jsonc/app.json，只要存在一个就可以。

- 读取用户或是管理员的登录配置文件

- 合并两个文件的配置

应用配置文件的结构如下，其中语言可以通过环境变量配置默认值。Token 与 Optional 可以自定义配置。

```golang

type DSL struct {
	Name        string      `json:"name,omitempty"`//
	Short       string      `json:"short,omitempty"`
	Version     string      `json:"version,omitempty"`
	Description string      `json:"description,omitempty"`
	Theme       string      `json:"theme,omitempty"`
	Lang        string      `json:"lang,omitempty"`
	Sid         string      `json:"sid,omitempty"`//当前会话ID
	Logo        string      `json:"logo,omitempty"`
	Favicon     string      `json:"favicon,omitempty"`
	Menu        MenuDSL     `json:"menu,omitempty"`
	AdminRoot   string      `json:"adminRoot,omitempty"`//管理后台的入口，默认是/admin，也可以修改成其它的
	Optional    OptionalDSL `json:"optional,omitempty"`
	Token       OptionalDSL `json:"token,omitempty"`
	Setting     string      `json:"setting,omitempty"` // 自定义的返回应用信息。默认是yao.app.xgen
	Setup       string      `json:"setup,omitempty"`   // setup process
}

```

配置示例：

```json
{
  "xgen": "1.0",
  "name": "::Demo Application",
  "short": "::Demo",
  "description": "::Another yao application",
  "version": "1.0.1",
  "setup": "scripts.demo.Data",
  "adminRoot": "admin",
  "optional": {
    "hideNotification": true,
    "hideSetting": false,
    "neo": { "api": "/neo", "studio": true }
  },
  "menu": { "process": "flows.app.menu", "args": ["demo"] }
}
```

用户或是登录配置文件会在 logins 目录下。

- 管理员配置文件名是`admin.login.yao`
- 普通用户配置文件名是`user.login.yao`

登录配置文件结构定义：

```golang

// DSL the login DSL
type DSL struct {
	ID              string               `json:"id,omitempty"`
	Name            string               `json:"name,omitempty"`
	Action          ActionDSL            `json:"action,omitempty"`
	Layout          LayoutDSL            `json:"layout,omitempty"`
	ThirdPartyLogin []ThirdPartyLoginDSL `json:"thirdPartyLogin,omitempty"`
}

// ActionDSL the login action DSL
type ActionDSL struct {
	Process string        `json:"process,omitempty"`//重要，用户登录处理器，默认是yao.login.Admin
	Args    []interface{} `json:"args,omitempty"`//登录器接收的http接口参数
}

// LayoutDSL the login page layoutDSL
type LayoutDSL struct {
	Entry   string `json:"entry,omitempty"`//登录成功后的跳转地址，需要注意的是只能是在xgen的菜单地址
	Captcha string `json:"captcha,omitempty"`//获取验证码图片的地址
	Cover   string `json:"cover,omitempty"`//封面图片地址
	Slogan  string `json:"slogan,omitempty"`//标语
	Site    string `json:"site,omitempty"`//显示的站点地址
}

// ThirdPartyLoginDSL the thirdparty login url
type ThirdPartyLoginDSL struct {
	Title string `json:"title,omitempty"`//标题
	Href  string `json:"href,omitempty"`//登录地址
	Icon  string `json:"icon,omitempty"`//登录页面显示的图标地址
	Blank bool   `json:"blank,omitempty"`//是否跳转到新窗口
}

```

配置文件示例：

管理员配置文件：

```json
{
  "name": "::Admin Login",
  "action": {
    "process": "yao.login.Admin",
    "args": [":payload"]
  },
  "layout": {
    "entry": "/x/Chart/dashboard",
    "captcha": "yao.utils.Captcha",
    "cover": "/assets/images/login/cover.svg",
    "slogan": "::Make Your Dream With Yao App Engine",
    "site": "https://yaoapps.com"
  },
  "thirdPartyLogin": [
    {
      "title": "微信登录",
      "href": "https://baidu.com",
      "icon": "/assets/logo_wechat.png",
      "blank": true
    },
    {
      "title": "飞书登录",
      "href": "https://google.com",
      "icon": "/assets/logo_feishu.png",
      "blank": false
    }
  ]
}
```

用户配置文件：

```json
{
  "name": "::User Login",
  "action": {
    "process": "scripts.user.Login",
    "args": [":payload"]
  },
  "layout": {
    "entry": "/x/Table/pet",
    "captcha": "yao.utils.Captcha",
    "cover": "/assets/images/login/cover.svg",
    "slogan": "::Make Your Dream With Yao App Engine",
    "site": "https://yaoapps.com/doc"
  }
}
```

后端根据配置会返回以下的配置信息。login 配置信息经过合并处理，验证码是返回的获取地址而不是处理器名称。

```json
{
  "apiPrefix": "__yao",
  "description": "Another yao application",
  "favicon": "/api/__yao/app/icons/app.ico",
  "lang": "zh-cn",
  "login": {
    "admin": {
      "captcha": "/api/__yao/login/admin/captcha?type=digit",
      "layout": {
        "site": "https://yaoapps.com?from=instance-admin-login",
        "slogan": "Chat with AI"
      },
      "login": "/api/__yao/login/admin"
    },
    "entry": {
      "admin": "/x/Table/demo.table",
      "user": "/x/Table/pet"
    },
    "user": {
      "captcha": "/api/__yao/login/user/captcha?type=digit",
      "layout": {
        "site": "https://yaoapps.com/?from=instance-user-login",
        "slogan": "梦想让我们与众不同"
      },
      "login": "/api/__yao/login/user"
    }
  },
  "logo": "/api/__yao/app/icons/app.png",
  "mode": "development",
  "name": "Demo Application",
  "optional": {
    "hideNotification": true,
    "hideSetting": false,
    "remoteCache": false
  },
  "sid": "Mb69Gat02A8pwKOIOnoF61698890200884",
  "theme": "",
  "token": {}
}
```

当用户登录成功后，xgen 框架会在浏览器端写入以下的存储内容：

localStorage

- xgen:avatar
- xgen:current_nav
- xgen:user
- xgen:login_url
- xgen:menu_key_path
- xgen:token_storage
- xgen:menus
- xgen:menu
- xgen:temp_sid
- xgen:remote_cache
- xgen:xgen_theme
- xgen:paths

## xgen:avatar

用户头像，自动在前端生成，使用的开发包是 react-nice-avatar。页面刷新后会自动生成。

```json
{
  "type": "Object",
  "value": {
    "sex": "man",
    "faceColor": "#AC6651",
    "earSize": "small",
    "eyeStyle": "circle",
    "noseStyle": "short",
    "mouthStyle": "peace",
    "shirtStyle": "hoody",
    "glassesStyle": "none",
    "hairColor": "#77311D",
    "hairStyle": "thick",
    "hatStyle": "none",
    "hatColor": "#D2EFF3",
    "eyeBrowStyle": "up",
    "shirtColor": "#F4D150",
    "bgColor": "#FFEBA4"
  }
}
```

## xgen:xgen_theme

主题,有两种,light 与 dark。可以为空。

```json
{ "type": "String", "value": "light" }
```

## xgen:current_nav

```json
{ "type": "Number", "value": "0" }
```

## xgen:user

用户信息，从数据器上返回。

```json
{
  "type": "Object",
  "value": {
    "email": "xiang@iqka.com",
    "extra": { "sex": "男" },
    "id": 1,
    "mobile": null,
    "name": "管理员",
    "status": "enabled",
    "type": "admin"
  }
}
```

## xgen:login_url

登录时的浏览器地址

```json
{ "type": "String", "value": "/" }
```

## xgen:token_storage

```json
{ "type": "String", "value": "sessionStorage" }
```

## xgen:menu_key_path

```json
{ "type": "Array", "value": [] }
```

## xgen:menus

服务器返回的用户菜单配置

```json
{
  "type": "Object",
  "value": {
    "items": [
      {
        "blocks": 0,
        "icon": "icon-activity",
        "id": 1,
        "name": "数据模型",
        "parent": null,
        "path": "/x/Chart/dashboard",
        "visible_menu": 0
      }
    ],
    "setting": [
      {
        "children": [{ "id": 10002, "name": "系统设置", "path": "/setting" }],
        "icon": "icon-settings",
        "id": 999999,
        "name": "设置",
        "path": "/setting"
      }
    ]
  }
}
```

## xgen:menu

xgen:menus 中的 items 子对象。

```json
{
  "type": "Array",
  "value": [
    {
      "blocks": 0,
      "icon": "icon-activity",
      "id": 1,
      "name": "数据模型",
      "parent": null,
      "path": "/x/Chart/dashboard",
      "visible_menu": 0
    }
  ]
}
```

## xgen:temp_sid

```json
{ "type": "String", "value": "ff9BOlHWGGpJrlOcwTQe_1698885330896" }
```

## xgen:remote_cache

```json
{ "type": "Boolean", "value": "false" }
```

## xgen:paths

```json
{ "type": "Array", "value": ["Table-Page-demo.table"] }
```
