# 加密解密

加密解密处理器，参考文档 <a href="https://github.com/YaoApp/yao/blob/main/crypto/crypto.go">对照表</a>

| 处理器                 | 说明                                                              | 使用方法                                                  |
| ---------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| yao.crypto.hmac        | 使用 SHA1 加密，自带 base64 加密                                  | Process("yao.crypto.hmac", "SHA1", value, key, "base64"); |
| encoding.base64.Encode | 使用 base64 加密                                                  | Process("encoding.base64.Encode", str);                   |
| encoding.base64.Decode | 使用 base64 解密                                                  | Process("encoding.base64.Decode", str);                   |
| yao.crypto.hash        | 使用各种加密方法 ，第一个参数可填写：MD4，MD5 ，SHA1 ，SHA256 ... | Process("yao.crypto.hash", "SHA1", str);                  |
|                        |
