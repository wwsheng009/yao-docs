# yao-admin 的前提条件

使用 yao-admin 需要满足以下前提条件:

- 数据库表的名称需要有规范,表名中的单词需要以下划线隔开，下划线会转换成 yao 模型名称中的点号，作为命名空间的一部分。比如说有数据库中有一张表的名称是"litemall_coupon_user",转换成模型文件的名称是`/litemall/coupon/user.mod.json`,它在 yao 的应用中的引用 ID 名称为`litemall.coupon.user`。

- 表前缀判断，程序会尝试使用所有表名中第一个下划之前的名称作为表前缀，比如表名`litemall_goods`的前缀是`litemall`.

- 数据库表需要有主键字段 id，并且作为自增 ID。id 作为表主键更多的是一种通用的规范约束,这个字段在 yao 中也会转换成类型为 id 的模型字段。

- 外键字段的名称需要以 \_id 作为后缀，按照这个约定，仅从表名与字段名就可以分析出多个表之间的关联关系。比如在表`litemall_coupon_user`就有三个字段带有`_id`后缀：`user_id`与`coupon_id`，`order_id`。程序会尝试查找表`litemall_user`,`litemall_coupon`,`litemall_order`,并生成合适的表与表之前的关联关系。
