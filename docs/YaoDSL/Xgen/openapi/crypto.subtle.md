# 在浏览器中 crypto.subtle对象不存在是什么原因

xgen启用openapi后，需要使用localhost或https协议访问。

在浏览器中访问 `window.crypto.subtle` 时出现 `undefined` 或提示 `crypto.subtle` 不存在，通常有以下几种常见原因（按出现频率排序）：

1. **页面协议不是安全的上下文（非 HTTPS 或 localhost）**  
   这是最常见的根本原因。  
   Web Cryptography API（包括 `crypto.subtle`）属于“强大特性”（Powerful Feature），根据浏览器安全规范，只有在安全上下文（Secure Context）下才可用。  
   安全上下文的定义：

   - `https://`
   - `http://localhost` 或 `http://127.0.0.1`（包括其 IPv6 形式）
   - `file://` 协议不行
   - 普通 `http://` 站点（包括内网 IP）不行

   如果你在普通 HTTP 页面打开，`window.crypto` 对象本身存在，但 `crypto.subtle` 会被故意设为 `undefined`。

   检查方法：

   ```js
   console.log(window.crypto); // 存在
   console.log(window.crypto.subtle); // undefined（在非安全上下文）
   console.log(location.protocol); // 如果是 "http:" 就一定不行
   console.log(window.isSecureContext); // false 表示当前不是安全上下文
   ```

2. **某些浏览器或浏览器配置禁用了 Web Cryptography API**

   - 旧版本浏览器（例如 IE 全系列、很老的 Edge、Android 系统浏览器 4.x 以前）根本不支持
   - Firefox 在 `about:config` 中如果将 `security.ssl.require_safe_context` 设为 true 并在非安全上下文打开，也会禁用
   - 企业版 Chrome/Chromium 通过组策略禁用了该功能
   - 隐私模式 + 某些扩展（如 uBlock Origin 在严格模式下）极少数情况下会干扰

3. **页面被嵌在不安全的 iframe 中**
   即使父页面是 HTTPS，如果你的页面被嵌入在一个 HTTP 页面或未设置正确 `allow` 属性的 iframe 中，子页面也会失去安全上下文，导致 `crypto.subtle` 不可用。

4. **某些“精简版”或特殊浏览器环境**
   - 微信、QQ、钉钉等内置浏览器（X5、QKView 等旧版）
   - 部分小程序 WebView
   - React Native WebView（默认不开启 DOMException 等）
   - jsdom 测试环境（Node.js 中默认没有 crypto.subtle）

### 快速自检代码（复制到控制台立即判断原因）

```js
if (!window.isSecureContext) {
  console.error(
    '当前页面不是安全上下文（Secure Context），crypto.subtle 被禁用'
  );
  console.log('协议:', location.protocol);
  console.log('建议使用 https:// 或 http://localhost');
} else if (!window.crypto) {
  console.error('当前浏览器完全不支持 Web Crypto API');
} else if (!crypto.subtle) {
  console.error(
    '浏览器支持 crypto 对象，但 subtle 被禁用（通常是因为非安全上下文）'
  );
} else {
  console.log('crypto.subtle 正常可用');
}
```

### 解决方案总结

| 场景                             | 解决方案                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------- |
| 本地开发                         | 使用 `http://localhost:xxxx` 或 `http://127.0.0.1:xxxx`                          |
| 生产环境                         | 必须部署 HTTPS（免费证书可用 Let's Encrypt）                                     |
| 内网测试                         | 配置域名 + HTTPS，或临时使用 localhost 映射                                      |
| 无法控制协议（如第三方页面嵌入） | 无法使用 `crypto.subtle`，需改用 WebAssembly 加密库（如 libsodium.js）或后端加密 |

总之，99% 的情况下 `crypto.subtle` 不存在的原因都是“页面不在安全上下文”，部署 HTTPS 或使用 localhost 即可解决。
