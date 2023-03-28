# 自动的生成 form/table 定义文件

请把[`init.js`](https://github.com/wwsheng009/yao-init-0.10.3/blob/main/studio/init.js)脚本复制到项目应用的`studio`目录。

脚本会根据你的模型自动生成以下的文件。

最小化配置文件，如果模型对应的`table/form`已经存在,不会覆盖你现有的文件，直接生成全量配置配置文件。

- `tables/material.tab.json`
- `forms/material.form.json`

全量配置配置文件，注意`default.json`会被自动覆盖。

- `tables/material.tab.default.json`
- `forms/material.form.default.json`

生成文件命令。

```sh
yao studio run  init.CreateTable material
yao studio run  init.CreateForm material
```

如果模型对应的`table/form`不存在，再执行一次命令可以全量配置。

```sh
yao studio run  init.CreateTable material
yao studio run  init.CreateForm material
```
