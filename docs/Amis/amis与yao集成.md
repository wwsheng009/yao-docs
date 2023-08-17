# amis 与 yao 集成

yao 作为 api 后端，给 amis 提供数据，amis 作为前端，使用 amis-editor 设计前端页面，快速开发。

集成分两部分：

- amis-editor 设计器与 yao 集成开发
- amis 与 yao 后端 api 集成开发

## amis-editor 设计器与 yao 集成开发

这部分的集成功能有：

- yao 提供 amis-设计器登陆认证接口
- yao 提供 amis 设计器生成的源代码读取与保存接口

源代码的读取与保存使用了 yao 的自定义 widget 功能，可以把 amis 页面的源代码保存到数据库表中，并且缓存在 yao 的应用中。
参考：[自定义 wdiget](../YaoDSL/Widget/%E8%87%AA%E5%AE%9A%E4%B9%89Widget%E5%8D%87%E7%BA%A7%E7%89%88.md)

## amis 应用与 yao 集成开发

这部分集成功能有：

- yao 提供用户登录认证接口
- yao 提供数据 CURD 接口

## API 接口适配

    amis对后端api接口是有返回格式要求的，而yao提供的api接口返回格式并不直接适配amis的要求。对接的第一步是进行api接口适配。针对单个接口，在amis中可以使用adopter进行处理，但是大量的接口就不合适了，amis提供了另外一个机制来处理，就是自定义fetcher函数，这个函数设置在amis初始的环境变量中，所有的amis请求都会使用。通过自定义fetcher可以全局的处理api请求与返回数据。
    具体请看：[fetcher](%E9%80%82%E9%85%8Dyao%E7%9A%84fetcher.md)

## 用户登录认证

    另外一个适配是集成在amis中接入yao的用户登录功能，因为在yao中很多内置的接口都是需要进行登录认证的，需要先登录后获取后端生成的token,保存在浏览器里。处理流程：
    - 制造一个登录页面，在登录页面里获取后端的验证码图片。
    - 提供用户信息与验证码给yao，返回token。
    - 把token保存在浏览器本地，在测试项目中把token写在cookie里，并设置有效时间,这样处理的好处是，cookie到期后会自动消失，可以简单的判断，然后如果不存在直接跳转到登录页面。
    - 在自定义fetcher里读取本地token，api请求时会自动的附加上token。

## 项目地址：

- yao 后端应用：https://github.com/wwsheng009/yao-amis-admin
- amis 设计器：https://github.com/wwsheng009/amis-editor-yao
