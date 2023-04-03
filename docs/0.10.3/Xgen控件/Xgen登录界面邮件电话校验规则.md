# Xgen 登录界面邮件电话校验规则

前端 xgen 登录 Form 有邮箱电话的校验。校验使用 regex 正则

源代码位置：`/xgen-v1.0/packages/xgen/utils/reg/index.ts`

```js
export const reg_email = new RegExp(
  /^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/,
);

export const reg_mobile = new RegExp(/^1[3|4|5|8|9][0-9]\d{4,8}$/);
```
