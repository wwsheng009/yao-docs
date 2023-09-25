# mongodb 连接配置

配置 MongoDB 作为 Store Key-Value 存储器。

## 配置连接器

在目录 `connectors` 下创建一个 `Products.conn.yao` 文件，内容如下。需要特别注意有部分的设置：

- 数据库名称配置。这需要在`options`里配置的 db 名，需要和 mongodb 里配置的 db 名一致。

- Collection 名称的配置，它的配置名称是`connector`配置文件的 ID。在这个示例中它的 ID 是`Products`,取`.mongo.yao`前面的信息。这里的 `Products` 对应 mongodb 中的 `collection`.`Products` 名称。如果在数据库中 Collection 不存在，会自动的创建。

- 用户名密码，需要设置数据库访问的用户名密码，这个是必须要设置的，不能使用空用户名或是空密码。

如果有多个 collection,每一个 collection 创建一个配置文件。

```json
{
  "LANG": "1.0.0",
  "VERSION": "1.0.0",
  "label": "Mongo TEST",
  "type": "mongo",
  "options": {
    "db": "odataserver", //配置数据库名称
    "hosts": [
      {
        "host": "$ENV.MONGO_TEST_HOST",
        "port": "$ENV.MONGO_TEST_PORT",
        "user": "$ENV.MONGO_TEST_USER",
        "pass": "$ENV.MONGO_TEST_PASS"
      }
    ],
    "params": { "maxPoolSize": 20, "w": "majority" } //配置其它参数
  }
}
```

在环境变量文件.env 中配置连接信息

```sh
MONGO_TEST_HOST=127.0.0.1
MONGO_TEST_PORT=27017
MONGO_TEST_USER="admin"
MONGO_TEST_PASS="admin"
```

另外需要注意的是，这里的 mongodb 是用于 key-value 的存储，YAO 会自动的为`Collection`创建一个`key`的**唯一**索引。保存的数据结构为以下结构,所以`Collection`数据结构中一定要有一个唯一的 key 值。

```json
{
  "key": "",
  "value": ""
}
```

所以它只适用于 key-value 数据结构，并不适用于其它的结构数据保存。

## 配置 Store

在 `stores` 目录配置一个名称为 `product.mongo.yao` 的配置文件。

```json
{
  "name": "MongoDB Key-Value store",
  "description": "MongoDB Key-Value store",
  "connector": "mongo",
  "option": {}
}
```

## 处理器

Store 的使用主要是通过处理器来处理：

Store 处理器的语法是`stores.[StoreID].set`,这里的 storeid 即是上面文件` product.mongo.yao`的 ID 部分。即是`product`。

```js
//设置值
Process('stores.product.Set', 'key1', 'value');

//读取值
Process('stores.product.Get', 'key1');

//删除值
Process('stores.product.Del', 'key1');

//读取并删除
Process('stores.product.GetDel', 'key1');

//检查是否存在
Process('stores.product.Has', 'key1');

//获取长度
Process('stores.product.Len');

//获取所有key
Process('stores.product.Keys');

//清空
Process('stores.product.clear');
```

## 总结

mongdb 也可以像 redis 一样作为存储，但是它不支持数据结构，所以它只适用于 key-value 数据结构。
