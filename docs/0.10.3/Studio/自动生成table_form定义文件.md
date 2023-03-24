# 自动的生成 form/table 定义文件

把[`init.js`](./init.js)脚本复制到项目应用的`studio`目录。

脚本有两个作用：

- 如果模型对应的`table/form`不存在,生成最小化配置`json`文件。
- 如果`table/form`已经存在最小化配置，根据最小化配置生成一份带有所有字段配置的`json`文件

```sh
yao studio run  init.CreateTable material.spec
yao studio run  init.CreateForm material.spec
```

如果模型对应的`table/form`不存在，分别执行两次命令可以生成最小化配置与全量配置。
