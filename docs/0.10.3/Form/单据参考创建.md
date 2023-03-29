# 单据参考创建

demo 请参考：[单据参考创建](https://github.com/wwsheng009/yao-demo-form-ref-create)

业务场景：根据单据类型 A 创建单据类型 B，单据 B 的部分值参考单据 A。

xgen 在表单与表格/表单与表单之间只有通过字段 id 进行串联。

要实现上述的业务需求有两个办法

- 修改现在有的 xgen 框架代码。

- 使用表单的 hook 函数。

## 方法一，修改方法如下：

修改 xgen 框架的源代码，增加处理自定义数据的逻辑。这个办法的优点是数据只会在前端上传输，缺点是修改的代码升级困难，需要自己作版本管理。

https://github.com/wwsheng009/xgen/commit/3adb3e00d60c9d7b2e8f9a535d2bd9a97a6c00eb

https://github.com/wwsheng009/xgen/commit/77a0646dbd4a06ebd756bb4b2d973c0eb14a8883

### 配置 action

在`payload.Form.data`里配置自定义的数据

```json
{
  "action": [
    {
      "payload": {
        "Form": {
          "model": "so",
          "type": "edit",
          "data": {
            "pet_name": "{{name}}",
            "total_amount": "{{cost}}"
          }
        }
      },
      "name": "Submit",
      "type": "Common.openModal"
    }
  ],
  "title": "参考创建销售订单",
  "icon": "icon-plus-circle"
}
```

## 方法二，使用表单 Hook 函数

创建一个新的 form 定义文件,在新 Form 里定义 hook 函数进行数据处理。

优点是不需要调整 xgen 框架的代码。只需要在后端写脚本处理即可。缺点是多一次网络调用。

[so2.form](forms/so2.form.json)

```json
{
  "name": "so",
  "action": {
    "bind": {
      "model": "so",
      "option": {
        "withs": {}
      }
    },
    "find": {
      "process": "scripts.so.Find"
    },
    "save": {
      "process": "scripts.so.Save"
    }
  }
}
```

[so.js](scripts/so.js)

```js
/**
 * 根据id找到pet的对象，返回so2 form的默认值
 * @param {number} id pet的id
 * @returns
 */
function Find(id) {
  const pet = Process('models.pet.Find', id, null);
  //或是其它对象值
  return { pet_name: pet['name'] };
}
/**
 * 永远创建新对象
 * @param {object} payload 表单的数据
 * @returns
 */
function Save(payload) {
  delete payload['id']; //这里的id是pet的id
  return Process('models.so.Save', payload);
}
```

## 配置 action

```json
{
  "action": [
    {
      "payload": {
        "Form": {
          "model": "so2",
          "type": "edit"
        }
      },
      "name": "Submit",
      "type": "Common.openModal"
    }
  ],
  "title": "参考销售订单",
  "icon": "icon-arrow-right"
}
```
