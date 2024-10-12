# List of Fixed Bug

个人版本的一些重要 github commit,VERSION :0.10.2

## YAO

https://github.com/YaoApp/yao/compare/main...wwsheng009:yao:main

- [Feat:增加 LogLevel 支持](https://github.com/wwsheng009/yao/commit/af01fdfe74067f8511a98ecc6a58508ce61df507)
- [Fix:修正内置模型类型判断错误](https://github.com/YaoApp/yao/commit/a087def58ae2af95b86d2d99ce6f60a381134567)
- [Fix:修正 Compute 无法处理子对象的异常](https://github.com/YaoApp/yao/commit/d9e0b6ef1ea2175d24f2c57c0385a2e40546633a)
- [Fix:处理器 yao.component.selectoptions 功能增强修正](https://github.com/YaoApp/yao/commit/f6637e9dc29e2e1e418d0c84c37577e10f51ab9d)
- [Fix:yao.component.selectoptions jsapi 中传入 wheres 对象。](https://github.com/YaoApp/yao/commit/347f491d6c2da3d3e00d4d235cb2c2c898633c5f)

## GOU

https://github.com/YaoApp/gou/compare/main...wwsheng009:gou:saphana

- [Feat:SAP HANA 数据库适配](https://github.com/YaoApp/gou/commit/4a7fc586d604e1550f83b1da99faade52d60d333)
- [Feat:增加 IP 参数解析](https://github.com/YaoApp/gou/commit/3904be0284c1f0b55ff7ff58085f9b36b9337c73)
- [Feat:sqlite3 时间戳插入时默认是 utc 时区，修改成本地时间](https://github.com/YaoApp/gou/commit/5e7b3dceebd382cab0a4a84b6fa7a14c01c29367)
- [Feat:模型数据更新错误显示原因](https://github.com/YaoApp/gou/commit/22540c8df17614f2383650139d252b1b29d2c4dc)
- [Fix:删除多余的 Sprintf](https://github.com/YaoApp/gou/commit/632e34dd253ca4ef7b5c01a75de58af54c76c708)
- [Feat:模型更新错误时，增加返回错误](https://github.com/YaoApp/gou/commit/fd214e7de3e56b34cbc407ec4e38247f83b25fb3)
- [Fix:优化 SAPHANA 模型](https://github.com/YaoApp/gou/commit/1810d40ab6f870fe5a733bfd7321d2271855b1e8)
- [Fix:防止主键被后面的设置覆盖/tmp 目录写入修正](https://github.com/YaoApp/gou/commit/cfc3d8964c6677ab6ab891b09d4991ad8f26c25a)
- [Fix:上传文件可以使用系统 temp 目录](https://github.com/YaoApp/gou/commit/2764c4e28b84d8b39468bb0a223b16e7a12994a7)
- [fix:跨域问题：配置了 YAO_ALLOW_FROM 启动异常](https://github.com/YaoApp/gou/commit/05cd6a4129bc6ec0dd20dade4ce1ed999100d46d)
- [Feat:hdb 数据库 connector 适配](https://github.com/YaoApp/gou/commit/a0f0039345d69e250f51ba0f69357e9bcdb4c349)
- [Fix:数据库 schema 默认值转换](https://github.com/YaoApp/gou/commit/779980d74ea01ad1557d63134f2c55e043998ec7)
- [Fix:Schema Null 值判断](https://github.com/YaoApp/gou/commit/745392660f9689f32044b9974fb34febca452db4)

## Kun

https://github.com/YaoApp/kun/compare/main...wwsheng009:kun:main

- [Fix:struct unexported field](https://github.com/YaoApp/kun/commit/a501c825e2a95d765008c1fbf543dce575f82764)
- [Fix:修正 console.log 输出 html 符号异常](https://github.com/YaoApp/kun/commit/8ed8e7237d35e829050dff98ae0e5dd500380a14)
- [Fix:fix convert null value to int](https://github.com/YaoApp/kun/commit/631074294b798b2039f207884162c019ddac5daa)

## Xun

https://github.com/YaoApp/xun/compare/main...wwsheng009:xun:main

- [Feat:SAP HANA 数据库支持](https://github.com/YaoApp/xun/commit/54e406a2078f15299a9927bbb22455c173a84cb7)
- [Feat:update hana db grammar](https://github.com/YaoApp/xun/commit/714f8449b00023914e2fc7b75fb8133a549453e4)
- [Feat:优化 sap hana 额外 schema 的读取](https://github.com/YaoApp/xun/commit/056f854ad5f547108efebb60c56cfaae136d5217)
- [Feat:update saphdb adapter](https://github.com/YaoApp/xun/commit/fdab994d9aee26234a572169d6575e7d25b3cd1c)
- [Feat:增加数据库表的备注](https://github.com/YaoApp/xun/commit/9712b9ffbb4f6d18f2b75fc074e4ea1e7db627cd)
- [Fix: Sqlite 如果字段名与表名一样，会被排除掉](https://github.com/YaoApp/xun/commit/7127b0945f1b5c9c279fc2005e17836ffcc65c7d)

## Xgen 1.0

https://github.com/YaoApp/xgen/compare/main...wwsheng009:xgen:main

- [Feat:优化 tag 控件，优化显示选项中的标签值 ](https://github.com/YaoApp/xgen/commit/ea33f68d527d3cfa3e757fc0c0987f3a11c10f4e)
- [Feat:增加远程插件依赖中的 antd](https://github.com/YaoApp/xgen/commit/ddb538c08bd4f9fc5cbcb14136445d85d84d5417)
- [Feat:更新远程组件依赖](https://github.com/YaoApp/xgen/commit/b23ed6e06eafcb9a6481cead44a9655bc38dc26b)
- [Fix:测试上传接口，需要给一个 api 属性，要不然会报错](https://github.com/YaoApp/xgen/commit/8bac8871c9986efc13d0e8e7762e5b74bbf4fb85)
- [Feat:优化 Tag 控件的显示](https://github.com/YaoApp/xgen/commit/183d4fba81d4bd771efb1e7320df90504d2615ab)
- [Feat:给外部依赖导入控件库](https://github.com/YaoApp/xgen/commit/e463cd069e1b97f912557b208803f6062bf7364d)
- [Feat:优化 Tag 的显示,固定选项也可以 x.remote 中查找](https://github.com/YaoApp/xgen/commit/2566a016c40dcb16debb85788bc89ba4765224dd)
- [fix:在 List 控件中，如果删除了条目,数据结构会有变化,需要增加额外的判断，要不然会清空整个列表](https://github.com/YaoApp/xgen/commit/c2534e88404166749c66b965aed2bbd99f785333)
- [fix:异步更新时，不能先清空数据，要不然无法把批量选中的 ID 传输到后端](https://github.com/YaoApp/xgen/commit/86eee73988b54c718059008b37b8dc0679708a21)
- [bug:search.key 不会存在](https://github.com/YaoApp/xgen/commit/641745d5b8f544388831f7973619baf53b2c8551)
