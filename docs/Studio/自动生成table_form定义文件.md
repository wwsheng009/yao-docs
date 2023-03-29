# 自动的生成 form/table 定义文件

## 下载工具脚本

请把工具脚本[`init.js`](https://github.com/wwsheng009/yao-init-0.10.3/blob/main/studio/init.js)脚本复制到`Yao`应用的`studio`目录下。

```sh
wget -O studio/init.js https://raw.githubusercontent.com/wwsheng009/yao-init-0.10.3/main/studio/init.js

```

## 使用脚本

使用脚本生成模型对应的界面配置文件。

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

如果模型对应的`table/form`定义文件已经存在,不会覆盖你现有的文件，而是直接生成全量配置文件。

最小化配置文件：

- `tables/material.tab.json`
- `forms/material.form.json`

全量配置文件

- `tables/material.tab.default.json`
- `forms/material.form.default.json`
