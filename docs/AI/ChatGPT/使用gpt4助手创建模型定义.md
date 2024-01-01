# 使用 pgt4 助手创建 yao 模型定义

在 gpt4 中，可以自定义一个助手来创建 yao 模型定义。

在助手中可以上传 yao 模型的 typescript 定义文件。

## 操作步骤

步骤一，上传两个文件：

- 附件 yao_model.ts 包含了 yao 模型的详细的 typescript 定义。

- 附件 user_model.json 包含了一个示例的用户信息对应的 yao 模型定义。

[Yao 模型定义](https://github.com/wwsheng009/yao-app-ts-types/blob/45426b810674f02098c04b2016116e7355cb1593/src/types/dsl/model.ts)

再加上一个示例的模型定义文件,这里是在 yao 模型中最常见的用户模型定义 user_model.json。

```json
{
  "name": "用户",
  "table": {
    "name": "admin_user",
    "comment": "用户表",
    "engine": "InnoDB"
  },
  "columns": [
    {
      "label": "ID",
      "name": "id",
      "type": "ID"
    },
    {
      "label": "类型",
      "name": "type",
      "type": "enum",
      "option": ["super", "admin", "staff", "user", "robot"],
      "comment": "账号类型 super 超级管理员,admin 管理员, staff 员工, user 用户, robot 机器人",
      "default": "user",
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "enum",
          "args": ["super", "admin", "staff", "user", "robot"],
          "message": "{{input}}不在许可范围, {{label}}应该为 super/admin/staff/user/robot"
        }
      ]
    },
    {
      "label": "邮箱",
      "name": "email",
      "type": "string",
      "length": 50,
      "comment": "邮箱",
      "nullable": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "email",
          "args": [],
          "message": "{{input}}不是邮箱地址"
        }
      ]
    },
    {
      "label": "手机号",
      "name": "mobile",
      "type": "string",
      "length": 50,
      "comment": "手机号",
      "nullable": true,
      // "crypt": "AES",
      "validations": [
        {
          "method": "mobile",
          "args": [],
          "message": "{{input}}格式错误"
        }
      ]
    },
    {
      "label": "登录密码",
      "name": "password",
      "type": "string",
      "length": 256,
      "comment": "登录密码",
      "crypt": "PASSWORD",
      "nullable": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "minLength",
          "args": [6],
          "message": "{{label}}应该由6-18位，大小写字母、数字和符号构成"
        },
        {
          "method": "maxLength",
          "args": [18],
          "message": "{{label}}应该由6-18位，大小写字母、数字和符号构成"
        },
        {
          "method": "pattern",
          "args": ["[0-9]+"],
          "message": "{{label}}应该至少包含一个数字"
        },
        {
          "method": "pattern",
          "args": ["[A-Z]+"],
          "message": "{{label}}应该至少包含一个大写字母"
        },
        {
          "method": "pattern",
          "args": ["[a-z]+"],
          "message": "{{label}}应该至少包含一个小写字母"
        },
        {
          "method": "pattern",
          "args": ["[@#$&*\\+]+"],
          "message": "{{label}}应该至少包含一个符号"
        }
      ]
    },
    {
      "label": "操作密码",
      "name": "password2nd",
      "type": "string",
      "length": 256,
      "comment": "操作密码",
      "crypt": "PASSWORD",
      "nullable": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "minLength",
          "args": [6],
          "message": "{{label}}应该由6-18位，大小写字母、数字和符号构成"
        },
        {
          "method": "maxLength",
          "args": [18],
          "message": "{{label}}应该由6-18位，大小写字母、数字和符号构成"
        },
        {
          "method": "pattern",
          "args": ["[0-9]+"],
          "message": "{{label}}应该至少包含一个数字"
        },
        {
          "method": "pattern",
          "args": ["[A-Z]+"],
          "message": "{{label}}应该至少包含一个大写字母"
        },
        {
          "method": "pattern",
          "args": ["[a-z]+"],
          "message": "{{label}}应该至少包含一个小写字母"
        },
        {
          "method": "pattern",
          "args": ["[@#$&*\\+]+"],
          "message": "{{label}}应该至少包含一个符号"
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
      "label": "身份证号码",
      "name": "idcard",
      "type": "string",
      "length": 256,
      "comment": "身份证号码",
      "crypt": "AES",
      "nullable": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "pattern",
          "args": ["^(\\d{18})|(\\d{14}X)$"],
          "message": "{{label}}格式错误"
        }
      ]
    },
    {
      "label": "API Key",
      "name": "key",
      "type": "string",
      "length": 256,
      "comment": "API Key",
      "nullable": true,
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为数字"
        },
        {
          "method": "pattern",
          "args": ["^[0-9]{10}$"],
          "message": " {{label}}应该由10位数字构成"
        }
      ]
    },
    {
      "label": "API 密钥",
      "name": "secret",
      "type": "string",
      "length": 256,
      "nullable": true,
      "crypt": "AES",
      "comment": "API 密钥",
      "validations": [
        {
          "method": "typeof",
          "args": ["string"],
          "message": "{{input}}类型错误, {{label}}应该为字符串"
        },
        {
          "method": "pattern",
          "args": ["^[0-9A-Za-z@#$&*]{32}$"],
          "message": "{{label}}应该由32位，大小写字母、数字和符号构成"
        }
      ]
    },
    {
      "label": "扩展信息",
      "name": "extra",
      "type": "json",
      "comment": "扩展信息",
      "nullable": true
    },
    {
      "label": "角色",
      "name": "role",
      "type": "json",
      "comment": "角色",
      "nullable": true
    },
    {
      "label": "状态",
      "comment": "用户状态 enabled 有效, disabled 无效",
      "name": "status",
      "type": "enum",
      "default": "enabled",
      "option": ["enabled", "disabled"],
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
      "name": "管理员",
      "type": "super",
      "email": "xiang@iqka.com",
      "mobile": null,
      "password": "A123456p+",
      "key": "8304925176",
      "secret": "XMTdNRVigbgUiAPdiJCfaWgWcz2PaQXw",
      "status": "enabled",
      "extra": {
        "sex": "男"
      }
    }
  ],
  "option": {
    "timestamps": true,
    "soft_deletes": true
  }
}
```

步骤二，定义助手指令

```md
YaoModel 是一个 DSL 模型语言。它定义了一种数据数据，用户只需要把应用的业务逻辑写成这种数据结构，框架就可以自动生成应用。你要学会如何写成这种数据结构。

附件 yao_model.ts 包含了 yao 模型的详细的 typescript 定义。

附件 user_model.json 包含了一个示例的用户信息对应的 yao 模型定义。

其中 YaoModel.ModelDSL 类型定义了类型模型的定义，每一个字段都有注释说明对应的字段的详细意思，请学习。

YaoModel.ModelDSL 类型中的字段类型也包含在附件中，并有详细的结构定义说明，请学习。

要求：在下面的学习和问题中，都要严格遵守类型定义。

当用户需要创建一个业务模型时，需要按照模型文件中定义中的 YaoModel.ModelDSL typescript 类型定义创建对应类型的 json 定义。

请理解模型定义与示例模型定义 json 之间的关联关系，并作为编程参考标准。

类型定义需要输出 json 格式。

输出的 json 类型定义需要严格按照附件中的类型说明，不要增加不存在的属性说明。

在输出 json 类型定义的同时，在 values 字段里增加一条与模型对应的假数据。

在 values 里增加一条假数据。

模型字段需要增加必要的检验规则
```
