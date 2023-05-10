## 本文目的为了说明aes加解密在yao中是如何实现的。

### model文件如下

我们只看 mobile列，很明显 crypt的属性是"AES",代表该字段进行AES加解密。（注：在yao中这些过程是自动的，根据源码得知只有在mysql中才能生效）

```json
{
  "name": "用户",
  "table": {
    "name": "xiang_user",
    "comment": "用户表",
    "engine": "InnoDB"
  },
  "columns": [
    { "label": "ID", "name": "id", "type": "ID" },
    {
      "label": "手机号",
      "name": "mobile",
      "type": "string",
      "length": 50,
      "comment": "手机号",
      "index": true,
      "nullable": true,
      "crypt": "AES",
      "validations": [
        {
          "method": "mobile",
          "args": [],
          "message": "{{input}}格式错误"
        }
      ]
    },
    {
      "label": "姓名",
      "name": "name",
      "type": "string",
      "length": 80,
      "comment": "姓名",
      "index": true,
      "nullable": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "minLength",
          "args": [2],
          "message": "{{label}}至少需要2个字"
        },
        {
          "method": "maxLength",
          "args": [40],
          "message": "{{label}}不能超过20个字"
        }
      ]
    },
    {
      "label": "状态",
      "comment": "用户状态 enabled 有效, disabled 无效",
      "name": "status",
      "type": "enum",
      "default": "enabled",
      "option": ["enabled", "disabled"],
      "index": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "enum",
          "args": ["enabled", "disabled"],
          "message": "{{input}}不在许可范围, {{label}}应该为 enabled/disabled"
        }
      ]
    }
  ],
  "relations": {},
  "values": [
    {
      "name": "用户",
      "mobile": "13900001111",
      "status": "enabled",
    }
  ],
  "indexes": [
    {
      "comment": "类型手机号唯一",
      "name": "type_mobile_unique",
      "columns": ["type", "mobile"],
      "type": "unique"
    }
  ],
  "option": { "timestamps": true, "soft_deletes": true }
}

```

### 实现方法

在新增和修改数据时，会调用mysql的内置函数AES_ENCRYPT。


在读取数据时，会调用mysql的内置函数AES_DECRYPT。

AES_ENCRYPT和AES_DECRYPT是MySQL中的两个函数，用于加密和解密数据。它们使用AES算法（Advanced Encryption Standard）对数据进行加密和解密。
这些函数需要一个密钥来进行加密和解密。以下是使用AES_ENCRYPT和AES_DECRYPT的示例：
```sql
-- 加密
SELECT AES_ENCRYPT('mytext', 'mykey');

-- 解密
SELECT AES_DECRYPT('encryptedtext', 'mykey');

```
在上面的示例中，'mytext'是要加密的文本，'encryptedtext'是要解密的加密文本，'mykey'是用于加密和解密的密钥。

在yao中，密钥默认是空字符串，通过YAO_DB_AESKEY环境变量可以进行设置。

此外，在yao中，保存到数据库中的字段会使用HEX函数进行转码，所以在数据表中看到的数据，并不是真正的密文，使用UNHEX函数转码后才是真正的密文。

